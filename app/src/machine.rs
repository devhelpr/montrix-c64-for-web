// Independently implemented MOS 6502 and the C64 display/input subset used by Montrix.
// The untouched saved RAM is an original asset, not translated/decompiled source.
const RAM: &[u8] = include_bytes!("../evidence/ram.bin");
const VIC: &[u8] = include_bytes!("../evidence/VIC-II.bin");
pub const PALETTE: [[u8; 3]; 16] = [
    [0, 0, 0],
    [255, 255, 255],
    [136, 57, 50],
    [103, 182, 189],
    [139, 63, 150],
    [85, 160, 73],
    [64, 49, 141],
    [191, 206, 114],
    [139, 84, 41],
    [87, 66, 0],
    [184, 105, 98],
    [80, 80, 80],
    [120, 120, 120],
    [148, 224, 137],
    [120, 105, 196],
    [159, 159, 159],
];
pub struct Machine {
    pub m: Vec<u8>,
    pub v: [u8; 64],
    pub color: Vec<u8>,
    pub pc: u16,
    a: u8,
    x: u8,
    y: u8,
    sp: u8,
    p: u8,
    pub raster: u16,
    cycles: i32,
    irq: bool,
    pub joy: u8,
    pub pixels: Vec<u8>,
    pub frame: u64,
    pub fire_calls: u64,
    pub shot_events: u64,
    pub unknown: u64,
}
impl Machine {
    pub fn new() -> Self {
        let mut v = [0; 64];
        v.copy_from_slice(&VIC[1..65]);
        Self {
            m: RAM.to_vec(),
            v,
            color: VIC[761..1785].to_vec(),
            pc: 0xbc4e,
            a: 0xfa,
            x: 0x0e,
            y: 0x15,
            sp: 0xfa,
            p: 0x65,
            raster: 174,
            cycles: 0,
            irq: false,
            joy: 255,
            pixels: vec![0; 384 * 272 * 4],
            frame: 0,
            fire_calls: 0,
            shot_events: 0,
            unknown: 0,
        }
    }
    fn rd(&mut self, a: u16) -> u8 {
        let n = a as usize;
        if self.m[1] & 4 != 0 && (0xd000..0xe000).contains(&n) {
            match n {
                0xd000..=0xd3ff => {
                    let r = n & 63;
                    match r {
                        0x11 => (self.v[17] & 127) | if self.raster >= 256 { 128 } else { 0 },
                        0x12 => self.raster as u8,
                        0x19 => self.v[25] | if self.irq { 128 } else { 0 },
                        0x1e | 0x1f => {
                            let b = self.v[r];
                            self.v[r] = 0;
                            b
                        }
                        _ => self.v[r],
                    }
                }
                0xd400..=0xd7ff => {
                    if n & 31 == 27 {
                        (self.frame.wrapping_mul(97) + self.pc as u64) as u8
                    } else {
                        self.m[n]
                    }
                }
                0xd800..=0xdbff => self.color[n - 0xd800],
                0xdc00 => self.joy,
                0xdc01 => 255,
                0xdc0d => 0,
                0xdd00 => self.m[n] | 0x3c,
                _ => self.m[n],
            }
        } else {
            self.m[n]
        }
    }
    fn wr(&mut self, a: u16, b: u8) {
        let n = a as usize;
        if ((0x1b6e..0x1b72).contains(&n)
            || (0x1b8a..0x1b8e).contains(&n)
            || (0x1ba6..0x1baa).contains(&n))
            && b == 1
            && self.m[n] == 0
        {
            self.shot_events += 1;
        }
        if self.m[1] & 4 != 0 && (0xd000..0xe000).contains(&n) {
            match n {
                0xd000..=0xd3ff => {
                    let r = n & 63;
                    if r == 0x19 {
                        self.v[r] &= !b;
                        self.irq = self.v[25] & self.v[26] & 15 != 0;
                    } else {
                        self.v[r] = b;
                    }
                }
                0xd800..=0xdbff => self.color[n - 0xd800] = b & 15,
                _ => self.m[n] = b,
            }
        } else {
            self.m[n] = b
        }
    }
    fn fetch(&mut self) -> u8 {
        let b = self.rd(self.pc);
        self.pc = self.pc.wrapping_add(1);
        b
    }
    fn word(&mut self) -> u16 {
        let l = self.fetch() as u16;
        l | (self.fetch() as u16) << 8
    }
    fn push(&mut self, b: u8) {
        self.m[0x100 + self.sp as usize] = b;
        self.sp = self.sp.wrapping_sub(1)
    }
    fn pop(&mut self) -> u8 {
        self.sp = self.sp.wrapping_add(1);
        self.m[0x100 + self.sp as usize]
    }
    fn nz(&mut self, b: u8) -> u8 {
        self.p = (self.p & !0x82) | if b == 0 { 2 } else { 0 } | (b & 128);
        b
    }
    fn flag(&mut self, f: u8, on: bool) {
        if on {
            self.p |= f
        } else {
            self.p &= !f
        }
    }
    fn adc(&mut self, b: u8) {
        let a = self.a;
        let c = (self.p & 1) as u16;
        let sum = a as u16 + b as u16 + c;
        self.flag(64, (!(a ^ b) & (a ^ sum as u8) & 128) != 0);
        if self.p & 8 != 0 {
            let mut lo = (a & 15) as u16 + (b & 15) as u16 + c;
            if lo > 9 {
                lo += 6;
            }
            let mut hi = (a >> 4) as u16 + (b >> 4) as u16 + if lo > 15 { 1 } else { 0 };
            if hi > 9 {
                hi += 6;
            }
            self.flag(1, hi > 15);
            self.a = self.nz(((hi << 4) | (lo & 15)) as u8);
        } else {
            self.flag(1, sum > 255);
            self.a = self.nz(sum as u8)
        }
    }
    fn sbc(&mut self, b: u8) {
        if self.p & 8 == 0 {
            self.adc(!b);
            return;
        }
        let a = self.a;
        let borrow = if self.p & 1 != 0 { 0 } else { 1 };
        let sum = a as i16 - b as i16 - borrow;
        self.flag(64, ((a ^ b) & (a ^ sum as u8) & 128) != 0);
        self.flag(1, sum >= 0);
        let mut lo = (a & 15) as i16 - (b & 15) as i16 - borrow;
        let mut hi = (a >> 4) as i16 - (b >> 4) as i16;
        if lo < 0 {
            lo -= 6;
            hi -= 1;
        }
        if hi < 0 {
            hi -= 6;
        }
        self.a = self.nz(((hi << 4) | (lo & 15)) as u8);
    }
    pub fn step(&mut self) -> i32 {
        if self.irq && self.p & 4 == 0 {
            self.push((self.pc >> 8) as u8);
            self.push(self.pc as u8);
            self.push((self.p & !16) | 32);
            self.p |= 4;
            self.pc = self.m[65534] as u16 | (self.m[65535] as u16) << 8;
            return 7;
        }
        let old = self.pc;
        if old == 0x148b {
            self.fire_calls += 1;
        }
        let code = self.fetch();
        let (op, mode, mut cyc) = OPS[code as usize];
        let addr = match mode {
            "im" => {
                let a = self.pc;
                self.pc = self.pc.wrapping_add(1);
                a
            }
            "zp" => self.fetch() as u16,
            "zx" => self.fetch().wrapping_add(self.x) as u16,
            "zy" => self.fetch().wrapping_add(self.y) as u16,
            "ab" => self.word(),
            "ax" | "ay" => {
                let a = self.word();
                let b = a.wrapping_add(if mode == "ax" { self.x } else { self.y } as u16);
                if a & 0xff00 != b & 0xff00
                    && !["STA", "ASL", "LSR", "ROR", "ROL", "INC", "DEC"].contains(&op)
                {
                    cyc += 1;
                }
                b
            }
            "ix" => {
                let a = self.fetch().wrapping_add(self.x);
                self.rd(a as u16) as u16 | (self.rd(a.wrapping_add(1) as u16) as u16) << 8
            }
            "iy" => {
                let a = self.fetch();
                let b = self.rd(a as u16) as u16 | (self.rd(a.wrapping_add(1) as u16) as u16) << 8;
                let d = b.wrapping_add(self.y as u16);
                if b & 0xff00 != d & 0xff00 && op != "STA" {
                    cyc += 1;
                }
                d
            }
            "ind" => {
                let a = self.word();
                self.rd(a) as u16 | (self.rd((a & 0xff00) | a.wrapping_add(1) & 255) as u16) << 8
            }
            "rel" => {
                let a = self.fetch() as i8;
                self.pc.wrapping_add(a as u16)
            }
            _ => 0,
        };
        let b = if ["im", "zp", "zx", "zy", "ab", "ax", "ay", "ix", "iy"].contains(&mode)
            && !["JMP", "JSR", "STA", "STX", "STY"].contains(&op)
        {
            self.rd(addr)
        } else {
            0
        };
        match op {
            "LDA" => self.a = self.nz(b),
            "LDX" => self.x = self.nz(b),
            "LDY" => self.y = self.nz(b),
            "STA" => self.wr(addr, self.a),
            "STX" => self.wr(addr, self.x),
            "STY" => self.wr(addr, self.y),
            "AND" => self.a = self.nz(self.a & b),
            "ORA" => self.a = self.nz(self.a | b),
            "EOR" => self.a = self.nz(self.a ^ b),
            "ADC" => self.adc(b),
            "SBC" => self.sbc(b),
            "CMP" | "CPX" | "CPY" => {
                let a = match op {
                    "CPX" => self.x,
                    "CPY" => self.y,
                    _ => self.a,
                };
                self.flag(1, a >= b);
                self.nz(a.wrapping_sub(b));
            }
            "BIT" => {
                self.p = (self.p & !0xc2) | (b & 0xc0) | if self.a & b == 0 { 2 } else { 0 };
            }
            "INC" | "DEC" => {
                let a = self.nz(if op == "INC" {
                    b.wrapping_add(1)
                } else {
                    b.wrapping_sub(1)
                });
                self.wr(addr, a)
            }
            "ASL" | "LSR" | "ROL" | "ROR" => {
                let a = if mode == "acc" { self.a } else { b };
                let c = self.p & 1;
                let result = match op {
                    "ASL" => {
                        self.flag(1, a & 128 != 0);
                        a << 1
                    }
                    "LSR" => {
                        self.flag(1, a & 1 != 0);
                        a >> 1
                    }
                    "ROL" => {
                        self.flag(1, a & 128 != 0);
                        (a << 1) | c
                    }
                    _ => {
                        self.flag(1, a & 1 != 0);
                        (a >> 1) | (c << 7)
                    }
                };
                let result = self.nz(result);
                if mode == "acc" {
                    self.a = result
                } else {
                    self.wr(addr, result)
                }
            }
            "JMP" => self.pc = addr,
            "JSR" => {
                let r = self.pc.wrapping_sub(1);
                self.push((r >> 8) as u8);
                self.push(r as u8);
                self.pc = addr
            }
            "RTS" => {
                self.pc = self.pop() as u16;
                self.pc |= (self.pop() as u16) << 8;
                self.pc = self.pc.wrapping_add(1)
            }
            "RTI" => {
                self.p = self.pop() | 32;
                self.pc = self.pop() as u16;
                self.pc |= (self.pop() as u16) << 8;
            }
            "BRK" => {
                self.pc = self.pc.wrapping_add(1);
                self.push((self.pc >> 8) as u8);
                self.push(self.pc as u8);
                self.push(self.p | 48);
                self.p |= 4;
                self.pc = self.rd(65534) as u16 | (self.rd(65535) as u16) << 8;
            }
            "PHA" => self.push(self.a),
            "PHP" => self.push(self.p | 48),
            "PLA" => {
                let a = self.pop();
                self.a = self.nz(a)
            }
            "PLP" => self.p = self.pop() | 32,
            "TAX" => self.x = self.nz(self.a),
            "TAY" => self.y = self.nz(self.a),
            "TXA" => self.a = self.nz(self.x),
            "TYA" => self.a = self.nz(self.y),
            "TSX" => self.x = self.nz(self.sp),
            "TXS" => self.sp = self.x,
            "INX" => self.x = self.nz(self.x.wrapping_add(1)),
            "DEX" => self.x = self.nz(self.x.wrapping_sub(1)),
            "INY" => self.y = self.nz(self.y.wrapping_add(1)),
            "DEY" => self.y = self.nz(self.y.wrapping_sub(1)),
            "CLC" => self.p &= !1,
            "SEC" => self.p |= 1,
            "CLI" => self.p &= !4,
            "SEI" => self.p |= 4,
            "CLD" => self.p &= !8,
            "SED" => self.p |= 8,
            "CLV" => self.p &= !64,
            "BNE" | "BEQ" | "BPL" | "BMI" | "BCC" | "BCS" | "BVC" | "BVS" => {
                let yes = match op {
                    "BNE" => self.p & 2 == 0,
                    "BEQ" => self.p & 2 != 0,
                    "BPL" => self.p & 128 == 0,
                    "BMI" => self.p & 128 != 0,
                    "BCC" => self.p & 1 == 0,
                    "BCS" => self.p & 1 != 0,
                    "BVC" => self.p & 64 == 0,
                    _ => self.p & 64 != 0,
                };
                if yes {
                    cyc += 1;
                    if self.pc & 0xff00 != addr & 0xff00 {
                        cyc += 1;
                    }
                    self.pc = addr
                }
            }
            "NOP" => {}
            _ => {
                self.unknown += 1;
                if self.unknown < 8 {
                    eprintln!("unsupported {code:02x} at {old:04x}");
                }
            }
        }
        cyc
    }
    pub fn run_frame(&mut self) {
        for _ in 0..312 {
            self.raster = (self.raster + 1) % 312;
            let target = self.v[18] as u16 | ((self.v[17] as u16 & 128) << 1);
            if self.raster == target {
                self.v[25] |= 1;
                self.irq = self.v[25] & self.v[26] & 15 != 0;
            }
            self.cycles += 63;
            while self.cycles > 0 {
                let used = self.step();
                self.cycles -= used;
            }
            self.draw_line();
        }
        self.frame += 1;
    }
    fn pixel(&mut self, x: usize, y: usize, c: u8) {
        if x >= 384 || y >= 272 {
            return;
        }
        let i = (y * 384 + x) * 4;
        let rgb = PALETTE[(c & 15) as usize];
        self.pixels[i..i + 3].copy_from_slice(&rgb);
        self.pixels[i + 3] = 255;
    }
    fn draw_line(&mut self) {
        let r = self.raster as i32;
        let yy = r - 15;
        if !(0..272).contains(&yy) {
            return;
        }
        let yy = yy as usize;
        for x in 0..384 {
            self.pixel(x, yy, self.v[32]);
        }
        let active = (51..251).contains(&r);
        let y = if active { (r - 51) as usize } else { 0 };
        let bank = ((!self.m[0xdd00] & 3) as usize) * 16384;
        let screen = bank + ((self.v[24] >> 4) as usize) * 1024;
        let bitmap = bank + if self.v[24] & 8 != 0 { 8192 } else { 0 };
        let chars = bank + ((self.v[24] & 14) as usize) * 1024;
        let mut foreground = [false; 320];
        if active {
            for x in 0..320 {
                let cell = y / 8 * 40 + x / 8;
                let s = self.m[(screen + cell) & 65535];
                let co = self.color[cell] & 15;
                let mut bit = false;
                let c = if self.v[17] & 16 == 0 {
                    self.v[33]
                } else if self.v[17] & 32 != 0 {
                    let b = self.m[(bitmap + cell * 8 + y % 8) & 65535];
                    if self.v[22] & 16 != 0 {
                        let z = (b >> (6 - (x % 8 / 2) * 2)) & 3;
                        bit = z >= 2;
                        match z {
                            0 => self.v[33],
                            1 => s >> 4,
                            2 => s & 15,
                            _ => co,
                        }
                    } else {
                        bit = b & (128 >> (x % 8)) != 0;
                        if bit {
                            s >> 4
                        } else {
                            s & 15
                        }
                    }
                } else {
                    let b = self.m[(chars + s as usize * 8 + y % 8) & 65535];
                    if self.v[22] & 16 != 0 && co & 8 != 0 {
                        let z = (b >> (6 - (x % 8 / 2) * 2)) & 3;
                        bit = z >= 2;
                        match z {
                            0 => self.v[33],
                            1 => self.v[34],
                            2 => self.v[35],
                            _ => co & 7,
                        }
                    } else {
                        bit = b & (128 >> (x % 8)) != 0;
                        if bit {
                            co
                        } else {
                            self.v[33]
                        }
                    }
                };
                foreground[x] = bit;
                self.pixel(x + 32, yy, c);
            }
        }
        let mut occupied = [0u8; 384];
        for s in (0..8).rev() {
            if self.v[21] & (1 << s) == 0 {
                continue;
            }
            let sy = self.v[s * 2 + 1] as i32;
            let dy = r - sy;
            let scale_y = if self.v[23] & (1 << s) != 0 { 2 } else { 1 };
            if dy < 0 || dy >= 21 * scale_y {
                continue;
            }
            let sx =
                self.v[s * 2] as i32 + if self.v[16] & (1 << s) != 0 { 256 } else { 0 } - 24 + 32;
            let ptr = self.m[(screen + 1016 + s) & 65535] as usize;
            let row = bank + ptr * 64 + (dy / scale_y) as usize * 3;
            let data = (self.m[row & 65535] as u32) << 16
                | (self.m[(row + 1) & 65535] as u32) << 8
                | self.m[(row + 2) & 65535] as u32;
            let multi = self.v[28] & (1 << s) != 0;
            let scale_x = if self.v[29] & (1 << s) != 0 { 2 } else { 1 };
            for dx in 0..24 {
                let z = if multi {
                    (data >> (22 - (dx / 2) * 2)) & 3
                } else {
                    (data >> (23 - dx)) & 1
                };
                if z == 0 {
                    continue;
                }
                let color = if multi {
                    match z {
                        1 => self.v[37],
                        2 => self.v[39 + s],
                        _ => self.v[38],
                    }
                } else {
                    self.v[39 + s]
                };
                for rep in 0..scale_x {
                    let x = sx + dx * scale_x + rep;
                    if x < 0 || x >= 384 {
                        continue;
                    }
                    let x = x as usize;
                    let fg = (32..352).contains(&x) && foreground[x - 32];
                    if fg {
                        self.v[31] |= 1 << s;
                    }
                    if occupied[x] != 0 {
                        self.v[30] |= occupied[x] | (1 << s);
                    }
                    occupied[x] |= 1 << s;
                    if !fg || self.v[27] & (1 << s) == 0 {
                        self.pixel(x, yy, color);
                    }
                }
            }
        }
    }
    pub fn position(&self) -> (u16, u8) {
        (
            self.m[0x1a08] as u16 + if self.m[0x1a28] & 1 != 0 { 256 } else { 0 },
            self.m[0x1a10],
        )
    }
}
const OPS: [(&str, &str, i32); 256] = [
    ("BRK", "imp", 7),
    ("ORA", "ix", 6),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("???", "imp", 3),
    ("ORA", "zp", 3),
    ("ASL", "zp", 5),
    ("???", "imp", 2),
    ("PHP", "imp", 3),
    ("ORA", "im", 2),
    ("ASL", "acc", 2),
    ("???", "imp", 2),
    ("???", "imp", 4),
    ("ORA", "ab", 4),
    ("ASL", "ab", 6),
    ("???", "imp", 2),
    ("BPL", "rel", 2),
    ("ORA", "iy", 5),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("???", "imp", 4),
    ("ORA", "zx", 4),
    ("ASL", "zx", 6),
    ("???", "imp", 2),
    ("CLC", "imp", 2),
    ("ORA", "ay", 4),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("???", "imp", 4),
    ("ORA", "ax", 4),
    ("ASL", "ax", 7),
    ("???", "imp", 2),
    ("JSR", "ab", 6),
    ("AND", "ix", 6),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("BIT", "zp", 3),
    ("AND", "zp", 3),
    ("ROL", "zp", 5),
    ("???", "imp", 2),
    ("PLP", "imp", 4),
    ("AND", "im", 2),
    ("ROL", "acc", 2),
    ("???", "imp", 2),
    ("BIT", "ab", 4),
    ("AND", "ab", 4),
    ("ROL", "ab", 6),
    ("???", "imp", 2),
    ("BMI", "rel", 2),
    ("AND", "iy", 5),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("???", "imp", 4),
    ("AND", "zx", 4),
    ("ROL", "zx", 6),
    ("???", "imp", 2),
    ("SEC", "imp", 2),
    ("AND", "ay", 4),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("???", "imp", 4),
    ("AND", "ax", 4),
    ("ROL", "ax", 7),
    ("???", "imp", 2),
    ("RTI", "imp", 6),
    ("EOR", "ix", 6),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("???", "imp", 3),
    ("EOR", "zp", 3),
    ("LSR", "zp", 5),
    ("???", "imp", 2),
    ("PHA", "imp", 3),
    ("EOR", "im", 2),
    ("LSR", "acc", 2),
    ("???", "imp", 2),
    ("JMP", "ab", 3),
    ("EOR", "ab", 4),
    ("LSR", "ab", 6),
    ("???", "imp", 2),
    ("BVC", "rel", 2),
    ("EOR", "iy", 5),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("???", "imp", 4),
    ("EOR", "zx", 4),
    ("LSR", "zx", 6),
    ("???", "imp", 2),
    ("CLI", "imp", 2),
    ("EOR", "ay", 4),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("???", "imp", 4),
    ("EOR", "ax", 4),
    ("LSR", "ax", 7),
    ("???", "imp", 2),
    ("RTS", "imp", 6),
    ("ADC", "ix", 6),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("???", "imp", 3),
    ("ADC", "zp", 3),
    ("ROR", "zp", 5),
    ("???", "imp", 2),
    ("PLA", "imp", 4),
    ("ADC", "im", 2),
    ("ROR", "acc", 2),
    ("???", "imp", 2),
    ("JMP", "ind", 5),
    ("ADC", "ab", 4),
    ("ROR", "ab", 6),
    ("???", "imp", 2),
    ("BVS", "rel", 2),
    ("ADC", "iy", 5),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("???", "imp", 4),
    ("ADC", "zx", 4),
    ("ROR", "zx", 6),
    ("???", "imp", 2),
    ("SEI", "imp", 2),
    ("ADC", "ay", 4),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("???", "imp", 4),
    ("ADC", "ax", 4),
    ("ROR", "ax", 7),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("STA", "ix", 6),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("STY", "zp", 3),
    ("STA", "zp", 3),
    ("STX", "zp", 3),
    ("???", "imp", 2),
    ("DEY", "imp", 2),
    ("???", "imp", 2),
    ("TXA", "imp", 2),
    ("???", "imp", 2),
    ("STY", "ab", 4),
    ("STA", "ab", 4),
    ("STX", "ab", 4),
    ("???", "imp", 2),
    ("BCC", "rel", 2),
    ("STA", "iy", 6),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("STY", "zx", 4),
    ("STA", "zx", 4),
    ("STX", "zy", 4),
    ("???", "imp", 2),
    ("TYA", "imp", 2),
    ("STA", "ay", 5),
    ("TXS", "imp", 2),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("STA", "ax", 5),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("LDY", "im", 2),
    ("LDA", "ix", 6),
    ("LDX", "im", 2),
    ("???", "imp", 2),
    ("LDY", "zp", 3),
    ("LDA", "zp", 3),
    ("LDX", "zp", 3),
    ("???", "imp", 2),
    ("TAY", "imp", 2),
    ("LDA", "im", 2),
    ("TAX", "imp", 2),
    ("???", "imp", 2),
    ("LDY", "ab", 4),
    ("LDA", "ab", 4),
    ("LDX", "ab", 4),
    ("???", "imp", 2),
    ("BCS", "rel", 2),
    ("LDA", "iy", 5),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("LDY", "zx", 4),
    ("LDA", "zx", 4),
    ("LDX", "zy", 4),
    ("???", "imp", 2),
    ("CLV", "imp", 2),
    ("LDA", "ay", 4),
    ("TSX", "imp", 2),
    ("???", "imp", 2),
    ("LDY", "ax", 4),
    ("LDA", "ax", 4),
    ("LDX", "ay", 4),
    ("???", "imp", 2),
    ("CPY", "im", 2),
    ("CMP", "ix", 6),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("CPY", "zp", 3),
    ("CMP", "zp", 3),
    ("DEC", "zp", 5),
    ("???", "imp", 2),
    ("INY", "imp", 2),
    ("CMP", "im", 2),
    ("DEX", "imp", 2),
    ("???", "imp", 2),
    ("CPY", "ab", 4),
    ("CMP", "ab", 4),
    ("DEC", "ab", 6),
    ("???", "imp", 2),
    ("BNE", "rel", 2),
    ("CMP", "iy", 5),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("???", "imp", 4),
    ("CMP", "zx", 4),
    ("DEC", "zx", 6),
    ("???", "imp", 2),
    ("CLD", "imp", 2),
    ("CMP", "ay", 4),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("???", "imp", 4),
    ("CMP", "ax", 4),
    ("DEC", "ax", 7),
    ("???", "imp", 2),
    ("CPX", "im", 2),
    ("SBC", "ix", 6),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("CPX", "zp", 3),
    ("SBC", "zp", 3),
    ("INC", "zp", 5),
    ("???", "imp", 2),
    ("INX", "imp", 2),
    ("SBC", "im", 2),
    ("NOP", "imp", 2),
    ("???", "imp", 2),
    ("CPX", "ab", 4),
    ("SBC", "ab", 4),
    ("INC", "ab", 6),
    ("???", "imp", 2),
    ("BEQ", "rel", 2),
    ("SBC", "iy", 5),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("???", "imp", 4),
    ("SBC", "zx", 4),
    ("INC", "zx", 6),
    ("???", "imp", 2),
    ("SED", "imp", 2),
    ("SBC", "ay", 4),
    ("???", "imp", 2),
    ("???", "imp", 2),
    ("???", "imp", 4),
    ("SBC", "ax", 4),
    ("INC", "ax", 7),
    ("???", "imp", 2),
];
