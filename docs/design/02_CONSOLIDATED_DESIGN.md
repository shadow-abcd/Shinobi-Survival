# Consolidated Design Document — Shinobi Survival

**Purpose:** The game at a design level. Pillars, loop, systems overview. Implementation details in companion files.

**Memo compliance:** This document is the *source* for cross-file decisions. All memo rules applied.

---

## 1. Design pillars

Three sentences. What the player feels.

1. **Minute 1 — Fragile precision.** You have one jutsu, a slow dodge, and a screen full of enemies. Every kill is deliberate. You feel outnumbered.
2. **Minute 10 — Tactical layering.** Two elements, one fusion pair, a boss you can barely beat. You're building something. The screen is still chaotic, but you see the patterns.
3. **Minute 20 — Earned dominance.** The screen is yours. Enemies die as fast as they spawn. The boss doesn't scare you anymore. You feel like a Kage.

The arc: **survive → compose → dominate.** The player's skill expression is *build assembly*, not reflexes.

---

## 2. Genre and positioning

- **Genre:** Roguelike action-survival (Vampire Survivors, Brotato, Magic Survival)
- **Session length:** 20-minute runs (v1). Ascension extends for veterans.
- **Input:** Movement (WASD/left stick), dash (space/A), manual Ultimate trigger. That's it.
- **Perspective:** Top-down 2D (or 3D ortho)
- **Platform:** PC first, console + mobile later

---

## 3. Terminology

| Concept | Word | Notes |
|---|---|---|
| Player progression | **Rank** | Genin → Chunin → Jonin → Kage |
| Ability progression | **Tier** | 1 → 2 → 3 |
| Ability rank within tier | **Rank** | 1 of 5 |
| Elemental reaction | **Synergy** | Binary |
| Wind → Fire trigger | **Prime/Detonate** | |
| Meta currency | **Seals** | |
| In-run currency | **Scrolls** | |
| In-run XP | **Chakra** | Also the meter name |

---

## 4. The core loop

```

┌──────────────────────────────────────────────────────┐
│                                                       │
│   SURVIVE → KILL → COLLECT XP → LEVEL UP → PICK → ↑  │
│                                                       │
│   every 5 min → boss → safe zone → next phase         │
│                                                       │
│   at 20 min → climax boss → run-end → Seals → meta   │
│                                                       │
└──────────────────────────────────────────────────────┘

```

**At any moment:**
- Player moves, auto-cast fires, statuses tick, enemies spawn
- XP gems spawn on kill → collected by proximity
- Level-up → pause → 3 choices
- Every 5 min → boss → safe zone → phase transition

**Run-end:**
- Death or 20-minute victory
- Summary screen → Seals payout → return to Academy

---

## 5. The combat model

### 5.1 Auto-cast

Every jutsu fires on cooldown at its targeting mode. The player's input is *movement*, not casting. Ultimate is the one exception — manually triggered per §1.5.

### 5.2 Targeting modes

Every ability declares one:

| Mode | Behavior | Best for |
|---|---|---|
| **Nearest** | Closest enemy | Basic attacks |
| **Facing** | Player movement direction | Line attacks |
| **Densest Cluster** | Point with most enemies in radius | AoE nukes |
| **Lowest HP** | Finisher targeting | Executions |
| **Random** | Any in range | Chip damage |
| **Self-AoE** | Centered on player | Defensive |
| **Fixed Point** | Enemy position at cast time | Delayed AoE (traps) |

### 5.3 The Prime/Detonate system

The core synergy mechanic. One element *primes* a status; another *detonates* it for 3× damage and spreads.

**Five prime/detonate relationships (full table in `03_STATUS_REGISTRY.md`):**

| Prime | Status | Detonate | Effect |
|---|---|---|---|
| Wind | Aerated | Fire | 3× damage, spreads Aerated to 2 nearby |
| Fire | Burning | Wind | AoE ignition |
| Water | Drenched | Lightning | Chains to 3 nearby |
| Earth | Rooted | Wind | Launch/knockback |
| Water | Frozen | Any physical | Shatter +50% |

### 5.4 The fusion matrix

Ten unique pairs from five elements. **Fusion fires on status overlap, subject to a 2.5 s per-target-per-pair ICD.**

| Pair | Effect | Status |
|---|---|---|
| Fire + Wind | Firestorm | Aerated |
| Fire + Water | Scald Veil | Drenched |
| Fire + Earth | Magma Well | Burning |
| Fire + Lightning | Plasma Lance | Burning + Stunned |
| Wind + Water | Frost Lattice | Frozen |
| Wind + Earth | Iron Sand | Rooted |
| Wind + Lightning | Thunder Gale | Stunned |
| Water + Lightning | Galvanic Torrent | Drenched |
| Water + Earth | Verdant Coil | Rooted |
| Earth + Lightning | Detonation Clay | Marked |

### 5.5 The loadout

- **4 active jutsu** (elemental). Slots for fusion and Prime/Detonate.
- **6 passive slots** (stats, utility, legacy traits).
- **1 ultimate slot** (manual trigger, from Chakra meter).

**Slot rationale:** 3 is too few (max 3 fusion pairs, most of the matrix unreachable); 6 is too many (builds stop feeling distinct). 4 gives 6 possible pairs per build.

**Fusion requires both parents at rank ≥ 3.** Makes fusion a *build goal*, not a mid-run accident.

### 5.6 The damage model

Every attack is:
```

Damage = base × rank_mult × element_mult × detonate_bonus × crit × target_resist

```

- `rank_mult` = 1.0 / 1.2 / 1.4 / 1.7 / 2.0 at ranks 1–5
- `element_mult` = 1.0 base, ±0.15 from weather/clan
- `detonate_bonus` = 3.0 on detonate, 1.0 otherwise
- `crit` = 1.5× on crit
- Burn stacks add *flat* after multipliers (not multiplied)

---

## 6. Enemy hierarchy

Scales on **time** (Memo §2.6/2.7), not on player Rank.

| Window | Type | Behavior |
|---|---|---|
| 0–5 min | **Fodder** | Slow, melee, straight path |
| 5–10 min | **Ranged** | Keep preferred distance, circle |
| 10–15 min | **Elites** | Teleport, drain Chakra/Overcharge |
| 15–20 min | **Mixed** | Elites + fodder + specialists |

**Spawn formulas:**

```

EnemyHP(t)     = 20 × 1.085^(minutes)
SpawnRate(t)   = min(12, 1.5 + 0.9 × minutes)   [per second]
MaxOnScreen(t) = min(900, 120 + 40 × minutes)
PodSize(t)     = 3 + min(7, floor(minutes / 4))

```

**Anti-AoE design:** Ranged/specialist enemies maintain preferred distance and circle. AoE centered on player hits fewer. See `06_BOSS_SPECIFICATION.md` §Fodder behavior.

**No Wave Compression.** The mechanic was deleted — it clustered enemies *around* the player, making AoE stronger, not weaker. The correct anti-AoE mechanic is preferred-distance behavior.

---

## 7. World phases

| Phase | Window | Visual | Mechanic |
|---|---|---|---|
| **Whispering Forest** | 0–5 min | Dense greenery, dappled sunlight | Destructible cover (trees, rocks) |
| **Ruined Village** | 5–15 min | Burnt buildings, raining ash | Interactive debris, open plazas |
| **Wasteland/Void** | 15+ min | Cracked earth, purple sky | Environmental hazards, low gravity feel |

**Phase transitions on boss death**, not timer. Guarantees every boss is fought in its correct phase.

**Phase flush occurs during the safe zone** (per Addendum A5-adjacent rule). No freeze frame.

---

## 8. Progression

### 8.1 Rank (player)

Genin → Chunin → Jonin → Kage. Granted by **Breakthrough** — a menu option costing a level-up pick.

**Rank effects:**
- **Genin:** Base stats. No additional grants.
- **Chunin:** +1 passive slot unlocked (5 of 6 usable).
- **Jonin:** +1 dash charge.
- **Kage:** Unlocks Flow State — 5 s of 70% CDR, triggered by Ultimate, once per run.

No raw stat bonuses. Rank *unlocks*, does not *boost*.

### 8.2 Tier (ability)

Every jutsu is Tier 1, 2, or 3. Tier 2 requires rank 3 of the Tier 1 parent. Tier 3 requires rank 5 of the Tier 2 parent.

**Tier 1 abilities are free from run 1. Tier 2 and 3 unlock via Academy (Memo C5).**

### 8.3 XP curve

```

XP to level N = 15 × 1.12^(N-1)

```

At 20 min with typical kill density: ~level 40–45. Enough picks for a full build + rank-ups.

Level cap: 50. After cap, level-up menu offers heal/reroll/banish instead.

---

## 9. Clans

Four clans, defined by stat floors + mechanical traits. See Memo §3 for the table.

**Uchiha** (start): Glass cannon. Fast, fragile, crit/stun.
**Nara** (30 min): Zoning. Slow, resource-rich, control.
**Hyuga** (90 min): Frontliner. Tanky, resource-poor, spacing (with Stagger damage amp).
**Uzumaki** (180 min): Sustain. Big pools, slowest.

Clans unlock at survive-time milestones. Persists across runs.

---

## 10. Meta-progression

Three pillars, all purchased with **Seals**:

1. **Global Stats** — flat and % increases to HP, Chakra gain, speed
2. **Arsenal Expansion** — Tier 2 and Tier 3 abilities enter the pool
3. **Clan Specialization** — per-clan upgrade trees

**Legacy system:** After 100% a clan tree, that clan contributes a Legacy Trait available to *other* clans. Equipped Legacy traits **cost a passive slot** (Memo C1). Max 3 equipped.

**Perfect Shinobi:** Own all four Legacy traits (equipped or not). Unlocks a global +10% to all Nature Transformations on every run. This is *not* the endgame — see §11.

---

## 11. Endgame

The meta tree's ceiling is **not** the game's ceiling.

**Ascension tiers:** Each successful 20-minute run unlocks Ascension +1. Each Ascension adds a modifier:
- A1: +10% enemy HP
- A2: +10% enemy count
- A3: Bosses +1 phase
- A4: No safe zones
- A5+: Combined escalations

Runs at Ascension 5+ are the long-term challenge. Ascension has no ceiling — the modifiers compound.

**The run is not "over" at Perfect Shinobi.** Perfect Shinobi unlocks Ascension A5 access; the game only ends when the player decides to stop climbing.

---

## 12. Feedback (feel of power)

| Rank | Visual | Audio |
|---|---|---|
| **Genin** | Small sparks, light dust | Light "thud" |
| **Chunin** | Brighter explosions, screen-shake on heavy hits | Medium "boom" |
| **Jonin** | Wide particle effects, enemies fly further back | Deep bass |
| **Kage** | Radial shockwave, screen bloom (not whiteout), ground cracks | Thunderous |

**Readable over spectacular:** every VFX must leave the gameplay layer legible. No full-screen whiteouts.

---

## 13. Design constraints (do not violate)

1. **Player has no aim input.** Targeting is per-ability, not per-input.
2. **Contact damage is the threat model.** No permanent invincibility, no flight.
3. **No priority suppression.** All ready abilities fire.
4. **No randomization of core progression.** Synergy, tier, and slot decisions are deterministic.
5. **Every effect readable.** Statuses have distinct visuals (see `03_STATUS_REGISTRY.md`).
6. **Slot count is the constraint.** No free passive effects beyond the 11 slots.
7. **No save-mutating world effects.** Environmental overlays are temporary; base map is read-only.
