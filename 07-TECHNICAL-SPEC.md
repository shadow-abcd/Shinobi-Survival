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
