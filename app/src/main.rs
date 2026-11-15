mod audio;
mod machine;
use machine::Machine;
use macroquad::prelude::*;
use serde_json::json;
fn option(name: &str) -> Option<String> {
    let args: Vec<String> = std::env::args().collect();
    args.iter()
        .position(|a| a == name)
        .and_then(|i| args.get(i + 1))
        .cloned()
}
fn conf() -> Conf {
    Conf {
        window_title:
            "Montrix (1991) — Arrows: move · Space: fire · P: pause · R: restart · M: sound".into(),
        window_width: 1152,
        window_height: 816,
        window_resizable: true,
        high_dpi: true,
        ..Default::default()
    }
}
fn self_test(path: &str) {
    let mut g = Machine::new();
    for f in 0..100 {
        g.joy = if (5..25).contains(&f) { 239 } else { 255 };
        g.run_frame();
    }
    let start = g.position();
    let lives = g.m[0x1b64];
    let mut moved = 0;
    let mut last = start;
    for f in 0..300 {
        g.joy = match f {
            0..=99 => 254,
            100..=199 => 247,
            _ => 253,
        };
        g.run_frame();
        let p = g.position();
        if p != last {
            moved += 1;
        }
        last = p;
    }
    let before = g.shot_events;
    for _ in 0..100 {
        g.joy = 239;
        g.run_frame();
    }
    let shots = g.shot_events - before;
    let hud = g
        .pixels
        .chunks_exact(384 * 4)
        .skip(204)
        .take(32)
        .flatten()
        .filter(|&&x| x != 0 && x != 255)
        .count();
    let score = g.m[0x196e..0x1974].iter().all(|v| *v < 10);
    let result = json!({"version":1,"steps":[{"step":"move","passed":moved>20,"detail":format!("Pressed fire to start; flight from {:?} to {:?}; changed position during {} frames",start,g.position(),moved)},{"step":"act","passed":shots>0,"detail":format!("Held joystick fire for 100 PAL frames; {} new projectile states emitted",shots)},{"step":"hud","passed":hud>100&&score&&lives==4,"detail":format!("Rendered original score and lives HUD ({} colored bytes); six decimal score digits; {} initial reserve lives",hud,lives)},{"step":"machine","passed":g.unknown==0,"detail":format!("{} frames, {} unsupported instructions",g.frame,g.unknown)}]});
    if let Some(parent) = std::path::Path::new(path).parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent).unwrap();
        }
    }
    std::fs::write(path, serde_json::to_vec_pretty(&result).unwrap()).unwrap();
    println!("{result}");
}
fn main() {
    if let Some(path) = option("--self-test") {
        self_test(&path);
        return;
    }
    macroquad::Window::from_config(conf(), run());
}
async fn run() {
    let shot = option("--screenshot");
    let mut game = Machine::new();
    let mut audio = if shot.is_none() {
        audio::Audio::new()
    } else {
        None
    };
    let tex = Texture2D::from_rgba8(384, 272, &game.pixels);
    tex.set_filter(FilterMode::Nearest);
    let mut clock = 0.;
    let mut paused = false;
    let mut muted = false;
    let mut restart = 0;
    let mut rendered = 0;
    loop {
        let mut joy = 255;
        if is_key_down(KeyCode::Left) || is_key_down(KeyCode::A) {
            joy &= !4;
        }
        if is_key_down(KeyCode::Right) || is_key_down(KeyCode::D) {
            joy &= !8;
        }
        if is_key_down(KeyCode::Up) || is_key_down(KeyCode::W) {
            joy &= !1;
        }
        if is_key_down(KeyCode::Down) || is_key_down(KeyCode::S) {
            joy &= !2;
        }
        if is_key_down(KeyCode::Space) || is_key_down(KeyCode::Enter) {
            joy &= !16;
        }
        if is_key_pressed(KeyCode::P) || is_key_pressed(KeyCode::Escape) {
            paused = !paused;
        }
        if is_key_pressed(KeyCode::M) {
            muted = !muted;
        }
        if is_key_pressed(KeyCode::R) {
            game = Machine::new();
            restart = 30;
            paused = false;
        }
        clock += get_frame_time().min(0.1);
        if shot.is_some() {
            clock = 1. / 50.125;
        }
        while clock >= 1. / 50.125 {
            clock -= 1. / 50.125;
            if !paused {
                game.joy = if restart > 5 { 239 } else { joy };
                if restart > 0 {
                    restart -= 1;
                }
                game.run_frame();
            }
        }
        if let Some(a) = &mut audio {
            a.update(&game.m, muted || paused);
        }
        tex.update(&Image {
            width: 384,
            height: 272,
            bytes: game.pixels.clone(),
        });
        clear_background(BLACK);
        let scale = (screen_width() / 384.).min(screen_height() / 272.);
        let x = (screen_width() - 384. * scale) / 2.;
        let y = (screen_height() - 272. * scale) / 2.;
        draw_texture_ex(
            &tex,
            x,
            y,
            WHITE,
            DrawTextureParams {
                dest_size: Some(vec2(384. * scale, 272. * scale)),
                ..Default::default()
            },
        );
        if paused {
            draw_rectangle(
                x + 80. * scale,
                y + 112. * scale,
                224. * scale,
                48. * scale,
                Color::new(0., 0., 0., 0.9),
            );
            draw_text(
                "PAUSED — P TO CONTINUE",
                x + 88. * scale,
                y + 142. * scale,
                14. * scale,
                WHITE,
            );
        }
        rendered += 1;
        if rendered >= 120 {
            if let Some(path) = &shot {
                if let Some(parent) = std::path::Path::new(path).parent() {
                    if !parent.as_os_str().is_empty() {
                        std::fs::create_dir_all(parent).ok();
                    }
                }
                get_screen_data().export_png(path);
                break;
            }
        }
        next_frame().await;
    }
}
