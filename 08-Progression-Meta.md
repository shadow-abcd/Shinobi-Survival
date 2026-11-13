# 8. Progression & Meta

> Source: `Shinobi Survival — Design Package v1.0`, §8 (pp. 27–30). Transcribed verbatim from the design package. Do not edit the rules below without changing the design package first.
>
> Memo compliance: Section 1 Overcharge [OK] · Section 2 Rank/Tier/ability [OK] · Section 3 Stat floors [OK] · C1–C10 [OK] · A1–A6 [OK]
> Intentional violations: none.

## 1. Rank (player progression)

Four ranks. Granted by Breakthrough. Never reversed.

| Rank | Effect |
|---|---|
| Genin | Base stats. 5/6 passive slots usable. |
| Chunin | +1 passive slot (6/6). |
| Jonin | +1 dash charge (2 total). |
| Kage | Unlocks Flow State — 5s of 70% CDR, Ultimate-triggered, once per run. |

No raw stat bonuses. Rank grants unlocks, not boosts. This is important — if rank granted stats, it would be a rubber band on the player, which contradicts the design's commitment to feel the power curve.

### Breakthrough

Available in the level-up menu once every N levels:

- Chunin: available at level 5+
- Jonin: available at level 15+
- Kage: available at level 25+

Costs one pick from the level-up menu. The player chooses when to promote. Wait = stronger abilities per rank. Promote = unlock slot/charge benefits sooner. Both valid.

> Boss defeat does NOT grant Breakthrough. Breakthrough is a level-up menu option. Boss kills do grant rewards, Seals payout, and unlocks — see §6 in the design package.

## 2. Tier (ability progression)

| Tier | Gating | Availability |
|---|---|---|
| Tier 1 | None | Free from run 1 |
| Tier 2 | Parent at rank 3 + Academy unlock (50 Seals) | Academy |
| Tier 3 | Parent at rank 5 + Academy unlock (150 Seals) | Academy |

Mastery prerequisite softened from “mastered” to “rank 3” — so a two-element synergy build is affordable.

## 3. XP curve

XP to level N = 15 × 1.12^(N−1). At 20 min: ~level 40–45. Level cap: 50. Post-cap: heal 25% HP / reroll jutsu rank / +1 banish charge.

## 4. Clans

Four clans, defined by stat floors + mechanical traits. See §1 for reference tables.

| Clan | HP | Chakra gain | Move speed | Total | Identity |
|---|---|---|---|---|---|
| Uchiha | 80 | 105 | 110 | 295 | Glass cannon |
| Nara | 95 | 115 | 90 | 300 | Zoning |
| Hyuga | 115 | 90 | 95 | 300 | Frontliner |
| Uzumaki | 110 | 110 | 80 | 300 | Sustain |

Traits:

| Clan | Trait |
|---|---|
| Uchiha | 15% on hit to Stun (1s). Fire jutsu +10% crit. |
| Nara | Shadow Stitch aura: 4m, −30% enemy speed. Slowed take +10% dmg. |
| Hyuga | Knockback → Stagger (2s, +20% incoming damage). |
| Uzumaki | +1 max Overcharge stack. Kill below 30% HP restores 2 HP. |

Clan acquisition:

| Clan | Unlock requirement |
|---|---|
| Uchiha | Available at start |
| Nara | 30 total minutes survived |
| Hyuga | 90 minutes survived |
| Uzumaki | 180 minutes survived |

## 5. Seals (meta currency)

Earned during runs. Spent in the Academy between runs.

Payout:

| Source | Seals |
|---|---|
| Elite kill | +2 |
| Boss kill | +20 to +100 |
| Run end (10 min survived) | +10 |
| Run end (15 min survived) | +25 |
| Run end (20 min victory) | +50 |
| Ascension modifier | +10% per Ascension tier |

In-run currency is Scrolls (for safe zone shop). Different from Seals.

## 6. The Academy

Between runs. Spend Seals on permanent upgrades.

Pillar 1 — Global Stats:

- HP: +10 flat per node (max 10, 30 Seals each)
- Chakra gain: +5% per node (max 10, 40 Seals each)
- Move speed: +2% per node (max 10, 40 Seals each)

Pillar 2 — Arsenal Expansion:

- Tier 2 abilities: 50 Seals each
- Tier 3 abilities: 150 Seals each
- Ultimates: 200 Seals each

Pillar 3 — Clan Specialization:

Each clan has its own tree. 5 nodes per tree, 100 Seals each. Example Uchiha tree: Genjutsu duration +0.2s/node, proc chance +2%/node, Fire crit +5%/node, CDR (Fire only) +3%/node, Capstone: Genjutsu spreads.

100% a clan tree to unlock a Legacy Trait.

Banish purchases:

- Free: 1 per run
- Purchasable: +2 (50 Seals each)
- Max per run: 3

## 7. Legacy system

After 100% a clan tree, that clan contributes a Legacy Trait available to other clans.

Rules:

- Each equipped Legacy Trait COSTS ONE PASSIVE SLOT (Memo C1)
- Max 3 equipped simultaneously (Memo C2)
- Legacy Trait does not apply to its clan of origin
- Perfect Shinobi triggers on OWNERSHIP of all 4, regardless of equip

Perfect Shinobi state: Global +10% to all Nature Transformations on every run. Not a build; a permanent unlock. This is NOT the endgame — see below.

## 8. Run-end screen

The screen that delivers the Seals. Previously undesigned.

```
RUN COMPLETE
Survived: 17:32  Rank: Chunin
Level: 38  Kills: 4,847  Kills/min: 280
Bosses: 3 / 4

SEALS EARNED
Base: 35
Bosses: 120
Time bonus: 15
Ascension: +10%
-------------------
TOTAL: 187
Balance: 1,427

NEXT UNLOCK
Nara clan unlocks in 3 more minutes survived

[SPEND IN ACADEMY] [RUN AGAIN]
```

Three required elements:

- Payout transparency — show the breakdown, not just the total
- Next-goal hook — always show the nearest unlock
- Build summary — what you built. Especially valuable after a loss.

Death: greyscale bg, somber audio, RUN ENDED. Victory: colorful bg, triumphant audio, RUN COMPLETE. Same layout.

## 9. Endgame — Ascension

The meta tree's ceiling is NOT the game's ceiling. Each victory (20-min run) unlocks Ascension +1. Each tier adds a global modifier.

| Ascension | Modifier |
|---|---|
| A1 | +10% enemy HP |
| A2 | +10% enemy count |
| A3 | Bosses gain +1 phase |
| A4 | Safe zones disabled |
| A5 | Player HP −10% |
| A6+ | Combinations + +5% per tier |

No ceiling. At A10, A15, A20 the game is a different game. Perfect Shinobi unlocks A5 access; game only ends when player decides to stop climbing.

Leaderboard: Ascension tier is the score. “I am on A7” is a bragging right.

## 10. The one-screen meta economy

RUN → earn Seals → Academy → higher stat/pool. RUN → 100% clan tree → Legacy Trait → hybrid run. RUN → all 4 legacies owned → Perfect Shinobi. RUN (victory) → Ascension +1 → harder run.

The loop is closed. Every run feeds one of the four meta gates.

## 11. What NOT to add

- No difficulty slider. Ascension is the difficulty slider.
- No class system. Clans are the class system.
- No paid currency. Seals only.
- No daily quests. Runs are the content.
- No PvP. Single-player only.

Adding any of these would dilute the game's identity. It is a 20-minute run-based auto-cast survivor. Every meta system serves that.

---

## Implementation note (not in the design package)

This file is the rule set the code in this push implements. Code mapping:

- `src/core/upgrades.js` — `RANKS`, `BREAKTHROUGH` (Chunin 5+, Jonin 15+, Kage 25+), `passiveSlotsForRank()` (Genin 5, else 6), `nextBreakthrough()` (menu option, costs the pick). `rollChoices()` offers Breakthrough when eligible and caps passives at `player.maxPassives`.
- `src/core/world.js` — `player.rank` starts `genin`, `maxPassives: 5`, `dashMax: 1`, `flowUnlocked: false`. `promote(rank)` is sequential only (`next === cur + 1`), never reversed, no stat boost: Chunin → `maxPassives = 6`; Jonin → `dashMax = 2`, `dashCharges = 2`; Kage → `flowUnlocked = true`. `castUltimate()` triggers Flow State once per run (`flowUsed`, `flowT = 5.0`, effective CDR 0.7 in `calcDamage` / cooldown path). `step()` ticks `flowT` down and emits `flow:end`.
- `src/ui/menus.js` — `showLevelUp(level, choices, onPick, rank)` renders Breakthrough cards distinctly and shows the current Rank in the title.
- `src/ui/audio.js` — `breakthrough()` and `flow()` sounds.
- `src/app.js` — hooks `rank:breakthrough` → `audio.breakthrough()`, `flow:start` → `audio.flow()`.

Verify after pushing: `grep -rn "passiveSlotsForRank\|promote\|flowT" src/` should hit `upgrades.js` + `world.js`, and a fresh run should start with 5 passive slots, not 6.
