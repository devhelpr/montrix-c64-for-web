#[path = "../machine.rs"]
mod machine;
fn main() {
 if std::env::args().any(|a|a=="--title"){let mut g=machine::Machine::new();for f in 0..240{g.run_frame();if f%60==59{macroquad::prelude::Image{width:384,height:272,bytes:g.pixels.chunks_exact(384*4).rev().flatten().copied().collect()}.export_png(&format!("shots/title-{f}.png"));eprintln!("{f} pc {:04x} v {:02x?} c {:?}",g.pc,&g.v[17..25],&g.m[0xc300..0xc310]);}}return;}

    let mut g = machine::Machine::new();
    for frame in 0..900 {
        g.joy = 255;
        if (5..25).contains(&frame) {
            g.joy &= !16;
        }
        if (100..200).contains(&frame) {
            g.joy &= !4;
        }
        if (200..300).contains(&frame) {
            g.joy &= !1;
        }
        if (300..400).contains(&frame) {
            g.joy &= !8;
        }
        if (400..500).contains(&frame) {
            g.joy &= !2;
        }
        if (500..600).contains(&frame) {
            g.joy &= !16;
        }
        g.run_frame();
        if frame % 100 == 0 {
            macroquad::prelude::Image {
                width: 384,
                height: 272,
                bytes: g
                    .pixels
                    .chunks_exact(384 * 4)
                    .rev()
                    .flatten()
                    .copied()
                    .collect(),
            }
            .export_png(&format!("shots/probe-{frame}.png"));
            eprintln!(
                "frame {frame} pc {:04x} pos {:?} room {} lives {} score {:?} action {} unknown {}",
                g.pc,
                g.position(),
                g.m[0x1b6c],
                g.m[0x1b64],
                &g.m[0x196e..0x1974],
                g.fire_calls,
                g.unknown
            );
            if frame == 100 {
                std::fs::write("evidence/level-ram.bin", &g.m).unwrap();
            }
        }
    }
}
