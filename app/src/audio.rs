// Small SID-style renderer. Original music/SFX sequencer writes the registers;
// analog filters, exact envelopes and oscillator combinations remain approximations.
#[cfg(target_os = "macos")]
mod platform {
    use std::{
        ffi::c_void,
        ptr,
        sync::{Arc, Mutex},
    };
    #[repr(C)]
    struct Format {
        rate: f64,
        id: u32,
        flags: u32,
        packet: u32,
        frames: u32,
        frame: u32,
        channels: u32,
        bits: u32,
        reserved: u32,
    }
    #[repr(C)]
    struct Buffer {
        capacity: u32,
        data: *mut c_void,
        size: u32,
        user: *mut c_void,
        packets: u32,
        descriptions: *mut c_void,
        count: u32,
    }
    type Queue = *mut c_void;
    #[link(name = "AudioToolbox", kind = "framework")]
    extern "C" {
        fn AudioQueueNewOutput(
            f: *const Format,
            cb: extern "C" fn(*mut c_void, Queue, *mut Buffer),
            data: *mut c_void,
            runloop: *mut c_void,
            mode: *mut c_void,
            flags: u32,
            q: *mut Queue,
        ) -> i32;
        fn AudioQueueAllocateBuffer(q: Queue, bytes: u32, b: *mut *mut Buffer) -> i32;
        fn AudioQueueEnqueueBuffer(
            q: Queue,
            b: *mut Buffer,
            count: u32,
            desc: *const c_void,
        ) -> i32;
        fn AudioQueueStart(q: Queue, time: *const c_void) -> i32;
        fn AudioQueueStop(q: Queue, immediate: bool) -> i32;
        fn AudioQueueDispose(q: Queue, immediate: bool) -> i32;
    }
    struct Data {
        regs: Arc<Mutex<[u8; 25]>>,
        phase: [f64; 3],
        env: [f64; 3],
        noise: u32,
        muted: bool,
    }
    extern "C" fn callback(data: *mut c_void, q: Queue, b: *mut Buffer) {
        unsafe {
            let d = &mut *(data as *mut Data);
            let regs = *d.regs.lock().unwrap();
            let out = std::slice::from_raw_parts_mut((*b).data as *mut f32, 4096);
            let rates: [f64; 16] = [
                0.002, 0.008, 0.016, 0.024, 0.038, 0.056, 0.068, 0.08, 0.1, 0.25, 0.5, 0.8, 1., 3.,
                5., 8.,
            ];
            for pair in out.chunks_exact_mut(2) {
                let mut mix = 0.;
                for v in 0..3 {
                    let i = v * 7;
                    let hz =
                        (regs[i] as u16 | (regs[i + 1] as u16) << 8) as f64 * 985248. / 16777216.;
                    d.phase[v] = (d.phase[v] + hz / 44100.) % 1.;
                    let ctrl = regs[i + 4];
                    let target = if ctrl & 1 != 0 { 1. } else { 0. };
                    let time = if ctrl & 1 != 0 {
                        rates[(regs[i + 5] >> 4) as usize]
                    } else {
                        rates[(regs[i + 6] & 15) as usize] * 3.
                    };
                    d.env[v] += (target - d.env[v]) / (time * 44100.).max(1.);
                    let p = d.phase[v];
                    let pulse =
                        (regs[i + 2] as u16 | ((regs[i + 3] & 15) as u16) << 8) as f64 / 4096.;
                    let wave = if ctrl & 128 != 0 {
                        d.noise ^= d.noise << 13;
                        d.noise ^= d.noise >> 17;
                        d.noise ^= d.noise << 5;
                        (d.noise as i32 as f64) / (i32::MAX as f64)
                    } else if ctrl & 64 != 0 {
                        if p < pulse {
                            1.
                        } else {
                            -1.
                        }
                    } else if ctrl & 32 != 0 {
                        p * 2. - 1.
                    } else if ctrl & 16 != 0 {
                        1. - 4. * (p - 0.5).abs()
                    } else {
                        0.
                    };
                    mix += wave * d.env[v];
                }
                let sample = if d.muted {
                    0.
                } else {
                    (mix * 0.085 * (regs[24] & 15) as f64 / 15.) as f32
                };
                pair[0] = sample;
                pair[1] = sample;
            }
            (*b).size = 16384;
            AudioQueueEnqueueBuffer(q, b, 0, ptr::null());
        }
    }
    pub struct Audio {
        q: Queue,
        data: *mut Data,
        regs: Arc<Mutex<[u8; 25]>>,
    }
    impl Audio {
        pub fn new() -> Option<Self> {
            let regs = Arc::new(Mutex::new([0; 25]));
            let data = Box::into_raw(Box::new(Data {
                regs: regs.clone(),
                phase: [0.; 3],
                env: [0.; 3],
                noise: 0x12345678,
                muted: false,
            }));
            let f = Format {
                rate: 44100.,
                id: 0x6c70636d,
                flags: 9,
                packet: 8,
                frames: 1,
                frame: 8,
                channels: 2,
                bits: 32,
                reserved: 0,
            };
            let mut q = ptr::null_mut();
            unsafe {
                if AudioQueueNewOutput(
                    &f,
                    callback,
                    data.cast(),
                    ptr::null_mut(),
                    ptr::null_mut(),
                    0,
                    &mut q,
                ) != 0
                {
                    drop(Box::from_raw(data));
                    return None;
                }
                for _ in 0..3 {
                    let mut b = ptr::null_mut();
                    if AudioQueueAllocateBuffer(q, 16384, &mut b) == 0 {
                        callback(data.cast(), q, b);
                    }
                }
                AudioQueueStart(q, ptr::null());
            }
            Some(Self { q, data, regs })
        }
        pub fn update(&self, m: &[u8], muted: bool) {
            let mut regs = self.regs.lock().unwrap();
            regs.copy_from_slice(&m[0xd400..0xd419]);
            if muted {
                regs[24] = 0;
            }
        }
    }
    impl Drop for Audio {
        fn drop(&mut self) {
            unsafe {
                AudioQueueStop(self.q, true);
                AudioQueueDispose(self.q, true);
                drop(Box::from_raw(self.data));
            }
        }
    }
}
#[cfg(target_os = "macos")]
pub use platform::Audio;
#[cfg(not(target_os = "macos"))]
pub struct Audio;
#[cfg(not(target_os = "macos"))]
impl Audio {
    pub fn new() -> Option<Self> {
        None
    }
    pub fn update(&self, _m: &[u8], _muted: bool) {}
}
