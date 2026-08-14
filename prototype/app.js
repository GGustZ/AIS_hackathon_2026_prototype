// ตรวจรู้ TruatRoo, user interface.
// Screen flow and rendering only. All logic lives in lib.js.

import {
  loadLibraries, readDocx, readPdf, parsePlan, compare, pickMethods, paDraft,
  buildDocx, savePlan, allPlans, addEvent, allEvents, buildProfile, clearAll,
  miscForStandard, problemFindings, methodsForBloom,
} from './lib.js'

const $ = s => document.querySelector(s)
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Inline SVG rather than an icon font. The mockups pull Material Symbols from
// a CDN; nine hand-written paths cost less and never fail to load.
const SVG = {
  upload: 'M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
  filePlus: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zm0 0v5h5M12 12v5m-2.5-2.5h5',
  star: 'M12 3l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.2l5.9-.8z',
  bulb: 'M9 18h6m-5 3h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z',
  warn: 'M12 9v4m0 4h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z',
  steps: 'M4 20h4v-5h4v-5h4V5h4',
  clock: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  check: 'M20 6 9 17l-5-5',
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6 6 18M6 6l12 12',
  doc: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zm0 0v5h5M9 13h6m-6 4h4',
  history: 'M3 3v6h6M3.5 13a9 9 0 1 0 2.1-6.4L3 9m9-2v5l4 2',
}
const ico = (n, size) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
  stroke-linecap="round" stroke-linejoin="round"${size ? ` width="${size}" height="${size}"` : ''}
  ><path d="${SVG[n]}"/></svg>`

const SCREENS = ['s0', 's0b', 's0c', 's1', 's2', 's2d', 's3', 's4', 's5']
const STEP_LABEL = {
  s0: 'เริ่มต้น', s0b: 'เลือกเรื่อง', s1: 'ตรวจข้อมูล', s2: 'สิ่งที่ควรเสริม',
  s3: 'แผนที่ปรับแล้ว', s4: 'หลักฐาน PA', s5: 'แผนของฉัน',
}
const STEP_ORDER = ['s0', 's1', 's2', 's3', 's4', 's5']

const state = {
  DB: null, doc: null, plan: null, result: null, profile: null,
  decisions: new Map(), current: null, shownAt: new Map(),
  planId: null, altIndex: new Map(), seen: {},
}

// ---------------------------------------------------------------- navigation

function go(id) {
  SCREENS.forEach(s => $('#' + s).classList.toggle('hide', s !== id))
  state.screen = id
  state.seen[id] = true
  renderSteps(id)
  $('#navCheck').classList.toggle('on', ['s0', 's0b', 's0c', 's1', 's2', 's2d', 's3'].includes(id))
  $('#navPlans').classList.toggle('on', id === 's5')
  $('#navPa').classList.toggle('on', id === 's4')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// A labelled bar rather than a spinner, per the design system: the teacher is
// waiting on their own document and wants to know which part is happening.
function renderSteps(current) {
  const idx = STEP_ORDER.indexOf(
    ['s0b', 's0c'].includes(current) ? 's0' : current === 's2d' ? 's2' : current)
  $('#steps').innerHTML = STEP_ORDER.map((s, i) => {
    const cls = i === idx ? 'on' : (i < idx || state.seen[s]) ? 'done' : ''
    return `<div class="pstep ${cls}"><i></i><span>${STEP_LABEL[s]}</span></div>`
  }).join('')
}

// Technical view has no on-screen control. Append #tech to the URL.
function setMode(dev) { document.body.classList.toggle('devmode', dev) }

// ---------------------------------------------------------------- boot

async function boot() {
  resetDrop()
  $('#icoUpload').innerHTML = ico('doc')
  $('#icoNew').innerHTML = ico('filePlus')
  $('#icoProblem').innerHTML = ico('bulb')
  $('#ttContent').insertAdjacentHTML('afterbegin', ico('book'))
  $('#ttContent2').insertAdjacentHTML('afterbegin', ico('book'))
  $('#ttComp').insertAdjacentHTML('afterbegin', ico('steps'))
  $('#ttProblem').insertAdjacentHTML('afterbegin', ico('warn'))
  $('#ttBloom').insertAdjacentHTML('afterbegin', ico('steps'))
  $('#ttDok').insertAdjacentHTML('afterbegin', ico('book'))
  $('#ttPisa').insertAdjacentHTML('afterbegin', ico('bulb'))
  $('#recBadge').innerHTML = ico('star', 14) + ' แนะนำ'
  try {
    state.DB = await loadLibraries()
  } catch (e) {
    $('#s0').innerHTML = `<div class="notice bad"><b>โหลดคลังข้อมูลไม่สำเร็จ</b><br>${esc(e.message)}
      <br><br>หน้านี้ต้องเปิดผ่านเว็บเซิร์ฟเวอร์ ไม่ใช่การดับเบิลคลิกไฟล์
      เพราะเบราว์เซอร์ปิดการอ่านไฟล์ข้างเคียงเมื่อเปิดด้วย file://
      <br>รันในเครื่องด้วย <code>python -m http.server</code> ที่โฟลเดอร์รากของโปรเจกต์
      แล้วเปิด <code>/prototype/</code></div>`
    return
  }
  const [plans, events] = await Promise.all([allPlans(), allEvents()])
  state.profile = buildProfile(plans, events)
  renderStart()
  go('s0')
}

function resetDrop() {
  $('#dropmsg').innerHTML = `${ico('upload')}
    <b>ลากไฟล์มาวางที่นี่</b>
    <span class="muted">หรือ <u>เลือกไฟล์จากอุปกรณ์</u></span>
    <div class="tiny" style="margin-top:10px">รองรับ PDF และ DOCX สูงสุด 20MB</div>`
}

function renderStart() {
  const p = state.profile, m = state.DB
  $('#libstat').textContent =
    `คลังชุดนี้ครอบ ${m.curr.length} ตัวชี้วัด ความเข้าใจผิด ${m.misc.length} รายการ ` +
    `และวิธีสอนที่ผูกกับความเข้าใจผิดแล้ว ${m.method.length} รายการ`
  $('#uploadcount').textContent = p.uploads
    ? `คุณเคยตรวจแผนมาแล้ว ${p.uploads} ครั้ง` +
      (p.uploads < 3 ? ` อีก ${3 - p.uploads} ครั้งระบบจะเริ่มเทียบกับแผนเดิมของคุณได้` : '')
    : ''
  $('#fallbackCode').innerHTML = m.curr.map(c =>
    `<option value="${esc(c.code)}">${esc(c.code)} ${esc(c.text.slice(0, 44))}</option>`).join('')
}

function wireUpload() {
  const drop = $('#drop'), input = $('#file')
  drop.addEventListener('click', () => input.click())
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over') })
  drop.addEventListener('dragleave', () => drop.classList.remove('over'))
  drop.addEventListener('drop', e => {
    e.preventDefault(); drop.classList.remove('over')
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  })
  input.addEventListener('change', () => input.files[0] && handleFile(input.files[0]))
}

const READ_TIMEOUT_MS = 25000

async function handleFile(file) {
  const t0 = performance.now()
  const PHASES = ['กำลังอ่านเอกสาร', 'กำลังแยกโครงแผน', 'กำลังตรวจตัวชี้วัด']
  let phase = 0
  const paint = () => {
    const s = ((performance.now() - t0) / 1000).toFixed(0)
    $('#dropmsg').innerHTML = `<b>${esc(file.name)}</b>
      <div class="pbar" style="margin:14px 0 10px">${PHASES.map((_, i) =>
        `<div class="pstep ${i < phase ? 'done' : i === phase ? 'on' : ''}"><i></i></div>`).join('')}</div>
      <span class="muted">${PHASES[phase]} · ${s} วินาที</span>`
  }
  const tick = setInterval(paint, 250)
  paint()
  const stop = () => clearInterval(tick)

  try {
    const buf = await file.arrayBuffer()
    const isDocx = /\.docx$/i.test(file.name)
    const work = isDocx ? readDocx(buf) : readPdf(buf)
    state.doc = await Promise.race([
      work,
      new Promise((_, rej) => setTimeout(() => rej(new Error('ไฟล์นี้ใช้เวลาอ่านนานผิดปกติ')), READ_TIMEOUT_MS)),
    ])
    phase = 1; paint()
    state.plan = parsePlan(state.doc)
    phase = 2; paint()
    state.plan.fileName = file.name
    state.plan.readMs = Math.round(performance.now() - t0)
    stop(); resetDrop()
    renderConfirm()
    go('s1')
  } catch (e) {
    // FR-L-03: never leave the teacher stuck.
    stop()
    $('#dropmsg').innerHTML = `${ico('warn')}<b>อ่านไฟล์นี้ไม่ได้</b>
      <span class="muted">${esc(e.message)}</span>`
    $('#fallback').classList.remove('hide')
    $('#fallback').scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

// ------------------------------------------------- screens 0b / 0c

// Both entry screens share the same content selector.
function fillContent(pfx) {
  const f = state.DB.form
  const g = $('#' + pfx + 'Grade'), sub = $('#' + pfx + 'Subject'), st = $('#' + pfx + 'Std')
  if (g.options.length) return
  g.innerHTML = f.grades.map(x => `<option${x === 'ม.1' ? ' selected' : ''}>${esc(x)}</option>`).join('')
  const subjects = [...new Set(state.DB.curr.map(c => c.subjectGroup || 'วิทยาศาสตร์และเทคโนโลยี'))]
  sub.innerHTML = subjects.map(x => `<option>${esc(x)}</option>`).join('')
  st.innerHTML = f.standards.map(x =>
    `<option value="${esc(x.code)}"${x.code === 'ว ๑.๒' ? ' selected' : ''}>${esc(x.label)}</option>`).join('')
}

function coverageHtml(std, grade) {
  const { codes, misc } = miscForStandard(state.DB, std, grade)
  // FR-L-02: say plainly when the library does not cover this, do not pad.
  return misc.length
    ? `<span class="badge ok">${ico('check', 13)} อยู่ในคลังแล้ว</span>
       คลังชุดนี้รู้จักความเข้าใจผิดของ ${esc(std)} ${esc(grade)} จำนวน ${misc.length} รายการ
       ในตัวชี้วัด ${codes.map(esc).join(', ')}`
    : `<span class="badge warn">ยังไม่อยู่ในคลัง</span>
       คลังชุดแรกยังไม่ครอบ ${esc(std)} ${esc(grade)}
       ระบบจะแนะนำวิธีสอนจากปัญหาที่คุณเลือกได้ แต่ยังบอกไม่ได้ว่าหน่วยนี้เด็กมักติดตรงไหน`
}

const updateCoverage = () => {
  $('#pkCoverage').innerHTML = coverageHtml($('#pkStd').value, $('#pkGrade').value)
  updateSummary()
}
const updateCoverageBk = () => {
  $('#bkCoverage').innerHTML = coverageHtml($('#bkStd').value, $('#bkGrade').value)
}

const chipHtml = (code, label, sub) =>
  `<label><input type="checkbox" value="${esc(code)}">${esc(label)}${
    sub ? `<span class="sub">${esc(sub)}</span>` : ''}</label>`

function renderPick() {
  fillContent('pk')
  if (!$('#pkBloom').children.length) {
    const T = state.DB.taxonomy
    $('#pkBloom').innerHTML = T.filter(t => t.kind === 'bloom')
      .map(t => chipHtml(t.labelTh, `${t.labelTh} (${t.labelEn})`)).join('')
    $('#pkDok').innerHTML = T.filter(t => t.kind === 'dok')
      .map(t => chipHtml(t.code, `${t.labelTh}: ${t.labelEn}`)).join('')
    // Domain level only. All 21 skills would swamp the screen, and the domains
    // are what the mockup shows and what a teacher can answer quickly.
    $('#pkPisa').innerHTML = T.filter(t => t.kind === 'pisa-domain')
      .map(t => chipHtml(t.code, `${t.code}. ${t.labelEn}`)).join('')
    $('#pkProblems').innerHTML = state.DB.problem.map(p =>
      `<label><input type="checkbox" value="${esc(p.id)}">
        <span>${esc(p.text)}
        <span class="sub">คลังจับคู่กับ ${esc(p.strategy)}${
          p.methodId ? '' : ' (ยังไม่มีรายละเอียดในคลังชุดนี้)'}</span>
        </span></label>`).join('')
    for (const sel of ['#pkBloom', '#pkDok', '#pkPisa', '#pkProblems']) {
      $(sel).addEventListener('change', e => {
        e.target.closest('label')?.classList.toggle('on', e.target.checked)
        updateSummary()
      })
    }
  }
  updateCoverage()
}

const checkedIn = sel => [...document.querySelectorAll(sel + ' input:checked')].map(i => i.value)

// Live read-out of what the current selection points at, so the teacher sees
// the mapping before committing rather than after.
function updateSummary() {
  const blooms = checkedIn('#pkBloom')
  const probs = checkedIn('#pkProblems')
  const fromBloom = methodsForBloom(state.DB, blooms)
  const fromProb = probs.map(id => state.DB.problem.find(p => p.id === id)).filter(Boolean)
  const merged = new Map()
  for (const x of fromProb) merged.set(x.strategy, { strategy: x.strategy, methodId: x.methodId })
  for (const x of fromBloom) if (!merged.has(x.strategy)) merged.set(x.strategy, x)
  const list = [...merged.values()].slice(0, 10)

  $('#pkSummary').innerHTML = `<div class="sico">${ico('bulb', 20)}</div>
    <div style="flex:1"><b>วิเคราะห์จากสิ่งที่เลือก</b>
      <div class="muted">${list.length
        ? 'คลังจับคู่กับวิธีสอนต่อไปนี้ ตัวที่จางคือยังไม่ได้กรอกรายละเอียดในคลังชุดนี้'
        : 'ยังไม่ได้เลือกอะไร เลือกปัญหาหรือระดับการคิดเพื่อดูวิธีที่คลังแนะนำ'}</div>
      <div class="stags">${list.map(x =>
        `<span class="stag ${x.methodId ? '' : 'dim'}">${esc(x.strategy)}</span>`).join('')}</div>
    </div>`
}

async function startPlan({ grade, std, findings, unit }) {
  const { codes, misc } = miscForStandard(state.DB, std, grade)
  // Only claim the indicators the library actually has misconceptions for.
  const mapped = [...new Set(state.DB.map
    .filter(r => misc.some(m => m.id === r.miscId) && codes.includes(r.code)).map(r => r.code))]

  state.doc = { paras: [], kind: 'manual' }
  state.plan = parsePlan({ paras: [], kind: 'manual' })
  state.plan.source = 'blank_template'
  state.plan.grade = grade
  state.plan.subject = 'วิทยาศาสตร์และเทคโนโลยี'
  state.plan.currCodes = mapped.length ? mapped : codes
  state.plan.unit = unit
  state.plan.planId = state.planId = 'P' + Date.now()
  state.plan.createdAt = Date.now()
  await savePlan({
    planId: state.planId, unit, subject: state.plan.subject, grade,
    periods: 1, minutesPerPeriod: 50, currCodes: state.plan.currCodes, kind: 'manual',
    source: 'blank_template', createdAt: state.plan.createdAt,
  })

  // FR-J-03: what students get stuck on goes at the very top, above the
  // method list. Put it below and the teacher reads the plan and closes.
  const miscFindings = misc.map(m => ({
    id: 'C2-' + m.id, comparator: 'misconception', kind: 'unaddressed', miscId: m.id, severity: 'high',
    title: `หน่วยนี้นักเรียนมักติด "${m.name}"`,
    body: m.desc,
    rule: `MAP ${std} ${grade} -> ${m.id} frequency=${m.freq}`,
  }))
  state.result = {
    findings: miscFindings.concat(findings || []),
    unknownCodes: [], knownCodes: state.plan.currCodes, budget: 50, allocated: 0,
  }
  state.decisions.clear()
  state.altIndex.clear()
  const [plans, events] = await Promise.all([allPlans(), allEvents()])
  state.profile = buildProfile(plans, events)
  renderFindings()
  go('s2')
}

async function runPick() {
  const grade = $('#pkGrade').value, std = $('#pkStd').value
  const note = $('#pkNote').value.trim()
  await startPlan({
    grade, std, unit: `มาตรฐาน ${std} ${grade}`,
    findings: problemFindings(state.DB, checkedIn('#pkProblems')),
  })
  // Free text is kept so the teacher can reuse it, and is never fed into
  // selection, because free text cannot be counted across teachers later.
  if (note) state.plan.teacherNote = note
}

async function runBlank() {
  const grade = $('#bkGrade').value, std = $('#bkStd').value
  await startPlan({ grade, std, unit: `มาตรฐาน ${std} ${grade}`, findings: [] })
}

// ---------------------------------------------------------------- screen 1

const LEVEL_TAG = {
  high: ['ok', 'อ่านได้ชัด'], medium: ['warn', 'อ่านได้บางส่วน'],
  low: ['bad', 'อ่านไม่ชัด'], none: ['bad', 'ไม่พบ'],
}

function renderConfirm() {
  const p = state.plan, c = p.confidence
  const row = (key, label, value) => {
    const [cls, txt] = LEVEL_TAG[c[key]?.level || 'none']
    return `<div class="fld"><div class="fk">${label}</div>
      <div>${value ? esc(String(value).slice(0, 260)) : '<span class="muted">ไม่พบในไฟล์</span>'}</div>
      <span class="badge ${cls}">${txt}</span></div>`
  }
  const rank = { none: 0, low: 1, medium: 2, high: 3 }
  const fields = [
    ['currCodes', 'ตัวชี้วัด', p.currCodes.join(', ')],
    ['unit', 'หน่วยการเรียนรู้', p.unit],
    ['subject', 'รายวิชา', p.subject],
    ['grade', 'ระดับชั้น', p.grade],
    ['periods', 'เวลา', p.periods ? `${p.periods} คาบ คาบละ ${p.minutesPerPeriod} นาที` : ''],
    ['keyConcept', 'สาระสำคัญ', p.keyConcept],
    ['objectives', 'จุดประสงค์', p.objectives],
    ['activities', 'กิจกรรม', p.activities.map(a => a.label).join(' / ')],
    ['materials', 'สื่อและแหล่งเรียนรู้', p.materials],
    ['assessment', 'การวัดและประเมินผล', p.assessment],
  ].sort((a, b) => rank[c[a[0]]?.level || 'none'] - rank[c[b[0]]?.level || 'none'])

  const dmg = Math.round(p.overallDamage * 100)
  let banner = ''
  if (p.overallDamage > 0.15) {
    banner = `<div class="notice warn"><b>ไฟล์นี้อ่านตัวอักษรออกมาได้ไม่ครบ ประมาณ ${dmg}%</b><br>
      สาเหตุคือฟอนต์ที่ฝังในไฟล์ไม่ได้บันทึกรหัสตัวอักษรไว้ครบ ซึ่งเป็นข้อจำกัดของตัวไฟล์ ไม่ใช่ของแผน
      โครงสร้างและรหัสตัวชี้วัดยังอ่านได้ ระบบจึงทำงานต่อได้ แต่ช่องที่ขึ้นว่าอ่านไม่ชัด ให้ตรวจก่อนกดยืนยัน</div>`
  }
  if (!p.currCodes.length) {
    banner += `<div class="notice bad"><b>ไม่พบรหัสตัวชี้วัดในไฟล์</b><br>
      รหัสตัวชี้วัดคือสิ่งที่ทุกอย่างต่อจากนี้แขวนอยู่ ระบบจะไม่เดาให้ กรุณาเลือกด้านล่าง</div>
      <div class="card"><div class="fk">เลือกตัวชี้วัดของหน่วยนี้</div>
      <div class="row" style="margin-top:10px">
        <select id="pickCode">${state.DB.curr.map(x =>
          `<option value="${esc(x.code)}">${esc(x.code)} ${esc(x.text.slice(0, 44))}</option>`).join('')}</select>
        <button class="btn secondary" id="addCode">เพิ่ม</button></div></div>`
  }

  $('#confirmBody').innerHTML = banner + `<div class="card">${fields.map(f => row(...f)).join('')}</div>
    <div class="devline">source=${p.kind} | readMs=${p.readMs} | overallDamage=${p.overallDamage.toFixed(3)}
| dropped=[${(p.dropped || []).join('')}] | activities=${p.activities.length}
| confidence=${JSON.stringify(Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v.level])))}</div>`

  const add = $('#addCode')
  if (add) add.onclick = () => {
    const v = $('#pickCode').value
    if (!state.plan.currCodes.includes(v)) state.plan.currCodes.push(v)
    state.plan.confidence.currCodes = { level: 'high', damage: 0, manual: true }
    renderConfirm()
  }
}

async function confirmPlan() {
  const p = state.plan
  p.planId = state.planId = 'P' + Date.now()
  p.createdAt = Date.now()
  await savePlan({
    planId: p.planId, unit: p.unit, subject: p.subject, grade: p.grade,
    periods: p.periods, minutesPerPeriod: p.minutesPerPeriod, currCodes: p.currCodes,
    kind: p.kind, createdAt: p.createdAt, fileName: p.fileName,
  })
  const [plans, events] = await Promise.all([allPlans(), allEvents()])
  state.profile = buildProfile(plans, events)
  state.result = compare(p, state.DB, state.profile)
  state.decisions.clear()
  renderFindings()
  go('s2')
}

// ---------------------------------------------------------------- screen 2

const SEV_TH = { high: 'ควรแก้ก่อน', medium: 'ควรดู' }
const REASON_TH = {
  no_time: 'เวลาไม่พอ', no_materials: 'ไม่มีอุปกรณ์',
  not_suitable: 'ไม่เหมาะกับห้องนี้', disagree: 'ไม่เห็นด้วยกับวิธีนี้', other: 'อื่นๆ',
}

function renderFindings() {
  const r = state.result, p = state.plan
  const shown = r.findings.slice(0, 3)
  const rest = r.findings.length - shown.length
  $('#navPa').removeAttribute('aria-disabled')

  let head = `<div class="card flat"><b>${esc(p.unit || p.fileName || 'แผนของคุณ')}</b>
    <div class="muted">${esc(p.subject || '')} ${esc(p.grade || '')}
      ${p.periods ? `· ${p.periods} คาบ คาบละ ${p.minutesPerPeriod} นาที` : ''}</div>
    <div class="muted">ผูกกับตัวชี้วัด ${p.currCodes.map(esc).join(', ') || 'ยังไม่ระบุ'}</div></div>`

  if (r.unknownCodes.length) {
    head += `<div class="notice info">ตัวชี้วัด ${r.unknownCodes.map(esc).join(', ')}
      ยังไม่อยู่ในคลังชุดแรก ระบบจึงยังบอกไม่ได้ว่าหน่วยนี้เด็กมักติดตรงไหน
      ส่วนที่เหลือด้านล่างมาจากการตรวจความครบของตัวชี้วัดที่อยู่ในคลังแล้ว</div>`
  }
  if (!r.findings.length) {
    head += `<div class="notice info"><b>ไม่พบจุดที่ต้องเสริมจากคลังชุดนี้</b><br>
      หมายความว่าแผนนี้ครอบสิ่งที่คลังรู้จักแล้ว ไม่ได้แปลว่าแผนสมบูรณ์
      คลังปัจจุบันครอบ ${state.DB.misc.length} ความเข้าใจผิด บน ${state.DB.curr.length} ตัวชี้วัด</div>`
  }

  $('#findings').innerHTML = head + shown.map((f, i) => card(f, i)).join('') +
    (rest > 0 ? `<div class="row"><button class="btn ghost" id="showAll">ดูทั้งหมดอีก ${rest} รายการ</button></div>` : '') +
    `<div class="row" style="margin-top:32px">
      <button class="btn primary" id="toPlan">${ico('doc', 18)} ดูแผนที่ปรับปรุงแล้ว</button>
      <button class="btn secondary" id="toPa">หลักฐาน PA</button></div>`

  shown.forEach(f => { if (!state.shownAt.has(f.id)) state.shownAt.set(f.id, Date.now()) })
  wireFindings()
}

function card(f, i) {
  const d = state.decisions.get(f.id)
  const mc = f.miscId ? state.DB.misc.find(m => m.id === f.miscId) : null
  const methods = pickMethods(f, state.plan, state.DB, state.profile)
  const idx = state.altIndex.get(f.id) || 0
  const m = methods[idx % (methods.length || 1)]

  let body = `<div class="fhead">
      <span class="badge rank">ข้อที่ ${(i ?? 0) + 1}</span>
      <span class="badge ${f.severity}">${SEV_TH[f.severity] || ''}</span>
    </div>
    <h3>${esc(f.title)}</h3>`

  if (f.kind === 'reinforce' && f.evidence) {
    body += `<div class="muted">ข้อความในแผนที่ตรงกับความเข้าใจผิดนี้</div>
      <div class="quote">${esc(f.evidence)}</div>
      <div class="muted">นักเรียนที่อ่านข้อความนี้ มักสรุปต่อเองว่า ${esc(mc?.distractor || '')}</div>`
  } else if (f.body) {
    body += `<div class="muted">${esc(f.body)}</div>`
  }

  if (d?.action === 'inserted') {
    body += `<div class="chosen ins">${ico('check', 16)} นำไปใช้แล้ว ${esc(d.methodName)}</div>
      <div class="row"><button class="btn ghost" data-undo="${f.id}">เปลี่ยนใจ</button></div>`
  } else if (d?.action === 'rejected') {
    body += `<div class="chosen rej">ไม่ใช้วิธีนี้ (${esc(REASON_TH[d.reason] || d.reason)})</div>
      <div class="row"><button class="btn ghost" data-undo="${f.id}">เปลี่ยนใจ</button></div>`
  } else if (m) {
    body += `<div class="propose"><b>วิธีที่แนะนำ</b> ${esc(m.nameTh)}
      ${m.duration ? `· ${m.duration} นาที` : ''} · แทรกที่${esc(m.stage)}
      <div class="muted" style="margin-top:6px">${esc(m.whenToUse)}</div></div>
      <div class="row end">
        <button class="btn ghost" data-rej="${f.id}">ไม่ใช้วิธีนี้</button>
        <button class="btn ghost" data-detail="${f.id}">ดูรายละเอียด</button>
        ${methods.length > 1 ? `<button class="btn secondary" data-alt="${f.id}">ขอแบบอื่น</button>` : ''}
        <button class="btn primary" data-ins="${f.id}" data-m="${m.id}">${ico('check', 18)} นำไปใช้</button>
      </div>
      <div class="hide" data-reasons="${f.id}">
        <div class="muted" style="margin-top:14px">ไม่ใช้เพราะอะไร</div>
        <div class="chips">${Object.entries(REASON_TH).map(([k, v]) =>
          `<label><input type="radio" name="r-${f.id}" value="${k}"><span>${v}</span></label>`).join('')}</div>
        <div class="row"><button class="btn secondary" data-rejok="${f.id}">บันทึกเหตุผล</button></div>
      </div>`
  } else if (f.catalogue) {
    const c = f.catalogue
    body += `<div class="propose"><b>คลังจับคู่กับ</b> ${esc(c.strategy)}
      ${c.variant ? `<span class="muted">${esc(c.variant)}</span>` : ''}
      <div class="muted" style="margin-top:6px">${esc(c.why)}</div></div>
      <div class="notice warn">วิธีนี้อยู่ในคลังตั้งต้น 110 รายการ แต่ยังไม่ได้กรอกขั้นตอน เวลา
        และข้อจำกัด จึงยังแนะนำแบบลงรายละเอียดไม่ได้ ตอนนี้กรอกครบแล้ว 20 รายการ</div>`
  } else {
    body += `<div class="notice warn">ยังไม่มีวิธีสอนในคลังที่ผูกกับเรื่องนี้และใส่ในเวลาที่เหลือได้</div>`
  }

  body += `<div class="devline">${esc(f.id)} | comparator=${esc(f.comparator)} | kind=${esc(f.kind)}
| severity=${esc(f.severity)}${f.miscId ? ` | misc=${esc(f.miscId)}` : ''}${m ? ` | method=${esc(m.id)}` : ''}
| rule: ${esc(f.rule || '')}</div>`

  return `<div class="card finding">${body}</div>`
}

function wireFindings() {
  document.querySelectorAll('[data-detail]').forEach(b => b.onclick = () => {
    state.current = state.result.findings.find(f => f.id === b.dataset.detail)
    renderDetail(); go('s2d')
  })
  document.querySelectorAll('[data-ins]').forEach(b => b.onclick = () => decide(b.dataset.ins, 'inserted', b.dataset.m))
  document.querySelectorAll('[data-alt]').forEach(b => b.onclick = () => {
    const id = b.dataset.alt
    state.altIndex.set(id, (state.altIndex.get(id) || 0) + 1)
    logEvent(id, 'requested_variant')
    renderFindings()
  })
  document.querySelectorAll('[data-rej]').forEach(b => b.onclick = () =>
    document.querySelector(`[data-reasons="${b.dataset.rej}"]`).classList.remove('hide'))
  document.querySelectorAll('[data-rejok]').forEach(b => b.onclick = () => {
    const id = b.dataset.rejok
    const sel = document.querySelector(`input[name="r-${id}"]:checked`)
    if (!sel) return
    decide(id, 'rejected', null, sel.value)
  })
  document.querySelectorAll('[data-undo]').forEach(b => b.onclick = () => {
    state.decisions.delete(b.dataset.undo); renderFindings()
  })
  const sa = $('#showAll')
  if (sa) sa.onclick = () => {
    sa.closest('.row').insertAdjacentHTML('beforebegin',
      state.result.findings.slice(3).map((f, i) => card(f, i + 3)).join(''))
    sa.remove(); wireFindings()
  }
  $('#toPlan').onclick = () => { renderPlan(); go('s3') }
  $('#toPa').onclick = () => { renderPa(); go('s4') }
}

async function decide(findingId, action, methodId, reason) {
  const m = methodId ? state.DB.method.find(x => x.id === methodId) : null
  state.decisions.set(findingId, { action, methodId, methodName: m?.nameTh, reason })
  await logEvent(findingId, action, m, reason)
  renderFindings()
}

async function logEvent(findingId, action, method, reason) {
  const f = state.result?.findings.find(x => x.id === findingId)
  await addEvent({
    planId: state.planId, findingId, comparator: f?.comparator, severity: f?.severity,
    miscId: f?.miscId || null, methodId: method?.id || null, methodName: method?.nameTh || null,
    action, reason: reason || null,
    shownAt: state.shownAt.get(findingId) || Date.now(), actedAt: Date.now(),
  })
}

// ---------------------------------------------------------------- screen 2d

function renderDetail() {
  const f = state.current
  if (!f) return
  const mc = f.miscId ? state.DB.misc.find(m => m.id === f.miscId) : null
  const methods = pickMethods(f, state.plan, state.DB, state.profile)
  const rank = (state.altIndex.get(f.id) || 0) % (methods.length || 1)
  const m = methods[rank]
  const ind = state.DB.curr.find(c => state.plan.currCodes.includes(c.code) && c.downstream?.length)
  const downstream = mc && ind ? ind.downstream.map(dc => state.DB.curr.find(x => x.code === dc)).filter(Boolean) : []

  if (!m) {
    $('#detailBody').innerHTML = `<div class="hero"><h1>${esc(f.title)}</h1></div>
      <div class="notice warn">ยังไม่มีวิธีสอนในคลังที่ลงรายละเอียดสำหรับเรื่องนี้</div>
      <div class="row"><button class="btn ghost" id="dBack">ย้อนกลับ</button></div>`
    $('#dBack').onclick = () => go('s2')
    return
  }

  $('#detailBody').innerHTML = `
    <div class="hero">
      <h1>วิธีที่เหมาะกับปัญหานี้</h1>
      <p>${esc(f.title)}</p>
    </div>

    <div class="card">
      <div class="fhead"><span class="badge rank">${ico('star', 13)} วิธีแนะนำอันดับ ${rank + 1}</span></div>
      <h3 style="font-size:26px">${esc(m.nameTh)}
        <span class="muted" style="font-weight:400">(${esc(m.nameEn)})</span></h3>
      ${m.variant ? `<div class="muted">${esc(m.variant)}</div>` : ''}

      <div class="detail-grid">
        <div>
          <div class="reason"><div class="rico good">${ico('bulb', 20)}</div>
            <div><h4>ทำไมจึงแนะนำ</h4><p>${esc(m.whenToUse)}
            ${mc ? ` ความเข้าใจผิดนี้พบบ่อยระดับ${esc(mc.freq)} และทนต่อการสอนระดับ${esc(mc.persistence)}
              ${mc.persistence === 'สูง' ? 'ซึ่งแปลว่าการอธิบายซ้ำมักไม่พอ ต้องใช้วิธีที่ทำให้ความเชื่อเดิมขัดกับหลักฐาน' : ''}` : ''}</p></div>
          </div>
          <div class="reason"><div class="rico limit">${ico('warn', 20)}</div>
            <div><h4>ข้อจำกัด</h4><p>${esc(m.notSuitable)}</p></div>
          </div>
          ${downstream.length ? `<div class="reason"><div class="rico good">${ico('steps', 20)}</div>
            <div><h4>ส่งผลต่อตัวชี้วัดถัดไป</h4><p>${downstream.map(d =>
              esc(d.code) + ' ' + esc(d.text)).join('<br>')}</p></div></div>` : ''}
        </div>

        <div class="info-panel">
          <b>เหมาะกับ</b>
          <div class="info-row">${ico('book')}
            <div><div class="k">หัวข้อ</div><div class="v">${esc(mc ? mc.name : state.plan.unit || '')}</div></div></div>
          <div class="info-row">${ico('steps')}
            <div><div class="k">ขั้นตอนการสอน</div><div class="v">${esc(m.stage)}</div></div></div>
          <div class="info-row">${ico('clock')}
            <div><div class="k">เวลาที่ใช้</div><div class="v">${m.duration} นาที</div></div></div>
          <div class="info-row">${ico('doc')}
            <div><div class="k">สิ่งที่ต้องเตรียม</div><div class="v">${
              m.materials.length ? esc(m.materials.join(', ')) : 'ไม่ต้องใช้อุปกรณ์'}</div></div></div>
        </div>
      </div>
    </div>

    ${mc ? `<div class="card"><h3>ความเข้าใจผิดคืออะไร</h3>
      <p>${esc(mc.desc)}</p>
      <p class="muted">สิ่งที่ถูกต้องคือ ${esc(mc.correct)}</p>
      ${mc.symptom.length ? `<div class="quote">นักเรียนมักแสดงออกว่า<br>
        ${mc.symptom.map(s => '• ' + esc(s)).join('<br>')}</div>` : ''}</div>` : ''}

    <div class="card"><h3>ขั้นตอนการทำ</h3>
      <ol>${m.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol></div>

    <div class="card"><h3>เส้นทางจากคลังและระดับหลักฐาน</h3>
      <table class="tbl">
        <tr><th>หมวดในคลัง</th><td>${esc(m.category)} / ${esc(m.majorType)}</td></tr>
        <tr><th>แทรกที่</th><td>${esc(m.stage)}</td></tr>
        <tr><th>ระดับหลักฐาน</th><td>${esc(m.evidenceStrength)}</td></tr>
      </table>
      <div class="notice ${m.evidenceStrength === 'ต่ำ' ? 'warn' : 'info'}" style="margin-top:14px">
        ${esc(m.evidenceNote)}<br>
        <span class="tiny">รายการนี้ยังเป็นสถานะ ${esc(m.status)} ยังไม่มีการอ้างอิงงานวิจัยรายรายการ
        และระบบไม่รายงานผลเชิงเหตุและผลกับผลการเรียน</span></div>
      <div class="devline">finding=${esc(f.id)} | rule: ${esc(f.rule || '')}
${mc ? `MISC ${mc.id} freq=${mc.freq} persistence=${mc.persistence} status=${mc.status}` : ''}
METHOD ${m.id} addresses=[${m.addresses.join(',')}] stage=${m.stage} duration=${m.duration}
ตัวเลือกอื่นที่ผูกกับเรื่องนี้: ${methods.map(x => x.id).join(', ') || 'ไม่มี'}</div>
    </div>

    <div class="row end" style="margin-top:20px">
      <button class="btn ghost" id="dBack">ย้อนกลับ</button>
      ${methods.length > 1 ? '<button class="btn secondary" id="dAlt">ขอแบบอื่น</button>' : ''}
      <button class="btn primary" id="dIns">${ico('check', 18)} นำไปใช้</button>
    </div>`

  $('#dIns').onclick = async () => { await decide(f.id, 'inserted', m.id); go('s2') }
  $('#dBack').onclick = () => go('s2')
  const alt = $('#dAlt')
  if (alt) alt.onclick = () => {
    state.altIndex.set(f.id, (state.altIndex.get(f.id) || 0) + 1)
    logEvent(f.id, 'requested_variant')
    renderDetail()
  }
}

// ---------------------------------------------------------------- screen 3

function accepted() {
  return [...state.decisions.entries()]
    .filter(([, d]) => d.action === 'inserted')
    .map(([id, d]) => {
      const f = state.result.findings.find(x => x.id === id)
      const m = state.DB.method.find(x => x.id === d.methodId)
      return { finding: f, method: m, miscId: f?.miscId, methodId: d.methodId }
    })
    .filter(x => x.method)
}

function renderPlan() {
  const p = state.plan, acc = accepted()
  const stages = ['ขั้นนำ', 'ขั้นสอน', 'ขั้นสรุป']
  let html = ''

  if (!acc.length) {
    html += `<div class="notice info">ยังไม่ได้เลือกอะไรเข้าแผน ย้อนกลับไปหน้าก่อนหน้าเพื่อเลือก</div>`
  }

  for (const st of stages) {
    const acts = p.activities.filter(a => a.stage === st)
    const ins = acc.filter(a => a.method.stage === st)
    if (!acts.length && !ins.length) continue
    const mins = acts.reduce((s, a) => s + (a.duration || 0), 0)
    html += `<div class="stage-head">${ico('doc', 22)} ${esc(st)}${mins ? ` · ${mins} นาที` : ''}</div>`
    const oldText = acts.map(a => a.text).join('\n\n').slice(0, 700)
    html += `<div class="diff">
      <div class="diff-old">
        <div class="dh">${ico('history', 16)} แผนการสอนเดิม</div>
        <div class="body">${oldText ? esc(oldText) : '<span class="muted">ยังไม่มีเนื้อหาในขั้นนี้</span>'}</div>
      </div>
      <div>${ins.length ? ins.map(a => `<div class="diff-new">
        <div class="dh">${ico('plus', 16)} ข้อเสนอแนะเพิ่มเติม</div>
        <div class="body">${esc(a.method.nameTh)} (${a.method.duration} นาที)<br>
          ${esc(a.method.steps.join(' จากนั้น '))}</div>
      </div>`).join('') : '<div class="muted" style="padding:18px">ไม่มีการเพิ่มในขั้นนี้</div>'}</div>
    </div>`
  }

  if (p.kind === 'pdf') {
    html += `<div class="notice warn">ไฟล์ต้นฉบับเป็น PDF ระบบจึงรักษารูปแบบเดิมของเอกสารไว้ไม่ได้
      ไฟล์ที่ดาวน์โหลดจะเป็นเอกสารใหม่ที่มีเนื้อหาเดิมพร้อมส่วนที่เพิ่ม
      ถ้าต้องการให้รูปแบบเดิมอยู่ครบ ให้อัปโหลดเป็น .docx</div>`
  } else if (p.kind === 'docx') {
    html += `<div class="notice info">ไฟล์ที่ดาวน์โหลดคือแผนเดิมของคุณ โดยส่วนที่เพิ่มถูกทำเป็น
      track changes ของ Word คุณกดยอมรับหรือปฏิเสธในโปรแกรม Word ได้</div>`
  }

  html += `<div class="row" style="margin-top:28px">
    <button class="btn primary" id="dl" ${acc.length ? '' : 'disabled'}>ดาวน์โหลด .docx</button>
    <button class="btn secondary" id="toPa2">หลักฐาน PA</button>
    <button class="btn ghost" id="back2">ย้อนกลับ</button></div>`

  $('#planBody').innerHTML = html
  $('#back2').onclick = () => go('s2')
  $('#toPa2').onclick = () => { renderPa(); go('s4') }
  const dl = $('#dl')
  if (dl) dl.onclick = download
}

function download() {
  const acc = accepted()
  const insertions = acc.map(a => {
    const anchor = [...state.plan.activities].reverse().find(x => x.stage === a.method.stage)
    const para = anchor && state.doc.paras ? state.doc.paras.find(p => p.i === anchor.line) : null
    return {
      stage: a.method.stage,
      text: `${a.method.nameTh} (${a.method.duration} นาที) ${a.method.steps.join(' จากนั้น ')}`,
      anchorEnd: para?.end ?? (state.doc.paras?.[state.doc.paras.length - 1]?.end ?? 0),
    }
  })
  const blob = buildDocx(state.plan, state.doc, insertions)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = (state.plan.unit || 'แผนการจัดการเรียนรู้').replace(/[\\/:*?"<>|]/g, '') + ' ปรับปรุงแล้ว.docx'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

// ---------------------------------------------------------------- screen 4

function renderPa() {
  const acc = accepted()
  const d = paDraft(state.plan, acc.map(a => ({ miscId: a.miscId, methodId: a.methodId })), state.DB)
  $('#paBody').innerHTML = `
    <div class="notice info"><b>ระบบไม่ได้ทำ ว.PA ให้ครบ</b><br>
      ส่วนที่ได้คือหลักฐานของ <b>ประเมิน PA รายปี ส่วนที่ 2 ประเด็นท้าทาย</b> ข้อ 1 และข้อ 2
      ข้อ 3.1 และ 3.2 ต้องมีผลการวัดจริง ซึ่งยังไม่มีในเฟสนี้
      ทุกข้อความด้านล่างเป็นร่าง คุณต้องอ่านและแก้ให้เป็นภาษาของคุณเอง เพราะกรรมการจะถามจากข้อความนี้</div>
    <h3>ข้อ 1 สภาพปัญหาของผู้เรียนและการจัดการเรียนรู้</h3>
    ${d.problem ? `<div class="card">${esc(d.problem)}</div>`
      : '<div class="notice warn">ยังไม่ได้รับข้อเสนอใด จึงยังไม่มีเนื้อหาส่วนนี้</div>'}
    <h3>ข้อ 2 วิธีการดำเนินการให้บรรลุผล</h3>
    ${d.how ? `<div class="card" style="white-space:pre-wrap">${esc(d.how)}</div>`
      : '<div class="notice warn">ยังไม่ได้รับข้อเสนอใด</div>'}
    <h3>ส่วนที่ระบบทำได้และทำไม่ได้</h3>
    <div class="card"><table class="tbl">
      <tr><th>ส่วนของ ว.PA</th><th>สถานะ</th><th>ที่มา</th></tr>
      ${d.covered.map(([k, ok, why]) =>
        `<tr><td>${esc(k)}</td>
          <td><span class="badge ${ok ? 'ok' : 'bad'}">${ok ? 'ได้' : 'ยังไม่ได้'}</span></td>
          <td class="muted">${esc(why)}</td></tr>`).join('')}
    </table></div>
    <h3>ชุดข้อวัด</h3>
    <div class="notice warn"><b>ยังไม่พร้อมใช้</b><br>
      คลังข้อวัดปัจจุบันมี ${state.DB.item.length} รายการ แต่ละรายการมีตัวลวงเพียงตัวเดียว
      และข้อความคำถามยังไม่สมบูรณ์ ระบบจึงไม่แสดงชุดข้อวัด
      เพราะการสร้างข้อขึ้นเองแบบไม่คงเส้นคงวาจะทำให้เฟส 2 เทียบผลข้ามครั้งไม่ได้</div>
    <div class="row"><button class="btn ghost" id="back3">ย้อนกลับ</button>
      <button class="btn secondary" id="toHist">แผนของฉัน</button></div>`
  $('#back3').onclick = () => go('s3')
  $('#toHist').onclick = async () => { await renderHistory(); go('s5') }
}

// ---------------------------------------------------------------- screen 5

const fmtDate = ts => {
  const d = new Date(ts)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543} ${
    String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function renderHistory() {
  const [plans, events] = await Promise.all([allPlans(), allEvents()])
  const prof = buildProfile(plans, events)
  state.profile = prof
  const ins = events.filter(e => e.action === 'inserted')
  const rej = events.filter(e => e.action === 'rejected')

  // One card per plan, newest first, details behind a toggle.
  const cards = [...plans].sort((a, b) => b.createdAt - a.createdAt).map(pl => {
    const ev = events.filter(e => e.planId === pl.planId)
    const took = ev.filter(e => e.action === 'inserted')
    const left = ev.filter(e => e.action === 'rejected')
    const times = ev.filter(e => e.shownAt && e.actedAt).map(e => (e.actedAt - e.shownAt) / 1000)
    const med = times.length ? times.sort((a, b) => a - b)[Math.floor(times.length / 2)] : null
    const src = pl.source === 'blank_template' ? 'สร้างจากบทเรียน'
      : pl.kind === 'docx' ? 'อัปโหลด .docx' : pl.kind === 'pdf' ? 'อัปโหลด .pdf' : 'เลือกจากหลักสูตร'
    return `<div class="hist-card">
      <div class="hist-top">
        <div class="hmain">
          <b>${esc(pl.unit || pl.fileName || 'แผนไม่มีชื่อ')}</b>
          <div class="hmeta">${esc(pl.subject || '')} ${esc(pl.grade || '')} ·
            ${esc(src)} · ${fmtDate(pl.createdAt)}</div>
        </div>
        <div class="hist-stats">
          <div><div class="n">${took.length}</div><div class="l">นำไปใช้</div></div>
          <div><div class="n">${left.length}</div><div class="l">ไม่ใช้</div></div>
          <div><div class="n">${med != null ? med.toFixed(0) + 's' : '-'}</div><div class="l">ตัดสินใจ</div></div>
        </div>
        <button class="btn ghost" data-hist="${esc(pl.planId)}">ดูรายละเอียด</button>
      </div>
      <div class="hist-more hide" data-histbody="${esc(pl.planId)}">
        <div class="muted" style="margin-bottom:10px">ตัวชี้วัด ${
          (pl.currCodes || []).map(esc).join(', ') || 'ไม่ระบุ'}</div>
        ${ev.length ? `<table class="tbl">
          <tr><th>สิ่งที่ระบบเสนอ</th><th>คุณเลือก</th><th>เหตุผล</th></tr>
          ${ev.map(e => `<tr>
            <td>${esc(e.methodName || e.miscId || e.findingId)}</td>
            <td>${e.action === 'inserted' ? '<span class="badge ok">นำไปใช้</span>'
              : e.action === 'rejected' ? '<span class="badge bad">ไม่ใช้</span>'
              : '<span class="badge medium">ขอแบบอื่น</span>'}</td>
            <td class="muted">${esc(REASON_TH[e.reason] || '')}</td></tr>`).join('')}
        </table>` : '<div class="muted">แผนนี้ยังไม่มีการตัดสินใจที่บันทึกไว้</div>'}
      </div>
    </div>`
  }).join('')

  $('#histBody').innerHTML = `
    <div class="card"><table class="tbl">
      <tr><th>แผนที่เคยตรวจ</th><td>${plans.length}</td></tr>
      <tr><th>ข้อเสนอที่นำไปใช้</th><td>${ins.length}</td></tr>
      <tr><th>ข้อเสนอที่ไม่ใช้</th><td>${rej.length}</td></tr>
      <tr><th>เวลาตัดสินใจ (มัธยฐาน)</th><td>${
        prof.medianDecisionSec != null ? prof.medianDecisionSec.toFixed(1) + ' วินาที' : 'ยังไม่มีข้อมูล'}</td></tr>
      <tr><th>ความยาวคาบที่คุณใช้บ่อย</th><td>${prof.typicalPeriodMinutes} นาที</td></tr>
    </table></div>
    ${prof.uploads < 3 ? `<div class="notice info">ระบบจะเริ่มเทียบแผนใหม่กับแผนเดิมของคุณ
      เมื่อตรวจครบ 3 แผน ตอนนี้ ${prof.uploads} แผน</div>` : ''}
    ${prof.noMaterials ? `<div class="notice info">คุณไม่ใช้วิธีที่ต้องมีอุปกรณ์มาแล้ว
      ${prof.rejectCounts.no_materials} ครั้ง ระบบหยุดเสนอวิธีที่ต้องใช้ห้องปฏิบัติการให้คุณแล้ว</div>` : ''}

    <h3>แผนที่เคยตรวจ</h3>
    ${plans.length ? `<div class="hist-list">${cards}</div>`
      : '<div class="notice info">ยังไม่มีแผนที่ตรวจไว้ กลับไปหน้าแรกเพื่อเริ่ม</div>'}

    ${prof.frequentActivities.length ? `<h3>วิธีที่คุณใช้บ่อย</h3><div class="card">${
      prof.frequentActivities.map(([n, c]) =>
        `<div style="padding:6px 0">${esc(n)} <span class="pill">${c} ครั้ง</span></div>`).join('')}</div>` : ''}
    ${rej.length ? `<h3>เหตุผลที่ไม่ใช้</h3><div class="card">${
      Object.entries(prof.rejectCounts).map(([k, v]) =>
        `<div style="padding:6px 0">${esc(REASON_TH[k] || k)} <span class="pill">${v}</span></div>`).join('')}</div>` : ''}
    <div class="devline">teacher_profile คำนวณจาก PLAN + HIST ไม่มีฟอร์มให้กรอก
${JSON.stringify(prof, null, 1)}</div>
    <div class="row" style="margin-top:24px">
      <button class="btn primary" id="again">ตรวจแผนใหม่</button>
      <button class="btn ghost" id="reset">ลบข้อมูลของฉันทั้งหมด</button></div>`

  document.querySelectorAll('[data-hist]').forEach(b => b.onclick = () => {
    const body = document.querySelector(`[data-histbody="${b.dataset.hist}"]`)
    const open = !body.classList.contains('hide')
    body.classList.toggle('hide', open)
    b.textContent = open ? 'ดูรายละเอียด' : 'ซ่อนรายละเอียด'
  })
  $('#reset').onclick = async () => {
    if (!confirm('ลบแผนและประวัติทั้งหมดในเครื่องนี้ การลบนี้ย้อนกลับไม่ได้')) return
    await clearAll(); await renderHistory(); renderStart()
  }
  $('#again').onclick = () => { state.decisions.clear(); state.altIndex.clear(); go('s0') }
}

// ---------------------------------------------------------------- wiring

$('#toPick').onclick = () => { renderPick(); go('s0b') }
$('#pkBack').onclick = () => go('s0')
$('#pkGo').onclick = runPick
$('#pkGrade').onchange = updateCoverage
$('#pkStd').onchange = updateCoverage
$('#cr1').onclick = () => go('s0')

$('#toBlank').onclick = () => { fillContent('bk'); updateCoverageBk(); go('s0c') }
$('#bkBack').onclick = () => go('s0')
$('#bkGo').onclick = runBlank
$('#bkGrade').onchange = updateCoverageBk
$('#bkStd').onchange = updateCoverageBk
$('#cr2').onclick = () => go('s0')

// A bundled synthetic plan so the upload path can be tried without a real
// file. Every name in it is invented; see tools/make-sample.mjs.
$('#trySample').onclick = async () => {
  try {
    const r = await fetch('sample-plan.docx')
    if (!r.ok) throw new Error('ไม่พบไฟล์ตัวอย่าง')
    const blob = await r.blob()
    await handleFile(new File([blob], 'แผนการสอนตัวอย่าง.docx',
      { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))
  } catch (e) {
    $('#dropmsg').innerHTML = `<b>โหลดไฟล์ตัวอย่างไม่ได้</b><span class="muted">${esc(e.message)}</span>`
  }
}
$('#confirmGo').onclick = confirmPlan
$('#confirmBack').onclick = () => go('s0')
$('#useFallback').onclick = () => {
  const code = $('#fallbackCode').value
  const ind = state.DB.curr.find(c => c.code === code)
  state.doc = { paras: [], kind: 'manual' }
  state.plan = parsePlan({ paras: [], kind: 'manual' })
  state.plan.currCodes = [code]
  state.plan.unit = ind.text.slice(0, 60)
  state.plan.grade = ind.grade
  state.plan.subject = 'วิทยาศาสตร์และเทคโนโลยี'
  state.plan.confidence.currCodes = { level: 'high', damage: 0, manual: true }
  renderConfirm()
  go('s1')
}

$('#navCheck').onclick = () => go('s0')
$('#navPlans').onclick = async () => { await renderHistory(); go('s5') }
$('#navPa').onclick = () => {
  if ($('#navPa').getAttribute('aria-disabled') === 'true') return
  renderPa(); go('s4')
}

wireUpload()
setMode(location.hash === '#tech')
addEventListener('hashchange', () => setMode(location.hash === '#tech'))
boot()

// Expose for console poking during a demo.
window.TR = state
