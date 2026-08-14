// Headless check of the browser engine, run against a real lesson plan.
//
//   node tools/selftest.mjs [path-to-plan.pdf|.docx]
//
// Defaults to the gitignored sample. Nothing from that file is written
// anywhere; only counts and derived findings are printed.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const p = (...a) => path.join(ROOT, ...a)

// lib.js fetches its CSVs. Serve them from disk instead.
const realFetch = globalThis.fetch
globalThis.fetch = async (url) => {
  const name = String(url).replace(/^.*\//, '')
  const f = p('data', name)
  if (fs.existsSync(f)) return new Response(fs.readFileSync(f, 'utf8'), { status: 200 })
  return realFetch ? realFetch(url) : new Response('', { status: 404 })
}

const lib = await import(pathToFileURL(p('prototype', 'lib.js')).href)

const target = process.argv[2] || p('data', 'samples', 'sample-lesson-plan-m1-photosynthesis.pdf')
if (!fs.existsSync(target)) {
  console.error(`no plan at ${target}\nPass a path, or drop a plan in data/samples/.`)
  process.exit(1)
}

const DB = await lib.loadLibraries('../data/')
console.log(`libraries: ${DB.curr.length} indicators | ${DB.misc.length} misconceptions | ` +
  `${DB.map.length} map rows | ${DB.method.length} methods | ${DB.evidence.length} evidence rows | ${DB.item.length} items\n`)

const methodIds = new Set(DB.method.map(m => m.id))
const unboundProblems = DB.problem.filter(p => !p.methodId || !methodIds.has(p.methodId))
const evidenceMethods = new Set(DB.evidence.flatMap(e => e.methodIds))
const problemMethodsWithoutEvidence = [...new Set(DB.problem.map(p => p.methodId).filter(Boolean))]
  .filter(id => !evidenceMethods.has(id))
const orphanEvidence = DB.evidence.flatMap(e => e.methodIds).filter(id => !methodIds.has(id))
const dataOk = DB.problem.length === 26 && !unboundProblems.length &&
  !problemMethodsWithoutEvidence.length && !orphanEvidence.length
console.log(`data QA     ${dataOk ? 'ok' : 'FAILED'} | problems ${DB.problem.length - unboundProblems.length}/${DB.problem.length} bound | ` +
  `problem methods with evidence ${DB.problem.length ? DB.problem.length - problemMethodsWithoutEvidence.length : 0}/${DB.problem.length}`)
if (!dataOk) {
  console.error({ unboundProblems: unboundProblems.map(p => p.id), problemMethodsWithoutEvidence, orphanEvidence })
  process.exitCode = 1
}

const buf = fs.readFileSync(target)
const isDocx = /\.docx$/i.test(target)
const t0 = Date.now()
const doc = isDocx ? await lib.readDocx(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length))
                   : await lib.readPdf(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length))
const plan = lib.parsePlan(doc)
const ms = Date.now() - t0

console.log(`file      ${path.basename(target)}  (${doc.kind}, ${ms} ms)`)
console.log(`damage    ${(plan.overallDamage * 100).toFixed(1)}%  (share of characters the font failed to map)`)
console.log(`unit      ${plan.unit || '(not found)'}`)
console.log(`subject   ${plan.subject || '(not found)'}`)
console.log(`grade     ${plan.grade || '(not found)'}   periods ${plan.periods ?? '?'} x ${plan.minutesPerPeriod} min`)
console.log(`INDICATORS ${plan.currCodes.join(', ') || '(none found)'}`)
console.log(`activities ${plan.activities.length}: ` +
  plan.activities.map(a => `${a.stage}${a.duration ? '/' + a.duration + 'm' : '/?'}`).join(' '))
console.log('confidence ' + Object.entries(plan.confidence).map(([k, v]) => `${k}=${v.level}`).join(' '))

const res = lib.compare(plan, DB, { uploads: 0 })
console.log(`\nfindings   ${res.findings.length} (showing all; the UI caps at 3)`)
console.log(`unknown    ${res.unknownCodes.join(', ') || 'none'}`)
for (const f of res.findings) {
  console.log(`\n  [${f.severity}] ${f.kind}  ${f.id}`)
  console.log(`  ${f.title}`)
  if (f.evidence) console.log(`  quoted from plan: "${f.evidence.slice(0, 150)}"`)
  console.log(`  rule: ${f.rule}`)
  const ms2 = lib.pickMethods(f, plan, DB, null)
  if (ms2.length) console.log(`  methods: ${ms2.slice(0, 4).map(m => m.id + ' ' + m.nameEn).join(' | ')}`)
  else if (f.miscId) console.log('  methods: none fit the remaining time')
}

// Round-trip the export so a broken .docx cannot ship unnoticed.
const acc = res.findings.filter(f => f.miscId).slice(0, 2)
  .map(f => ({ miscId: f.miscId, methodId: lib.pickMethods(f, plan, DB, null)[0]?.id }))
  .filter(a => a.methodId)
if (acc.length) {
  const insertions = acc.map(a => {
    const m = DB.method.find(x => x.id === a.methodId)
    return { stage: m.stage, text: `${m.nameTh} (${m.duration} นาที)`, anchorEnd: doc.paras.at(-1)?.end ?? 0 }
  })
  const blob = lib.buildDocx(plan, doc, insertions)
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const back = await lib.unzip(bytes.buffer)
  const ok = back.has('word/document.xml')
  console.log(`\nexport     ${bytes.length} bytes, ${back.size} entries, document.xml ${ok ? 'present' : 'MISSING'}`)
  if (!ok) process.exitCode = 1

  const pa = lib.paDraft(plan, acc, DB)
  console.log(`PA draft   ข้อ1 ${pa.problem ? pa.problem.length + ' chars' : 'empty'} | ` +
    `ข้อ2 ${pa.how ? pa.how.split('\n').length + ' methods' : 'empty'} | ` +
    `covered ${pa.covered.filter(c => c[1]).length}/${pa.covered.length}`)
}

// Problem-first plans have no original activity paragraphs. Their accepted
// recommendation still has to appear in the downloadable document exactly once.
const manualText = 'ตัวอย่างวิธีสอนสำหรับแผนเริ่มจากปัญหา'
const manualBlob = lib.buildDocx(
  { ...plan, kind: 'manual', activities: [] }, { kind: 'manual', paras: [] },
  [{ stage: 'ขั้นสอน', text: manualText, anchorEnd: 0 }])
const manualBytes = new Uint8Array(await manualBlob.arrayBuffer())
const manualZip = await lib.unzip(manualBytes.buffer)
const manualXml = new TextDecoder().decode(manualZip.get('word/document.xml'))
const manualHits = manualXml.split(manualText).length - 1
console.log(`manual DOCX ${manualHits === 1 ? 'ok' : 'FAILED'} | accepted method appears ${manualHits} time(s)`)
if (manualHits !== 1) process.exitCode = 1

// The problem-first path must produce PA wording too. It is intentionally
// broader than misconception diagnosis and must not claim the system found
// a teacher-observed problem in the uploaded plan.
const broad = lib.problemFindings(DB, ['PB-01'])[0]
const broadMethod = broad && lib.pickMethods(broad, plan, DB, null)[0]
if (!broad || !broadMethod) {
  console.error('problem-first regression: PB-01 is not connected to a usable method')
  process.exitCode = 1
} else {
  const broadPa = lib.paDraft(
    { ...plan, teacherNote: 'นักเรียนต้องรอคำแนะนำจากครูก่อนเริ่มงาน' },
    [{ methodId: broadMethod.id, problemText: broad.title }], DB)
  const ok = broadPa.problem.includes('จากการสังเกตของครู') &&
    broadPa.problem.includes(broad.title) && broadPa.how && !broadPa.how.includes('ขั้นขั้น')
  console.log(`problem PA  ${ok ? 'ok' : 'FAILED'} | ${broadMethod.id} | no duplicated ขั้น`)
  if (!ok) process.exitCode = 1
}

// HIST is append-only, but the profile must use only the latest decision for
// each finding. Changing one's mind must not count both choices.
const profileCheck = lib.buildProfile(
  [{ planId: 'T1', minutesPerPeriod: 50, grade: 'ม.1' }],
  [
    { planId: 'T1', findingId: 'F1', action: 'inserted', methodName: 'วิธี ก', shownAt: 1, actedAt: 11 },
    { planId: 'T1', findingId: 'F1', action: 'undone', shownAt: 1, actedAt: 12 },
    { planId: 'T1', findingId: 'F1', action: 'rejected', reason: 'no_time', shownAt: 1, actedAt: 13 },
  ])
const profileOk = profileCheck.frequentActivities.length === 0 && profileCheck.rejectCounts.no_time === 1
console.log(`history PA  ${profileOk ? 'ok' : 'FAILED'} | latest decision only`)
if (!profileOk) process.exitCode = 1
