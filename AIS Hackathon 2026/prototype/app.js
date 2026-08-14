// ตรวจรู้ TruatRoo, user interface.
// Screen flow and rendering only. All logic lives in lib.js.

import {
  loadLibraries, readDocx, readPdf, parsePlan, compare, pickMethods, paDraft,
  buildDocx, savePlan, allPlans, addEvent, allEvents, buildProfile, clearAll,
  miscForStandard, problemFindings,
} from './lib.js'

const $ = s => document.querySelector(s)
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const SCREENS = ['s0', 's0b', 's1', 's2', 's2d', 's3', 's4', 's5']
const state = {
  DB: null, doc: null, plan: null, result: null, profile: null,
  decisions: new Map(),   // findingId -> {action, methodId, methodName, reason}
  current: null,          // finding open in the detail screen
  shownAt: new Map(),
  planId: null,
  altIndex: new Map(),
}

// ---------------------------------------------------------------- navigation

function go(id) {
  SCREENS.forEach(s => $('#' + s).classList.toggle('hide', s !== id))
  state.screen = id
  const dots = SCREENS.filter(s => s !== 's2d')
  $('#steps').innerHTML = dots.map(s =>
    `<div class="sdot ${s === id ? 'on' : (state.seen?.[s] ? 'done' : '')}"></div>`).join('')
  state.seen = state.seen || {}
  state.seen[id] = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Technical view has no on-screen control. Append #tech to the URL to expose
// the table and rule provenance behind every recommendation.
function setMode(dev) {
  document.body.classList.toggle('devmode', dev)
}

// ---------------------------------------------------------------- boot

async function boot() {
  try {
    state.DB = await loadLibraries()
  } catch (e) {
    $('#s0').innerHTML = `<div class="notice bad"><b>โหลดคลังข้อมูลไม่สำเร็จ</b><br>${esc(e.message)}
      <br><br>ไฟล์นี้ต้องเปิดผ่านเว็บเซิร์ฟเวอร์ ไม่ใช่การดับเบิลคลิก
      เพราะเบราว์เซอร์ปิดการอ่านไฟล์ข้างเคียงเมื่อเปิดด้วย file://
      <br>รันในเครื่องด้วย <code>python -m http.server</code> ที่โฟลเดอร์รากของโปรเจกต์
      แล้วเปิด <code>/prototype/</code></div>`
    return
  }
  const [plans, events] = await Promise.all([allPlans(), allEvents()])
  state.profile = buildProfile(plans, events)
  renderStart()
  renderHistory()
  go('s0')
}

// ---------------------------------------------------------------- screen 0

function renderStart() {
  const p = state.profile
  const m = state.DB
  $('#libstat').innerHTML =
    `คลังชุดนี้ครอบ ${m.curr.length} ตัวชี้วัด ความเข้าใจผิด ${m.misc.length} รายการ ` +
    `และวิธีสอนที่ผูกกับความเข้าใจผิดแล้ว ${m.method.length} รายการ`
  $('#uploadcount').textContent = p.uploads
    ? `คุณเคยตรวจแผนมาแล้ว ${p.uploads} ครั้ง` + (p.uploads < 3 ? ` อีก ${3 - p.uploads} ครั้งระบบจะเริ่มเทียบกับแผนเดิมของคุณได้` : '')
    : ''
  const sel = $('#fallbackCode')
  sel.innerHTML = m.curr.map(c => `<option value="${esc(c.code)}">${esc(c.code)} ${esc(c.text.slice(0, 48))}</option>`).join('')
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
  // A demo that sits on "reading" with no elapsed time looks hung even when it
  // is working, so show the clock and cap the wait.
  const tick = setInterval(() => {
    const s = ((performance.now() - t0) / 1000).toFixed(0)
    $('#dropmsg').innerHTML =
      `<b>กำลังอ่าน ${esc(file.name)}</b><span class="muted">${s} วินาที</span>`
  }, 250)
  const stop = () => clearInterval(tick)

  try {
    const buf = await file.arrayBuffer()
    const isDocx = /\.docx$/i.test(file.name)
    const work = isDocx ? readDocx(buf) : readPdf(buf)
    state.doc = await Promise.race([
      work,
      new Promise((_, rej) => setTimeout(() => rej(new Error('ไฟล์นี้ใช้เวลาอ่านนานผิดปกติ')), READ_TIMEOUT_MS)),
    ])
    state.plan = parsePlan(state.doc)
    state.plan.fileName = file.name
    state.plan.readMs = Math.round(performance.now() - t0)
    stop()
    renderConfirm()
    go('s1')
  } catch (e) {
    // FR-L-03: never leave the teacher stuck.
    stop()
    $('#dropmsg').innerHTML = `<b>อ่านไฟล์นี้ไม่ได้</b><span class="muted">${esc(e.message)}</span>`
    $('#fallback').classList.remove('hide')
    $('#fallback').scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

// ---------------------------------------------------------------- screen 0b

function renderPick() {
  const f = state.DB.form
  const g = $('#pkGrade'), s = $('#pkStd')
  if (!g.options.length) {
    g.innerHTML = f.grades.map(x => `<option${x === 'ม.1' ? ' selected' : ''}>${esc(x)}</option>`).join('')
    s.innerHTML = f.standards.map(x =>
      `<option value="${esc(x.code)}"${x.code === 'ว ๑.๒' ? ' selected' : ''}>${esc(x.label)}</option>`).join('')
    $('#pkProblems').innerHTML = state.DB.problem.map(p =>
      `<label data-pb="${esc(p.id)}"><input type="checkbox" value="${esc(p.id)}">
        <span>${esc(p.text)}
        <span class="sub">คลังจับคู่กับ ${esc(p.strategy)}${p.methodId ? '' : ' (ยังไม่มีรายละเอียดในคลังชุดนี้)'}</span>
        </span></label>`).join('')
    $('#pkBloom').innerHTML = f.bloom.map(b =>
      `<label><input type="checkbox" value="${esc(b)}"><span>${esc(b)}</span></label>`).join('')
    $('#pkProblems').addEventListener('change', e => {
      e.target.closest('label')?.classList.toggle('on', e.target.checked)
    })
  }
  updateCoverage()
}

function updateCoverage() {
  const grade = $('#pkGrade').value, std = $('#pkStd').value
  const { codes, misc } = miscForStandard(state.DB, std, grade)
  // FR-L-02: say plainly when the library does not cover this, do not pad.
  $('#pkCoverage').innerHTML = misc.length
    ? `คลังชุดนี้ครอบ ${esc(std)} ${esc(grade)} แล้ว รู้จักความเข้าใจผิด ${misc.length} รายการ
       ในตัวชี้วัด ${codes.map(esc).join(', ')}`
    : `<span style="color:var(--mid)">คลังชุดแรกยังไม่ครอบ ${esc(std)} ${esc(grade)}
       ระบบจะแนะนำวิธีสอนจากปัญหาที่คุณติ๊กได้ แต่ยังบอกไม่ได้ว่าหน่วยนี้เด็กมักติดตรงไหน</span>`
}

async function runPick() {
  const grade = $('#pkGrade').value, std = $('#pkStd').value
  const ids = [...$('#pkProblems').querySelectorAll('input:checked')].map(i => i.value)
  const { codes, misc } = miscForStandard(state.DB, std, grade)
  // Only claim the indicators the library actually has misconceptions for.
  // Listing every indicator in the standard would imply coverage we do not have.
  const mapped = [...new Set(state.DB.map
    .filter(r => misc.some(m => m.id === r.miscId) && codes.includes(r.code))
    .map(r => r.code))]

  state.doc = { paras: [], kind: 'manual' }
  state.plan = parsePlan({ paras: [], kind: 'manual' })
  state.plan.source = 'blank_template'
  state.plan.grade = grade
  state.plan.subject = 'วิทยาศาสตร์และเทคโนโลยี'
  state.plan.currCodes = mapped.length ? mapped : codes
  state.plan.unit = `มาตรฐาน ${std} ${grade}`
  state.plan.planId = state.planId = 'P' + Date.now()
  state.plan.createdAt = Date.now()
  await savePlan({
    planId: state.planId, unit: state.plan.unit, subject: state.plan.subject, grade,
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
    findings: miscFindings.concat(problemFindings(state.DB, ids)),
    unknownCodes: [], knownCodes: codes, budget: 50, allocated: 0,
  }
  state.decisions.clear()
  state.altIndex.clear()
  const [plans, events] = await Promise.all([allPlans(), allEvents()])
  state.profile = buildProfile(plans, events)
  renderFindings()
  go('s2')
}

// ---------------------------------------------------------------- screen 1

const LEVEL_TAG = { high: ['ok', 'อ่านได้ชัด'], medium: ['warn', 'อ่านได้บางส่วน'], low: ['bad', 'อ่านไม่ชัด'], none: ['bad', 'ไม่พบ'] }

function renderConfirm() {
  const p = state.plan, c = p.confidence
  const row = (key, label, value) => {
    const lv = c[key]?.level || 'none'
    const [cls, txt] = LEVEL_TAG[lv]
    return `<div class="fld"><div class="fk">${label}</div>
      <div>${value ? esc(String(value).slice(0, 260)) : '<span class="muted">ไม่พบในไฟล์</span>'}</div>
      <span class="tag ${cls}">${txt}</span></div>`
  }
  // FR-B-02: low confidence first, because that is what needs a human.
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
      โครงสร้างและรหัสตัวชี้วัดยังอ่านได้ ระบบจึงยังทำงานต่อได้ แต่ช่องที่ขึ้นว่าอ่านไม่ชัด ให้ตรวจก่อนกดยืนยัน</div>`
  }
  if (!p.currCodes.length) {
    banner += `<div class="notice bad"><b>ไม่พบรหัสตัวชี้วัดในไฟล์</b><br>
      รหัสตัวชี้วัดคือสิ่งที่ทุกอย่างต่อจากนี้แขวนอยู่ ระบบจะไม่เดาให้ กรุณาเลือกด้านล่าง</div>
      <div class="card"><div class="fk">เลือกตัวชี้วัดของหน่วยนี้</div>
      <div class="row" style="margin-top:8px">
        <select id="pickCode">${state.DB.curr.map(x => `<option value="${esc(x.code)}">${esc(x.code)} ${esc(x.text.slice(0, 44))}</option>`).join('')}</select>
        <button class="btn" id="addCode">เพิ่ม</button></div></div>`
  }

  $('#confirmBody').innerHTML = banner + `<div class="card">${fields.map(f => row(...f)).join('')}</div>
    <div class="devline">source=${p.kind} | readMs=${p.readMs} | overallDamage=${p.overallDamage.toFixed(3)}
| activities=${p.activities.length} | confidence=${JSON.stringify(Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v.level])))}</div>`

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

function renderFindings() {
  const r = state.result, p = state.plan
  const shown = r.findings.slice(0, 3)
  const rest = r.findings.length - shown.length

  let head = `<div class="card"><b>${esc(p.unit || p.fileName || 'แผนของคุณ')}</b>
    <div class="muted">${esc(p.subject || '')} ${esc(p.grade || '')} ${p.periods ? `${p.periods} คาบ คาบละ ${p.minutesPerPeriod} นาที` : ''}</div>
    <div class="muted">ผูกกับ ${p.currCodes.map(esc).join(', ') || 'ยังไม่ระบุ'}</div></div>`

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

  $('#findings').innerHTML = head + shown.map(f => card(f)).join('') +
    (rest > 0 ? `<button class="btn ghost" id="showAll">ดูทั้งหมดอีก ${rest} รายการ</button>` : '') +
    `<div class="row" style="margin-top:20px">
      <button class="btn primary" id="toPlan">ดูแผนที่เติมแล้ว</button>
      <button class="btn" id="toPa">เอกสาร ว.PA</button></div>`

  shown.forEach(f => { if (!state.shownAt.has(f.id)) state.shownAt.set(f.id, Date.now()) })
  wireFindings()
}

function card(f) {
  const d = state.decisions.get(f.id)
  const mc = f.miscId ? state.DB.misc.find(m => m.id === f.miscId) : null
  const methods = pickMethods(f, state.plan, state.DB, state.profile)
  const idx = state.altIndex.get(f.id) || 0
  const m = methods[idx % (methods.length || 1)]

  let body = `<div class="sev ${f.severity}">${SEV_TH[f.severity] || ''}</div>
    <h3>${esc(f.title)}</h3>`
  if (f.kind === 'reinforce' && f.evidence) {
    body += `<div class="muted">ข้อความในแผนที่ตรงกับความเข้าใจผิดนี้</div>
      <div class="quote">${esc(f.evidence)}</div>
      <div class="muted">นักเรียนที่อ่านข้อความนี้ มักสรุปต่อเองว่า ${esc(mc?.distractor || '')}</div>`
  } else if (f.body) {
    body += `<div class="muted">${esc(f.body)}</div>`
  }

  if (d?.action === 'inserted') {
    body += `<div class="chosen ins">เลือกแล้ว ${esc(d.methodName)}</div>
      <div class="row"><button class="btn ghost" data-undo="${f.id}">เปลี่ยนใจ</button></div>`
  } else if (d?.action === 'rejected') {
    body += `<div class="chosen rej">ไม่เอา (${esc(REASON_TH[d.reason] || d.reason)})</div>
      <div class="row"><button class="btn ghost" data-undo="${f.id}">เปลี่ยนใจ</button></div>`
  } else if (m) {
    body += `<div class="propose"><b>เสนอ</b> ${esc(m.nameTh)} ${m.duration ? `${m.duration} นาที` : ''}
      ที่${esc(m.stage)}<br><span class="muted">${esc(m.whenToUse)}</span></div>
      <div class="row">
        <button class="btn" data-detail="${f.id}">ดูรายละเอียด</button>
        <button class="btn primary" data-ins="${f.id}" data-m="${m.id}">แทรก</button>
        ${methods.length > 1 ? `<button class="btn" data-alt="${f.id}">ขอแบบอื่น</button>` : ''}
        <button class="btn ghost" data-rej="${f.id}">ไม่เอา</button>
      </div>
      <div class="reasons hide" data-reasons="${f.id}">
        <div class="muted">ไม่เอาเพราะอะไร</div>
        ${Object.entries(REASON_TH).map(([k, v]) =>
          `<label><input type="radio" name="r-${f.id}" value="${k}">${v}</label>`).join('')}
        <div><button class="btn" data-rejok="${f.id}">บันทึก</button></div>
      </div>`
  } else if (f.catalogue) {
    // The catalogue names a strategy but the bound library has no detail for
    // it yet. Say exactly that instead of inventing steps.
    const c = f.catalogue
    body += `<div class="propose"><b>คลังจับคู่กับ</b> ${esc(c.strategy)}
      ${c.variant ? `<span class="muted">${esc(c.variant)}</span>` : ''}
      <br><span class="muted">${esc(c.why)}</span></div>
      <div class="notice warn">วิธีนี้อยู่ในคลังตั้งต้น 110 รายการ แต่ยังไม่ได้กรอกขั้นตอน เวลา
        และข้อจำกัด จึงยังแนะนำแบบลงรายละเอียดไม่ได้ ตอนนี้กรอกครบแล้ว 20 รายการ</div>`
  } else {
    body += `<div class="notice warn">ยังไม่มีวิธีสอนในคลังที่ผูกกับเรื่องนี้และใส่ในเวลาที่เหลือได้</div>`
  }

  body += `<div class="devline">${esc(f.id)} | comparator=${esc(f.comparator)} | kind=${esc(f.kind)}
| severity=${esc(f.severity)}${f.miscId ? ` | misc=${esc(f.miscId)}` : ''}${m ? ` | method=${esc(m.id)}` : ''}
| rule: ${esc(f.rule || '')}</div>`

  return `<div class="card finding ${f.severity}">${body}</div>`
}

const REASON_TH = {
  no_time: 'เวลาไม่พอ', no_materials: 'ไม่มีอุปกรณ์',
  not_suitable: 'ไม่เหมาะกับห้องนี้', disagree: 'ไม่เห็นด้วยกับวิธีนี้', other: 'อื่นๆ',
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
  document.querySelectorAll('[data-rej]').forEach(b => b.onclick = () => {
    document.querySelector(`[data-reasons="${b.dataset.rej}"]`).classList.remove('hide')
  })
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
    $('#findings').insertAdjacentHTML('beforeend', state.result.findings.slice(3).map(card).join(''))
    sa.remove(); wireFindings()
  }
  $('#toPlan').onclick = () => { renderPlan(); go('s3') }
  $('#toPa').onclick = () => { renderPa(); go('s4') }
}

async function decide(findingId, action, methodId, reason) {
  const f = state.result.findings.find(x => x.id === findingId)
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
  const m = methods[(state.altIndex.get(f.id) || 0) % (methods.length || 1)]
  const ind = state.DB.curr.find(c => state.plan.currCodes.includes(c.code) && c.downstream?.length)
  const downstream = mc && ind ? ind.downstream.map(dc => state.DB.curr.find(x => x.code === dc)).filter(Boolean) : []

  const sec = (h, b) => b ? `<h3>${h}</h3>${b}` : ''
  $('#detailBody').innerHTML = `<h2>${esc(f.title)}</h2>
    <div class="lead">ที่มาของคำแนะนำนี้</div>
    ${sec('ความเข้าใจผิดคืออะไร', mc ? `<div>${esc(mc.desc)}</div>
      <div class="muted">สิ่งที่ถูกต้องคือ ${esc(mc.correct)}</div>
      ${mc.symptom.length ? `<div class="quote">นักเรียนมักแสดงออกว่า<br>${mc.symptom.map(s => '• ' + esc(s)).join('<br>')}</div>` : ''}` : '')}
    ${sec('ทำไมสำคัญ', mc ? `<div>พบบ่อยระดับ <b>${esc(mc.freq)}</b> และทนต่อการสอนระดับ <b>${esc(mc.persistence)}</b>
      ${mc.persistence === 'สูง' ? 'ซึ่งแปลว่าการอธิบายซ้ำมักไม่พอ ต้องใช้วิธีที่ทำให้ความเชื่อเดิมขัดกับหลักฐาน' : ''}</div>
      ${downstream.length ? `<div class="muted">ส่งผลต่อตัวชี้วัดถัดไป ${downstream.map(d => esc(d.code) + ' ' + esc(d.text)).join(' | ')}</div>` : ''}` : '')}
    ${sec('วิธีที่เสนอ', m ? `<div><b>${esc(m.nameTh)}</b> ${m.nameEn ? `<span class="muted">${esc(m.nameEn)}</span>` : ''}
      ${m.variant ? `<div class="muted">${esc(m.variant)}</div>` : ''}
      <ol>${m.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="muted">ใช้เวลา ${m.duration} นาที ${m.materials.length ? 'ต้องมี ' + m.materials.map(esc).join(', ') : 'ไม่ต้องใช้อุปกรณ์'}</div></div>` : '')}
    ${sec('เส้นทางจากคลัง', m ? `<table class="tbl">
      <tr><th>หมวด</th><td>${esc(m.category)} / ${esc(m.majorType)}</td></tr>
      <tr><th>เลือกเพราะ</th><td>${esc(m.whenToUse)}</td></tr>
      <tr><th>แทรกที่</th><td>${esc(m.stage)}</td></tr></table>` : '')}
    ${sec('ระดับหลักฐานและข้อจำกัด', m ? `<div class="notice ${m.evidenceStrength === 'ต่ำ' ? 'warn' : 'info'}">
      <b>ระดับหลักฐาน ${esc(m.evidenceStrength)}</b><br>${esc(m.evidenceNote)}<br>
      <b>ไม่ควรใช้เมื่อ</b> ${esc(m.notSuitable)}<br>
      <span class="muted">รายการนี้ยังเป็นสถานะ ${esc(m.status)} ยังไม่มีการอ้างอิงงานวิจัยรายรายการ
      และระบบไม่รายงานผลเชิงเหตุและผลกับผลการเรียน</span></div>` : '')}
    ${sec('จะแทรกตรงไหน', m ? `<div>${esc(m.stage)} ของแผนนี้</div>` : '')}
    <div class="devline">finding=${esc(f.id)} | rule: ${esc(f.rule || '')}
${mc ? `MISC ${mc.id} freq=${mc.freq} persistence=${mc.persistence} status=${mc.status}` : ''}
${m ? `METHOD ${m.id} addresses=[${m.addresses.join(',')}] stage=${m.stage} duration=${m.duration}` : ''}
ตัวเลือกอื่นที่ผูกกับความเข้าใจผิดนี้: ${methods.map(x => x.id).join(', ') || 'ไม่มี'}</div>
    <div class="row" style="margin-top:16px">
      <button class="btn primary" id="dIns">แทรก</button>
      <button class="btn ghost" id="dBack">กลับ</button></div>`

  $('#dIns').onclick = async () => { await decide(f.id, 'inserted', m?.id); go('s2') }
  $('#dBack').onclick = () => go('s2')
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
  const byStage = s => acc.filter(a => a.method.stage === s)
  const stages = ['ขั้นนำ', 'ขั้นสอน', 'ขั้นสรุป']

  let html = `<div class="card"><b>${esc(p.unit || 'แผนของคุณ')}</b>
    <div class="muted">แสดงเฉพาะสิ่งที่เพิ่มเข้าไป ส่วนที่เหลือคือแผนเดิมของคุณ ไม่ได้เขียนใหม่</div></div>`

  if (!acc.length) {
    html += `<div class="notice info">ยังไม่ได้เลือกอะไรเข้าแผน กลับไปหน้าก่อนหน้าเพื่อเลือก</div>`
  }

  html += '<div class="card plan">'
  for (const st of stages) {
    const acts = p.activities.filter(a => a.stage === st)
    const ins = byStage(st)
    if (!acts.length && !ins.length) continue
    html += `<div class="stage">${esc(st)}</div>`
    acts.forEach(a => {
      html += `<div class="orig">${esc(a.label)}${a.duration ? ` (${a.duration} นาที)` : ''}<br>
        <span class="muted">${esc(a.text.slice(0, 400))}</span></div>`
    })
    ins.forEach(a => {
      html += `<div class="ins"><b>เพิ่ม</b> ${esc(a.method.nameTh)} ${a.method.duration} นาที<br>
        ${esc(a.method.steps.join(' จากนั้น '))}</div>`
    })
  }
  html += '</div>'

  if (p.kind === 'pdf') {
    html += `<div class="notice warn">ไฟล์ต้นฉบับเป็น PDF ระบบจึงรักษารูปแบบเดิมของเอกสารไว้ไม่ได้
      ไฟล์ที่ดาวน์โหลดจะเป็นเอกสารใหม่ที่มีเนื้อหาเดิมพร้อมส่วนที่เพิ่ม
      ถ้าต้องการให้รูปแบบเดิมอยู่ครบ ให้อัปโหลดเป็น .docx</div>`
  } else {
    html += `<div class="notice info">ไฟล์ที่ดาวน์โหลดเป็นแผนเดิมของคุณ โดยส่วนที่เพิ่มถูกทำเป็น
      track changes ของ Word คุณกดยอมรับหรือปฏิเสธในโปรแกรม Word ได้</div>`
  }

  html += `<div class="row"><button class="btn primary" id="dl" ${acc.length ? '' : 'disabled'}>ดาวน์โหลด .docx</button>
    <button class="btn" id="toPa2">เอกสาร ว.PA</button>
    <button class="btn ghost" id="back2">กลับ</button></div>`

  $('#planBody').innerHTML = html
  $('#back2').onclick = () => go('s2')
  $('#toPa2').onclick = () => { renderPa(); go('s4') }
  const dl = $('#dl')
  if (dl) dl.onclick = () => download()
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
  a.download = (state.plan.unit || 'แผนการจัดการเรียนรู้').replace(/[\\/:*?"<>|]/g, '') + ' ปรับแล้ว.docx'
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
    ${d.problem ? `<div class="card">${esc(d.problem)}</div>` : '<div class="notice warn">ยังไม่ได้รับข้อเสนอใด จึงยังไม่มีเนื้อหาส่วนนี้</div>'}
    <h3>ข้อ 2 วิธีการดำเนินการให้บรรลุผล</h3>
    ${d.how ? `<div class="card" style="white-space:pre-wrap">${esc(d.how)}</div>` : '<div class="notice warn">ยังไม่ได้รับข้อเสนอใด</div>'}
    <h3>ส่วนที่ระบบทำได้และทำไม่ได้</h3>
    <table class="tbl"><tr><th>ส่วนของ ว.PA</th><th>สถานะ</th><th>ที่มา</th></tr>
    ${d.covered.map(([k, ok, why]) =>
      `<tr><td>${esc(k)}</td><td>${ok ? '<span class="tag ok">ได้</span>' : '<span class="tag bad">ยังไม่ได้</span>'}</td>
      <td class="muted">${esc(why)}</td></tr>`).join('')}</table>
    <h3>ชุดข้อวัด</h3>
    <div class="notice warn"><b>ยังไม่พร้อมใช้</b><br>
      คลังข้อวัดปัจจุบันมี ${state.DB.item.length} รายการ แต่ละรายการมีตัวลวงเพียงตัวเดียวและข้อความคำถามยังไม่สมบูรณ์
      ระบบจึงไม่แสดงชุดข้อวัด เพราะการสร้างข้อขึ้นเองแบบไม่คงเส้นคงวาจะทำให้เฟส 2 เทียบผลข้ามครั้งไม่ได้</div>
    <div class="row"><button class="btn ghost" id="back3">กลับ</button>
      <button class="btn" id="toHist">สิ่งที่คุณเคยเลือกไว้</button></div>`
  $('#back3').onclick = () => go('s3')
  $('#toHist').onclick = async () => { await renderHistory(); go('s5') }
}

// ---------------------------------------------------------------- screen 5

async function renderHistory() {
  const [plans, events] = await Promise.all([allPlans(), allEvents()])
  const prof = buildProfile(plans, events)
  state.profile = prof
  const ins = events.filter(e => e.action === 'inserted')
  const rej = events.filter(e => e.action === 'rejected')

  $('#histBody').innerHTML = `
    <div class="card"><table class="tbl">
      <tr><th>แผนที่เคยตรวจ</th><td>${plans.length}</td></tr>
      <tr><th>ข้อเสนอที่รับ</th><td>${ins.length}</td></tr>
      <tr><th>ข้อเสนอที่ปฏิเสธ</th><td>${rej.length}</td></tr>
      <tr><th>เวลาตัดสินใจ (มัธยฐาน)</th><td>${prof.medianDecisionSec != null ? prof.medianDecisionSec.toFixed(1) + ' วินาที' : 'ยังไม่มีข้อมูล'}</td></tr>
      <tr><th>ความยาวคาบที่คุณใช้บ่อย</th><td>${prof.typicalPeriodMinutes} นาที</td></tr>
    </table></div>
    ${prof.uploads < 3 ? `<div class="notice info">ระบบจะเริ่มเทียบแผนใหม่กับแผนเดิมของคุณ เมื่อตรวจครบ 3 แผน
      ตอนนี้ ${prof.uploads} แผน</div>` : ''}
    ${prof.noMaterials ? `<div class="notice info">คุณปฏิเสธเพราะไม่มีอุปกรณ์มาแล้ว ${prof.rejectCounts.no_materials} ครั้ง
      ระบบหยุดเสนอวิธีที่ต้องใช้ห้องปฏิบัติการให้คุณแล้ว</div>` : ''}
    ${prof.frequentActivities.length ? `<h3>วิธีที่คุณใช้บ่อย</h3><div class="card">${
      prof.frequentActivities.map(([n, c]) => `<div>${esc(n)} <span class="pill">${c} ครั้ง</span></div>`).join('')}</div>` : ''}
    ${rej.length ? `<h3>เหตุผลที่ปฏิเสธ</h3><div class="card">${
      Object.entries(prof.rejectCounts).map(([k, v]) => `<div>${esc(REASON_TH[k] || k)} <span class="pill">${v}</span></div>`).join('')}</div>` : ''}
    <div class="devline">teacher_profile คำนวณจาก PLAN + HIST ไม่มีฟอร์มให้กรอก
${JSON.stringify(prof, null, 1)}</div>
    <div class="row"><button class="btn ghost" id="reset">ลบข้อมูลของฉันทั้งหมด</button>
      <button class="btn" id="again">ตรวจแผนใหม่</button></div>`

  $('#reset').onclick = async () => {
    if (!confirm('ลบแผนและประวัติทั้งหมดในเครื่องนี้')) return
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
$('#openHist').onclick = async () => { await renderHistory(); go('s5') }

wireUpload()
setMode(location.hash === '#tech')
addEventListener('hashchange', () => setMode(location.hash === '#tech'))
boot()

// Expose for console poking during a demo.
window.TR = state
