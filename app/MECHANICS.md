# Recovered mechanics and implementation limits

The original C64 program was opened and triaged first. Native function listing, string search and pseudocode were attempted; VICE is unsupported, the built-in raw loader does not accept 6502, and Ghidra lacks its macOS native decompiler. RAM was extracted using the VICE module layout and inspected with an independently written 6502 disassembler before any estimates. A temporary raw target was opened with a 6502 language pin, but its fallback x86 disassembler was not used as evidence.

Rather than invent missing rules, this build preserves the untouched original RAM as an owner-provided game asset and executes its instructions in newly written Rust. All game logic, enemy routines, item/weapon upgrades and room tables therefore remain present. No decompiled source was pasted. The sheet records decoded constants; other per-template values remain read directly by the original routines. Full runtime equivalence is unverified.

Evidence: movement/fire bytes ev_4867cb49a211cb36fe2af22c0125a91e0e18064eeba72607fc023876bb1599a0; room/init bytes ev_5baf157582ad9df9f6da74c3eebcc30f10ef3854552843ddec9098153d2d7777; room table ev_704663daa59f8fabcfb11a0b7284f65c346143eb1f2b7efc9e559c558ac80d2d; reward tables ev_6e1579bc9cc018700bdf219daf95c49f946987aba409c4207844336b708da571.

- **PAL CPU clock** (timing): 985248 cycles/s. Source: VICE C64 PAL model; snapshot VIC-II model byte 1.
- **cycles per raster line** (timing): 63 cycles. Source: VICE PAL C64 model.
- **raster lines per frame** (timing): 312 lines. Source: VICE PAL C64 model.
- **simulation frame rate** (timing): 50.125 Hz. Source: 985248 / (312 * 63), rounded 0.001 Hz.
- **screen width** (display): 320 pixels. Source: VIC-II 40 columns × 8, register $D016.
- **screen height** (display): 200 pixels. Source: VIC-II 25 rows × 8, register $D011.
- **output with border** (display): 384 × 272 pixels. Source: renderer crop around VIC-II visible area. **Estimated / approximate.**
- **map tile size** (collision): 8 pixels. Source: 6502 $1453–$1488 and $2205: divide X/Y by 8.
- **solid collision marker** (collision): 128 byte. Source: 6502 $7842–$786B compares tile to $80.
- **horizontal movement increment** (movement): 1 pixel/update. Source: 6502 $13C8 INC $1A08 and $1429 DEC $1A08; update frequency driven by original interrupts.
- **vertical movement increment** (movement): 1 pixel/update. Source: 6502 $7807 INC $1A10 and $7839 DEC $1A10.
- **flight direction** (movement): four directions, held joystick; horizontal coasting/braking counter reloads to 16. Source: 6502 $1308–$1452, $757D–$76CD and $7800–$786B.
- **right room edge** (movement): 319 C64 sprite X. Source: 6502 $13AD compares X low $3F with high bit set.
- **left room edge** (movement): 25 C64 sprite X. Source: 6502 $140E compares X $19.
- **top room edge** (movement): 50 C64 sprite Y. Source: 6502 $7832 compares Y $32.
- **bottom room edge** (movement): 191 C64 sprite Y. Source: 6502 $7800 compares Y $BF.
- **room transition marker** (rooms): 254 byte. Source: 6502 $13EE and $1437 set $1B65=$FE.
- **room count** (rooms): 60 rooms. Source: 6502 $20CF–$20E1 CMP #$3C; 60 four-byte entries at $2800.
- **room entry size** (rooms): 4 bytes. Source: 6502 $20B9 ASL ASL indexes table at $2800.
- **room absent link** (rooms): 255 byte. Source: 6502 $1330, $136F, $13CE, $142D check $FF.
- **joystick port** (controls): 2 port. Source: 6502 $2257 LDA $DC00; CIA1 joystick port 2.
- **joystick up bit** (controls): 1 active-low mask. Source: 6502 $1308–$1452; input $02 / $DC00.
- **joystick down bit** (controls): 2 active-low mask. Source: 6502 $1308–$1452; input $02 / $DC00.
- **joystick left bit** (controls): 4 active-low mask. Source: 6502 $1308–$1452; input $02 / $DC00.
- **joystick right bit** (controls): 8 active-low mask. Source: 6502 $1308–$1452; input $02 / $DC00.
- **joystick fire bit** (controls): 16 active-low mask. Source: 6502 $1308–$1452; input $02 / $DC00.
- **desktop movement** (controls): arrow keys or WASD binding. Source: new input bridge to original joystick port 2.
- **desktop fire/start** (controls): Space or Enter, hold binding. Source: new input bridge to original joystick fire bit 16.
- **pause** (controls): P or Escape binding. Source: new desktop convenience.
- **restart** (controls): R binding. Source: new desktop convenience: restore snapshot then press fire.
- **mute** (controls): M binding. Source: new desktop convenience.
- **reserve lives at start** (survival): 4 reserve lives. Source: 6502 $0820 LDY #$04; $214F STY $1B64; measured after fire-to-start.
- **respawn flash counter** (survival): 64 updates. Source: 6502 $2154 LDA #$40 stores $1167.
- **respawn protection counter after death** (survival): 128 updates. Source: 6502 $117B stores $80 to $1167.
- **enemy slots** (enemies): 7 slots. Source: 6502 $0AEB–$0B21 slots 1..7; player in slot 0.
- **sprite actor slots** (enemies): 8 slots. Source: 6502 $11EA–$120B and $27CB.
- **initial enemy health storage** (enemies): 8 per slot, later template-dependent. Source: snapshot $1A39–$1A40; $27C0 decrements health until zero.
- **death animation length** (enemies): 14 animation steps. Source: 6502 $1145 CMP #$0E.
- **death animation hold** (enemies): 3 updates/step. Source: 6502 $78AE–$78C1 reloads counter 2, decrements twice.
- **enemy behavior** (enemies): original per-room template programs and movement tables rule. Source: 6502 $0B25–$0BFC loads 8-byte templates at $1E00; AI $60xx–$72xx retained in original RAM.
- **projectile cooldown reload** (weapons): 10 updates. Source: 6502 $14D1, $1509, $1523 set $1B6D=$0A.
- **horizontal projectile slots per direction** (weapons): 4 slots. Source: 6502 $14A5–$1512 checks four slots right / left.
- **vertical projectile slots** (weapons): 4 slots. Source: 6502 $1515–$155E split indices 0..1 / 2..3.
- **projectile travel step** (weapons): 1 tile/update. Source: 6502 $1620 INC projectile X; $16D4 DEC X; $17A5 and $17F1 vertical Y.
- **weapon mode selector** (weapons): original $217F selector and per-mode branching rule. Source: 6502 $2180–$219B and $2500–$2559 retained; no extra magazine/reload mechanics added.
- **score digits** (scoring): 6 decimal digits. Source: 6502 $10BB–$10F0, $196E–$1973, $9EC4–$9ED5.
- **enemy score rewards** (scoring): 5, 1, 20, 50, 100, 1000 points by original reward index. Source: 6502 $1974 digit indices 5,5,4,4,3,2 and $197A increments 5,1,2,5,1,1; actual formula 10^(5-digit index)*increment.
- **score reset** (scoring): 0 points. Source: 6502 $7AC0–$7AD1 clears six decimal digits.
- **music voices** (sound): 3 voices. Source: original writes to SID $D400–$D418.
- **SID oscillator frequency** (sound): 16-bit register × 985248 / 16777216 Hz. Source: MOS SID frequency register formula; original music/SFX writes preserved.
- **sound sample rate** (sound): 44100 samples/s. Source: new macOS output backend.
- **SID analog response** (sound): approximate pulse/saw/triangle/noise and attack/release; no analog filter model implementation. Source: estimated. **Estimated / approximate.**
- **VIC-II bus contention** (timing): not modeled; original instruction cycles and raster IRQs are modeled implementation. Source: estimated. **Estimated / approximate.**
- **screenshot duration** (verification): 120 rendered frames. Source: new screenshot runner.

## Applicability

The game uses 2D four-direction flight and room transitions. There is no new walk/run, jump/gravity, crouch, 3D camera, mouse aiming, armor, magazine or reload system. The original fire routines, collision damage and reserve-lives rules are executed as saved. On-screen HUD is the original lower strip with ship/lives/score artwork; no replacement interface is imposed. Keyboard conveniences are additions.

The game begins in its saved credits/attract state (PC $BC4E), then joystick fire starts a fresh game. The original program remains responsible for high-score entry, attract cycling, death, game over and progression. A full campaign playthrough and exact sound/overscan comparison require original running evidence and remain unverified.

## Standalone web follow-up

The 54 values above describe the preserved simulator reference. `web/game.mjs` implements independent JavaScript rules: one pixel/update at 50.125 Hz, 8-pixel projectile step, 10-update cooldown, four reserves, 64 initial/128 respawn protection updates and six score digits. Room links, 8-pixel collision grids and sprites were exported from the reference. Native enemy AI, reward-index mapping, transitions and combat are approximations; weapon upgrades and original music are not ported. `web/game.test.mjs` checks movement, firing, collision, room links, combat, lives, game over and a physically traversable first exit. These checks establish native behavior, not exact equivalence with every original routine.

## Sprite playback correction

The web exporter records 768 successive poses for every room/slot, including coordinates, atlas frame, visibility and X/Y expansion. Atlas deduplication no longer determines frame order or cadence. The capture holds player protection constant so death/respawn and protection-colour flashing cannot contaminate the animation. Verified recurring pose windows loop; nonperiodic recordings retrace continuously after their capture ends. This improves the recorded movement but does not reproduce player-dependent AI.

The native ship uses the original pointer sequence $11, $2E, $3C, $3D, $3E, $3F, $12 from $6A06/$6A40, advancing every two updates ($6A82). Its horizontal controller retains a sixteen-update coasting/braking interval ($7680–$76CD). Room entry resets the actor clock, paused updates leave every animation clock unchanged, and rendering clips all sprites to the room and draws higher slot numbers first. Regression tests cover fixed objects, multipart offsets, capture metadata, loop boundaries, ship coasting/turning and pause. Exact reactive AI, campaign and original-runtime visual equivalence remain unverified.
