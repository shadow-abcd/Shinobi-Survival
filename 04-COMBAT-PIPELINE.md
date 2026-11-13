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
