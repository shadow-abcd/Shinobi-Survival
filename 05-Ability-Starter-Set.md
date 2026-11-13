# 5. Ability Starter Set

> Source: `Shinobi Survival — Design Package v1.0`, §5 (pp. 16–19). Transcribed verbatim from the design package. Do not edit the stats below without changing the design package first.
>
> Memo compliance: Section 1 Overcharge [OK] · Section 2 Rank/Tier/ability [OK] · Section 3 Stat floors [OK] · C1–C10 [OK] · A1–A6 [OK]
> Intentional violations: none.

20 abilities + 3 ultimates. Full stats. Format template for all future abilities.

## Format template

| Field | Values |
|---|---|
| Name | — |
| Element | Fire / Wind / Water / Lightning / Earth / Physical |
| Tier | 1 / 2 / 3 |
| Targeting | Nearest / Facing / Densest / Lowest HP / Random / Self-AoE / Fixed Point |
| Cooldown | Base seconds. CD floor = base × 0.30 (from 70% CDR cap) |
| Damage @ R1 | Coefficient × ATK |
| Damage @ R5 | Coefficient × ATK |
| Hitbox radius | 90px @ R1 to 140px @ R5 |
| Max targets | 6 (or 8 for AoE) |
| Status applied | StatusTag + duration |
| Detonates into | StatusTag + multiplier |
| Chakra gain | +1 per kill while active |

## Fire (4 abilities)

### Fireball — Tier 1

Facing | CD 1.2s | Dmg 1.0x to 2.0x | Radius 40px | 1 target | Burning 3s | Detonates Aerated 3x

Baseline starter. Line projectile. Reliable damage.

### Fire Wall — Tier 2 (Fireball rank 3)

Fixed Point | CD 6.0s | Dmg 1.4x/s to 2.4x/s (3s) | Radius 120px line | 8 targets/tick | Burning 3s | Detonates Aerated 3x

Zone denial. Placed at target's cast-time position. Freezes in place.

### Flame Clone — Tier 2 (Fireball rank 3)

Self-AoE | CD 12.0s | Dmg 0.8x to 1.6x | Radius 140px | 8 targets | Burning 3s | Detonates Aerated 3x

Summons a clone that taunts enemies. Explodes at end of life or player recall.

### Great Fire Annihilation — Tier 3 (Fire Wall rank 5)

Densest Cluster | CD 12.0s | Dmg 4.0x to 8.0x | Radius 260px wave | 8 targets | Burning 3s | Detonates Aerated 3x

Screen-clearing Fire jutsu. Wave projects toward Densest Cluster.

## Wind (4 abilities)

### Wind Slash — Tier 1

Facing | CD 0.8s | Dmg 0.8x to 1.6x | Radius 60px | 1 target | Aerated 4s | Detonates Burning 2x

Fast, low damage. Prime stack. Pairs with Fire.

### Vacuum Sphere — Tier 2 (Wind Slash rank 3)

Nearest | CD 5.0s | Dmg 1.2x to 2.4x + knockback | Radius 100px | 4 targets | Aerated 4s | Detonates Burning 2x

Pulls enemies toward impact point, then knocks back.

### Air Wall — Tier 2 (Wind Slash rank 3)

Self-AoE | CD 8.0s | Defensive | Radius 120px | 1.5s i-frames + 80px push

Panic button. Does not interact with detonate system.

### Great Breakthrough — Tier 3 (Vacuum Sphere rank 5)

Self-AoE cone | CD 10.0s | Dmg 3.0x to 6.0x | Radius 320px | 8 targets | Aerated 4s | Detonates Burning 2x

Screen-clearing cone. Prime-setter for follow-up Fire.

> Note: “Great Breakthrough” here is a Wind Tier 3 jutsu. It is not the same thing as player-Rank Breakthrough (§8.1). Do not confuse the two.

## Lightning (4 abilities)

### Spark — Tier 1

Nearest | CD 1.0s | Dmg 1.1x to 2.2x | Radius 40px | 1 target | Detonates Drenched 2.5x + Stun

Detonator for Water builds.

### Chain Lightning — Tier 2 (Spark rank 3)

Nearest | CD 7.0s | Dmg 2.0x to 4.0x (chains to 3) | Radius 200px | 3 targets | Detonates Drenched 2.5x + Stun

Chains to all Drenched targets; if none, jumps to 3 nearest.

### Lightning Armor — Tier 2 (Spark rank 3)

Self | CD 15.0s | Buff | 3s of +20% move speed + thorns (0.5x ATK Lightning damage)

Defensive. Reflects damage at attackers.

### Kirin — Tier 3 (Chain Lightning rank 5)

Densest Cluster | CD 15.0s | Dmg 5.0x to 10.0x | Radius 280px | 8 targets | Detonates Drenched 2.5x + Stun

Single-target finisher. Huge damage but slow cooldown. Pairs with Water for detonate chain.

## Water (4 abilities)

### Water Bullet — Tier 1

Nearest | CD 1.2s | Dmg 1.0x to 2.0x | Radius 45px | 1 target | Drenched 5s | Heals 1 HP per hit

Prime-setter for Lightning. Sustain.

### Water Wall — Tier 2 (Water Bullet rank 3)

Self-AoE cone | CD 6.0s | Dmg 1.5x to 3.0x | Radius 180px | 8 targets | Drenched 5s

Defensive sweep. Drenches enemies for Lightning detonates.

### Water Clone — Tier 2 (Water Bullet rank 3)

Self-AoE | CD 14.0s | Dmg 1.2x/s to 2.4x/s | Radius 120px | Drenched 5s

Clone persists 5s, fires Water Bullets.

### Great Waterfall — Tier 3 (Water Wall rank 5)

Densest Cluster | CD 12.0s | Dmg 4.0x to 8.0x | Radius 240px | 8 targets | Drenched 5s

Large AoE drench. Sets up Lightning for chain detonation.

## Earth (4 abilities)

### Stone Spike — Tier 1

Fixed Point | CD 1.5s | Dmg 1.2x to 2.4x | Radius 60px | 1 target | Rooted 2.5s | Detonates Wind 2x + launch

Roots target, primes for Wind detonate.

### Earth Wall — Tier 2 (Stone Spike rank 3)

Self-AoE | CD 10.0s | Defensive | Radius 200px arc | blocks enemy movement for 5s

Blocks enemy movement. Does not damage.

### Rock Golem — Tier 2 (Stone Spike rank 3)

Nearest | CD 18.0s | Dmg 0.6x/s to 1.2x/s | Radius 80px | Rooted 2.5s on hit

Golem persists 6s, targets nearest enemy.

### Terraform — Tier 3 (Earth Wall rank 5)

Densest Cluster | CD 14.0s | Dmg 3.5x to 7.0x | Radius 300px | 8 targets | Rooted 2.5s

Creates temporary terrain + damage. Roots all in radius.

## Ultimates (3 options, pick 1 per run)

All ultimates: manual trigger, 100 Chakra cost, once per 60s minimum.

### Cataclysm Core (offensive)

Densest Cluster | 20x ATK in 400px radius | applies ALL statuses at max stacks

The screen-clearing ultimate. Triggers detonate on every applicable pair in radius.

### Susanoo Ribs (defensive)

Self | 5s duration | 90% damage reduction | immune to statuses | +50% damage to your attacks

The panic button. Turn a losing moment into a counter-attack window.

### Summoning: Toad Sage (utility)

Self | 10s duration | Giant toad (600 HP, 2x ATK/s, applies Burning, taunts)

Another player entered the fight. Strong in crowded phases.

## Ability unlock progression

| Tier | Unlock requirement |
|---|---|
| Tier 1 | Available from run 1 |
| Tier 2 | Academy unlock (50 Seals) + parent at rank 3 |
| Tier 3 | Academy unlock (150 Seals) + parent at rank 5 |

## Clan weighting

When the level-up menu rolls, clan-signature elements get 2x weight: Uchiha = Fire, Nara = Earth, Hyuga = Wind, Uzumaki = Water. Lightning has no clan signature — available evenly.

## Future ability additions

When adding an ability, it must satisfy:

- Fills a T1/T2/T3 slot within an existing element
- Has a targeting mode from the standard list
- Applies a status from the registry (or is defensive — no status)
- Participates in at least one Prime/Detonate or fusion pair
- Falls within the damage curve (T1: 0.8–1.2x, T2: 1.2–2.5x, T3: 3.5–5.0x at R1)

---

## Implementation note (not in the design package)

Code mapping for this repo: `src/core/abilities.js` holds the 20 abilities (`ABILITIES`) and the 3 ultimates. Tier gating in `src/core/upgrades.js` (`abilityAvailable`) uses ability mastery only — parent rank 3 for T2, parent rank 5 for T3 — never player Rank (memo §2.4). Clan weighting is in `rollChoices` in the same file.
