# Boss Specification — Shinobi Survival

**Purpose:** Four bosses. Full kits. The longest-open item in the project, now closed.

**Memo compliance:** §2 ✓ · C10 ✓ · A1 ✓ · C3 ✓

---

## Boss cadence

| Boss | Window | Role | HP vs. expected DPS |
|---|---|---|---|
| **The Ronin** | 5:00 | Teaching boss | **60%** — killable with a bad build |
| **The Twin** | 10:00 | First real test | **95%** — requires a coherent build |
| **The Warden** | 15:00 | Wall | **110%** — requires correct positioning |
| **The Sovereign** | 20:00 | Climax | **130% + phases** — the run's finale |

**HP formula:** `BossHP = 60 × expected_DPS_at_minute × HP_percentage`

Where `expected_DPS_at_minute` uses the player's build at the *median* level for that window (not the maximum). Median is intentional — the boss should be beatable by the median player, not only by optimal play.

**Fail state:** No timeout-enrage at 5:00 (teaching boss). From 10:00 onward, bosses enrage at 90 s: damage +50%, attack speed +30%. If the player survives the enrage without killing, the boss despawns at 120 s and the run continues (with a Seals penalty). **The run does not end from failing a boss.** Doc 5 §III.3's "elite wave → game over" is superseded.

---

## Arena rules (all bosses)

- **Boss arena:** 800 × 800 px, centered on the boss spawn point
- **Fodder cleared:** All non-boss enemies despawn when the boss spawns
- **Arena walls:** Visual only (player cannot exit the arena, but it looks like the arena has boundaries)
- **Boss does not leave the arena**
- **On boss death:** 3 s slow-motion, safe zone spawns, phase transition flushes (per Addendum A5-adjacent rule)
- **Boss rewards:** 50 Seals (guaranteed), 1 random tier-2 ability token, XP burst equal to 10× normal kill

---

## Telegraph rules (all bosses)

**Non-negotiable.** Telegraphs are how the player survives an auto-cast game with one dodge.

| Telegraph type | Duration | Visual | Audio |
|---|---|---|---|
| **Light attack** | 0.6 s | Yellow circle outline | Tick |
| **Heavy attack** | 1.2 s | Red circle outline, fills to center | Whoosh |
| **Arena attack** | 2.0 s | Red floor decal across area | Drum |
| **Unblockable** | 1.5 s | Red circle with X pattern | Bell |

Telegraphs must be readable at 60% opacity over the densest VFX. If a player cannot see a red circle through the fire, the boss is unfair.

---

## Boss 1 — The Ronin (5:00)

**Theme:** A wandering swordsman. Calm. Doesn't rush. Teaches: telegraphs, dodging, windows.

**HP:** 60% of expected DPS × 60 s = ~150 × expected_DPS
**Phases:** 1 (no phase transitions — teaching boss)
**Arena:** 800×800 px

### Attack kit

1. **Long Slash** (every 4 s)
   - Telegraph: Yellow arc (0.6 s)
   - 180° arc, 200 px reach, 1.5× ATK damage
   - Punish window: 1.0 s after slash

2. **Dash Strike** (every 8 s)
   - Telegraph: Red line to player position (1.2 s)
   - Dashes 400 px, deals 2× ATK on hit
   - Punish window: 1.5 s after dash (boss is stationary)

3. **Counter Stance** (every 12 s)
   - Telegraph: Blue glow (0.8 s)
   - If player attacks during the 2 s window, boss reflects 50% damage
   - If player does not attack, boss is vulnerable for 2 s

### Adds
None. Teaching boss.

### Enrage
None at 5:00. Boss is always killable.

### Failure
Player can choose to run from the arena. Boss despawns after 60 s of player absence. No penalty.

---

## Boss 2 — The Twin (10:00)

**Theme:** Two shinobi, mirrored. One ranged, one melee. Teaches: split focus, positioning.

**HP:** 95% of expected DPS × 90 s = ~180 × expected_DPS **total** (split between two bosses: 90× each)
**Phases:** 2 (phase 2 begins when either twin dies)
**Arena:** 1,200 × 800 px

### Phase 1 — Both alive

**Twin A (Ranged):**
- **Volley** (every 5 s): 5 arrows in a fan, 0.8× ATK each
- **Trap** (every 10 s): places a slowing trap at player's current position (telegraphed 1.2 s, then trap persists 8 s)
- **Retreat** (passive): maintains 300 px from player, teleports if cornered

**Twin B (Melee):**
- **Sword Combo** (every 3 s): 3-hit combo, 0.7× ATK each
- **Charge** (every 7 s): 300 px charge, 2× ATK
- **Follow** (passive): stays within 100 px of player

**Shared mechanic:** When one twin takes 30% of its HP in damage, both teleport-swap positions. Prevents focus-fire.

### Phase 2 — One twin dies

The surviving twin absorbs the other's power:

- **New attack:** Every 6 s, fires a volley + does a sword combo simultaneously
- **+30% damage**, +20% move speed
- **Health:** The surviving twin heals to 100% of its original maximum

**Phase transition trigger:** Either twin at 0 HP.

### Adds
None in Phase 1. In Phase 2, the surviving twin summons 4 ranged fodder (respawn every 10 s, max 8 active).

### Enrage (90 s from spawn)
Both twins' damage +50%, attack speed +30%.

---

## Boss 3 — The Warden (15:00)

**Theme:** An armored giant with a weakness. Teaches: kiting, positioning, exploiting openings.

**HP:** 110% of expected DPS × 120 s = ~260 × expected_DPS
**Phases:** 3 (transitions at 66% and 33% HP)
**Arena:** 1,000 × 1,000 px

### Passive: Armored Front
Attacks from the front deal 50% damage. Attacks from behind deal 100% damage. This is the boss's central mechanic — the player must *move around* the boss, which for a survivor-like is a genuine skill test.

### Phase 1 (100–66%)

**Attack kit:**
- **Shield Bash** (every 5 s): 180° front cone, 2× ATK, knocks player back 200 px
- **Ground Slam** (every 8 s): 300 px circle centered on self, 3× ATK, telegraph 1.5 s
- **Slow Advance** (passive): moves toward player at 40% speed

**Window:** After Ground Slam, boss is stationary for 1.5 s. Back attacks during this window deal 150% damage.

### Phase 2 (66–33%)

Boss loses shield (armor front becomes 75%/100% instead of 50%/100%).

**New attacks:**
- **Shield Throw** (every 10 s): shield becomes a projectile, returns after 3 s. During flight, boss has *no* front armor — 100% from all directions.
- **Fire Spin** (every 15 s): boss spins, 360° 4× ATK, telegraph 2 s

### Phase 3 (33–0%)

Boss enrages. Armor front removed entirely (100% from all directions).

**New attacks:**
- **Desperation Charge** (every 6 s): 400 px charge, 5× ATK, telegraph 1.0 s, very fast
- **Summon Elites** (once at 33%): 2 elite teleporters spawn (respawn every 15 s, max 4)

### Adds
Elites in Phase 3 (max 4).

### Enrage (120 s from spawn)
Attack speed +30%, damage +30%.

---

## Boss 4 — The Sovereign (20:00)

**Theme:** The Kage. Screen-filling, four phases, floor hazards. This is the run's finale.

**HP:** 130% of expected DPS × 120 s = ~310 × expected_DPS
**Phases:** 4 (transitions at 75%, 50%, 25%)
**Arena:** 1,400 × 1,400 px

### Passive: Nature Mastery
The Sovereign casts jutsu of all five elements. Attacks rotate through elements each phase, applying the corresponding status. Player builds that rely on a single detonate pair must adapt.

### Phase 1 (100–75%) — Fire

**Kit:**
- **Fireball Barrage** (every 4 s): 3 fireballs in a fan, 1.5× ATK each, applies Burning
- **Eruption** (every 10 s): 4 eruption circles at player's position + 3 others, 3× ATK, telegraph 1.5 s, applies Burning
- **Flame Aura** (passive): any player within 100 px takes 0.5× ATK/s

### Phase 2 (75–50%) — Wind + Water

**Kit:**
- **Wind Slash + Water Bullet combo** (every 5 s): 2 projectiles in sequence, applies Aerated then Drenched
- **Frost Lattice** (every 12 s): full-screen AoE, 4× ATK, applies Frozen, telegraph 2 s (the "get out of the center" moment)
- **Rain of Arrows** (passive): continuous falling projectiles, 0.3× ATK each, applies Drenched

### Phase 3 (50–25%) — Lightning + Earth

**Kit:**
- **Kirin** (every 15 s): targeted strike on player's position, 8× ATK, telegraph 2 s, applies Stunned
- **Earth Wall** (every 10 s): creates barriers, blocks player movement for 5 s
- **Chain Lightning** (every 6 s): chains to all Drenched enemies (player is Drenched from Phase 2 Rain)

### Phase 4 (25–0%) — All elements + Climax

**Kit:**
- **Tailed Beast Bomb** (once, at 25%): telegraphed 3 s, 15× ATK, 600 px radius. Player must use Ultimate i-frames or escape the center. This is the moment the run ends or doesn't.
- **All Phase 1–3 attacks at +50% speed**
- **Summon 4 Elites** (respawn every 20 s, max 4)

### Adds
Elites in Phase 4 (max 4).

### Enrage (150 s from spawn)
Attack speed +50%, damage +40%.

### The run-ending choice

At the 25% threshold (start of Phase 4), a **choice prompt** appears:

- **Finish the fight** — kill the Sovereign, get full rewards
- **Extract** — end the run now, keep rewards × 1.0, start a new run

Choosing to fight and losing gives rewards × 0.5. This is the "one more run" hook or the "I earned this" moment. The player chooses.

---

## Boss reward structure

| Boss | Seals | Ability token | Ascension progress |
|---|---|---|---|
| The Ronin | 20 | — | — |
| The Twin | 40 | 1 Tier-2 random | — |
| The Warden | 60 | 1 Tier-3 random | +1 to A1 unlock |
| The Sovereign | 100 | 1 Tier-3 random + 1 rank-up | +1 Ascension tier |

---

## Breakthrough relationship

**Boss defeat does not grant Breakthrough.** Breakthrough is a level-up menu option (Memo §2.5). This is intentional: the player chooses when to promote, and a boss kill is not the trigger.

Boss kills *do* grant:
- The above rewards
- A Seals payout
- Access to the next phase

But not Rank. Rank is player-driven.

---

## Boss audiovisual budget

Bosses are the most expensive entities in the game. Budget:

- **Mesh:** 1 base + 1 alternate per phase transition (4 max per boss)
- **VFX instances per attack:** ≤ 8 concurrent
- **Audio:** 1 music track per phase + per-attack cues
- **Screen shake:** capped at 6 px amplitude, 0.3 s duration per event

At 4 bosses with 4 phases each = 16 visual states. Plan the art budget accordingly.
