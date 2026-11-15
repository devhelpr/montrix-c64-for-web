This build contains the original game's own files, for the private use of the person who owns the game, on their own computer. It must not be shared or published.

# Montrix

A playable Rust + macroquad reconstruction from your 1991 C64 VICE memory snapshot. It starts at the saved attract/credits screen. Press Space or Enter to start, then use the arrow keys and Space to control the craft. WASD also moves. P/Escape pauses; R restarts a fresh game; M mutes the sound. Resize the window freely; the original pixel display retains its proportions.

The original game assets and machine instructions are retained in a small, independently written 6502/VIC-II runtime. This preserves the room data, enemy programs, scoring, weapons, lives, attract screens and menus without guessing at game rules. This is a tailored reconstruction, not a complete general-purpose C64 emulator. No original ROM is required. No external emulator is installed or launched.

## Run and verify

`cargo run --bin montrix`

`cargo run --bin montrix -- --screenshot shots/now.png`

`cargo run --bin montrix -- --self-test shots/self-test.json`

The screenshot run draws 120 frames, saves the actual window framebuffer and exits. The macOS window backend is locally patched to show the check window without activating it. Normal play opens normally. The self-test starts with joystick fire, flies in three directions, fires actual projectiles and measures the original HUD and game memory. It runs the same game state and renderer without requiring a foreground window.

## Fidelity limits

The RAM and graphics are exact extracted bytes. The new CPU implementation executes the game's instructions and raster interrupts, rather than translating decompiled output. Source addresses and independently decoded rules are in MECHANICS.md. Hardware bus contention, precise bad-line timing, border tricks and SID analog filters/envelopes are approximations. Some attract-screen effects can differ. The original SID music and effects sequencer runs; macOS audio synthesizes its register output with approximate oscillators/envelopes. Other platforms currently have no audio backend. This build is intended for the owner's current Mac.

There are no original runtime screenshots in the supplied reference folder, so exact visual and sound equivalence remains unverified. The capture README's scan of the parent Development/AI directory includes unrelated projects; none were imported.

Snapshot format was checked against the VICE project's own c64memsnapshot.c and viciisc/vicii-snapshot.c (https://github.com/VICE-Team/svn-mirror). Deep-tool decompilation was attempted, but the container is unsupported and Ghidra lacks its macOS native decompiler. The standalone 6502 disassembly helper is investigation-only code. All generated/modified project content lives here.
