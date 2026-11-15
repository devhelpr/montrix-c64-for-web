// Build-time reference capture only. The web game never loads this runtime.
mod reference {
    include!("../machine.rs");
    impl Machine {
        pub fn reference_frame(&mut self, room: u8, selected: &mut bool, hide: bool) {
            for _ in 0..312 {
                self.raster = (self.raster + 1) % 312;
                let target = self.v[18] as u16 | ((self.v[17] as u16 & 128) << 1);
                if self.raster == target { self.v[25] |= 1; self.irq = self.v[25] & self.v[26] & 15 != 0; }
                self.cycles += 63;
                while self.cycles > 0 {
                    if self.pc == 0x08e0 && !*selected { self.m[0x1b6c] = room; *selected = true; }
                    self.cycles -= self.step();
                }
                let sprites = self.v[21];
                if hide { self.v[21] = 0; }
                self.draw_line();
                self.v[21] = sprites;
            }
            self.frame += 1;
        }
        pub fn sprite(&self, s: usize) -> Vec<u8> {
            let bank = ((!self.m[0xdd00] & 3) as usize) * 16384;
            // Gameplay sprite pointers live in the bitmap screen at $C000.
            let screen = bank + ((self.v[24] >> 4) as usize) * 1024;
            let ptr = self.m[(screen + 1016 + s) & 65535] as usize;
            let mut pixels = vec![0; 24 * 21 * 4];
            for y in 0..21 { for x in 0..24 {
                let b = self.m[(bank + ptr*64 + y*3 + x/8) & 65535];
                let multi = self.v[28] & (1<<s) != 0;
                let z = if multi { (b >> (6 - (x%8/2)*2)) & 3 } else { (b >> (7-x%8)) & 1 };
                if z == 0 { continue; }
                let c = if multi { match z {1=>self.v[37],2=>self.v[39+s],_=>self.v[38]} } else { self.v[39+s] };
                let i=(y*24+x)*4; pixels[i..i+3].copy_from_slice(&PALETTE[(c&15) as usize]); pixels[i+3]=255;
            }} pixels
        }
    }
}
use serde_json::json;
fn png(path: &str, w: u16, h: u16, pixels: Vec<u8>) {
    macroquad::prelude::Image {width:w,height:h,bytes:pixels.chunks_exact(w as usize*4).rev().flatten().copied().collect()}.export_png(path);
}
fn main() {
    std::fs::create_dir_all("web/assets").unwrap();
    let mut atlas: Vec<Vec<u8>>=vec![];
    let mut rooms=vec![];
    for room in 0..60 {
        let mut g=reference::Machine::new(); let mut selected=false;
        // A room's actors can push the idle ship through an exit during the
        // long recording (notably 8 -> 9 and 15 -> 17). Keep the original
        // movement/actors running, but return from the four exit handlers.
        // This patch belongs only to the build-time capture machine.
        for address in [0x1330, 0x136f, 0x13ce, 0x142d] { g.m[address] = 0x60; }
        let mut actor_frames: Vec<Vec<usize>>=vec![vec![];8];
        let mut tracks: Vec<Vec<serde_json::Value>> = vec![vec![]; 8];
        for f in 0..823 {
            g.joy=if (5..25).contains(&f) {239} else {255};
            // Prevent combat/respawn from contaminating the captured movement and art.
            if selected { g.m[0x1167] = 255; }
            g.reference_frame(room,&mut selected,false);
            if f >= 55 {
                assert_eq!(g.m[0x1b6c], room, "capture left requested room at frame {f}");
                for s in 0..8 {
                    // Protection changes the ship's colour, not its animation.
                    if s == 0 { g.v[39] = g.m[0x1168]; }
                    let p=g.sprite(s);
                    if !p.iter().any(|b| *b!=0) {continue;}
                    let id=atlas.iter().position(|a| *a==p).unwrap_or_else(|| {atlas.push(p);atlas.len()-1});
                    if !actor_frames[s].contains(&id) {actor_frames[s].push(id);}
                    let x = g.v[s*2] as i32 + if g.v[16] & (1<<s) != 0 {256} else {0} - 24;
                    let y = g.v[s*2+1] as i32 - 51;
                    tracks[s].push(json!([x,y,id, g.v[21] & (1<<s) != 0,
                        if g.v[29] & (1<<s) != 0 {2} else {1},
                        if g.v[23] & (1<<s) != 0 {2} else {1}]));
                }
            }
        }
        assert!(selected, "room not initialized");
        let ptr=g.m[0x2800+room as usize*4] as usize | (g.m[0x2801+room as usize*4] as usize)<<8;
        let links=g.m[ptr..ptr+4].to_vec();
        let mut actors=vec![];
        for s in 0..8 {
            let samples=&tracks[s];
            // A loop must repeat a complete 32-update window; a held pose alone
            // is not enough (some actors wait off-screen before entering).
            let mut loop_start=None;
            let mut loop_end=samples.len();
            'search: for end in (64..samples.len().saturating_sub(32)).rev() {
                for start in 0..end.saturating_sub(32) {
                    if samples[start..start+32] == samples[end..end+32] &&
                       samples[start..end].iter().any(|p| p[3] == true) {
                        // Verify the rest of the recording against that period.
                        let period=end-start;
                        if (end..samples.len()).all(|i| samples[i] == samples[start+(i-start)%period]) {
                            loop_start=Some(start); loop_end=end; break 'search;
                        }
                    }
                }
            }
            let mut poses=vec![];
            for pose in &samples[..loop_end] {
                if let Some(last) = poses.last_mut() {
                    let last: &mut serde_json::Value = last;
                    if last[0] == *pose { let n=last[1].as_u64().unwrap()+1; last[1]=json!(n); continue; }
                }
                poses.push(json!([pose,1]));
            }
            // Room 10 is the third screen down. Its two telescoping doors
            // have a piston and two leaves, not three independent movers.
            let attachment = match (room, s) {
                (10, 1) => json!({"actor":2,"dx":10,"dy":-20}),
                (10, 4) => json!({"actor":5,"dx":10,"dy":21}),
                _ => serde_json::Value::Null,
            };
            actors.push(json!({"attachment":attachment,"x":samples[0][0].as_i64().unwrap()+24,
                "y":samples[0][1].as_i64().unwrap()+51,"frames":actor_frames[s],
                "kind":if s>0 {g.m[0x1a51+s]} else {0},
                "health":if s>0 {g.m[0x1a39+s]} else {0},
                "poses":poses,"duration":loop_end,"loopStart":loop_start}));
        }
        let mut collision=vec![];
        for y in 0..20 { for x in 0..40 { let addr=g.m[0x1b0e+y] as usize | (g.m[0x1b28+y] as usize)<<8; collision.push(g.m[(addr+x)&65535]); } }
        // Re-render a complete frame without actors; the saved art and HUD remain exact.
        g.reference_frame(room,&mut selected,true);
        png(&format!("web/assets/room-{room}.png"),384,272,g.pixels.clone());
        assert_eq!(g.m[0x1b6c], room, "background belongs to a different room");
        rooms.push(json!({"capturedRoom":g.m[0x1b6c],"links":links,"actors":actors,"collision":collision}));
        eprintln!("captured room {room}: links {:?}", &g.m[ptr..ptr+4]);
    }
    // Original $6A06/$6A40 turn sequence. These are pointer states, not
    // colour-flash frames or a looping walk animation.
    let mut g=reference::Machine::new(); let mut selected=false;
    for f in 0..100 {g.joy=if (5..25).contains(&f){239}else{255};g.reference_frame(0,&mut selected,false);}
    let mut turn_frames=vec![];
    for pointer in [0x11,0x2e,0x3c,0x3d,0x3e,0x3f,0x12] {
        g.m[0xc3f8]=pointer; g.v[39]=g.m[0x1168];
        let p=g.sprite(0);
        let id=atlas.iter().position(|a| *a==p).unwrap_or_else(|| {atlas.push(p);atlas.len()-1});
        turn_frames.push(id);
    }
    let player_frames=vec![vec![turn_frames[0]],vec![turn_frames[6]],vec![turn_frames[0]],vec![turn_frames[0]]];
    let mut sheet=vec![0;24*21*4*atlas.len()];
    for (i,p) in atlas.iter().enumerate() {sheet[i*24*21*4..(i+1)*24*21*4].copy_from_slice(p);}
    png("web/assets/sprites.png",24,(21*atlas.len()) as u16,sheet);
    std::fs::write("web/assets/rooms.json",serde_json::to_string(&json!({"rooms":rooms,"spriteCount":atlas.len(),"playerFrames":player_frames,"playerTurnFrames":turn_frames})).unwrap()).unwrap();
    eprintln!("{} unique sprite frames",atlas.len());
}
