# CLAUDE.md

Project context for AI assistants working on this repository.

## What this project is

An entry for **AIS JumpThailand Hackathon 2026**, track **Empowering Teachers**.

**Proposal deadline: 15 August 2026.** The deliverable is a proposal document plus a scoped demo, not a production system. Optimize for what can be demonstrated and defended, not for feature completeness.

Judging weights: Problem-Solution Fit 35%, Technical 35%, Market Potential 20%, Presentation 10%.

## The product

A classroom learning-problem diagnosis system for teachers.

A teacher records what they observed in class (student work, quiz results, a short structured observation). The system groups the problem into a domain, recommends a teaching method drawn from a research-seeded database, and records what the teacher tried and what changed. Over time it builds a per-classroom history and can draft the teacher's PA documentation from the same records.

Core flow:

```
teacher input + research method library + curriculum indicators
        |
        v
   AI system: diagnose -> recommend -> record
        |
        v
   teacher picks a method and teaches
        |
        v
   teacher logs outcome ---> feeds back into recommendations
        |
        v
   other teachers see what worked in similar classrooms
```

## Design constraints that must not be violated

These come from analysis of why the first version of this idea failed. Any proposed change that breaks one of these is wrong, even if it adds capability.

1. **The first user must get value on the first use, with no permission from anyone.** The method library is seeded from research before launch. Never design a feature whose value depends on other teachers having already used the system.

2. **Never add data entry without removing more than you add.** The failure mode of the previous version was asking time-poor teachers to log more. Every logging step must pay for itself, ideally by feeding the PA draft.

3. **Never claim causation.** Report "N teachers used this and reported improvement." Never report "this method improves outcomes by X%." There is no control group and the confounders are severe (class composition, time of year, teacher growth, outside tutoring).

4. **The PA connection is load-bearing, not a nice-to-have.** It is what makes a teacher willing to keep logging after week two. If scope must be cut, know that cutting this removes the incentive structure, not a feature.

## Target user

Small-school primary teacher, teaching subjects outside her degree. Representative profile:

- 34, female, education degree in Thai language, teaching 5 subjects including science to grades 4 to 6
- School has 4 teachers covering 8 grade levels
- Also responsible for procurement paperwork
- Preparing for คศ.2 promotion, so PA documentation is a live concern
- Uses LINE, Facebook, Canva comfortably. Has never used an analytics tool.
- Will abandon anything that takes more than 10 minutes per use or duplicates data she has already entered elsewhere

The gap between what she knows and what she must teach is the product's reason to exist. A teacher who trained in the subject she teaches needs this much less.

## Evidence base

Use these figures. They are sourced and defensible.

| Claim | Figure | Source |
|---|---|---|
| Small-school teaching hours | 27.31 hrs/week, 37.6% above ministry standard | EEF / EEFI 2026 |
| Workload harms teaching quality | 47.7% of teachers agree | EEF |
| Adequate lesson prep time | only 29.7% | EEF |
| Time lost outside classroom | 84 of 200 working days | Thai PBS |
| Administrative hours | 346 hrs per term | Thai PBS |
| Teacher shortage | 56,820 positions across 20,368 schools | Policy Watch (101 PUB) |
| Surplus teachers elsewhere | 8,893 across 3,800 schools | Policy Watch |
| Basic reading skills gap | 29% of children aged 7 to 14 | UNICEF |
| Programs cut under Work Smart | 7 duplicate evaluation programs, May 2026 | MOE |

**Handle with care:** the "42-point PISA gap in teacher-short schools" figure is a correlation, not a causal effect. Small, remote, and low-income schools are confounded with teacher shortage. Cite it as an association only.

## Known weaknesses to state openly in the proposal

Do not hide these. A judge will find them, and pre-empting them reads as rigor.

1. The system asks teachers to log data, which is in tension with the workload-reduction goal. Mitigation is the PA connection.
2. Causal attribution is not possible. Reporting language must reflect this.
3. Mapping Western pedagogy research onto หลักสูตรแกนกลาง indicators has not been done, and the curriculum is moving toward competency-based standards.
4. No teacher interviews have been conducted. All evidence is secondary.
5. Freemium-to-premium risk: an AI tool with per-school cost can widen the inequality that other tracks of this hackathon exist to close.

## Competitive position

| Competitor | Their advantage | Their gap |
|---|---|---|
| General LLMs (ChatGPT, Gemini, NotebookLM) | Free, immediate, Thai-capable, good advice | No memory across sessions, no per-classroom history |
| School systems (SGS, Q-Info) | Already hold scores, teachers already enter data | Report "low score," never "which misconception" |
| Teacher Facebook groups | Hundreds of thousands of users, free | Not searchable, opinion rather than evidence |
| Khanmigo, Quizizz, Formative | Mature assessment analytics | Shallow Thai curriculum and language support |

The differentiator is continuity, not intelligence. A general LLM gives good advice once. This system remembers what this classroom already tried.

## Open decisions

- Whether the method library is seeded from real research or hand-built (roughly 20 entries) for the demo. If hand-built, say so explicitly on the slide.
- Input time budget: 10 or 15 minutes. Whichever is stated will be measured against the workload-reduction claim, so state the number that can be defended.
- Which subject and which misconceptions the demo covers. A narrow, deep slice beats a broad, shallow one.

## Working style

- Correctness over speed. This is a proposal that gets read by people who work in education, so a wrong claim about the Thai school system costs more than a missing feature.
- Distinguish clearly between what is built, what is designed, and what is aspirational. Do not let future scope (district and national aggregation) read as present capability.
- Thai-language output for anything going into the proposal or slides. English is fine for code and internal docs.
- No em dashes in any written output.