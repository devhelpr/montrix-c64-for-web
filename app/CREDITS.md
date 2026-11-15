# Original game material

Owner-provided source: `/Users/audax/Development/AI/montrix-vice-snapshot-20261115103455.vsf`

SHA-256: ef7324fa262261b5406e1204c2d0db3b0a0a3e0439584eaaad7a30e6c17804db

The snapshot contains the game's own credits: code, design and concept — Maikel vd Lisdonk; graphics and design — Ramon vd Laar; music and sound effects — Maikel vd Lisdonk. These credits are retained in the original attract screens.

Original files used (all derived from the single owner-provided snapshot, no unrelated installed files):

- `evidence/ram.bin`: C64MEM payload bytes 4..65540; the exact 64 KiB saved RAM. Includes original machine instructions, room/monster/weapon tables, sprites, fonts, bitmap backgrounds, HUD, music and effects sequencers. RAM SHA-256: 19697bb462b13703b96bed6ec3824d68ade38d5d9d22e687dcfbebb27cf19231.
- `evidence/VIC-II.bin`: VIC-II module payload; registers at 1..65, original color RAM at 761..1785. Used directly by the renderer's starting state.
- `evidence/MAINCPU.bin`: MAINCPU module payload; restored A=$FA, X=$0E, Y=$15, SP=$FA, PC=$BC4E, P=$65. Used to identify the starting register state.
- Other `evidence/*.bin` module extracts are retained only as investigation evidence, not loaded by the game: C64MEM, C64CART, CIA1, CIA2, SID, SIDEXTENDED, DRIVE8–11, DRIVECPU0, 1541VIA1D0, VIA2D0, FSDRIVE, GLUE, C64MEMHACKS, TAPEPORT, DATASETTE, KEYBOARD, JOYPORT0–1, JOYSTICK0–1 and USERPORT. Their common source is the snapshot path above.
- `evidence/recovered-*.png`, `evidence/level-ram.bin` and `shots/probe-*.png`: inspection renders/captures derived from the same snapshot, not additional source artwork.

# New software

6502 execution, display reconstruction, input bridge, audio synthesis and automated tests were independently implemented in Rust. No decompiled source was pasted into the game.

macroquad and its dependencies retain their respective open-source licenses. The vendored miniquad 0.4.11 backend is MIT/Apache-2.0 licensed (licenses included under vendor/miniquad); its macOS activation behavior is patched for nonintrusive screenshot checks.

# Standalone web version

`web/assets/room-0.png` through `room-59.png`, `title.png`, `sprites.png`, and `rooms.json` are private-use derivatives of the owner-provided snapshot, exported through the retained Rust reference runtime by `src/bin/reference_export.rs`. They contain the original backgrounds, title/credits, sprite artwork, room links, collision grids and observed actor templates. The web runtime does not load original executable instructions, ROMs or the snapshot. Canvas presentation, JavaScript rules, offline packaging, controls and synthesized effects are newly written. The browser game has no third-party runtime dependencies.
