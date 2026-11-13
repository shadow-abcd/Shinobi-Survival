# Combat Resolution Pipeline — Shinobi Survival

**Purpose:** The order of operations for one hit. Every jutsu, fusion, detonate, and status application resolves through this sequence, in this order. Engineers implement this file directly.

**Memo compliance:** A1 ✓ · A4 ✓ · C3 ✓ · A6 ✓

---

## The pipeline (nine steps)

```

1. CAST CHECK
↓
2. TARGET ACQUISITION
↓
3. HITBOX SPAWN
↓
4. HIT DETECTION
↓
5. STATUS APPLICATION
↓
6. PRIME / DETONATE CHECK
↓
7. DAMAGE CALCULATION
↓
8. ON-HIT EFFECTS
↓
9. DEATH & LOOT

```

---

## Step 1 — Cast check

```

IF cooldown_ready(ability) AND rank_unlocked(ability):
proceed
ELSE:
skip

```

**No chakra check.** Per Memo §1.1, standard jutsu have no resource cost.

**Ultimate exception (Memo §1.5):** Ultimate is manually triggered. It has its own check:

```

IF player_pressed_ultimate AND chakra >= 100:
consume chakra, proceed
ELSE:
skip

```

**No priority resolution (Addendum A1).** Two abilities can cast on the same tick.

---

## Step 2 — Target acquisition

Resolve the jutsu's declared targeting mode *at cast time*, not at impact.

| Mode | Algorithm |
|---|---|
| **Nearest** | Linear scan over spatial grid, closest squared-distance to player |
| **Facing** | Nearest enemy within 45° cone of player's movement direction |
| **Densest Cluster** | Grid cell with most enemies within 6 cells of player |
| **Lowest HP** | Nearest enemy with min(currentHP) |
| **Random** | Uniform pick from in-range enemies |
| **Self-AoE** | Player position |
| **Fixed Point** | Nearest enemy's position *at cast time* (target list is frozen) |

**Multi-target abilities:** `max_targets` is declared per ability. The targeting mode fills that list. **Cap at 8 targets per cast** unless the ability explicitly declares higher (see `05_ABILITY_STARTER_SET.md`).

---

## Step 3 — Hitbox spawn

Projectile or area enters the world. Carries:

```csharp
struct HitData {
    int sourceAbilityId;
    ElementTag element;         // Fire, Wind, Water, Lightning, Earth, Physical
    int rank;                   // 1-5
    float damageCoefficient;    // from ability table
    float radius;
    StatusTag[] appliesStatus;  // may be empty
    int maxTargets;
    bool isFusion;              // true if this hit is a fusion result
    bool isDetonate;            // true if this hit is a detonate result
}
```

---

## Step 4 — Hit detection

Spatial grid query. Resolve overlap set.

```
for each cell in queryRadius:
    for each entity in cell:
        if entity.active AND overlaps(hitbox, entity.collider):
            add to candidate set

cap candidate set to maxTargets (sorted by priority: nearest first)
```

**Per-target validation:**

- If the ability is `Fixed Point`, verify the target is still within 20 px of where it was at cast
- If the ability requires `Line of Sight`, run a ray cast against blockers
- If the target is `Invulnerable` (safe zone), skip

---

## Step 5 — Status application

Apply this hit's element status to each hit target.

```
for each target:
    status = status_from_element(hit.element)
    if status exists:
        if target.has_status(status):
            if target.stack_count(status) < max_stacks(status):
                target.add_stack(status)
            else:
                target.refresh_duration(status)
        else:
            target.apply_status(status, duration_from_registry(status))
```

**Status application does NOT trigger detonation by itself** (that's step 6).

---

## Step 6 — Prime / detonate check

**This is the step where the synergy system lives.** Every detonate chain reaction is born here.

```
for each hit target:
    for each status S on target:
        if can_detonate(hit.element, S):
            pair = (hit.element, S)
            if now - target.lastDetonateTime[pair] >= pair_icd(pair):
                fire_detonation(hit, target, S)
                target.lastDetonateTime[pair] = now
```

### The detonation itself

```
fire_detonation(hit, target, S):
    # 1. Compute detonation damage
    detonate_dmg = hit.damage * detonate_multiplier(S)
    apply_damage(target, detonate_dmg, is_detonate=true)

    # 2. Consume the triggering status on this target only
    remove_status(target, S)

    # 3. Spread S to nearby enemies (capped, one hop only)
    nearby = query_radius(target.position, spread_radius(S))
    nearby = nearby.filter(e => !recently_detonated(e, S))
    nearby = sort_by_distance(nearby)
    nearby = take(nearby, max_spread_targets(S))   # typically 2
    for n in nearby:
        apply_status(n, S, duration_from_registry(S))
        # NOTE: this does NOT trigger another detonate this tick (rule D4)
```

### Loop guards (mandatory)

1. **A status applied by a detonation cannot trigger the same detonation this tick** (Rule D4)
2. **Per-target-per-pair ICD = 2.5 s** (Rule D2)
3. **Spread capped at 2 targets** (Rule D3)
4. **Detonations never re-apply the status that triggered them on the same target** (Rule D1)

---

## Step 7 — Damage calculation

```
damage = base_coefficient
       * rank_multiplier(rank)     # 1.0, 1.2, 1.4, 1.7, 2.0
       * element_multiplier        # from weather/clan, 0.85-1.15
       * detonate_bonus            # 3.0 if detonate, else 1.0
       * crit_multiplier           # 1.5 on crit, else 1.0
       * target_resistance         # 0.0-1.0

damage += sum(burning_stacks) * 2   # flat, added AFTER multipliers

apply_damage(target, damage)
```

**Order matters:** Burn stacks are additive *after* all multipliers. Do not let burn stacks multiply.

---

## Step 8 — On-hit effects

Fire once per target per hit. Not per damage tick.

```
for each hit target:
    if hit has knockback:      apply_knockback(target, strength)
    if hit has lifesteal:      heal(player, damage * lifesteal_pct)
    if hit has root:           apply_status(target, Rooted, duration)
    if hit has stagger:        apply_status(target, Staggered, 2.0)
    if hit has overcharge:     player.chakra += 1
```

**Fusion hits apply their composite on-hit effects here too** (e.g., Firestorm's vacuum pull).

---

## Step 9 — Death and loot

```
if target.hp <= 0:
    spawn_xp_gem(target.position, xp_value(target))
    if target is elite: roll_elite_drop(target)
    if target is boss: trigger_boss_death_sequence()
    remove_from_spatial_grid(target)
    release_to_pool(target)
```

**Death does not trigger further detonations** except for the Marked status (on-death explosion, once, capped at 2 nearby).

---

## Resolution order of multiple abilities on the same tick

Per Addendum A1, no priority resolution exists. Both fire.

**But** for determinism of testing, the *order of resolution* within a tick is:

1. Ultimates (player-triggered, so at most one)
2. Active jutsu, sorted by **creation order** (slot index 1–4)
3. Basic attack (if separate)

This is not a priority suppression — all ready abilities fire. It's a deterministic iteration order for reproducible testing. Store `slotIndex` on every ability and sort by it each tick.

---

## Determinism requirements

For replay capture and bug reproducibility:

- **Fixed 60 Hz tick** (Addendum A3.1)
- **Float precision:** use `double` for damage accumulation, `float` for positions
- **RNG seeded per run** — store seed in the run record
- **Spatial grid iteration order** — stable (cell ID ascending, then entity spawn ID ascending)

A run record should be replayable from seed + input log. This is required for bug reports and for the balance team to test 1000 runs overnight.

---

## What to test

Per pipeline step, the acceptance tests:

| Step ↕▾ | Test ↕▾ |
|---|---|
| −1 | Two abilities on the same tick both cast |
| −2 | Densest-cluster targeting picks the right cell |
| −3 | Hitbox carries the right status |
| −4 | Multi-target cap is enforced (max 8) |
| −5 | Max stacks enforced, refresh works |
| −6 | Detonate fires once, ICD blocks re-fire |
| 6 | Spread is capped at 2 |
| 6 | One hop only |
| 7 | Burn stacks add after multipliers |
| 8 | On-hit effects fire once per target |
| 9 | Pool released correctly on death |
⚙

Steps 6 and 7 are where balance bugs live. Test them hardest.

</BDS:create_file>

<BDS:create_file fileName="05_ABILITY_STARTER_SET.md">

```markdown
# Ability Starter Set — Shinobi Survival

**Purpose:** 20 abilities + 3 ultimates with full stats. Format template for all future abilities.

**Memo compliance:** §2 ✓ · C3 ✓ · C5 ✓ · C9 ✓

---

## Format template

Every ability has these fields:

Name
Element         Fire / Wind / Water / Lightning / Earth / Physical
Tier            1 / 2 / 3
Targeting       Nearest / Facing / Densest Cluster / Lowest HP / Random / Self-AoE / Fixed Point
Cooldown        base seconds
CD floor        base × 0.30 (from 70% CDR cap)
Damage @R1      coefficient × ATK
Damage @R5      coefficient × ATK
Hitbox radius   90 px @R1 → 140 px @R5
Max targets     6 (or 8 for AoE)
Status applied  StatusTag + duration
Detonates into  StatusTag + multiplier
Chakra gain     +1 per kill while active

```

---

## Fire (4 abilities)

### Fireball
- Element: Fire
- Tier: 1
- Targeting: **Facing**
- Cooldown: 1.2 s
- CD floor: 0.36 s
- Damage @R1: 1.0× ATK
- Damage @R5: 2.0× ATK
- Hitbox radius: 40 px (projectile)
- Max targets: 1
- Status applied: **Burning, 3.0 s**
- Detonates into: Aerated (3.0×)
- Notes: The baseline starter. Line projectile. Reliable damage.

### Fire Wall
- Element: Fire
- Tier: 2 (requires Fireball rank 3)
- Targeting: **Fixed Point**
- Cooldown: 6.0 s
- CD floor: 1.8 s
- Damage @R1: 1.4× ATK/s for 3 s
- Damage @R5: 2.4× ATK/s for 3 s
- Hitbox radius: 120 px (line, 3 cells long)
- Max targets: 8 per tick
- Status applied: **Burning, 3.0 s**
- Detonates into: Aerated (3.0×)
- Notes: Zone denial. Placed at the target's *cast-time* position. Freezes in place.

### Flame Clone
- Element: Fire
- Tier: 2 (requires Fireball rank 3)
- Targeting: **Self-AoE**
- Cooldown: 12.0 s
- CD floor: 3.6 s
- Damage @R1: 0.8× ATK on explosion (clone lingers 4 s, explodes at end)
- Damage @R5: 1.6× ATK
- Hitbox radius: 140 px (explosion)
- Max targets: 8
- Status applied: **Burning, 3.0 s**
- Detonates into: Aerated (3.0×)
- Notes: Summons a clone 60 px behind player. Taunts nearby enemies. Explodes at end of life or on player recall.

### Great Fire Annihilation
- Element: Fire
- Tier: 3 (requires Fire Wall rank 5)
- Targeting: **Densest Cluster**
- Cooldown: 12.0 s
- CD floor: 3.6 s
- Damage @R1: 4.0× ATK
- Damage @R5: 8.0× ATK
- Hitbox radius: 260 px (wave)
- Max targets: 8
- Status applied: **Burning, 3.0 s**
- Detonates into: Aerated (3.0×)
- Notes: The screen-clearing Fire jutsu. Wave projects from player toward Densest Cluster.

---

## Wind (4 abilities)

### Wind Slash
- Element: Wind
- Tier: 1
- Targeting: **Facing**
- Cooldown: 0.8 s
- CD floor: 0.24 s
- Damage @R1: 0.8× ATK
- Damage @R5: 1.6× ATK
- Hitbox radius: 60 px (projectile)
- Max targets: 1
- Status applied: **Aerated, 4.0 s**
- Detonates into: Burning (2.0×)
- Notes: Fast, low damage. Prime stack. Pairs with Fire.

### Vacuum Sphere
- Element: Wind
- Tier: 2 (requires Wind Slash rank 3)
- Targeting: **Nearest**
- Cooldown: 5.0 s
- CD floor: 1.5 s
- Damage @R1: 1.2× ATK + knockback
- Damage @R5: 2.4× ATK + increased knockback
- Hitbox radius: 100 px
- Max targets: 4
- Status applied: **Aerated, 4.0 s**
- Detonates into: Burning (2.0×)
- Notes: Pulls enemies toward the impact point, then knocks back.

### Air Wall
- Element: Wind
- Tier: 2 (requires Wind Slash rank 3)
- Targeting: **Self-AoE**
- Cooldown: 8.0 s
- CD floor: 2.4 s
- Damage @R1: 0 (defensive)
- Damage @R5: 0
- Hitbox radius: 120 px
- Max targets: n/a
- Status applied: none
- Detonates into: n/a
- Notes: 1.5 s of i-frames + pushes nearby enemies 80 px away. Panic button. Does *not* interact with detonate system.

### Great Breakthrough
- Element: Wind
- Tier: 3 (requires Vacuum Sphere rank 5)
- Targeting: **Self-AoE**
- Cooldown: 10.0 s
- CD floor: 3.0 s
- Damage @R1: 3.0× ATK
- Damage @R5: 6.0× ATK
- Hitbox radius: 320 px (cone in facing direction)
- Max targets: 8
- Status applied: **Aerated, 4.0 s**
- Detonates into: Burning (2.0×)
- Notes: Screen-clearing cone. Prime-setter for follow-up Fire.

---

## Lightning (4 abilities)

### Spark
- Element: Lightning
- Tier: 1
- Targeting: **Nearest**
- Cooldown: 1.0 s
- CD floor: 0.30 s
- Damage @R1: 1.1× ATK
- Damage @R5: 2.2× ATK
- Hitbox radius: 40 px
- Max targets: 1
- Status applied: none directly (detonates Drenched → Stunned)
- Detonates into: Drenched (2.5× + Stun)
- Notes: Detonator for Water builds.

### Chain Lightning
- Element: Lightning
- Tier: 2 (requires Spark rank 3)
- Targeting: **Nearest**
- Cooldown: 7.0 s
- CD floor: 2.1 s
- Damage @R1: 2.0× ATK (chains to 3)
- Damage @R5: 4.0× ATK
- Hitbox radius: 200 px (chain)
- Max targets: 3
- Status applied: none
- Detonates into: Drenched (2.5× + Stun)
- Notes: Chains to all Drenched targets in range; if none, jumps to 3 nearest.

### Lightning Armor
- Element: Lightning
- Tier: 2 (requires Spark rank 3)
- Targeting: **Self**
- Cooldown: 15.0 s
- CD floor: 4.5 s
- Damage @R1: 0 (buff)
- Damage @R5: 0
- Hitbox radius: n/a
- Max targets: n/a
- Status applied: none
- Detonates into: n/a
- Notes: 3 s of +20% move speed + thorns (any attacker takes 0.5× ATK Lightning damage).

### Kirin
- Element: Lightning
- Tier: 3 (requires Chain Lightning rank 5)
- Targeting: **Densest Cluster**
- Cooldown: 15.0 s
- CD floor: 4.5 s
- Damage @R1: 5.0× ATK
- Damage @R5: 10.0× ATK
- Hitbox radius: 280 px
- Max targets: 8
- Status applied: none directly
- Detonates into: Drenched (2.5× + Stun)
- Notes: The single-target finisher. Huge damage but slow cooldown. Pairs with Water for detonate chain.

---

## Water (4 abilities)

### Water Bullet
- Element: Water
- Tier: 1
- Targeting: **Nearest**
- Cooldown: 1.2 s
- CD floor: 0.36 s
- Damage @R1: 1.0× ATK
- Damage @R5: 2.0× ATK
- Hitbox radius: 45 px
- Max targets: 1
- Status applied: **Drenched, 5.0 s**
- Detonates into: none (Water primes for Lightning)
- Notes: Prime-setter for Lightning. Also heals 1 HP per hit (sustain).

### Water Wall
- Element: Water
- Tier: 2 (requires Water Bullet rank 3)
- Targeting: **Self-AoE cone**
- Cooldown: 6.0 s
- CD floor: 1.8 s
- Damage @R1: 1.5× ATK
- Damage @R5: 3.0× ATK
- Hitbox radius: 180 px cone
- Max targets: 8
- Status applied: **Drenched, 5.0 s**
- Notes: Defensive sweep. Drenches enemies for Lightning detonates.

### Water Clone
- Element: Water
- Tier: 2 (requires Water Bullet rank 3)
- Targeting: **Self-AoE**
- Cooldown: 14.0 s
- CD floor: 4.2 s
- Damage @R1: 1.2× ATK/s while active (clone shoots)
- Damage @R5: 2.4× ATK/s
- Hitbox radius: 120 px
- Max targets: 1 per tick
- Status applied: **Drenched, 5.0 s**
- Notes: Clone persists 5 s, fires Water Bullets.

### Great Waterfall
- Element: Water
- Tier: 3 (requires Water Wall rank 5)
- Targeting: **Densest Cluster**
- Cooldown: 12.0 s
- CD floor: 3.6 s
- Damage @R1: 4.0× ATK
- Damage @R5: 8.0× ATK
- Hitbox radius: 240 px
- Max targets: 8
- Status applied: **Drenched, 5.0 s**
- Notes: Large AoE drench. Sets up Lightning for chain detonation.

---

## Earth (4 abilities)

### Stone Spike
- Element: Earth
- Tier: 1
- Targeting: **Fixed Point**
- Cooldown: 1.5 s
- CD floor: 0.45 s
- Damage @R1: 1.2× ATK
- Damage @R5: 2.4× ATK
- Hitbox radius: 60 px
- Max targets: 1
- Status applied: **Rooted, 2.5 s**
- Detonates into: Wind (2.0× + launch)
- Notes: Roots target, primes for Wind detonate.

### Earth Wall
- Element: Earth
- Tier: 2 (requires Stone Spike rank 3)
- Targeting: **Self-AoE**
- Cooldown: 10.0 s
- CD floor: 3.0 s
- Damage @R1: 0 (defensive)
- Damage @R5: 0
- Hitbox radius: 200 px wall (arc)
- Max targets: n/a
- Status applied: none
- Detonates into: n/a
- Notes: Creates a wall that blocks enemy movement for 5 s. Does *not* damage.

### Rock Golem
- Element: Earth
- Tier: 2 (requires Stone Spike rank 3)
- Targeting: **Nearest**
- Cooldown: 18.0 s
- CD floor: 5.4 s
- Damage @R1: 0.6× ATK/s while active (golem attacks)
- Damage @R5: 1.2× ATK/s
- Hitbox radius: 80 px
- Max targets: 1 per tick
- Status applied: **Rooted, 2.5 s** on hit
- Notes: Golem persists 6 s, targets nearest enemy.

### Terraform
- Element: Earth
- Tier: 3 (requires Earth Wall rank 5)
- Targeting: **Densest Cluster**
- Cooldown: 14.0 s
- CD floor: 4.2 s
- Damage @R1: 3.5× ATK
- Damage @R5: 7.0× ATK
- Hitbox radius: 300 px
- Max targets: 8
- Status applied: **Rooted, 2.5 s**
- Notes: Creates temporary terrain + damage. Roots all in radius.

---

## Ultimates (3 options, pick 1 per run)

All ultimates share: **manual trigger**, **100 Chakra cost**, **once per 60 s minimum**.

### Cataclysm Core (offensive)
- Targeting: **Densest Cluster**
- Damage: 20× ATK in 400 px radius
- Status applied: **All statuses** (max stacks) to all targets
- Notes: The screen-clearing ultimate. Triggers detonate on every applicable pair in radius. This is the "Kage-level" moment.

### Susanoo Ribs (defensive)
- Targeting: **Self**
- Duration: 5 s
- Effect: 90% damage reduction, immune to status effects, +50% damage to your attacks
- Notes: The panic button. Turn a losing moment into a counter-attack window.

### Summoning: Toad Sage (utility)
- Targeting: **Self**
- Duration: 10 s
- Effect: A giant toad fights for you (600 HP, 2× ATK/s, applies Burning on hit), taunts nearby enemies
- Notes: The "another player entered the fight" ultimate. Strong in crowded phases.

---

## Ability unlock progression

| Tier | Unlock requirement |
|---|---|
| Tier 1 | Available from run 1 |
| Tier 2 | Academy unlock (50 Seals each) + parent at rank 3 |
| Tier 3 | Academy unlock (150 Seals each) + parent at rank 5 |

---

## Clan weighting

When the level-up menu rolls, clan-signature elements get **2× weight**:

- Uchiha: Fire
- Nara: Earth
- Hyuga: Wind
- Uzumaki: Water

Lightning has no clan signature — it's available evenly.

---

## Future ability additions

When adding an ability, it must satisfy:

1. Fills a Tier 1/2/3 slot within an existing element
2. Has a targeting mode from the standard list
3. Applies a status from the registry (or is defensive — no status)
4. Participates in at least one Prime/Detonate or fusion pair
5. Falls within the damage curve (Tier 1: 0.8–1.2×, Tier 2: 1.2–2.5×, Tier 3: 3.5–5.0× at R1)
