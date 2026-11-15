This build contains the original game's own files, for the private use of the person who owns the game, on their own computer. It must not be shared or published.

# Montrix — standalone web recreation

Open `index.html` in a browser to play. No installation, server, simulator, C64 ROM, WebAssembly, or Internet connection is needed. The same ready-to-run file is in `dist/index.html`.

The new source is in `web/`. It runs browser-native JavaScript game rules and Canvas drawing. It does not execute any C64 instructions or load a memory snapshot. All 60 original room backgrounds, room connections, collision grids and sprite images were captured from the existing Rust simulator as a build-time reference. The original title/credits artwork is retained.

Space/Enter starts and fires. Arrow keys or WASD fly. P/Escape pauses, R restarts and M toggles synthesized effects. Buttons support starting, pause, sound and full screen; touch controls appear on touch devices. Changing windows pauses play. Sound starts muted and only runs after interaction.

## Build and test

From `app/`, run `npm run build` and `npm test`. Node's standard library is sufficient; there are no web runtime dependencies or packages to install. The build writes an offline HTML entry point into both `app/index.html` and `app/dist/index.html`, and copies the modular web sources/assets into `dist/`. `npm start` optionally serves `dist/` at localhost:5173; set PORT to use another port.

`npm run test:browser` is an optional Playwright visual check. It requires Playwright (or PLAYWRIGHT_MODULE pointing to its installation) and Chrome (or CHROME_PATH pointing to a Chromium executable). This environment refused browser launch/listening, so browser visual/touch/audio testing was not completed. Automated native-rule tests and an offline bundle initialization/input/render smoke check pass. Craft Anything's rebuild_check currently selects the project's preserved Rust stack, so its screenshot/self-test results describe that version, not web visual equivalence.

## Reference retained

The original Rust project, `src/machine.rs`, `src/main.rs`, audio, evidence files, vendor libraries and captures remain in place. `cargo run --bin montrix` runs the simulator-based reference as before. Its original documentation is preserved in `README-reference.md`.

`src/bin/reference_export.rs` is a build-time art/data capture utility. Running `cargo run --release --bin reference_export` from `app/` regenerates the web assets from the reference runtime. It is never included in the web build, and ordinary web builds do not run Rust.

## Fidelity

Room artwork, topology, collision tiles and captured sprites come from the original. Native movement uses one pixel per 50.125 Hz update, fire cooldown is 10 updates, there are four reserve lives and six score digits. Player movement, walls, room changes, projectiles, captured enemy paths, damage, respawn protection, scoring, game over and the final exit are implemented directly in JavaScript.

Sprite playback preserves recorded per-update poses, hold times, visibility, expansion and drawing priority. Stationary objects stay fixed; multipart sprites share the room clock. Ship facing uses the seven original turn poses at two updates per pose, with sixteen-update horizontal coasting/braking; vertical movement retains horizontal facing. Pause freezes all sprite clocks. The exporter now reads each actor type from the correct slot.

Enemy paths are 768-update build-time recordings with verified repeating sections. Nonperiodic recordings retrace at their endpoints to avoid teleporting; they do not implement the original reactive AI. Reward selection is still approximate. The web version does not reproduce the original weapon-upgrade programs, music sequencer, high-score entry or attract-screen cycling. Sound is newly synthesized effects. Exact campaign, mechanics, audio and visual equivalence remain unverified. The reference simulator and its fidelity notes remain available for future comparison.

Room capture now disables the reference machine's four exit handlers while recording, and asserts the active room matches the requested room throughout. Previously actor interactions could move the idle ship to a neighbouring room during the 768-update recording, saving that neighbour's background/collision/actors under the starting room's original links. All 60 rooms have been regenerated, with capture identities and all four links checked against the snapshot.

## Keys, rockets and title options

The title screen has separate Infinite lives and Infinite shield switches, both off by default. Choices survive a restart: infinite lives allows hits and respawns without spending reserves; infinite shield prevents damage and respawns altogether.

All 19 keys are collected on contact and remain collected across rooms and deaths until a new game. Each opens every door carrying its original numeric ID. The build-time `web/reference-interactions.mjs` reads the original $3e/$3f drawing commands and their $b700 indices, including repeated door sections; the standalone runtime receives only decoded positions and IDs. Collected keys and unlocked doors disappear from the picture and collision checks. Other bonus objects retain their previous behavior.

Type $ac rockets now wait at their original launch coordinates and rise two pixels per update when the ship passes above them. Their flight freezes on pause, supports combat and contact damage, and ends off-screen. Launch coordinates come from the original room records rather than idle captures, which could already show a launched or destroyed rocket. Flame effects and the launch sound are newly drawn/synthesized.

Validation: all 20 web rule and standalone bundle tests pass. Craft Anything rebuild_check passes build, reference screenshot, reference self-test and credits; it still checks the preserved Rust app. Its mechanics comparison remains incomplete. The optional Playwright browser check could not run because Playwright is not installed; web visual equivalence remains unverified.
