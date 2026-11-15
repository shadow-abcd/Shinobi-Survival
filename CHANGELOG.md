# Changelog — Shinobi Survival

## Unreleased
- Quick Wins: CHANGELOG + Profiler (FPS + pool) + Swipe Cards + Replay (seed save/load)

## Batch 11 FIX v3 — 2026-11-15
- Real combat fields for 5 new jutsu (blizzard, meteor, venomPool, kunai, gravityWell)
- Fix duplicate chainLightning: cd 7.0 -> 2.8, chains 4, kind chain
- Add STATUS.poisoned (DoT 2/stack/0.5s)
- Tests: tests/batch11.test.mjs

## Balance Fix — 2026-11-15
- Enemy HP 1.085 -> 1.078 (Batch 8), spawn cap 11, MaxOnScreen 750
- Overcharge: +50% dmg +30% radius, 8s cd, needs 50 Chakra
- Recommended Loadout hint per clan

## Gaps Fix — 2026-11-15
- SFX per element + boss + hit + level-up (Web Audio, M mute)
- +2 enemies: Stinger (ranged Drenched) + Summoner (spawns 2 fodder / 8s)
- Mobile Level-Up Cards: 88px min-height, vertical on phone, tap to pick
- README: Balance Philosophy + Roadmap + Contribution

## Mobile QoL — 2026-11-14
- Pause button + P key, Auto-save every 30s, Low-power mode (L), One-hand mode (O)

## Achievements + Quests — 2026-11-14
- 12 Achievements + 4 Daily Quests, Seals rewards

## Endless + Boss Rush — 2026-11-14
- Endless: infinite after 30 min, Boss Rush: 5 min, no swarm, 4 bosses

## Daily Run + Leaderboard — 2026-11-14
- Daily seed YYYY-MM-DD, score time+kills+level+bosses, local top 10

## Skins + Trails — 2026-11-14
- 6 skins + 6 trails, Seals unlocks, cosmetics not power

## Batch 8 Balance — 2026-11-13
- Base HP 165, enemy HP exponent 1.078, fodder 2.5, touch cooldown 1.05s, caps 750/11
- Sim 3/5 wins, 21 tests passed

## Batches 1-7 — 2026-11-12
- Engine, Bosses, Enemies, Upgrades, Rank/Breakthrough, Banish + post-cap, Meta/Academy
- Commit 10fb5f9, 16 files, 5499 insertions

## Docs v2 — 2026-11-11
- docs/design/ 01-09 + README, Minimal IP rename DONE
