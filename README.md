# Shinobi Survival — Step 4

A browser-playable build of the *Shinobi Survival* design package: a full twenty-minute run, five
elements, twenty jutsu, ten fusions, four bosses, and a meta layer that persists between runs.

Run it:

```bash
cd workspace/shinobi
python3 serve.py 8099
# open http://127.0.0.1:8099/
```

(`serve.py` is a static server with caching disabled; `python3 -m http.server 8099` works too,
you may just have to hard-reload after an edit.)

Or open `dist/shinobi.html` — the whole game inlined into one file, no server needed. Rebuild it
with `npm run bundle` after changing anything.

No build step, no dependencies, no network calls. Plain ES modules + Canvas 2D.

## Controls

| Input | Action |
|---|---|
| WASD / arrows | Move |
| Space | Dash (i-frames, 1.8 s cooldown) |
| Q or double-click | Ultimate (needs a full Chakra meter) |
| 1 / 2 / 3 | Pick a level-up card |
| M | Mute |

Touch: left stick moves, DASH and ULT buttons on the right. Jutsu auto-cast — the only manual
inputs are movement, dash and the Ultimate, per the design memo §1.5.

## What is implemented

- **60 Hz fixed logic tick** with an accumulator; rendering is decoupled (`src/core/world.js`).
- **Deterministic simulation**: seeded RNG (mulberry32), same seed + same inputs = same run.
- **Object pools** for enemies (1500), projectiles, fields, gems, VFX; no per-frame allocation in
  the hot loop.
- **Status registry** as data (`src/core/statuses.js`): Aerated, Burning, Drenched, Frozen,
  Rooted, Marked, Stunned, Staggered — with durations, stack caps, refresh rules, detonation
  multipliers, per-target-per-pair ICDs and the D1–D4 loop guards.
- **Nine-step damage pipeline** in the order the design specifies: status application →
  prime/detonate → damage formula (rank × element × detonate × crit × resist) → on-hit → death/loot.
- **Prime/Detonate**: Wind applies Aerated (4 s), Fire detonates it for 3× and spreads Aerated to
  two neighbours (2.5 s ICD per target per pair, one hop, capped).
- **Fusion**: Fire + Wind = Firestorm, fired by the detonation itself (memo C9).
- **Chakra / Overcharge**: +1 per kill (+10 elite, +50 boss), cap 100. At 100 the Ultimate is
  armed and the next standard jutsu fires empowered (+50% damage, +30% radius, +1 stack).
- **Abilities**: all twenty from the Ability Starter Set across Fire, Wind, Lightning, Water and
  Earth — four per element, Tier 1/2/3, with the targeting mode, status and damage curve the
  document specifies. Four active slots, six passive slots, five ranks per ability. Tier 2 needs
  rank 3 of its parent, Tier 3 needs rank 5 (ability mastery only, never player Rank).
- **All ten fusion pairs** from the matrix (Firestorm, Scald Veil, Magma Well, Plasma Lance,
  Frost Lattice, Iron Sand, Thunder Gale, Galvanic Torrent, Verdant Coil, Detonation Clay), each
  with its own 2.5 s per-target ICD.
- **Three ultimates, picked before a run**: Cataclysm Core (all statuses, every pair detonated),
  Susanoo Ribs (90% reduction, status immunity, +50% damage) and Summoning: Toad Sage.
- **Summons and terrain**: Water Clone and Rock Golem fight beside you; the Earth Wall physically
  shoves enemies out for five seconds.
- **Enemies** on the time-based curve: `HP = 20 × 1.085^minutes`, `spawn/s = 1.7 + 0.95 × min`,
  `max on screen = 130 + 45 × min`. Fodder, brutes and archers (archers keep preferred distance
  and circle — the anti-AoE behaviour, not wave compression).
- **Four bosses on a twenty-minute cadence**, each in its own cleared arena, each with a punish window:
  - **The Ronin** (5:00) — Long Slash arc, Dash Strike line, Counter Stance that reflects.
  - **The Twin** (10:00) — a bow and a blade at once. Hit either too hard and they swap places;
    kill one and the survivor absorbs it, heals, and fights harder.
  - **The Warden** (15:00) — armored front: half damage from the front, full from behind. Three
    phases, shield throw, spin, a desperation charge, elite adds.
  - **The Sovereign** (20:00) — four phases that rotate through all five elements, ending in a
    telegraphed Cataclysm Core. At a quarter health you choose: finish it, or extract with what
    you have.
- **Boss health scales with your measured single-target DPS** (about thirty seconds of fight), so a
  maxed build does not delete the Warden and a weak one does not stall on the Ronin.
- **World phases**: Whispering Forest → Ruined Village → Wasteland, each with its own tint,
  advancing when a boss dies, with a short safe zone (no spawns, a heal) between stages.
- **Elites from minute 9**: Shunshin teleporters that blink onto you, and Siphoners that drain your
  Chakra on contact.
- **Run structure**: death, extraction or victory → run-end summary with build, kills, damage,
  bosses cleared, final boss HP and the Seals you earned.
- **Meta layer (saved in the browser)**:
  - **Seals** from every run — boss kills, time survived, level, with a 1.3× win multiplier.
  - **The Academy**: Training (HP, damage, speed, pickup, Chakra gain), Arsenal (unlock every
    Tier 2 and Tier 3 jutsu), Clans (select a clan, then rank up its tree).
  - **Four clans** with the memo's stat floors and mechanical traits — Uchiha free, Nara at 30
    minutes survived, Hyuga at 90, Uzumaki at 180.
  - **Legacy**: finishing a clan tree earns its Legacy trait for every clan; owning all four is
    Perfect Shinobi, +10% damage on every run.
  - **Ascension**: every win raises the tier — enemy HP up, then enemy count, and at A4 the safe
    zones disappear. No ceiling.

## Deliberately not in Phase 1

Meta-progression (Seals, the Academy, clan unlocks, Legacy, Ascension), the other three elements
and their fifteen jutsu, the other three bosses, world phases, safe zones, audio assets, and the
Godot/C# port. Those are Phases 2–4 of the plan.

## Architecture

```
src/
  core/        pure simulation — no DOM, runs headless under Node
    world.js       fixed-tick orchestrator, pools, damage entry points
    statuses.js    the status registry + tick/stack/detonate rules
    abilities.js   ability data + cast behaviour, fusion table
    enemies.js     archetypes, AI, spawner curve
    boss.js        The Ronin state machine and telegraphs
    upgrades.js    level-up pool, slot and tier gating
    grid.js        uniform spatial hash (collisions + crowd separation)
    pools.js, rng.js, bus.js
  render/      reads world state only
    renderer.js    camera, draw order, VFX, damage numbers
    sprites.js     baked offscreen sprites (no per-frame gradients)
  ui/          DOM HUD, overlays, audio, dev autopilot
  app.js       input, accumulator loop, screen transitions
tests/
  sim.mjs         full 5-minute headless run + determinism check
  combat.test.mjs 21 assertions on the pipeline: prime/detonate, ICDs, spread caps,
                  fusion, crit, Staggered, Overcharge, Chakra
  bot.mjs        the autopilot both tests and the browser debug mode use
```

`core/` never touches the DOM, which is why the balance can be simulated thousands of times headless.

## Verification

```bash
node tests/combat.test.mjs    # 21 assertions, all passing
node tests/sim.mjs            # five seeds, full 20-minute runs: 4/5 wins, boss duels of 15–30 s
```

Measured in the sandbox's Chrome at 1271×808: **60 fps at 215 enemies on screen**, logic
~0.2 ms/tick.

Debug parameters (development only): `?seed=N` fixed seed, `?warp=SECONDS` fast-forward,
`?god=1` invulnerable while fast-forwarding, `?auto=1` autopilot, `?fps=1` metrics overlay,
`?ult=cataclysm|susanoo|toad` force an ultimate.

## Packaging

`tools/bundle.mjs` is a dependency-free bundler: it resolves the relative imports from
`src/app.js`, concatenates the modules in dependency order, strips the import/export syntax,
inlines the stylesheet, and writes `dist/shinobi.html` (~190 KB, no network, no build toolchain).
That single file is the build you can hand to someone, drop on a static host, or open by
double-clicking.

## Known rough edges

- Art is procedural primitives, not the game's final style — it exists to be readable at density.
- Audio is synthesised at runtime (no music, no recorded SFX); it reads as placeholder, not score.
- World phases change light and tint, not geometry.
- Mobile layout is functional but untested on a real device.
- The run-end screen has no meta payout yet: the meta layer is Step 4.
- World phases change light and tint, not geometry; destructible cover and hazards are polish.
