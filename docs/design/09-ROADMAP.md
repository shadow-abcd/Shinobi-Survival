# Roadmap — Shinobi Survival

**Purpose:** Milestones, estimates, acceptance criteria.

**Memo compliance:** Full — this doc is downstream of all decisions.

---

## Timeline summary

Realistic estimates for a small team (2–4 people):

| Milestone | Effort | Cumulative |
|---|---|---|
| M1 — Greybox | 3 weeks | 3 weeks |
| M2 — Synergy Core | 4 weeks | 7 weeks |
| M3 — Content + Bosses | 6 weeks | 13 weeks |
| M4 — Meta + Persistence | 4 weeks | 17 weeks |
| M5 — Polish + VFX | 8 weeks | 25 weeks |
| M6 — Hardening | 3 weeks | 28 weeks |

**~7 months to v1.0** (with buffer: 9 months).

---

## Milestone 1 — Greybox (3 weeks)

**Goal:** Prove the survivor feel. A playable loop, no art.

### Deliverables

- [ ] Player movement (WASD + dash with i-frames)
- [ ] One ability: Fireball (Facing targeting, 1.2 s CD, projectile)
- [ ] Three enemy types: fodder, ranged, elite (cubes and spheres)
- [ ] XP gems drop on kill, magnet to player in radius
- [ ] Level-up menu (3 choices: 3 passive stats initially)
- [ ] Enemy spawning per schedule (fodder 0–5 min, ranged 5–10)
- [ ] **Death and run restart** — proves the loop closes
- [ ] **5-minute teaching boss** — The Ronin

### Acceptance criteria

- Loop runs end to end: spawn → kill → level → pick → survive → die → restart
- 60 Hz logic tick stable
- Zero `Instantiate`/`Destroy` during gameplay (all pooled)
- Player can die at minute 3 and understand why

### What M1 proves

The core loop is fun before any art, VFX, or meta layer exists. **If M1 isn't fun, no amount of content fixes it.** This is the single most important milestone to iterate on.

---

## Milestone 2 — Synergy Core (4 weeks)

**Goal:** Implement the tag system and Prime/Detonate. Prove the combat identity.

### Deliverables

- [ ] **Status registry** (per `03_STATUS_REGISTRY.md`) — 8 statuses implemented
- [ ] **Combat pipeline** (per `04_COMBAT_PIPELINE.md`) — 9 steps, deterministic
- [ ] **Tag-based synergy resolver** — reads statuses, fires detonates
- [ ] **Prime/Detonate loop working** — all 5 prime/detonate pairs fire correctly
- [ ] **Fusion** — Fire+Wind, Water+Lightning working (2 of 10 pairs; rest tested in M3)
- [ ] **3 abilities per element** = 15 abilities (from `05_ABILITY_STARTER_SET.md`)
- [ ] **Loadout system** — 4 active / 6 passive slots, level-up menu picks

### Acceptance criteria

- All 5 prime/detonate pairs fire correctly in automated tests
- Loop guards (D1–D4) prevent chain reaction blowups at 500+ enemy density
- Deterministic replay works (same seed + inputs = same outcome)
- Player can feel the difference between "Fire only" and "Fire + Wind"

### What M2 proves

The Prime/Detonate system is the game's identity. M2 proves it's readable, balanced, and fun *before* content expansion.

**M2 is split into M2a (tag + 3 jutsu + 1 fusion pair) and M2b (full 15 abilities + all pairs).** Ship M2a first — the tag system is where the risk lives.

---

## Milestone 3 — Content + Bosses (6 weeks)

**Goal:** Full content for a 20-minute run.

### Deliverables

- [ ] **20 abilities** (4 per element, T1–T3) + 3 ultimates (from starter set)
- [ ] **All 10 fusion pairs** working
- [ ] **All 4 bosses** (Ronin, Twin, Warden, Sovereign) per `06_BOSS_SPECIFICATION.md`
- [ ] **3 world phases** (Forest, Village, Wasteland) with transitions on boss death
- [ ] **Environmental synergy** (Fire+grass, Lightning+water)
- [ ] **Enemy roster** — fodder, ranged, elites, 3 elite variants
- [ ] **Safe zones** per spec (30 s, heal/buff/suspend)

### Acceptance criteria

- A player can complete a 20-minute run and beat the Sovereign
- All 10 fusion pairs fire correctly
- All 4 bosses have phase transitions and telegraphs per spec
- Phase transitions happen at boss death, not timer (verified in test)

---

## Milestone 4 — Meta + Persistence (4 weeks)

**Goal:** The meta layer. Everything that survives death.

### Deliverables

- [ ] **Seals currency** — payout at run end per `08_PROGRESSION_AND_META.md`
- [ ] **Run-end screen** — payout breakdown, build summary, next-goal hook
- [ ] **Academy** — 3 pillars (Global, Arsenal, Clan)
- [ ] **Clan unlocks** — survive-time milestones (30/90/180 min)
- [ ] **Legacy system** — clan trees, trait ownership, Perfect Shinobi state
- [ ] **Save/load** — atomic writes, crash-mid-write recovery tested
- [ ] **Ascension tiers** — A1–A5 at minimum

### Acceptance criteria

- Kill process during save → no corruption, previous save intact
- Meta persists across runs and reloads
- Run-end screen shows accurate payout math
- Ascension modifiers apply correctly at A1–A5

---

## Milestone 5 — Polish + VFX (8 weeks)

**Goal:** The feel of power.

### Deliverables

- [ ] **VFX for all abilities** — 20 abilities × 5 ranks = 100 visual states
- [ ] **VFX for all fusion pairs** — 10 unique VFX
- [ ] **Status visuals** per `03_STATUS_REGISTRY.md` (tint + particles)
- [ ] **Boss VFX** — 4 bosses × 4 phases = 16 visual states
- [ ] **Audio** — impact ladder (light/mid/heavy/apex), music, boss themes
- [ ] **Environment art** — 3 phases, transition VFX
- [ ] **UI/UX** — menus, HUD, level-up screen polish
- [ ] **Controller support** — gamepad mapping, rumble

### Acceptance criteria

- Full VFX coverage with no whiteout effects (accessibility)
- Audio impact ladder matches power tier
- All UI readable at 1080p and 4K
- 60 Hz stable at minute-15 density with all VFX active

**M5 is the longest milestone by design.** VFX is where most of the "juice" comes from, and it's the most expensive content to produce.

---

## Milestone 6 — Hardening (3 weeks)

**Goal:** Ship-ready. Every feature tested, every crash fixed.

### Deliverables

- [ ] **Full playtest campaign** — 100+ complete runs
- [ ] **Bug fix pass** — every reproducible bug fixed
- [ ] **Performance validation** — 60 Hz sustained at all densities
- [ ] **Accessibility pass** — colorblind modes, screen shake toggle, audio options
- [ ] **Localization prep** — all strings externalized
- [ ] **Platform certification** (if console/mobile launch)
- [ ] **Launch build** — signed, tested, packaged

### Acceptance criteria

- No known crashes
- 60 Hz on target hardware for 30 consecutive minutes
- All accessible settings verified by a tester
- Certification passed (if applicable)

---

## The rule: don't skip M1

The single most common indie failure mode: teams build M3 content before proving M1 is fun. If M1 isn't fun — if killing cubes with a single fireball isn't satisfying — no amount of VFX, bosses, or meta will fix it.

**M1 must be playable end-to-end and fun before M2 starts.**

If M1 isn't fun after 2–3 iterations (6–9 weeks total), the concept needs re-evaluation, not more content.

---

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| M1 loop isn't fun | Medium | Iterate quickly; don't add content until it is |
| Prime/Detonate unreadable | Medium | M2a tests readability before M2b |
| VFX budget overrun | High | M5 is 8 weeks; if it slips, cut VFX polish, not systems |
| Engine issues | Low | Godot 4 is battle-tested at this scale |
| Team capacity | Medium | 7-month estimate assumes 2–4 people; adjust |
| Meta economy grind | Medium | Playtest 100 runs; tune Seals rates |

---

## Post-launch roadmap (v1.1+)

Not v1.0 scope, but worth sketching:

- **More clans** (2–3 more)
- **More bosses** (endless Ascension rotas)
- **Endless mode** (no 20-min cap; survive as long as possible)
- **Daily seed runs** (leaderboards)
- **Mod support** (custom abilities, bosses)

The game is designed to extend — the tag system, status registry, and ability template all support new content cleanly. v1.0 is the foundation, not the ceiling.
