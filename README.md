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

## Controls

| Input | Action |
|---|---|
| WASD / arrows | Move |
| Space | Dash (i-frames, 1 charge Genin / 2 charges Jonin, 1.8 s per charge) |
| Q or double-click | Ultimate (needs a full Chakra meter) |
| 1 / 2 / 3 | Pick a level-up card |
| Click "Banish" under a card | Remove that card from the pool for the run (costs 1 Banish charge, NOT the pick) |
| M | Mute |

Touch: left stick moves, DASH and ULT buttons on the right. Jutsu auto-cast — the only manual
inputs are movement, dash and the Ultimate, per the design memo §1.5.

## What is implemented (Batches 1-7)

- **60 Hz fixed logic tick** with an accumulator; rendering is decoupled (`src/core/world.js`).
- **Deterministic simulation**: seeded RNG (mulberry32), same seed + same inputs = same run. Verified by `node tests/sim.mjs --check`.
- **Object pools** for enemies (1500), projectiles, fields, gems, VFX; no per-frame allocation in the hot loop.
- **Status registry** as data (`src/core/statuses.js`): Aerated, Burning, Drenched, Frozen, Rooted, Marked, Stunned, Staggered — with durations, stack caps, refresh rules, detonation multipliers, per-target-per-pair ICDs and the D1-D4 loop guards.
- **Prime/Detonate**: Wind applies Aerated (4 s), Fire detonates it for 3× and spreads Aerated to two neighbours (2.5 s ICD per target per pair, one hop, capped).
- **Fusion**: all ten pairs from the matrix, each with its own 2.5 s per-target ICD. Fire + Wind = Firestorm, fired by the detonation itself (memo C9).
- **Chakra / Overcharge**: +1 per kill (+10 elite, +50 boss), cap 100. At 100 the Ultimate is armed and the next standard jutsu fires empowered (+50% damage, +30% radius, +1 stack).
- **Abilities**: all twenty from the Ability Starter Set across Fire, Wind, Lightning, Water and Earth — four per element, Tier 1/2/3, with the targeting mode, status and damage curve the document specifies. Four active slots, six passive slots (Genin 5, Chunin+ 6), five ranks per ability. Tier 2 needs rank 3 of its parent, Tier 3 needs rank 5 (ability mastery only, never player Rank).
- **Three ultimates**: Cataclysm Core (free, all statuses, every pair detonated), Spectral Guard (200 Seals), Summoning: Elder Toad (200 Seals).
- **Enemies** on the time-based curve: `HP = 20 × 1.085^minutes`, `SpawnRate = min(12, 1.5 + 0.9 × minutes)`, `MaxOnScreen = min(900, 120 + 40 × minutes)`. Fodder, brutes and archers (archers keep preferred distance and circle — the anti-AoE behaviour, not wave compression).
- **Four bosses** on a twenty-minute cadence, each in its own cleared arena, each with a punish window: Ronin (5:00, Counter Stance reflects), Twin (10:00, swap + absorb), Warden (15:00, armored front, 3 phases), Sovereign (20:00, Extract or Finish choice).
- **Rank / Breakthrough (Batch 5)**: Genin → Chunin (level 5+, +1 passive slot) → Jonin (level 15+, +1 dash charge) → Kage (level 25+, Flow State: 5 s of 70% CDR on Ultimate, once per run). Breakthrough is a level-up menu option that costs the pick. Skip it and it stays available next level-up. No stat boosts — Rank grants unlocks, not boosts.
- **Banish + Post-cap (Batch 6)**: Banish removes one offered card from the pool for the run. 1 free per run + up to 2 bought in Academy (50 Seals each), max 3 per run. At level cap 50, each full XP bar gives Heal 25% / Reroll Jutsu / +1 Banish instead of normal picks.
- **Academy (Batch 7, design §6)**: Training costs are flat — HP +10/node (max 10, 30 Seals), Chakra +5%/node (max 10, 40), Move +2%/node (max 10, 40). Clan trees are 5 nodes, 100 Seals each. T2 50, T3 150, Ultimates 200. Save writes backup-first so a crash-mid-write can be recovered on load.
- **Clan weighting (Batch 4)**: level-up rolls weight the clan-signature element 2× (Ember Fire, Stoneward Earth, Gale Wind, Tide Water).
- **XP curve (Batch 4)**: `XP to level N = 15 × 1.12^(N-1)`, cap 50.

## Install order (Batches 1-7)

Install in order 1 → 2 → 3 → 4 → 5 → 6 → 7. Each batch is full files, built on the previous one. Replace the whole file, don't paste snippets. If you skip earlier batches, the latest batch's `world.js` / `upgrades.js` still contain Batch 1-6 fixes, but don't mix old files with new ones.

## Tests

```bash
node tests/combat.test.mjs   # 21 checks: statuses, prime/detonate, ICD, spread, fusion, damage, overcharge, chakra
node tests/sim.mjs --check    # 5 seeds + determinism + post-cap, fails on NaN / crash
node tools/bundle.mjs .       # 18 modules -> dist/shinobi.html, fails on missing modules / placeholders
```
