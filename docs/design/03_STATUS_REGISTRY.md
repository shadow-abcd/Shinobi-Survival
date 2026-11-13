# Status Registry — Shinobi Survival

**Purpose:** The canonical data structure for every elemental status. Every combat rule reads from this table. **Do not add a status without adding a row here.**

**Memo compliance:** C8 ✓ · A6 ✓ · C9 ✓

---

## The registry

| Status | Source | Duration | Max stacks | Refresh rule | Detonates into | Damage bonus | Per-target per-pair ICD |
|---|---|---|---|---|---|---|---|
| **Aerated** | Wind hits | 4.0 s | 3 | Refresh duration only | **Fire** → 3× dmg, spread to 2 nearby | 3.0× | 2.5 s |
| **Burning** | Fire hits | 3.0 s | 5 | Adds stack (each = +2 dmg/tick) | **Wind** → AoE ignition, 2.0× | 2.0× | 2.5 s |
| **Drenched** | Water hits | 5.0 s | 1 | Refresh duration | **Lightning** → chain to 3, 2.5× | 2.5× | 2.5 s |
| **Frozen** | Wind+Water fusion (Frost Lattice) | 1.5 s | 1 | Immune 4 s after break | **Any physical** → shatter +50% | 1.5× | 3.0 s |
| **Rooted** | Earth hits | 2.5 s | 1 | Immune 3 s after break | **Wind** → launch, 2.0× + knockback | 2.0× | 2.5 s |
| **Marked** | Earth+Lightning fusion (Detonation Clay) | 3.0 s | 1 | No refresh | On death → chain explosion to 2 nearby, 2.0× | 2.0× | 2.0 s |
| **Stunned** | Lightning hits (from Aerial detonate) | 1.0 s | 1 | Immune 2 s after break | — | — | — |
| **Staggered** | Hyuga knockback (clan) | 2.0 s | 1 | Refresh duration | — | +20% incoming damage | — |

---

## Status visuals (non-negotiable)

Every status needs a one-glance read. Tint overlap is forbidden — use one tint channel max, distinguish others by particle shape.

| Status | Tint | Particles | Ground |
|---|---|---|---|
| Aerated | — | White swirl orbit, upward drift | — |
| Burning | Orange | Flame emitter | — |
| Drenched | Blue | Drip emitter | — |
| Frozen | Cyan outline | Sprite frozen at 0 fps | — |
| Rooted | — | — | Dark decal under sprite |
| Marked | Red | Pulse emitter (heartbeat) | — |
| Stunned | Yellow | Star orbit | — |
| Staggered | — | (sprite leans back) | — |

---

## Detonate rules (must implement exactly)

These are the rules that prevent a chain reaction from melting the frame rate. Each is load-bearing.

### The cascade walk (why each rule exists)

At minute 15, with 900 enemies on screen:

```

N primed enemies in a radius
→ one Fire AoE hits all N
→ each detonates for 3×
→ each spreads Aerated to 2 nearby
→ if the 3× damage instance counts as a Fire hit,
every newly primed enemy detonates on the same frame
→ repeat

```

Without the three rules below, this resolves inside one frame and kills 400 enemies at once. Framerate dies; balance never recovers.

### Rule D1 — Detonations cannot re-apply the trigger status

A Firestorm detonation spreads Aerated to *neighbors*, never to the target it just detonated. Otherwise the same target detonates repeatedly on every Fire cast.

### Rule D2 — Every detonate has a per-target-per-pair ICD

Default **2.5 seconds** per target per pair. Store `lastDetonateTime[targetId][pairId]`. Without this, a single AoE can chain-detonate the same enemy across multiple sub-hits.

### Rule D3 — Spread is capped

Maximum **2 spread targets** per detonation. Not "all enemies in radius." The spread target list is sorted by distance, capped at 2, filtered to enemies not detonated in the last 1 second.

### Rule D4 — One hop only

A detonation's spread status cannot trigger a *second* detonation from the same cast. If A detonates B, and B spreads to C, C's status persists but does not detonate until the next cast that meets the ICD.

---

## Status interactions matrix (what detonates what)

```

HIT WITH:
Fire  Wind  Water  Lightning  Earth  Physical
AERATED       3×    —     —      —          —      —
BURNING       —     2×    —      —          —      —
DRENCHED      —     —     —      2.5×       —      —
FROZEN        —     —     —      —          —      1.5× (shatter)
ROOTED        —     2×    —      —          —      —
MARKED        —     —     —      —          —      — (on death only)
STUNNED       —     —     —      —          —      —
STAGGERED     +20% incoming damage from all sources

```

---

## When to add a status

A status earns a row only if it satisfies all five:

1. **It has a distinct visual** (see visuals table above)
2. **It has a trigger element** (or fusion pair)
3. **It has a detonate relationship** (or a clear reason not to — e.g., Stunned is pure CC)
4. **It has a bounded lifetime** (never permanent)
5. **It does not duplicate another status' effect**

If a new status fails any test, it's a modifier, not a status. Put it in the passive slot system instead.

---

## Where these numbers live in code

```

StatusRegistry.cs      ← this table, as data
DetonateResolver.cs    ← rules D1–D4
StatusVisuals.cs       ← tint + particle assignment

```

The registry is data. The resolver is code. Adding a status should be a table row + a visual entry, no new code in the resolver.

---

## Known open questions (v1.1)

- Are Burning stacks additive damage or additive duration? **Currently: additive damage (+2/tick per stack).**
- Can two detonations from different pairs trigger on the same target in the same tick? **Currently: no — first pair to resolve wins, ICD applies.**
- Does Shatter (Frozen) count as a detonate for ICD purposes? **Currently: yes.**
