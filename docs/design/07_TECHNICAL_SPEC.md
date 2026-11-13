# Technical Specification — Shinobi Survival

**Purpose:** Engine, tick rate, pools, sleep/wake, save format. Everything the engineer needs to build on.

**Memo compliance:** A2 ✓ · A3 ✓ · A4 ✓ · A5 ✓ · A6 ✓

---

## 1. Engine

- **Godot 4.4** (or 4.x LTS)
- **C# (.NET 8)**
- **No GDScript** in shipped gameplay code (tooling scripts excepted)
- **Target platforms:** PC first, then console (Switch, PlayStation, Xbox) and mobile

### Why Godot 4 + C#

- `MultiMeshInstance3D` handles thousands of instanced entities without extra work
- `_PhysicsProcess` is the fixed-tick decoupled logic loop the design requires
- Node pooling pattern is straightforward
- Editor is free for commercial use
- C# for static typing at 2,000 entity scale

### Rejected alternatives

- **Unity DOTS:** viable if team already knows Unity; heavier setup
- **Unity Mono:** `SetActive()` pooling at 2,000 entities is a frame tax the design cannot afford
- **Unreal:** overkill for this genre; rendering pipeline is over-engineered for 2D top-down

---

## 2. Tick rate

- **Logic tick: 60 Hz.** All cooldowns, statuses, AI, collisions, damage resolution.
- **Render:** interpolates between last two logic states. Uncapped framerate.
- **Gameplay never reads render delta.** All timing is on the fixed tick.

```csharp
// Correct
public override void _PhysicsProcess(double delta) {
    // Fixed 60 Hz. All gameplay here.
    TickStatuses();
    TickCooldowns();
    ResolveDamage();
}

// Incorrect - never do this
public override void _Process(double delta) {
    player.health -= damage * (float)delta;  // WRONG
}
```

---

## 3. Frame budget

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

Any subsystem exceeding budget 3 consecutive seconds logs a warning. "Performance complete" means a 20-minute run at minute-15 density stays in budget on target hardware.

---

## 4. Object pools

Pre-allocated at run start. No `Instantiate` or `Destroy` during gameplay.

| Pool ↕▾ | Count ↕▾ |
|---|---|
| −Enemies | 1,500 |
| −Projectiles | 1,200 |
| −VFX | 800 |
| −XP gems | 800 |
| Damage numbers | 500 |
| Status icons | 500 |
⚙

### Pool implementation

Free-list with `active` flag. Systems iterate the active list. Engine-level enable/disable is used only for the render layer, not for logic.

```
class EntityPool<T> where T : Node3D {
    private T[] entities;
    private bool[] active;
    private int freeListHead;

    public T Acquire() {
        int idx = freeListHead;
        freeListHead = findNextFree(idx);
        active[idx] = true;
        entities[idx].Visible = true;
        return entities[idx];
    }

    public void Release(T entity) {
        int idx = Array.IndexOf(entities, entity);
        active[idx] = false;
        entities[idx].Visible = false;
        entities[idx].Position = Vector3.Zero;
        freeListHead = idx;
    }

    public IEnumerable<T> Active() {
        for (int i = 0; i < entities.Length; i++)
            if (active[i]) yield return entities[i];
    }
}
```

---

## 5. Sleep / wake / despawn

The largest missing performance item in earlier docs. With 900 enemies at minute 15 and ~40% off-screen, sleep is what makes density targets reachable.

```
Sleep at:    ≥ 1.5 × camera diagonal
Wake at:     < 1.2 × camera diagonal  (hysteresis)
Despawn at:  ≥ 2.0 × camera diagonal after 30 s sleep
```

### On sleep

- AI disabled (`_Process` skipped via state flag)
- Physics disabled
- VFX disabled
- Position frozen
- **Statuses persist** (a sleeping enemy can be detonated by a hit that wakes it)

### On wake

- AI re-enabled
- Physics re-enabled
- VFX re-enabled
- Position begins ticking from frozen state

### On despawn

- Return to pool
- Release status icons
- Drop XP gems to nearest 100 px to the player (so kills still feel rewarding)

### Why 30 s grace

A player who briefly runs backward should not see enemies vanish. 30 seconds is enough that the direction change is forgotten by the time despawn fires.

---

## 6. Spatial partitioning

Grid-based. Cell size = 4× average entity radius (typically ~40 px).

- **Query:** iterate grid cells within query radius
- **Insert:** on entity spawn, add to its cell
- **Remove:** on entity death, remove from cell
- **Rebuild:** per tick (cheap at 2,000 entities with uniform grid)

**Target:** ≤ 8 entities per cell average. If exceeded, reduce cell size.

### Used for

- Collision detection (hit detection)
- Targeting (nearest, densest cluster)

### NOT used for

- Status checks (read target entity directly per Addendum A6)
- Synergy resolution (per-target, not spatial)

---

## 7. Communication pattern

Systems communicate through **Godot signals** or a `SignalBus` autoload. No system reads another's internal state.

```
// SignalBus.cs
[Signal] public delegate void AbilityCastEventHandler(int abilityId, int targetId);
[Signal] public delegate void CooldownReadyEventHandler(int abilityId);
[Signal] public delegate void HitEventHandler(int targetId, ElementTag element, int sourceId);
[Signal] public delegate void EnemyKilledEventHandler(int enemyId, int xpValue);
```

### Coordinator rules

- A coordinator owns *data*, not *access*
- It emits; others subscribe
- It does not call other coordinators to do its job
- If it needs another system's data, that's a signal

---

## 8. Save format

**JSON with atomic writes.** SQLite is rejected at v1 (overkill for a single-player roguelike with a small persistent record).

### Save data

```
{
  "version": 1,
  "playerId": "uuid",
  "seals": 1240,
  "clansUnlocked": ["Uchiha", "Nara"],
  "clanMastery": {
    "Uchiha": { "nodes": ["GENJUTSU_I", "GENJUTSU_II"], "percent": 45 },
    "Nara": { "nodes": [], "percent": 0 }
  },
  "arsenalUnlocked": ["fireball", "wind_slash", "water_bullet"],
  "globalUpgrades": {
    "hp": 2, "chakraGain": 1, "speed": 0
  },
  "legacyTraits": {
    "owned": ["NARA_SLOW"],
    "equipped": ["NARA_SLOW"]
  },
  "achievements": {
    "firstBossKill": true,
    "20MinRun": false,
    "perfectShinobi": false
  },
  "ascensionTier": 0
}
```

### Write protocol

```
1. Serialize to memory
2. Write to save.json.tmp
3. Flush and fsync
4. Rename save.json.tmp → save.json
5. On startup: if save.json.tmp exists without save.json, use .tmp
```

**Test:** crash during step 2–4, verify the previous save is intact.

---

## 9. Modifier stack

Applied at run start, not recalculated per frame.

```
finalHP    = (baseHP    + academyFlatHP)    × (1 + academyPctHP)     × (1 + legacyPctHP)
finalSpeed = (baseSpeed + academyFlatSpeed) × (1 + academyPctSpeed)  × (1 + legacyPctSpeed)
finalHP    = max(finalHP, clanStatFloor.HP)

finalChakraGain = (baseChakraGain + academyFlat) × (1 + academyPct)
```

**Order:** additive flat → multiplicative percent → floor → clamp.

Clan stat floors applied last (Memo §3.1). This means no combination of upgrades can push a clan below its floor — but upgrades *can* raise a clan above another clan's floor, which is fine.

---

## 10. Entity IDs

Use **stable integer IDs** assigned at entity creation. Store `spawnId` and `entityTypeId`.

- Enables replay capture
- Enables save/load round-tripping (if save-scumming is added)
- Enables deterministic sorting for tests

---

## 11. Determinism

For replay and reproducible testing:

- **Fixed 60 Hz tick** (guaranteed by `_PhysicsProcess`)
- **RNG seeded per run** — store seed in run record
- **Spatial grid iteration order** — stable (cell ID ascending, then spawn ID ascending)
- **Float precision** — `double` for damage accumulation, `float` for positions
- **No `DateTime.Now` in gameplay code** — use tick count

---

## 12. Frame budget monitoring

In development builds, log per-subsystem timing each second:

```
[1.0s] AI:0.8ms Ability:0.6ms Status:0.4ms Collision:0.3ms
       Physics:1.2ms VFX:1.8ms Render:5.4ms — TOTAL: 10.5ms (OK)
```

When a subsystem exceeds budget for 3 consecutive seconds, log a warning and, in debug builds, screenshot the state.

---

## 13. Milestone acceptance criteria

A milestone is "done" only when:

1. **Runs at 60 Hz on target hardware** — no subsystem over budget for 10 consecutive minutes
2. **Zero allocation in gameplay loop** — profiled via Godot's memory monitor
3. **Save/load survives crash-mid-write** — verified by killing the process at step 3 of write protocol
4. **Deterministic replay works** — same seed + inputs = same outcome

Not just "feature exists."

</BDS:create_file>

<BDS:create_file fileName="08_PROGRESSION_AND_META.md">

```markdown
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
