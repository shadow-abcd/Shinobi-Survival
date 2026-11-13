# Decision Memo — Shinobi Survival
**Version:** 2.0 (memo 1.0 + addendum integrated)
**Status:** NORMATIVE. Source of truth for all constraints.
**Date:** 2026-11-12

---

## How to read this

Every item below is a **Decision** with **Rule Text** (implement this) and **Rationale** (why — do not re-litigate). Where a rule conflicts with an earlier design doc, **this memo wins**.

Two sections:

- **§1–§3:** Core decisions (from Memo 1.0)
- **§A1–§A6:** Technical decisions (from Addendum A)

Compliance is checked by the template at the bottom.

---

## §1 — Chakra is replaced by Overcharge

**Decision:** Standard jutsu run on cooldowns alone, with no resource cost. The chakra *concept* survives as a meter named **Chakra**, powering the Ultimate and empowering a cast.

**Rule Text:**

> **1.1** Every jutsu has a cooldown and no resource cost.
>
> **1.2** Killing an enemy grants Chakra: **1 per trash, 10 per elite, 50 per boss.** Cap **100**.
>
> **1.3** At **100 Chakra** the player may cast the Ultimate. Casting consumes the meter.
>
> **1.4** Reaching 100 Chakra also arms **Overcharge**: the next standard jutsu to fire is empowered for that cast only — **+50% damage, +30% radius, +1 status stack.** Consumed on use.
>
> **1.5** The Ultimate is **manually triggered**. The only manual input besides movement and dash.
>
> **1.6** Chakra does not decay. Persists between waves until spent.
>
> **1.7** Global **Cooldown Reduction cap is 70%**. No effect, passive, tier, or Flow State exceeds it.

**Rationale:** The gate produced no decisions, punished failure twice, and broke the fusion system invisibly. Overcharge inverts the feedback — rewards acting instead of removing the ability to act. Manual Ultimate stops the most expensive ability in the game from firing itself on a straggler.

---

## §2 — Three words, three meanings

**Decision:** Player progression, ability progression, and synergy are three different axes.

**Rule Text:**

> **2.1** **Rank** refers to the player: **Genin → Chunin → Jonin → Kage**. Four ranks. Granted by Breakthrough.
>
> **2.2** **Tier** refers to an ability: **Tier 1 → Tier 2 → Tier 3**. A property of the jutsu, not the player.
>
> **2.3** **Synergy** is binary, not tiered. A synergy exists or does not. **Delete "Tier 2 synergy" from all documents.**
>
> **2.4** Ability Tier gated by **ability mastery** only — Tier 2 unlocks at Tier 1 **rank 3 of 5**. Player Rank does not gate ability Tier.
>
> **2.5** Breakthrough is a **level-up menu option**, not automatic. Costs that pick.
>
> **2.6** Enemy archetypes scale on **run time**, never on Rank.
>
> **2.7** Archetype schedule: **0–5 min** fodder · **5–10 min** ranged + shielded · **10–15 min** teleporters + Siphoners · **15+ min** elite mixes.

**Rationale:** By Doc 5 "Tier" carried three incompatible meanings. Tying enemies to Rank created a death spiral — playing well gains XP faster, meets harder enemies with a T1 kit. Scaling on time decouples reward from punishment. Breakthrough as a menu option restores a decision the automatic version deleted.

---

## §3 — Stat floors are the tradeoff framework

**Decision:** Clan tradeoffs are expressed as **stat floors**, not bonus/penalty pairs. Traits are mechanical only.

**Rule Text:**

> **3.1** Each clan sets a baseline for **Max HP, Chakra gain, Move Speed** as a percentage of neutral.
>
> **3.2** No clan's combined total exceeds another's by more than **10%**. Tradeoffs are directional.
>
> **3.3** No clan trait grants a raw percentage stat boost. Traits are mechanical.
>
> **3.4** Stat floor and traits point in the same direction.

**Starting table** (neutral = 100%):

| Clan | HP | Chakra gain | Move speed | Total |
|---|---|---|---|---|
| Ember | 80 | 105 | 110 | 295 |
| Stoneward | 95 | 115 | 90 | 300 |
| Gale | 115 | 90 | 95 | 300 |
| Tide | 110 | 110 | 80 | 300 |

**Clan traits (mechanical only):**

| Clan | Trait |
|---|---|
| **Ember** | 15% chance on hit to apply Stun (1 s). Fire jutsu gain +10% crit chance. |
| **Stoneward** | Stone Grasp: 4 m aura, −30% enemy move speed. Slowed enemies take +10% damage. |
| **Gale** | Basic attacks apply knockback. Knockback applies **Stagger** — staggered enemies take +20% damage for 2 s. |
| **Tide** | +1 max Overcharge stack (empowered cast gains 2 status stacks). Killing an enemy below 30% HP restores 2 HP. |

---

## Companion decisions

| # | Rule |
|---|---|
| **C1** | Legacy traits occupy a passive slot |
| **C2** | Hybridization cap (3) applies to **equipped**. Perfect Shinobi triggers on **ownership** of all four |
| **C3** | No priority queue. All cooldowns resolve independently on the fixed tick |
| **C4** | Banish: 1 free per run, +2 purchasable, max 3 |
| **C5** | Unlock direction: all Tier 1 free at start. Academy unlocks Tier 2/3 only |
| **C6** | Clans: Ember free. Stoneward at 30 min survived, Gale at 90, Tide at 180 |
| **C7** | In-run currency: **Scrolls**. Meta currency: **Seals**. "Scroll Fragments" retired |
| **C8** | Status registry is the core data structure (see `03_STATUS_REGISTRY.md`) |
| **C9** | Fusion = Prime/Detonate, unified. Firestorm *is* the detonate visual |
| **C10** | `EnemyHP(t) = 20 × 1.085^minutes` |

---

## §A1 — Priority resolution is deleted

**Rule Text:**

> **A1.1** Every jutsu's cooldown resolves independently on the fixed tick. No priority order.
>
> **A1.2** When two abilities are ready on the same tick, both fire. VFX layer may stagger visuals 2–4 frames; gameplay never suppressed.
>
> **A1.3** Ultimate is manually triggered (per §1.5). Not part of any "simultaneous" resolution.
>
> **A1.4** Per-frame VFX spawn budget: **3 effects per tick**. Overflow queues to next tick, not skipped.

**Rationale:** Priority resolver produced no decisions, starved low-priority jutsu, and broke fusion invisibly.

---

## §A2 — Engine: Godot 4 with C#

**Rule Text:**

> **A2.1** Engine: Godot 4.x. Language: C# (.NET 8). No GDScript in shipped gameplay code.
>
> **A2.2** Logic on `_PhysicsProcess` at fixed 60 Hz. Rendering on `_Process` with interpolation. Gameplay code never reads render delta.
>
> **A2.3** Fodder + environmental assets use `MultiMeshInstance3D`. Player, bosses, elites use standard `Node3D`.
>
> **A2.4** Persistence: `System.Text.Json` with atomic writes (`save.json` → `save.tmp` → `rename`). SQLite not used at v1.

---

## §A3 — Fixed tick and frame budget

**Rule Text:**

> **A3.1** Logic tick: **60 Hz**. All cooldowns, statuses, AI, collisions, damage resolution on this tick.
>
> **A3.2** Render interpolates between last two logic states. Uncapped framerate.
>
> **A3.3** Frame budget at 60 Hz:

```

Logic total         ≤  4.0 ms
· AI              ≤  1.5 ms
· Ability resolve ≤  1.0 ms
· Status/synergy  ≤  0.8 ms
· Collision       ≤  0.7 ms
Physics             ≤  2.0 ms
VFX update          ≤  2.5 ms
Save / IO           ≤  0.5 ms  (async only)
Render submission   ≤  6.0 ms
────────────────────────────────
Total               ≤ 15.0 ms

```

> **A3.4** Any subsystem exceeding budget 3 consecutive seconds logs a warning. "Performance complete" means a 20-minute run at minute-15 density stays in budget on target hardware.

---

## §A4 — Managers become signal coordinators

**Rule Text:**

> **A4.1** Systems communicate through **Godot signals** or a `SignalBus` autoload. Emit; subscribe. No system reads another's internal state.
>
> **A4.2** A coordinator owns *data*, not *access*. It emits `AbilityCast`, `CooldownReady`, `Hit`. Systems subscribe.
>
> **A4.3** A coordinator must not call another coordinator to do its job. Fix is an event, not a call.

---

## §A5 — Pool budget and sleep/wake

**Rule Text:**

> **A5.1** Pre-allocated pools at run start:

| Pool | Count |
|---|---|
| Enemies | 1,500 |
| Projectiles | 1,200 |
| VFX | 800 |
| XP gems | 800 |
| Damage numbers | 500 |
| Status icons | 500 |

> **A5.2** Free-list with `active` flag. Iterate active list. Engine enable/disable for render only.
>
> **A5.3** **Sleep** ≥1.5× camera diagonal: AI off, physics off, VFX off, position frozen. Statuses persist.
>
> **A5.4** **Wake** <1.2× camera diagonal (hysteresis).
>
> **A5.5** **Despawn** ≥2× camera diagonal after 30 s of sleep. Return to pool. Drop XP gems near player.

---

## §A6 — Status registry is source of truth

**Rule Text:**

> **A6.1** Status registry (C8) is canonical for name, source, duration, max stacks, refresh, detonates-into, per-target-per-pair ICD.
>
> **A6.2** Synergy resolution reads the target's status set directly. Does not query spatial grid.
>
> **A6.3** Spatial partitioning is for collisions only, not statuses.

---

## Compliance template

Every doc opens with:

```

Memo compliance:
§1  Overcharge          [✓ / ✗]
§2  Rank/Tier/ability   [✓ / ✗]
§3  Stat floors         [✓ / ✗]
C1  Legacy slot-cost    [✓ / ✗]
C2  Hybrid cap vs apex  [✓ / ✗]
C3  No priority queue   [✓ / ✗]
C4  Banish              [✓ / ✗]
C5  Unlock direction    [✓ / ✗]
C6  Clan acquisition    [✓ / ✗]
C7  Seals currency      [✓ / ✗]
C8  Status registry     [✓ / ✗]
C9  Fusion = Prime/Det  [✓ / ✗]
C10 Time-based HP       [✓ / ✗]
A1  No priority (again) [✓ / ✗]
A2  Godot 4 / C#        [✓ / ✗]
A3  Fixed 60 Hz + budget[✓ / ✗]
A4  Signal coordination [✓ / ✗]
A5  Pool + sleep/wake   [✓ / ✗]
A6  Registry source     [✓ / ✗]

Intentional violations: [none / list with rationale]

```

