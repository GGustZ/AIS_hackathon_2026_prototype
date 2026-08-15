# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Thai public-school science teachers, primarily in small schools, who teach subjects outside the degree they trained in.

The representative user is 34, holds an education degree in Thai language, and teaches five subjects including science. Her school covers ป.1 to ม.6 and she can be assigned to any grade in that range, decided year to year by whoever is left after transfers. Her school has four teachers covering eight grade levels. She is also responsible for procurement paperwork and is preparing for a คศ.2 promotion, so PA documentation is a live concern.

She uses LINE, Facebook and Canva comfortably and has never used an analytics tool. She abandons anything that duplicates data she has already entered elsewhere.

The gap between what she knows and what she is required to teach is the product's reason to exist. A teacher who trained in the subject she teaches needs this much less.

## Product Purpose

A teacher uploads a lesson plan she has **already written**. The system parses it, compares it against curated references, and reports at most three things the plan does not yet handle, each with a concrete insertion and a reason. She taps to accept or reject.

The system does not write the plan. What it removes is the time a teacher spends finding out where students usually get stuck and which method addresses that.

Success is a teacher who gets a usable finding on her first upload without asking permission from anyone, and who comes back because the accepted items become evidence for her annual PA.

## Positioning

The differentiator is a curated misconception library plus continuity, not raw intelligence.

A general LLM writes a good plan once. This system tells a teacher what the plan she already wrote fails to catch, and remembers what she chose last time. School systems (SGS, Q-Info) report "low score" and never "which misconception". Teacher Facebook groups carry opinion rather than evidence and are not searchable.

The strongest single demonstration is the system quoting a sentence from the teacher's own plan that reinforces a known misconception, which no competitor can do without the library.

## Operating Context

- Lesson plans arrive as .docx or .pdf, commonly in 5E structure (ขั้นสร้างความสนใจ, ขั้นสำรวจและค้นหา, ขั้นอธิบายและลงข้อสรุป, ขั้นขยายความรู้, ขั้นประเมิน), frequently as numbered sections rather than labelled ones.
- Real PDFs embed fonts with incomplete ToUnicode tables, so text arrives with characters permanently missing. The reference sample loses ส ห ว ศ document-wide, about 21% character damage. Structure and indicator codes survive; prose does not.
- Curriculum authority is หลักสูตรแกนกลาง พ.ศ. 2551, indicators ฉบับปรับปรุง พ.ศ. 2560. สพฐ. is piloting competency-based standards in ป.4-6.
- The annual PA assessment is mandatory for every teacher every year, distinct from DPA promotion which only applies to teachers seeking วิทยฐานะ. The product targets ส่วนที่ 2 ประเด็นท้าทาย, worth 40 of 100 points.
- Teachers work on phones as readily as on older laptops, often on unreliable connections.

## Capabilities and Constraints

**Confirmed capability.** Parses .docx and .pdf in the browser; reports extraction confidence per field, never per file; compares a plan against curriculum indicators, a misconception library, and the teacher's own history; ranks findings by severity and shows at most three; records accept/reject decisions locally; exports the teacher's own plan with tracked-change insertions; drafts PA evidence for parts 1 and 2 of ส่วนที่ 2.

**Hard product constraints that future work must not break.**

1. The first user must get value on first use with no permission from anyone. Never design a feature whose value depends on other teachers having used the system first.
2. No typing in the main path. Everything is an upload, a selection, or a tap. Reject reasons are a closed list, because free text cannot be counted later.
3. Never return a rewritten plan file. Output is a diff on the teacher's own plan. Returning a whole rewritten document forces her to re-read it to find what changed, which adds reading time instead of removing preparation time.
4. Never claim causation. "N teachers used this and reported improvement" is allowed; "this method improves outcomes by X%" is not. There is no control group.
5. Say "I do not know" rather than guessing. Indicators outside the library return a plain statement that the unit is not covered.
6. The PA connection is load-bearing, not a feature. It is the reason a teacher returns after week two.

**Technical constraints.** Zero runtime dependencies: no framework, no bundler, no CDN. Data lives in CSVs loaded at runtime and those CSVs are the single source of truth. Storage is IndexedDB, per browser and per device, correct for a prototype and wrong for production. No server, no accounts, no cross-teacher data.

**Library state, which bounds every claim.** 6 misconceptions covering 1 indicator (ว 1.2 ม.1/6). 20 of 110 catalogued methods bound with the four fields needed to recommend. 7 curriculum indicators extracted. Every row is `status = draft` with no per-item citations. Assessment items exist but are unusable: truncated stems, one distractor each.

**Undecided.** The PA coverage claim is inconsistent across documents (README says 6 of 9, input-output-spec §3.7 says 5 of 8) and was explicitly deferred on 14 Aug 2026. The defensible fallback is the claim derived from the actual forms: evidence for ส่วนที่ 2 (40 points) plus 3 of the 15 indicators in ส่วนที่ 1, with 10 of 15 untouchable.

**Undecided.** Business model. Freemium-to-premium carries a recognised risk: an AI tool with per-school cost can widen the inequality the hackathon exists to close. No decision made.

## Brand Commitments

- Name: **ตรวจรู้ (TruatRoo)**. Tagline: ผู้ช่วยตรวจแผนการสอนวิทยาศาสตร์.
- All teacher-facing output is Thai. English is acceptable in code and internal docs.
- No em dashes in any written output.
- The line "ระบบไม่ได้เขียนแผนแทนคุณ" is a positioning commitment, not decoration.
- Findings are always phrased as facts about students, never as defects in the teacher's plan. This is an adoption requirement: the product tells a professional under annual evaluation that her own work is incomplete, and deficit framing loses her.
- Evidence limits are shown alongside every recommendation, never hidden behind a link.
- Entry submitted to AIS JumpThailand Hackathon 2026, track Empowering Teachers. Judging weights: Problem-Solution Fit 35%, Technical 35%, Market Potential 20%, Presentation 10%.

## Evidence on Hand

- `docs/evidence/statistics-and-sources.md`: figures re-verified against sources on 13 Aug 2026, including which two were previously wrong and removed.
- `docs/evidence/pa-documents-explained.md`: what ว.PA actually requires, form by form.
- `data/source/thai-science-curriculum-indicators-2560.pdf`: the official curriculum, 277 pages, 98.3% text-extractable. `data/DB1_curriculum_slice.csv` is extracted from it and hand-verified.
- `prototype/sample-plan.docx`: synthetic plan with invented school and teacher names, safe to publish, built by `tools/make-sample.mjs`.
- `data/samples/`: one real lesson plan carrying a real school name, teacher name and classroom **without consent to publish**. Gitignored and must stay so.

**Absences future work must not fabricate.** No teacher interviews have been conducted; all evidence is secondary. No outcome data, no control group, no pilot. No per-item research citations behind any library row. The 42-point PISA gap in teacher-short schools is an association and must never be written as a causal effect.

## Product Principles

1. **Narrow and deep beats broad and shallow.** Own ม.1 วิทยาศาสตร์ completely, roughly 30 indicators, rather than covering a thin slice of everything. "We cover ม.1 science end to end" is defensible; 5% coverage of the whole curriculum is not.
2. **Science is the wedge, not the ceiling.** The misconception research exists in science, so that is where the moat is built, but the architecture stays subject-neutral so Thai or maths can follow. Do not hard-code science assumptions into structure.
3. **Honesty is the feature.** Saying "this unit is not in the library yet" is the behaviour that makes every other claim credible. Padding an empty result destroys the thing that distinguishes this from a chatbot.
4. **Remove work, never add it.** Any step that asks the teacher for something must pay for itself immediately, and the PA output is how it pays.
5. **The library is the product.** Intelligence is commodity; the curated, bounded, citable reference set is not. Investment goes to the tables before it goes to the interface.

## Accessibility & Inclusion

Thai-first typography with generous line height, because Thai vowels and tone marks clip at Latin defaults. Must work on a phone and on an older laptop, and must remain usable on an unreliable connection, which is why no layout-critical asset loads from a CDN. Teacher-facing views carry no table names, field names, or system jargon.

The product must not require a school to pay before a teacher can use it, since the inequality it addresses is concentrated in schools least able to pay.

## Scope and Horizon

Built as an entry for the AIS JumpThailand Hackathon 2026, proposal deadline 15 Aug 2026. Whether it continues past that depends on the outcome.

Until that is decided, optimise for what can be demonstrated and defended rather than for production readiness. Prototype-only choices (IndexedDB, no accounts, single browser, no server) are accepted deliberately and are documented as such; do not treat them as debt to be paid down without a decision to continue.
