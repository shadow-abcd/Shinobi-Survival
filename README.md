# Shinobi Survival — Design Package

**Version:** 1.0 (consolidated)
**Date:** 2026-11-12
**Status:** Handoff-ready. All decisions closed. Build can begin.

---

## What this is

This is the consolidated design package for *Shinobi Survival*, a roguelike action-survival game (Vampire Survivors-like) in the *ninja / elemental* theme. It merges eleven source documents and six rounds of design review into a single, implementation-ready set of specs.

**The original eleven documents are superseded.** Anything not in this package is historical context, not current design.

---

## Reading order

Read these in order the first time. After that, use them as reference.

| # | File | Purpose | Read time |
|---|---|---|---|
| 1 | **`01_DECISION_MEMO.md`** | Every binding decision. Source of truth for constraints. **Read this first.** | 15 min |
| 2 | **`02_CONSOLIDATED_DESIGN.md`** | The game at a design level — pillars, loop, systems overview | 30 min |
| 3 | **`03_STATUS_REGISTRY.md`** | The core data structure. Every combat rule reads from this | 10 min |
| 4 | **`04_COMBAT_PIPELINE.md`** | The order of operations for one hit. Engineers implement this | 10 min |
| 5 | **`05_ABILITY_STARTER_SET.md`** | 20 abilities + 3 ultimates with full stats | 20 min |
| 6 | **`06_BOSS_SPECIFICATION.md`** | Four bosses, full kits | 20 min |
| 7 | **`07_TECHNICAL_SPEC.md`** | Engine, tick rate, pools, sleep/wake | 15 min |
| 8 | **`08_PROGRESSION_AND_META.md`** | Rank/Tier, clans, Seals, run-end | 20 min |
| 9 | **`09_ROADMAP.md`** | Milestones, estimates, acceptance criteria | 10 min |

---

## Where to look for what

**"I'm implementing a new ability."**
→ `03_STATUS_REGISTRY.md` (what statuses exist)
→ `04_COMBAT_PIPELINE.md` (how it resolves)
→ `05_ABILITY_STARTER_SET.md` (format template)

**"I'm implementing a new enemy or boss."**
→ `06_BOSS_SPECIFICATION.md`
→ `02_CONSOLIDATED_DESIGN.md` § Enemy Hierarchy

**"I'm architecting the code."**
→ `07_TECHNICAL_SPEC.md`
→ `01_DECISION_MEMO.md` (constraints)

**"I'm designing a new clan or meta upgrade."**
→ `08_PROGRESSION_AND_META.md`
→ `01_DECISION_MEMO.md` § Decision 3 (stat floors)

**"I'm deciding what to build next."**
→ `09_ROADMAP.md`

**"I want to know why a rule exists."**
→ `01_DECISION_MEMO.md` — every decision has a rationale paragraph

---

## Compliance protocol

Every new document added to this project after today **must** open with:

```

Memo compliance:
§1  Overcharge          [✓ / ✗]
§2  Rank/Tier/ability   [✓ / ✗]
§3  Stat floors         [✓ / ✗]
C1–C10                  [✓ / ✗ each]
A1–A6 (addendum)        [✓ / ✗ each]

Intentional violations: [none / list with rationale]

```

Two minutes. It prevents the drift that cost six review cycles.

---

## Version history

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-11-12 | Initial consolidated package. All eleven source docs merged. Decision memo + addendum integrated. Boss specification written. |

---

## What's still open (not closed by this package)

- **IP / terminology rename — OPEN.** This package still uses *Naruto*-derived terms (Uchiha, Nara, Hyuga, Uzumaki, Chakra, Jutsu, Genin/Chunin/Jonin/Kage, Susanoo, etc.) flagged in the first review. No rename has been applied. Do not ship commercially under these terms without a rename pass or licence. See AUDIT below.
- Everything else on the old "still open" list is resolved in this package:

- Boss specification → `06_BOSS_SPECIFICATION.md`
- Slot counts → 4 active / 6 passive / 1 ultimate (in `08_PROGRESSION_AND_META.md`)
- Run-end screen → `08_PROGRESSION_AND_META.md` § Run-End Screen
- Post-max challenge → Ascension tiers (`08_PROGRESSION_AND_META.md` § Endgame)
- Run length → 20-minute finale + Ascension (`08_PROGRESSION_AND_META.md`)
- XP curve → `08_PROGRESSION_AND_META.md` § XP Curve
- Boss HP table → `06_BOSS_SPECIFICATION.md` § HP Formula
- Targeting mode per ability → `05_ABILITY_STARTER_SET.md`
- Modifier-stack order → `07_TECHNICAL_SPEC.md` §9 Modifier Stack (not 08 — 08 has no Modifier Stack section)

v1.1 will be reserved for tuning values after playtesting, not for missing systems.
