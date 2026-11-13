# The five steps

The game was built in five playable steps. Each one ended in something you could run, not a
half-finished refactor. This is the record of what each step added and how it was verified.

The repository history carries the last three steps as commits; steps 1 and 2 were developed
before this repository was initialised, and their code is folded into `867333a`. Tags `step-3`,
`step-4` and `step-5` mark the milestone commits.

| Step | What it delivered | Verification |
|---|---|---|
| 1 | Core slice: 60 Hz fixed-tick loop, seeded RNG, object pools, status registry, nine-step combat pipeline, Prime/Detonate, Fire + Wind, five jutsu, three enemy types, The Ronin at 5:00, level-up picks, run-end screen. | Playable 5-minute run; 21 combat assertions; five seeded headless runs. |
| 2 | Full elemental roster: all 20 jutsu across five elements with tier gating, all 10 fusion pairs, 3 ultimates chosen per run, summons (Water Clone, Rock Golem, Toad Sage), Earth Wall barrier, Lightning Armor thorns, Vacuum Sphere pull, chain lightning. Damage routed through one formula so passives and Overcharge multiply everything. | 21/21 assertions; 5/5 seeded wins. |
| 3 | The 20-minute run: bosses at 5/10/15/20 (Ronin, Twin, Warden, Sovereign), boss HP scaled to measured single-target DPS, telegraphed ground zones, three world phases with safe zones, elite enemies (Shunshin teleporters, Siphoners), the Sovereign's extract-or-finish choice. | 5-seed 20-minute simulation, 4/5 wins, duels of 15–30 s. |
| 4 | Meta layer: Seals payout, the Academy (Training / Arsenal / Clans), four clans with stat floors and mechanical traits, Legacy traits, Perfect Shinobi, Ascension tiers, localStorage save. | Headless save/progression test; clan balance pass; 21/21 assertions. |
| 5 | Feel and packaging: per-element projectile and burst shapes, status pips, boss telegraph shapes, per-element audio, hit-stop, and `tools/bundle.mjs` producing a single-file build. | Chrome at 60 fps with 300+ enemies; 5/5 seeded wins; bundle loads standalone. |

## Running it

```bash
python3 serve.py 8099     # or: npm start
# http://127.0.0.1:8099/
```

Or open `dist/shinobi.html` — the whole game in one file, no server.

## Verifying it

```bash
npm test    # 21 combat assertions
npm run sim # five full 20-minute headless runs + determinism check
npm run bundle
```

## Where the design lives

`docs/design/` holds the consolidated design package the code implements. The Decision Memo is
normative where documents disagree; the ability starter set lives inside
`04_COMBAT_PIPELINE.md`.

## What is still open

- Art and audio are procedural placeholders, not production assets.
- The build is web (ES modules + Canvas 2D), not the Godot 4 / C# the technical spec calls for.
- World phases change light and tint, not geometry.
- Breakthrough (the level-up Rank promotion) and the full modifier-stack rules are unimplemented;
  Rank currently exists only as a label.
