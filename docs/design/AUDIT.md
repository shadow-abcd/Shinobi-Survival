# Audit — all files checked

Checked: 01, 02, 03, 04, 05, 06, 07, 08, 09, README (docs/design) + read.md + Read2–Read12 (reviews) + code Rank push (previous turn).

## Verdict

The design itself is consistent. The files were not. The two "missing" files were never missing — they were glued inside the wrong files, with build scaffolding left in.

## 1. The big find: 05 and 08 were glued inside 04 and 07

- `04_COMBAT_PIPELINE.md` contained TWO docs: Combat Pipeline + Ability Starter Set (05), joined by a leaked `<BDS:create_file fileName="05_ABILITY_STARTER_SET.md">` + ```` ```markdown ```` wrapper.
- `07_TECHNICAL_SPEC.md` contained TWO docs: Technical Spec + Progression & Meta (08), joined by the same leaked wrapper for `08_PROGRESSION_AND_META.md`.
- That is why `docs/design/README.md` cited 05/08 but `ls docs/design/` showed no 05/08 file, and why the repo looked like Rank was missing from docs.

Fix in this push: split both files, strip the BDS wrappers. No content deleted. After the split, 04 contains only the pipeline, 07 only the technical spec, 05 only abilities, 08 only progression.

Supersedes: the hyphen-named `05-ability-starter-set.md` / `08-progression-meta.md` from the previous Rank push (PDF transcriptions). Do NOT commit those — they would duplicate the split files. Use the underscore names below, which match README and every other file in docs/design.

## 2. Contradictions found and fixed

| # | Where | Contradiction | Fix |
|---|---|---|---|
| 1 | 02 §8.1 | Said Chunin = "5 of 6 usable", Genin = "no additional grants" — backwards. 08 says Genin 5/6, Chunin 6/6. | 02 now: Genin 5/6, Chunin 6/6. |
| 2 | 02 §11 | Ascension list stopped at "A5+: Combined escalations" — omitted A5 Player HP −10% and A6+ +5%/tier from 08. | 02 now lists A1–A5 + A6+ exactly as 08. |
| 3 | 06 Arena rules | Said "50 Seals (guaranteed)" — contradicts its own reward table (20/40/60/100) and 08's "+20 to +100 (see boss spec)". | Arena line now points to the table. Table is authoritative. |
| 4 | 06 Fail state | Said "enrage at 90 s, despawn at 120 s" for all bosses — contradicts per-boss kits (Twin 90, Warden 120, Sovereign 150). | Fail state now: per-boss enrage time, despawn 30 s after enrage. Per-boss kits unchanged. |
| 5 | 03 Registry | Stunned source said "Lightning hits (from Aerial detonate)" — "Aerial" is defined nowhere. 04 says Lightning detonates Drenched → Stunned. | 03 now: "Lightning detonates Drenched (see 04 § Step 6)". |
| 6 | 09 M2 | Said "6 statuses implemented" — registry has 8 (Aerated, Burning, Drenched, Frozen, Rooted, Marked, Stunned, Staggered). | 09 now: 8 statuses. |
| 7 | README | Said "Modifier-stack order → 08 § Modifier Stack" — 08 has no Modifier Stack section. It is 07 §9. | README now points to 07 §9. |
| 8 | README | Said "What's still missing: None" — false. IP rename is still open (see §3). | README now lists IP as OPEN. |

## 3. Still open — not fixed by this push

- **IP / terminology rename — MINIMAL DONE 2026-11-13. Clan names, Spectral Guard, Elder Toad renamed. Chakra/Jutsu/Genin/Chunin/Jonin/Kage kept intentionally.** The package still uses Naruto-derived terms (Uchiha, Nara, Hyuga, Uzumaki, Chakra, Jutsu, Genin/Chunin/Jonin/Kage, Susanoo, Genjutsu, etc.) flagged in the very first review (read.md §1). No rename has been applied in any of 01–09. The mechanics survive a rename; the nouns do not. Do a rename pass (or get a licence) before any commercial release / Steam page / store art. Do not let these names leak into new code identifiers, UI strings, or marketing.
- **01 omits Breakthrough level thresholds.** 01 says Breakthrough is a menu option (correct) but gives no levels. 08 is authoritative: Chunin 5+, Jonin 15+, Kage 25+. No change made — 01 is the constraint doc, 08 is the numbers doc — but if you ever edit 01, add the three numbers there too so a reader of 01 alone does not have to hunt.

## 4. What the Read files are

- `read.md`, `Read2.md`–`Read7.md`, `Read9.md`–`Read11.md` are **reviews / critiques**, not design docs. They are historical context. Do NOT commit them into `docs/design/` — they will be mistaken for current spec.
- `Read8.md` (Decision Memo) + `Read12.md` (Decision Addendum) are the **sources** for `01_DECISION_MEMO.md`, already integrated there (01 v2.0 = Memo 1.0 + Addendum). They are superseded by 01. Archive, do not duplicate.
- Placement: `docs/reviews/` for the 10 review files, `docs/archive/` for Read8/Read12 if you want to keep them. `docs/design/` holds only 01–09 + README.

## 5. Code vs docs — Rank

The Rank code push from the previous turn (upgrades.js / world.js / menus.js / audio.js / app.js) matches 08 in this push:
- Genin 5 passives, Chunin 6, Jonin +1 dash (2), Kage Flow State 5 s 70% CDR on Ultimate once per run.
- Breakthrough is a level-up menu option costing the pick, sequential only, never reversed, no stat boost.
- Tested 18/18 in the previous turn. No code change in this push — this push is docs-only except for the filename correction (hyphen → underscore).

## 6. What was NOT changed

- No ability stats, no boss HP, no XP curve, no Seals costs, no status durations were altered. All fixes above are wording / pointer / split fixes to make the files agree with each other. The one place two numbers disagreed (06 Seals), the table (20/40/60/100) was kept because it matches 08's range.
