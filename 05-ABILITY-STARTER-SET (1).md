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
