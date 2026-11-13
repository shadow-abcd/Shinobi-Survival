# Progression & Meta — Shinobi Survival

**Purpose:** Rank, Tier, clans, Seals, Academy, run-end screen, endgame.

**Memo compliance:** §1 ✓ · §2 ✓ · §3 ✓ · C1–C7 ✓

---

## 1. Rank (player progression)

Four ranks. Granted by Breakthrough. Never reversed.

| Rank | Effect |
|---|---|
| **Genin** | Starting rank. Base stats. 5 of 6 passive slots usable. |
| **Chunin** | +1 passive slot (6 of 6 usable). |
| **Jonin** | +1 dash charge (2 total). |
| **Kage** | Unlocks Flow State — 5 s of 70% CDR, Ultimate-triggered, once per run. |

**No raw stat bonuses.** Rank grants *unlocks*, not *boosts*. This is important — if rank granted stats, it would be a rubber band on the player, which contradicts the design's commitment to feel the power curve.

### Breakthrough

Available in the level-up menu once every N levels:

- Chunin: available at level 5+
- Jonin: available at level 15+
- Kage: available at level 25+

Costs one pick from the level-up menu. Competing option shown alongside jutsu/passive picks.

**The player chooses when to promote.** A player who waits has stronger abilities at each rank. A player who promotes early unlocks the slot/charge benefits sooner. Both are valid strategies.

---

## 2. Tier (ability progression)

Every jutsu is Tier 1, 2, or 3.

| Tier | Gating | Availability |
|---|---|---|
| Tier 1 | None | All free from run 1 |
| Tier 2 | Parent at rank 3 + Academy unlock (50 Seals) | Academy |
| Tier 3 | Parent at rank 5 + Academy unlock (150 Seals) | Academy |

**Mastery prerequisite softened from "mastered" to "rank 3"** — so a two-element synergy build is affordable.

---

## 3. XP curve

XP to level N = 15 × 1.12^(N-1)

```

At 20 min with typical kill density: ~level 40–45. Enough picks for a full build + rank-ups.

Level cap: 50. After cap, level-up menu offers:
- Heal 25% HP
- Reroll a jutsu rank
- +1 banish charge

---

## 4. Clans

Four clans, defined by stat floors + mechanical traits.

**Reference table (from Memo §3):**

| Clan | HP | Chakra gain | Move speed | Total | Identity |
|---|---|---|---|---|---|
| Uchiha | 80 | 105 | 110 | 295 | Glass cannon |
| Nara | 95 | 115 | 90 | 300 | Zoning |
| Hyuga | 115 | 90 | 95 | 300 | Frontliner |
| Uzumaki | 110 | 110 | 80 | 300 | Sustain |

**Traits:**

| Clan | Trait |
|---|---|
| Uchiha | 15% chance on hit to Stun (1 s). Fire jutsu +10% crit. |
| Nara | Shadow Stitch aura: 4 m, −30% enemy speed. Slowed take +10% damage. |
| Hyuga | Basic attacks apply knockback. Knockback → Stagger (2 s, +20% incoming damage). |
| Uzumaki | +1 max Overcharge stack (empowered cast gains 2 status stacks). Kill below 30% HP restores 2 HP. |

### Clan acquisition (Memo C6)

| Clan | Unlock requirement |
|---|---|
| Uchiha | Available at start |
| Nara | 30 total minutes survived (across all runs) |
| Hyuga | 90 minutes survived |
| Uzumaki | 180 minutes survived |

Persistence: survives death. Stored in save.

---

## 5. Seals (meta currency)

**Meta currency.** Earned during runs. Spent in the Academy between runs.

### Payout

| Source | Seals |
|---|---|
| Trash kill | +0 (Seals are milestone-based, not per-kill) |
| Elite kill | +2 |
| Boss kill | +20 to +100 (see boss spec) |
| Run end (10 min survived) | +10 |
| Run end (15 min survived) | +25 |
| Run end (20 min victory) | +50 |
| Ascension modifier | +10% per Ascension tier |

**In-run currency** is **Scrolls** (for safe zone shop). Different from Seals. See Memo C7.

---

## 6. The Academy

Between runs. Spend Seals on permanent upgrades.

### Three pillars

**Pillar 1 — Global Stats**
- HP: +10 flat per node (max 10 nodes, 30 Seals each)
- Chakra gain: +5% per node (max 10, 40 Seals each)
- Move speed: +2% per node (max 10, 40 Seals each)

**Pillar 2 — Arsenal Expansion**
- Unlock Tier 2 abilities: 50 Seals each
- Unlock Tier 3 abilities: 150 Seals each
- Unlock ultimates: 200 Seals each

**Pillar 3 — Clan Specialization**
Each clan has its own tree. 5 nodes per tree, 100 Seals each.
- Example Uchiha tree: Genjutsu duration +0.2 s per node · Genjutsu proc chance +2% per node · Fire crit +5% per node · Cooldown reduction (Fire only) +3% per node · Capstone: Genjutsu spreads to nearby enemies

100% a clan tree to unlock a **Legacy Trait**.

### Banish purchases

- Free: 1 per run
- Purchasable: +2 (50 Seals each, one-time)
- Max per run: 3

---

## 7. Legacy system

After 100% a clan tree, that clan contributes a **Legacy Trait** — a passive available to *other* clans.

### Rules

- Each equipped Legacy Trait **costs one passive slot** (Memo C1)
- Max 3 equipped simultaneously (Memo C2)
- A Legacy Trait does not apply to its clan of origin (base trait already covers it)
- **Perfect Shinobi** triggers on *ownership* of all four Legacy Traits, regardless of which are equipped

### Perfect Shinobi state

Global +10% to all Nature Transformations on every run. Not a build; a permanent unlock.

**This is not the endgame.** See §9.

---

## 8. Run-end screen

The screen that delivers the Seals. Previously undesigned.

### Layout

```

┌─────────────────────────────────────────────────────┐
│  RUN COMPLETE                                        │
│                                                      │
│  Survived: 17:32         Rank: Chunin               │
│  Level: 38                Kills: 4,847              │
│  Kills/min: 280           Bosses: 3 / 4             │
│                                                      │
│  ┌──────────────────────────────────────────┐       │
│  │ SEALS EARNED                              │       │
│  │  Base: 35                                 │       │
│  │  Bosses: 120                              │       │
│  │  Time bonus: 15                           │       │
│  │  Ascension: +10%                          │       │
│  │  ─────────────────────                    │       │
│  │  TOTAL: 187                               │       │
│  │  Balance: 1,427                           │       │
│  └──────────────────────────────────────────┘       │
│                                                      │
│  BUILD                                               │
│  [Fire] Fireball R5 · [Fire] Fire Wall R3 · ...    │
│                                                      │
│  NEXT UNLOCK                                         │
│  Nara clan unlocks in 3 more minutes survived       │
│                                                      │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │  SPEND IN ACADEMY │  │  RUN AGAIN        │        │
│  └──────────────────┘  └──────────────────┘        │
└─────────────────────────────────────────────────────┘

```

### Three required elements

1. **Payout transparency** — show the breakdown, not just the total. Players learn what to chase.
2. **Next-goal hook** — always show the nearest unlock (clan, ability, node). This is the "one more run" mechanism.
3. **Build summary** — what you built. Especially valuable after a loss; the player can see what worked.

### Victory vs. death

- **Death:** Greyscale background, somber audio, "RUN ENDED"
- **Victory (20 min):** Colorful background, triumphant audio, "RUN COMPLETE"

Both use the same layout. The framing differs.

---

## 9. Endgame — Ascension

The meta tree's ceiling is **not** the game's ceiling.

### How it works

Each victory (20-minute run) unlocks **Ascension +1**. Each Ascension tier adds a global modifier.

| Ascension | Modifier |
|---|---|
| A1 | +10% enemy HP |
| A2 | +10% enemy count |
| A3 | Bosses gain +1 phase |
| A4 | Safe zones disabled |
| A5 | Player HP −10% |
| A6+ | Combinations + +5% per tier |

**No ceiling.** Ascension tiers compound indefinitely. At A10, A15, A20, the game is a different game.

### Why this matters

Without Ascension, the Perfect Shinobi is the end of the game. With it, Perfect Shinobi unlocks *A5 access* — the game only ends when the player decides to stop climbing.

### Leaderboard

Ascension tier is the score. "I'm on A7" is a bragging right.

---

## 10. The one-screen meta economy

```

┌─────────────────────────────────────────────────────┐
│                    META LAYER                        │
│                                                      │
│  RUN → earn Seals → Academy → higher stat/pool      │
│                                                      │
│  RUN → 100% clan tree → Legacy Trait → hybrid run   │
│                                                      │
│  RUN → all 4 legacies owned → Perfect Shinobi       │
│                                                      │
│  RUN (victory) → Ascension +1 → harder run          │
│                                                      │
└─────────────────────────────────────────────────────┘

```

The loop is closed. Every run feeds one of the four meta gates.

---

## 11. What NOT to add

- **No difficulty slider.** Ascension is the difficulty slider.
- **No class system.** Clans are the class system.
- **No paid currency.** Seals only.
- **No daily quests.** Runs are the content.
- **No PvP.** Single-player only.

Adding any of these would dilute the game's identity. It is a *20-minute run-based auto-cast survivor*. Every meta system serves that.
