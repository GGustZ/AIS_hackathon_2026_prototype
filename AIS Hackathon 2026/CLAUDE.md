# CLAUDE.md

Project context for AI assistants working on this repository.

Last reconciled with the design docs on 14 August 2026. If this file and `docs/design/` disagree, `docs/design/` wins and this file needs updating.

## What this project is

**ตรวจรู้ (TruatRoo)**, an entry for **AIS JumpThailand Hackathon 2026**, track **Empowering Teachers**.

**Proposal deadline: 15 August 2026.** The deliverable is a proposal document plus a scoped demo, not a production system. Optimize for what can be demonstrated and defended, not for feature completeness.

Judging weights: Problem-Solution Fit 35%, Technical 35%, Market Potential 20%, Presentation 10%.

## The product

A lesson-plan checker for Thai science teachers.

A teacher uploads a lesson plan they have **already written**. The system parses it, compares it against three references, and reports at most three things the plan does not yet handle, each with a concrete insertion and a reason. The teacher taps to accept or reject.

**The system does not write the plan.** What it removes is the time a teacher spends finding out where students usually get stuck and which method addresses that. Teachers with no plan yet can start from a blank template instead of a file.

Core flow:

```
teacher uploads an existing lesson plan (.docx / .pdf)
        |
        v
   parse into DB7 PLAN, per-field extraction confidence
        |
        v
   three comparators run in the background
     1. vs DB1 CURR      does it cover the indicators
     2. vs DB2 MISC      does it head off known misconceptions   <-- the differentiator
     3. vs DB8 HIST      how does it differ from your own past plans
        |
        v
   at most 3 findings, ranked by severity, shown as a diff
        |
        v
   teacher taps: insert / another variant / reject (closed-list reason)
        |
        v
   accepted items produce assessment questions + PA evidence
   rejections tune future recommendations (constraint_profile)
```

Comparator 2 is the one competitors cannot do. Comparators 1 and 3 are nearly free once the plan is parsed.

**This is a pivot.** An earlier version had teachers photograph marked student work for OCR diagnosis. That direction is archived in `docs/archive/` and must not be resumed. Pre/post measurement, class rosters, and result capture are all Phase 2, drawn in the diagrams but labelled as not built.

## Design constraints that must not be violated

Any proposed change that breaks one of these is wrong, even if it adds capability.

1. **The first user must get value on the first use, with no permission from anyone.** The misconception and method libraries are seeded before launch. Never design a feature whose value depends on other teachers having already used the system.

2. **No typing in the main path.** Everything is an upload, a selection, or a tap. The one exception is grade + subject + periods-per-week, which is optional and pays for itself immediately by generating the PA1 workload table. Reject reasons are a closed list, never free text, because free text cannot be counted later.

3. **Never return a rewritten plan file.** Output is a diff on the teacher's own plan. Returning a whole rewritten document forces the teacher to re-read it to find what changed, which adds reading time rather than removing preparation time, and the time-saving claim collapses.

4. **Never claim causation.** Report "N teachers used this and reported improvement." Never report "this method improves outcomes by X%." There is no control group and the confounders are severe.

5. **Say "I do not know" rather than guessing.** If an indicator is not in the MAP table, the system says the unit is not in the first library release and returns comparator 1 only. Low-confidence extracted fields are shown to the teacher for confirmation, not silently used.

6. **The PA connection is load-bearing, not a nice-to-have.** It is the reason a teacher keeps using this past week two. If scope must be cut, know that cutting this removes the incentive structure, not a feature.

## Which PA, exactly

This was retargeted after reading the actual forms. Getting it wrong shrinks the addressable user base by an order of magnitude.

| | Annual PA assessment | Promotion via DPA |
|---|---|---|
| Who | **Every teacher, every year, mandatory** | Only those applying for วิทยฐานะ |
| Forms | PA1/ส, PA2/ส, PA3/ส | DPA system submission |
| Aim at this? | **Yes** | Secondary |

The target is **ส่วนที่ 2 ประเด็นท้าทาย** of the annual PA, worth **40 of 100 points**, and the hardest section for teachers to write because it demands a real problem, a real method, and real numbers. Its four required parts map almost exactly onto this product's loop. Phase 1 can supply parts 1 and 2; parts 3.1 and 3.2 need measurement and are Phase 2.

**Never claim "the system does PA for the teacher."** The defensible claim is: evidence for section 2 (40 points) plus three of the fifteen indicators in section 1. Ten of the fifteen indicators the system cannot touch at all.

Note: `README.md` says 6 of 9 PA components, `docs/design/input-output-spec.md` §3.7 says 5 of 8. These need to be reconciled to one number before the proposal ships.

## Target user

Small-school teacher, teaching subjects outside her degree. Representative profile:

- 34, female, education degree in Thai language, teaching 5 subjects including science
- **Assignable to any grade from ป.1 to ม.6.** Her school spans the full range, and which grades she gets is decided year to year by whoever is left after transfers
- School has 4 teachers covering 8 grade levels
- Also responsible for procurement paperwork
- Preparing for คศ.2 promotion, so PA documentation is a live concern
- Uses LINE, Facebook, Canva comfortably. Has never used an analytics tool.
- Will abandon anything that duplicates data she has already entered elsewhere

The gap between what she knows and what she must teach is the product's reason to exist. A teacher who trained in the subject she teaches needs this much less.

**The grade range is a product requirement, not just biography.** Because she can be moved anywhere from ป.1 to ม.6, the system cannot assume a fixed grade band, and `MISC.grade_band` and `METHOD.grade_band` must be ranges rather than single levels. It is also why the demo can sit at ม.1 while the persona is a small-school generalist: both are inside her range. The DB1 `prereq_codes` field matters more for her than for a specialist, because she is the one who has to notice that this year's ม.1 class never got solid at ป.6.

## Evidence base

All figures below were re-verified against source links on 13 August 2026. Full working in `docs/evidence/statistics-and-sources.md`, which also records what was wrong before.

| Claim | Figure | Source |
|---|---|---|
| Small-school teaching hours | 27.31 hrs/week, 37.6% above ministry standard | กสศ. 2569 |
| Workload harms teaching quality | 47.7% agree, only 29.7% have adequate prep time, 63% no work-life balance | กสศ. 2569 |
| Quality-assurance paperwork | **438 hrs per term**, pure documentation work | กสศ. 2569 |
| Schools running duplicate projects | 41% run more than 10 projects | 2562 data, label the year |
| Teacher shortage | 56,820 positions across 20,368 schools | Policy Watch |
| Surplus teachers elsewhere | 8,893 across 3,800 schools | Policy Watch |
| Small-school staffing | avg 62 students across 7 to 8 classrooms, fewer than 4 teachers | Policy Watch |
| Basic skills gap | 27% of ages 7 to 14 lack reading, 31% lack numeracy | UNICEF / MICS 2022 |
| Inequality gap | 19 points reading, 21 points numeracy, richest vs poorest quintile | UNICEF / MICS 2022 |
| Programs cut under Work Smart | 7 duplicate evaluation programs, May 2026 | MOE |
| MOE stated goal | "record once, report to many systems" | MOE, 27 May 2026 |

**Two figures previously in this file were wrong and have been removed.** "346 admin hrs per term" appears in no source that could be found; use 438 hrs quality-assurance work instead. "29% reading / 35% numeracy" is wrong; the correct figures are 27% and 31%.

**Handle with care:** the 42-point PISA gap in teacher-short schools is an association, not a causal effect. Write "schools with teacher shortages score 42 points lower." Never write "teacher shortage lowers scores by 42 points." A judge who knows statistics will dock Technical, not just Market.

**Label the year on older data.** The "84 of 200 working days lost outside the classroom" figure is from 2557 and is twelve years old. Newer substitutes exist in the evidence doc.

**Naming trap:** กสศ. (Equitable Education Fund, Thailand) and EEF (Education Endowment Foundation, UK) are unrelated organisations. Write "กสศ." for the Thai workload data and "EEF (สหราชอาณาจักร)" for the UK teaching toolkit. Never write a bare "EEF" for both.

**The strongest single line for the problem slide** is the MOE's own stated goal of "record once, report to many systems," announced but unbuilt, alongside its stated reason for cancelling the classroom-research program: teachers were producing the same evidence in several different formats.

## Data status

The libraries are the product. Their state is the honest constraint on what can be claimed.

| File | Rows | Status |
|---|---:|---|
| `data/DB4_teaching_methods_110.csv` | 110 | source spreadsheet, categorised with Bloom matching. Still has no `addresses_misc`, `when_to_use`, `not_suitable_when`, or `plan_stage`. Treat as the raw catalogue, not the recommender |
| `data/DB4_methods_bound_draft.csv` | 20 | **the recommender.** Methods drawn from the 110 and bound to the seeded misconceptions, with all four missing fields filled |
| `data/FORM_frontend_options.csv` | 26 problems | complete, every problem maps to a method |
| `data/DB2_misconceptions_draft.csv` | 6 | **draft, no per-item citations**, covers ว 1.2 ม.1 only |
| `data/DB3_indicator_map_draft.csv` | 6 | draft |
| `data/DB6_assessment_items_draft.csv` | 6 | draft, distractors already bound to misconception ids |
| `data/source/thai-science-curriculum-indicators-2560.pdf` | n/a | not yet extracted into DB1 |

DB2 MISC is the only table in the reference set that nobody else gives away. Everything on every screen hangs off it. It is the asset, and it currently has six rows.

Every distractor in DB6 carries a `misc_id`. This is what lets Phase 2 close the measurement loop without redesigning anything, so it must not be dropped for demo convenience.

### How the recommender selects

`DB4_methods_bound_draft.csv` is what makes the method library a recommender rather than a list. Every row has `addresses_misc`, `when_to_use`, `not_suitable_when`, and `plan_stage` filled, which is the minimum needed to answer "why this method, and where does it go."

Selection rules, all of which are visible in the data rather than hidden in code:

1. **`persistence` picks the method class.** High persistence means re-explaining will not work and a conflict-based method is required (T-CC-01, T-CCH-01). Medium or low persistence means clear reteaching is enough (T-EI-01), and proposing a heavy activity there wastes the teacher's period. `T-EI-01` and `T-CCH-01` are marked mutually incompatible for exactly this reason.
2. **`plan_stage` decides the insertion point.** The output is "insert at ขั้นนำ," not "consider using cognitive conflict."
3. **`duration_min` is filtered against the period length** from `teacher_profile.typical_period_minutes`. The demo plan is 50 minutes with 25 unallocated, so anything above 25 is not offered.
4. **`requires_lab` and `materials` are filtered against `constraint_profile`.** A teacher who has rejected three suggestions for having no equipment stops being shown A-EXP-01. This is the whole reason reject reasons are a closed list.
5. **Models are not insertions.** P-INQ-02 and P-PHEN-02 are `plan_stage = ทั้งแผน` and must never be proposed as an insertion into a finished plan, because accepting one means rewriting the plan, which violates the diff-only constraint.

Coverage is 20 methods across all four categories, every misconception reachable by at least six. Every row is `status = draft` because none has a per-item citation yet, and `evidence_note` carries the honest caveat per row until DB5 EVID exists.

## Known weaknesses to state openly in the proposal

Do not hide these. A judge will find them, and pre-empting them reads as rigor.

1. **PDF extraction is lossy on real files.** The sample plan embeds a font such that ส ห ว ษ vanish document-wide, roughly 26% character damage. Structure survives (numbered headings and indicator codes extracted correctly), content does not. This is why confidence is reported per field, not per file, and why damaged fields fall through to page OCR plus teacher confirmation.
2. The misconception library covers one indicator, not a curriculum.
3. Mapping Western pedagogy research onto หลักสูตรแกนกลาง indicators has not been done, and สพฐ. is piloting competency-based standards in ป.4-6 this academic year. The `curriculum_version` field on DB3 MAP exists specifically so the mapping can be rewritten without touching MISC or HIST.
4. Causal attribution is not possible. Reporting language must reflect this.
5. No teacher interviews have been conducted. All evidence is secondary.
6. Freemium-to-premium risk: an AI tool with per-school cost can widen the inequality that other tracks of this hackathon exist to close.
7. The demo runs on prepared sample files and does not yet handle every plan format.

## Competitive position

| Competitor | Their advantage | Their gap |
|---|---|---|
| General LLMs (ChatGPT, Gemini, NotebookLM) | Free, immediate, Thai-capable, good advice | Cannot say what **your** plan is missing against a curated library, no memory across sessions |
| School systems (SGS, Q-Info) | Already hold scores, teachers already enter data | Report "low score," never "which misconception" |
| Teacher Facebook groups | Hundreds of thousands of users, free | Not searchable, opinion rather than evidence |
| Khanmigo, Quizizz, Formative | Mature assessment analytics | Shallow Thai curriculum and language support |

The differentiator is the curated misconception library plus continuity, not raw intelligence. A general LLM writes a good plan once. This system tells a teacher what the plan she already wrote fails to catch, and remembers what she chose last time.

The upload path defends itself better than the blank-template path, because on a blank template the output is a generated plan and that is exactly where an LLM competes head-on. Lead the demo with the upload path. If the blank-template path is shown, the misconception section must sit at the top of the page, never at the bottom, or the teacher reads the plan and closes it without seeing the only thing that makes this different.

## Open decisions

- **Deferred by decision, 14 Aug 2026:** reconcile the PA coverage claim. README says 6 of 9, the spec says 5 of 8. Left as is for now. If a judge asks, fall back to the claim in the "Which PA, exactly" section above, which is derived from the actual forms and is the defensible one.
- State a defensible time figure. The spec claims 20 seconds to upload and 15 seconds to read the result. Whatever number goes on the slide will be tested against the workload-reduction claim.
- The slide must state the bound count honestly: 20 of the 110 methods are bound to a misconception, covering 6 misconceptions on 1 indicator. Claiming a 110-method recommender would be false.
- Whether to extend the binding beyond photosynthesis before the deadline, or state the narrow slice as a deliberate choice. The spec already argues that narrow and deep beats broad and shallow.

## Repo map

| Path | What it is |
|---|---|
| `docs/design/input-output-spec.md` | **The canonical document.** What the teacher gives, what the system shows |
| `docs/design/database-schema.md` | DB1 to DB8 field by field, plus the taxonomy reference file and teacher_profile view |
| `docs/design/requirements.md` | FR and NFR for a working prototype, with build order. Read before writing any implementation code |
| `docs/evidence/statistics-and-sources.md` | Verified figures and the record of which ones were wrong |
| `docs/evidence/pa-documents-explained.md` | What ว.PA actually requires and which parts the system can supply |
| `docs/CHANGELOG.md` | What changed, when, and why. Update this when a change affects what can be claimed |
| `docs/archive/` | Abandoned directions. Do not resume work from here |
| `prototype/index.html` | 8-screen demo, no install, teacher-view / technical-view toggle |
| `data/samples/` | **Gitignored.** Contains a real school name, teacher name, and classroom, without consent to publish |

## Working style

- Correctness over speed. This is a proposal read by people who work in education, so a wrong claim about the Thai school system costs more than a missing feature.
- Distinguish clearly between what is built, what is designed, and what is aspirational. Do not let Phase 2 scope read as present capability.
- Thai-language output for anything going into the proposal or slides. English is fine for code and internal docs.
- No em dashes in any written output.
</content>
</invoke>
