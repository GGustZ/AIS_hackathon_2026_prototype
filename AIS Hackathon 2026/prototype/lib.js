// ตรวจรู้ TruatRoo, engine.
// Pure logic: no DOM. Everything here is testable in isolation.
//
// Browser-native only. No bundler, no dependencies, no CDN. Unzip and inflate
// come from DecompressionStream, which every current browser ships.

// ===========================================================================
// CSV
// ===========================================================================

// keepBlank matters for FORM_frontend_options.csv, where empty rows are the
// block separators and dropping them merges every section into one list.
export function parseCSV(text, keepBlank = false) {
  text = text.replace(/^﻿/, '')
  const rows = []
  let row = [], field = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else q = false }
      else field += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return keepBlank ? rows : rows.filter(r => r.some(c => c.trim()))
}

function toObjects(text) {
  const rows = parseCSV(text)
  if (!rows.length) return []
  const head = rows[0].map(h => h.trim())
  return rows.slice(1).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])))
}

const list = (v, sep = ';') => (v || '').split(sep).map(s => s.trim()).filter(Boolean)
const bool = v => String(v).toUpperCase() === 'TRUE'

// The CSVs in data/ are the source of truth and are fetched at runtime.
// Nothing is copied into this file; changing a CSV changes the product.
export async function loadLibraries(base = '../data/') {
  const get = async f => {
    const r = await fetch(base + f)
    if (!r.ok) throw new Error(`โหลด ${f} ไม่ได้ (${r.status})`)
    return toObjects(await r.text())
  }
  const [c, m, mp, me, it, pb, form] = await Promise.all([
    get('DB1_curriculum_slice.csv'),
    get('DB2_misconceptions_draft.csv'),
    get('DB3_indicator_map_draft.csv'),
    get('DB4_methods_bound_draft.csv'),
    get('DB6_assessment_items_draft.csv'),
    get('FORM_problem_method_map.csv'),
    fetch(base + 'FORM_frontend_options.csv').then(r => r.text()),
  ])
  return {
    curr: c.map(r => ({
      code: r.curr_code, strand: r.strand, standard: r.standard, standardText: r.standard_text,
      grade: r.grade, seq: +r.seq, text: r.indicator_text, core: list(r.core_content, '|'),
      prereq: list(r.prereq_codes), downstream: list(r.downstream_codes),
      version: r.curriculum_version, page: r.source_page,
    })),
    misc: m.map(r => ({
      id: r.misc_id, name: r.name_th, freq: r.frequency, persistence: r.persistence,
      desc: r.description_th, correct: r.correct_concept, symptom: list(r.symptom, '|'),
      distractor: r.distractor, strategyRef: r.strategy_ref, evidence: r.evidence_level, status: r.status,
    })),
    map: mp.map(r => ({ miscId: r.misc_id, code: r.curr_code, version: r.curriculum_version, relevance: r.relevance })),
    method: me.map(r => ({
      id: r.method_id, category: r.db_category, majorType: r.major_type, nameEn: r.name_en,
      nameTh: r.name_th, variant: r.variant, steps: list(r.steps), duration: +r.duration_min || 0,
      materials: list(r.materials), requiresLab: bool(r.requires_lab), requiresNet: bool(r.requires_internet),
      classMin: +r.class_size_min || 0, classMax: +r.class_size_max || 999,
      gradeBand: r.grade_band, stage: r.plan_stage, addresses: list(r.addresses_misc),
      whenToUse: r.when_to_use, notSuitable: r.not_suitable_when,
      compatible: list(r.compatible_with), incompatible: list(r.incompatible_with),
      evidenceStrength: r.evidence_strength, evidenceNote: r.evidence_note, status: r.status,
    })),
    item: it.map(r => ({
      id: r.item_id, code: r.curr_code, stemHint: r.stem_hint, correct: r.option_correct,
      distractor: r.option_distractor, miscId: r.distractor_misc_id,
      dok: +r.dok_level || null, pisa: r.pisa_skill, threshold: +r.pass_threshold || null,
    })),
    problem: pb.map(r => ({
      id: r.problem_id, text: r.problem_text, majorType: r.major_type,
      strategy: r.strategy_en, variant: r.variant,
      bloomMain: r.bloom_main, bloomSub: r.bloom_sub, why: r.why_match,
      methodId: r.method_id || null,
    })),
    form: parseFormOptions(form),
  }
}

// FORM_frontend_options.csv is a spreadsheet export: blank rows separate the
// blocks, and the first row of each block is its title. Parsed rather than
// retyped, so the option lists stay owned by the CSV.
export function parseFormOptions(text) {
  const rows = parseCSV(text.replace(/^﻿/, ''), true)
  const blocks = []
  let cur = null
  for (const raw of rows) {
    const a = (raw[0] || '').trim(), b = (raw[1] || '').trim()
    if (!a && !b) { cur = null; continue }
    if (!cur) { cur = { title: a, items: [], pairs: [] }; blocks.push(cur); continue }
    if (a) cur.items.push(a)
    if (b) cur.pairs.push([a || cur.pairs.at(-1)?.[0] || '', b])
  }
  const byTitle = t => blocks.filter(x => x.title.includes(t))
  const grades = byTitle('ระดับชั้นเรียน')[0]?.items || []
  // The standards block is the one that fills the second column.
  const stdBlock = blocks.find(x => x.pairs.length)
  const standards = (stdBlock?.pairs || []).map(([strand, std]) => ({
    strand: strand.replace(/\s+มาตรฐาน.*$/, '').trim(),
    label: std.trim(),
    code: std.replace('มาตรฐาน', '').trim(),
  }))
  const bloom = byTitle('Bloom')[0]?.items || []
  return { grades, standards, bloom }
}

// Thai digits are how the curriculum writes standard numbers; the indicator
// codes in DB1 use Arabic digits.
const TH_D = '๐๑๒๓๔๕๖๗๘๙'
export const arabize = s => String(s || '').replace(/[๐-๙]/g, d => String(TH_D.indexOf(d)))

// ===========================================================================
// ZIP  (read and write, stored + deflate)
// ===========================================================================

const u8 = b => new Uint8Array(b)
const dv = b => new DataView(b.buffer, b.byteOffset, b.byteLength)

async function inflateRaw(bytes) {
  const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return u8(await new Response(s).arrayBuffer())
}
async function inflateZlib(bytes) {
  const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))
  return u8(await new Response(s).arrayBuffer())
}

// Returns Map(name -> Uint8Array) preserving entry order.
export async function unzip(buf) {
  const b = u8(buf), d = dv(b)
  let eocd = -1
  for (let i = b.length - 22; i >= 0 && i > b.length - 66000; i--) {
    if (d.getUint32(i, true) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('ไม่ใช่ไฟล์ zip ที่อ่านได้')
  const count = d.getUint16(eocd + 10, true)
  let p = d.getUint32(eocd + 16, true)
  const out = new Map()
  for (let i = 0; i < count; i++) {
    if (d.getUint32(p, true) !== 0x02014b50) break
    const method = d.getUint16(p + 10, true)
    const csize = d.getUint32(p + 20, true)
    const nlen = d.getUint16(p + 28, true)
    const mlen = d.getUint16(p + 30, true)
    const klen = d.getUint16(p + 32, true)
    const lho = d.getUint32(p + 42, true)
    const name = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nlen))
    const ln = d.getUint16(lho + 26, true), le = d.getUint16(lho + 28, true)
    const start = lho + 30 + ln + le
    const raw = b.subarray(start, start + csize)
    out.set(name, method === 8 ? await inflateRaw(raw) : raw)
    p += 46 + nlen + mlen + klen
  }
  return out
}

const CRC_T = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_T[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

// Stored-mode writer. Word opens uncompressed .docx without complaint, and
// skipping compression removes the only remaining reason to need a library.
export function zip(entries) {
  const enc = new TextEncoder()
  const chunks = [], central = []
  let offset = 0
  for (const [name, data] of entries) {
    const nb = enc.encode(name), crc = crc32(data), n = data.length
    const lh = new Uint8Array(30 + nb.length), ld = dv(lh)
    ld.setUint32(0, 0x04034b50, true); ld.setUint16(4, 20, true)
    ld.setUint32(14, crc, true); ld.setUint32(18, n, true); ld.setUint32(22, n, true)
    ld.setUint16(26, nb.length, true)
    lh.set(nb, 30)
    chunks.push(lh, data)
    const ch = new Uint8Array(46 + nb.length), cd = dv(ch)
    cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true)
    cd.setUint32(16, crc, true); cd.setUint32(20, n, true); cd.setUint32(24, n, true)
    cd.setUint16(28, nb.length, true); cd.setUint32(42, offset, true)
    ch.set(nb, 46)
    central.push(ch)
    offset += lh.length + n
  }
  const cs = central.reduce((a, c) => a + c.length, 0)
  const eo = new Uint8Array(22), ed = dv(eo)
  ed.setUint32(0, 0x06054b50, true)
  ed.setUint16(8, central.length, true); ed.setUint16(10, central.length, true)
  ed.setUint32(12, cs, true); ed.setUint32(16, offset, true)
  return new Blob([...chunks, ...central, eo], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}

// ===========================================================================
// DOCX read
// ===========================================================================

const xmlText = x => x.replace(/<w:tab\/>/g, ' ').replace(/<[^>]+>/g, '')
const unesc = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, '&')

export async function readDocx(buf) {
  const files = await unzip(buf)
  const doc = files.get('word/document.xml')
  if (!doc) throw new Error('ไม่พบ word/document.xml ในไฟล์นี้')
  const xml = new TextDecoder().decode(doc)
  const paras = []
  const re = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g
  let m, idx = 0
  while ((m = re.exec(xml))) {
    const text = unesc(xmlText(m[1])).replace(/\s+/g, ' ').trim()
    paras.push({ text, start: m.index, end: m.index + m[0].length, i: idx++ })
  }
  return { paras, xml, files, kind: 'docx' }
}

// ===========================================================================
// PDF read  (ToUnicode CMap decoding; twin of tools/pdftext.mjs)
// ===========================================================================

const latin1 = bytes => {
  let s = ''
  const CH = 8192
  for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode(...bytes.subarray(i, i + CH))
  return s
}
const hexToStr = h => {
  let o = ''
  for (let i = 0; i + 4 <= h.length; i += 4) o += String.fromCharCode(parseInt(h.slice(i, i + 4), 16))
  return o
}

function parseCMap(text) {
  const map = new Map()
  let codeBytes = 2, m
  const csr = /begincodespacerange([\s\S]*?)endcodespacerange/g
  while ((m = csr.exec(text))) {
    const f = m[1].match(/<([0-9A-Fa-f]+)>/)
    if (f) codeBytes = Math.max(1, Math.round(f[1].length / 2))
  }
  const bfc = /beginbfchar([\s\S]*?)endbfchar/g
  while ((m = bfc.exec(text))) {
    for (const p of m[1].match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) || []) {
      const g = p.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/)
      map.set(parseInt(g[1], 16), hexToStr(g[2]))
    }
  }
  const bfr = /beginbfrange([\s\S]*?)endbfrange/g
  while ((m = bfr.exec(text))) {
    const body = m[1]
    const arr = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([\s\S]*?)\]/g
    let a
    while ((a = arr.exec(body))) {
      const lo = parseInt(a[1], 16)
      ;(a[3].match(/<([0-9A-Fa-f]+)>/g) || []).forEach((it, i) => map.set(lo + i, hexToStr(it.slice(1, -1))))
    }
    const seq = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g
    let s
    while ((s = seq.exec(body))) {
      const lo = parseInt(s[1], 16), hi = parseInt(s[2], 16), dst = s[3]
      if (hi - lo > 65535) continue
      const base = parseInt(dst.slice(-4), 16)
      const pre = dst.length > 4 ? hexToStr(dst.slice(0, -4)) : ''
      for (let c = lo; c <= hi; c++) map.set(c, pre + String.fromCharCode(base + (c - lo)))
    }
  }
  return { codeBytes, map }
}

export async function readPdf(buf) {
  const b = u8(buf), raw = latin1(b)
  const objs = new Map()
  const re = /(\d+)\s+(\d+)\s+obj\b/g
  let m
  while ((m = re.exec(raw))) {
    const num = +m[1], start = m.index + m[0].length
    const end = raw.indexOf('endobj', start)
    if (end < 0) continue
    const body = raw.slice(start, end)
    const si = body.indexOf('stream')
    let dict = body, stream = null
    if (si > -1) {
      dict = body.slice(0, si)
      let s = start + si + 6
      if (b[s] === 13) s++
      if (b[s] === 10) s++
      const e = raw.indexOf('endstream', s)
      if (e > -1) stream = b.subarray(s, e)
    }
    objs.set(num, { dict, stream })
  }
  const decode = async o => {
    if (!o || !o.stream) return null
    if (!/\/FlateDecode/.test(o.dict)) return o.stream
    // PDF writers pad the gap before "endstream" with EOL bytes. Node's zlib
    // ignores the trailing garbage; DecompressionStream refuses the whole
    // stream over it. Trim before inflating or every page comes back empty.
    let s = o.stream
    while (s.length && (s[s.length - 1] === 10 || s[s.length - 1] === 13 || s[s.length - 1] === 32)) {
      s = s.subarray(0, s.length - 1)
    }
    try { return await inflateZlib(s) } catch { /* fall through */ }
    try { return await inflateRaw(s) } catch { return null }
  }
  const cmaps = new Map()
  for (const [num, o] of objs) {
    const tu = o.dict.match(/\/ToUnicode\s+(\d+)\s+\d+\s+R/)
    if (!tu) continue
    const d = await decode(objs.get(+tu[1]))
    if (d) cmaps.set(num, parseCMap(latin1(d)))
  }
  const resFonts = dict => {
    const out = new Map()
    let res = dict
    const r = dict.match(/\/Resources\s+(\d+)\s+\d+\s+R/)
    if (r) res = objs.get(+r[1])?.dict || dict
    const fi = res.indexOf('/Font')
    if (fi < 0) return out
    const seg = res.slice(fi, fi + 3000)
    const rr = /\/([A-Za-z0-9.+_-]+)\s+(\d+)\s+\d+\s+R/g
    let x
    while ((x = rr.exec(seg))) out.set(x[1], +x[2])
    return out
  }
  const pages = []
  for (const [, o] of objs) {
    if (!/\/Type\s*\/Page\b/.test(o.dict)) continue
    const fonts = resFonts(o.dict)
    const refs = []
    const s1 = o.dict.match(/\/Contents\s+(\d+)\s+\d+\s+R/)
    if (s1) refs.push(+s1[1])
    const sa = o.dict.match(/\/Contents\s*\[([^\]]*)\]/)
    if (sa) for (const r of sa[1].match(/(\d+)\s+\d+\s+R/g) || []) refs.push(+r.split(/\s+/)[0])
    let text = ''
    for (const r of refs) {
      const d = await decode(objs.get(r))
      if (!d) continue
      const content = latin1(d)
      let cur = null
      const tok = /\/([A-Za-z0-9.+_-]+)\s+[\d.]+\s+Tf|<([0-9A-Fa-f\s]+)>|\(((?:[^()\\]|\\.)*)\)|(T\*|Td|TD|ET)/g
      let t
      while ((t = tok.exec(content))) {
        if (t[1]) { const f = fonts.get(t[1]); cur = f != null ? cmaps.get(f) : null; continue }
        if (t[2] != null) {
          if (!cur) continue
          const hex = t[2].replace(/\s+/g, ''), step = cur.codeBytes * 2
          for (let i = 0; i + step <= hex.length; i += step) {
            const ch = cur.map.get(parseInt(hex.slice(i, i + step), 16))
            // Unmapped code: the glyph exists on the page but its Unicode value
            // was never recorded. Nothing can recover it. Drop it and let
            // damageRatio report the loss instead of inventing a character.
            if (ch != null) text += ch
          }
          continue
        }
        if (t[3] != null) { if (!cur || !cur.map.size) text += t[3].replace(/\\([()\\])/g, '$1'); continue }
        if (t[4]) text += '\n'
      }
    }
    pages.push(text)
  }
  const paras = pages.join('\n').split('\n').map((s, i) => ({ text: s.replace(/\s+/g, ' ').trim(), i }))
    .filter(p => p.text)
  return { paras, pages, kind: 'pdf' }
}

// ===========================================================================
// Text health
// ===========================================================================

// Share of Thai codepoints among visible characters. Healthy Thai documents sit
// near 0.9. The known-damaged sample sits far below, because dropped glyphs
// leave the Latin digits and punctuation behind.
export function thaiRatio(text) {
  const v = (text || '').replace(/\s/g, '')
  if (!v.length) return 0
  return (v.match(/[฀-๿]/g) || []).length / v.length
}

// Thai words never contain a bare consonant cluster with no vowel across a long
// run, so an abnormally low Thai ratio in a field is the damage signal.
export function damageRatio(text) {
  const r = thaiRatio(text)
  if (!text || !text.trim()) return 1
  return Math.max(0, Math.min(1, (0.9 - r) / 0.9))
}

// ===========================================================================
// Thai character n-gram similarity
// ===========================================================================
// Thai is written without spaces, so token matching does not work. Character
// n-grams are the cheapest thing that survives rewording: a plan that says
// "รากดูดซึมสารอาหารจากดิน" still shares most 5-grams with the library's
// "รากดูดอาหารจากดิน". This is a heuristic, not semantics, and it is tuned
// deliberately loose because a missed misconception costs more than a
// false alarm the teacher can dismiss in one tap.

const NG = 5
function grams(s, n = NG) {
  const t = (s || '').replace(/[\s๏๚๛.,()"'\/\-]/g, '')
  const out = new Set()
  for (let i = 0; i + n <= t.length; i++) out.add(t.slice(i, i + n))
  return out
}
export function overlap(probe, text) {
  const a = grams(probe)
  if (!a.size) return 0
  const b = grams(text)
  let hit = 0
  for (const g of a) if (b.has(g)) hit++
  return hit / a.size
}

// ===========================================================================
// Lesson plan parsing
// ===========================================================================

// ---------------------------------------------------------------------------
// Damage-tolerant matching
// ---------------------------------------------------------------------------
// A broken embedded font deletes glyphs; it never substitutes them. And it
// deletes the same glyphs everywhere, because the gap is in the font's
// ToUnicode table, not in the text. So the recovery is: work out which
// characters this file lost, then delete those same characters from the
// library side before comparing. "หน่วยการเรียนรู้" and the damaged
// "น่ยการเรียนรู้" both reduce to the same string once ห and ว are removed.

// Characters so common that any running Thai text must contain them at a rate
// well above the threshold below. The rarest of them still runs above 1% of
// Thai characters.
const MUST_APPEAR = 'กงจดตทนบปพมยรลวสหอาีุเแ่้ิ'

// Not a zero test. A document can mix fonts, so a dropped glyph may still
// appear a handful of times from a heading or a stray run that happened to be
// set in a font whose ToUnicode table was complete. Judge by rate, not
// presence: eight occurrences of ห in thirteen thousand Thai characters means
// the glyph is missing, not present.
const PRESENT_RATE = 0.002

export function detectDropped(text) {
  const dropped = new Set()
  if (!text || text.length < 400) return dropped
  const thai = (text.match(/[฀-๿]/g) || []).length
  if (thai < 300) return dropped
  for (const ch of MUST_APPEAR) {
    const n = text.split(ch).length - 1
    if (n / thai < PRESENT_RATE) dropped.add(ch)
  }
  return dropped
}

export function stripChars(s, dropped) {
  if (!dropped || !dropped.size) return s
  let o = ''
  for (const ch of s) if (!dropped.has(ch)) o += ch
  return o
}

// Canonical form for comparing library text against damaged plan text.
// Beyond dropping missing glyphs: SARA AM decomposes into NIKHAHIT + SARA AA
// in these PDFs, and the NIKHAHIT half is usually unmapped, so "สำรวจ" comes
// out as " ารวจ". Folding ำ to า and discarding whitespace makes the two
// forms comparable without loosening the match.
export function normMatch(s, dropped) {
  return stripChars(String(s || ''), dropped)
    .replace(/ำ/g, 'า')
    .replace(/\s+/g, '')
    .toLowerCase()
}

// Below this length a normalised pattern starts matching inside unrelated
// words, for example "สื่อ" reducing to "ื่อ" and hitting "เรื่อง".
const MIN_PATTERN = 5

const LABELS = [
  ['unit', ['หน่วยการเรียนรู้']],
  ['subject', ['กลุ่มสาระการเรียนรู้', 'รายวิชา', 'วิชา']],
  ['grade', ['ระดับชั้น', 'ชั้น']],
  ['periods', ['เวลาเรียน', 'จำนวนคาบ', 'เวลา']],
  ['indicators', ['มาตรฐานการเรียนรู้และตัวชี้วัด', 'ตัวชี้วัด', 'มาตรฐานการเรียนรู้', 'ผลการเรียนรู้']],
  ['keyConcept', ['สาระสำคัญ', 'ความคิดรวบยอด']],
  ['objectives', ['จุดประสงค์การเรียนรู้', 'จุดประสงค์']],
  ['content', ['สาระการเรียนรู้']],
  ['activities', ['กิจกรรมการเรียนรู้', 'กระบวนการจัดการเรียนรู้', 'การจัดกิจกรรมการเรียนรู้', 'กิจกรรมการจัดการเรียนรู้']],
  ['materials', ['สื่อและแหล่งเรียนรู้', 'สื่อการเรียนรู้', 'แหล่งเรียนรู้', 'สื่อ/อุปกรณ์']],
  ['assessment', ['การวัดและประเมินผล', 'การวัดผลและประเมินผล', 'การประเมินผล']],
  ['postNote', ['บันทึกหลังสอน', 'บันทึกผลหลังการสอน', 'บันทึกหลังการจัดการเรียนรู้']],
]

// 5E is the dominant Thai science plan format. Map it onto the three stages the
// method library indexes by, so plan_stage stays meaningful either way.
const STAGES = [
  [['ขั้นสร้างความสนใจ', 'สร้างความสนใจ', 'ขั้นนำ', 'engage'], 'ขั้นนำ'],
  [['ขั้นสำรวจและค้นหา', 'ขั้นสำรวจ', 'explor'], 'ขั้นสอน'],
  [['ขั้นอธิบายและลงข้อสรุป', 'ขั้นอธิบาย', 'explain'], 'ขั้นสอน'],
  [['ขั้นขยายความรู้', 'ขั้นขยายความ', 'elaborat'], 'ขั้นสอน'],
  [['ขั้นประเมินผล', 'ขั้นประเมิน', 'evaluat'], 'ขั้นสรุป'],
  [['ขั้นสอน'], 'ขั้นสอน'],
  [['ขั้นสรุป'], 'ขั้นสรุป'],
]

const THAI_D = '๐๑๒๓๔๕๖๗๘๙'
const thaiNum = s => s.replace(/[๐-๙]/g, d => String(THAI_D.indexOf(d)))

// Matches "ว 1.2 ม.1/6" and the range form "ว 1.2 ม.1/6-8". The subject letter
// is optional because it is frequently one of the dropped glyphs; when it is
// missing we fall back to the subject implied by the rest of the document.
export function extractIndicators(text, dropped) {
  const t = thaiNum(text)
  const out = []
  const re = /(?:([ควทสพศงอ])\s*)?(\d)\.(\d)\s*(ป|ม)\s*\.?\s*(\d+)\s*\/\s*(\d+)(?:\s*[-–—]\s*(\d+))?/g
  let m
  while ((m = re.exec(t))) {
    const [, sub, a, b, lvl, gr, from, to] = m
    // Without a subject letter this is only an indicator if the letter was
    // dropped by the font. Otherwise it is probably a date or a ratio.
    let subject = sub
    if (!subject) {
      if (dropped && dropped.has('ว')) subject = 'ว'
      else continue
    }
    const last = to ? +to : +from
    if (last < +from || last - +from > 20) continue
    for (let n = +from; n <= last; n++) {
      const code = `${subject} ${a}.${b} ${lvl}.${gr}/${n}`
      if (!out.includes(code)) out.push(code)
    }
  }
  return out
}

// Where the label ends in the original string, given that the match was made
// against the normalised form. Walk forward until the normalised prefix ends
// with the pattern, so the surviving text after it is cut cleanly.
function cutOriginal(orig, pattern, dropped) {
  for (let i = 0; i < orig.length; i++) {
    if (normMatch(orig.slice(0, i + 1), dropped).endsWith(pattern)) return i + 1
  }
  return 0
}

function sliceByLabels(paras, dropped) {
  const marks = []
  const pats = LABELS.map(([key, words]) =>
    [key, words.map(w => normMatch(w, dropped)).filter(w => w.length >= MIN_PATTERN)])
  paras.forEach(p => {
    const s = normMatch(p.text, dropped)
    for (const [key, words] of pats) {
      if (words.some(w => s.includes(w))) { marks.push({ key, i: p.i, text: p.text }); break }
    }
  })
  const out = {}
  marks.forEach((mk, n) => {
    // Paragraph indices are gapped once blank lines are dropped, so the tail
    // bound must be open rather than paras.length.
    const end = n + 1 < marks.length ? marks[n + 1].i : Infinity
    const body = paras.filter(p => p.i >= mk.i && p.i < end).map(p => p.text)
    if (!body.length) return
    // Strip the label itself off the first line. Compare on the stripped form
    // but cut from the original, so the surviving text stays intact.
    const words = LABELS.find(l => l[0] === mk.key)[1]
    for (const w of words) {
      const pat = normMatch(w, dropped)
      if (pat.length < MIN_PATTERN) continue
      const cut = cutOriginal(body[0], pat, dropped)
      if (cut) { body[0] = body[0].slice(cut); break }
    }
    body[0] = body[0].replace(/^[\s:：.\-–]+/, '')
    if (!out[mk.key]) out[mk.key] = { text: body.join('\n').trim(), from: mk.i, to: end }
  })
  return out
}

// Scans the whole document rather than a labelled section. Real plans often
// have no "กิจกรรมการเรียนรู้" heading at all: the stages appear as numbered
// sections such as "6.1 ขั้นสร้างความสนใจ". The stage names themselves are
// unambiguous enough to anchor on directly.
function parseActivities(paras, dropped) {
  const pats = STAGES.map(([words, stage]) =>
    [words.map(w => normMatch(w, dropped)).filter(w => w.length >= 4), stage])
  const stops = ['สื่อและแหล่งเรียนรู้', 'สื่อ/วัสดุ/อุปกรณ์', 'การวัดและประเมินผล', 'บันทึกหลังสอน']
    .map(w => normMatch(w, dropped)).filter(w => w.length >= 6)

  const acts = []
  let cur = null
  const flush = () => { if (cur) { acts.push(cur); cur = null } }

  for (const p of paras) {
    const s = normMatch(p.text, dropped)
    const hit = pats.find(([words]) => words.some(w => s.includes(w)))
    if (hit) {
      flush()
      cur = { stage: hit[1], label: p.text.slice(0, 60), text: '', duration: null, line: p.i }
      const mins = p.text.match(/(\d+)\s*นาที/)
      if (mins) cur.duration = +mins[1]
      continue
    }
    if (!cur) continue
    // Duration is frequently on the line after the stage header, because the
    // header wraps mid-parenthesis.
    if (cur.duration == null) {
      const mins = p.text.match(/(\d+)\s*นาที/)
      if (mins) cur.duration = +mins[1]
    }
    if (stops.some(w => s.includes(w))) { flush(); break }
    cur.text += (cur.text ? ' ' : '') + p.text
  }
  flush()
  return acts
}

export function parsePlan(doc) {
  const paras = doc.paras
  const whole = paras.map(p => p.text).join('\n')
  const dropped = detectDropped(whole)
  const f = sliceByLabels(paras, dropped)
  const head = paras.slice(0, 25).map(p => p.text).join(' ')

  const codes = extractIndicators(f.indicators?.text || '', dropped)
  const codesAnywhere = codes.length ? codes : extractIndicators(whole, dropped)

  const periodsTxt = (f.periods?.text || '') + ' ' + head
  const pm = thaiNum(periodsTxt).match(/(\d+)\s*(คาบ|ชั่วโมง)/)
  const mm = thaiNum(periodsTxt).match(/(\d+)\s*นาที/)
  const gm = thaiNum((f.grade?.text || '') + ' ' + head).match(/(ป|ม)\s*\.?\s*(\d+)/)

  const activities = parseActivities(paras, dropped)

  const plan = {
    unit: f.unit?.text?.split('\n')[0] || '',
    subject: f.subject?.text?.split('\n')[0] || '',
    grade: gm ? `${gm[1]}.${gm[2]}` : '',
    periods: pm ? +pm[1] : null,
    minutesPerPeriod: mm ? +mm[1] : 50,
    currCodes: codesAnywhere,
    keyConcept: f.keyConcept?.text || '',
    objectives: f.objectives?.text || '',
    content: f.content?.text || '',
    activities,
    materials: f.materials?.text || '',
    assessment: f.assessment?.text || '',
    postNote: f.postNote?.text || '',
    raw: whole,
    kind: doc.kind,
    blocks: f,
  }

  // FR-A-05: confidence is recorded per field, never per file.
  const conf = {}
  const score = (key, value, weight = 1) => {
    if (!value || !String(value).trim()) return (conf[key] = { level: 'none', damage: 1 })
    const d = damageRatio(String(value))
    conf[key] = { level: d > 0.45 ? 'low' : d > 0.18 ? 'medium' : 'high', damage: d, weight }
  }
  score('unit', plan.unit)
  score('subject', plan.subject)
  score('grade', plan.grade)
  score('keyConcept', plan.keyConcept)
  score('objectives', plan.objectives)
  score('content', plan.content)
  score('activities', activities.map(a => a.text).join(' '))
  score('materials', plan.materials)
  score('assessment', plan.assessment)
  // Indicator codes are digits and Latin letters, so damage scoring does not
  // apply. Either the pattern matched or it did not.
  conf.currCodes = { level: codesAnywhere.length ? 'high' : 'none', damage: codesAnywhere.length ? 0 : 1 }
  conf.periods = { level: plan.periods ? 'high' : 'none', damage: plan.periods ? 0 : 1 }

  plan.confidence = conf
  plan.overallDamage = damageRatio(whole)
  plan.dropped = [...dropped]
  return plan
}

// ===========================================================================
// Comparators
// ===========================================================================

const FREQ_RANK = { 'สูงมาก': 3, 'สูง': 2, 'ปานกลาง': 1, 'ต่ำ': 0 }
const SEV_RANK = { high: 2, medium: 1, low: 0 }

// Tuned on the seeded library. Loose enough to catch rewording, tight enough
// that unrelated plan text does not trip it.
const T_REINFORCE = 0.34
const T_ADDRESSED = 0.30

function planText(plan) {
  return [plan.keyConcept, plan.objectives, plan.content,
    plan.activities.map(a => a.label + ' ' + a.text).join(' '), plan.assessment].join(' ')
}

// Break plan prose into sentence-sized pieces.
//
// This matters more than it looks. Scoring a probe against a whole stage of a
// lesson plan inflates the score: a long enough passage contains most short
// n-grams by accident, so every misconception looks present. Scoring against
// single sentences keeps precision, and has the side benefit of yielding the
// exact sentence to quote back to the teacher.
function splitSegments(text) {
  if (!text) return []
  const rough = String(text)
    .split(/\n|\s{2,}|(?=\s\d{1,2}[.)]\s)|[•●]/)
    .map(s => s.trim())
    .filter(s => s.length >= 12)
  const out = []
  for (const piece of rough) {
    if (piece.length <= 170) { out.push(piece); continue }
    // Overlapping windows so a sentence straddling a cut is still seen whole.
    for (let i = 0; i < piece.length; i += 80) {
      const w = piece.slice(i, i + 160)
      if (w.length >= 40) out.push(w)
    }
  }
  return out
}

function planSegments(plan) {
  const segs = []
  for (const a of plan.activities) {
    for (const t of splitSegments(a.text)) segs.push({ stage: a.stage, label: a.label, text: t })
  }
  for (const t of splitSegments(plan.assessment)) {
    segs.push({ stage: 'ขั้นสรุป', label: 'การวัดและประเมินผล', text: t })
  }
  for (const t of splitSegments(plan.keyConcept)) {
    segs.push({ stage: 'ขั้นนำ', label: 'สาระสำคัญ', text: t })
  }
  return segs
}

export function compare(plan, DB, profile = null) {
  const findings = []
  const text = planText(plan)
  const push = f => findings.push(f)
  // The plan may be missing glyphs its font failed to map. Compare like for
  // like by removing the same characters from the library text, otherwise
  // every probe fails against a damaged file and the system reports a clean
  // plan when it simply could not read it.
  const dropped = new Set(plan.dropped || [])
  const ov = (probe, txt) => overlap(normMatch(probe, dropped), normMatch(txt, dropped))
  const segments = planSegments(plan)

  // ---- Comparator 1: curriculum coverage -----------------------------------
  const known = plan.currCodes.filter(c => DB.curr.some(x => x.code === c))
  const unknown = plan.currCodes.filter(c => !DB.curr.some(x => x.code === c))

  for (const code of known) {
    const ind = DB.curr.find(x => x.code === code)
    const hit = ind.core.some(c => ov(c, text) > 0.22) || ov(ind.text, text) > 0.25
    if (!hit) {
      push({
        id: 'C1-' + code, comparator: 'curriculum', severity: 'high', kind: 'uncovered',
        title: `แผนอ้างตัวชี้วัด ${code} แต่ยังไม่มีเนื้อหาหรือกิจกรรมที่ตรงกับตัวชี้วัดนี้`,
        body: ind.text,
        detail: { indicator: ind },
        rule: `ov(core_content, plan) <= 0.22 สำหรับ ${code}`,
      })
    }
  }

  // ---- Comparator 2: misconceptions ---------------------------------------
  const mapped = DB.map.filter(r => known.includes(r.code))
  const miscSeen = new Set()
  for (const rel of mapped) {
    const mc = DB.misc.find(m => m.id === rel.miscId)
    if (!mc || miscSeen.has(mc.id)) continue
    miscSeen.add(mc.id)

    // 2a. Does the plan itself repeat the misconception? This is the strongest
    // signal the system produces, and the only one that finds a defect rather
    // than an absence.
    const probes = [mc.distractor, ...mc.symptom]
    let best = { score: 0, probe: null, where: null }
    for (const probe of probes) {
      for (const seg of segments) {
        const s = ov(probe, seg.text)
        if (s > best.score) best = { score: s, probe, where: seg }
      }
    }
    if (best.score >= T_REINFORCE) {
      push({
        id: 'C2R-' + mc.id, comparator: 'misconception', severity: 'high', kind: 'reinforce',
        miscId: mc.id, title: `ข้อความในแผนไปตรงกับความเข้าใจผิดที่พบบ่อยของหน่วยนี้`,
        body: mc.name, evidence: best.where?.text?.slice(0, 220), stage: best.where?.stage, matchScore: best.score,
        detail: { misc: mc },
        rule: `ov(MISC.distractor|symptom, ${best.where?.stage || 'plan'}) = ${best.score.toFixed(2)} >= ${T_REINFORCE}`,
      })
      continue
    }

    // 2b. Otherwise: is there a step that heads it off?
    const addressed = ov(mc.correct, text) >= T_ADDRESSED ||
      DB.method.filter(x => x.addresses.includes(mc.id))
        .some(x => ov(x.nameTh, text) > 0.5 || (x.nameEn && text.includes(x.nameEn)))
    if (!addressed) {
      const sev = FREQ_RANK[mc.freq] >= 2 ? 'high' : 'medium'
      push({
        id: 'C2-' + mc.id, comparator: 'misconception', severity: sev, kind: 'unaddressed',
        miscId: mc.id,
        title: `หน่วยนี้นักเรียนมักติด "${mc.name}" แต่แผนยังไม่มีขั้นที่ทำให้เรื่องนี้โผล่ออกมาก่อนสอน`,
        body: mc.desc, detail: { misc: mc },
        rule: `ไม่พบขั้นที่จัดการ ${mc.id} (ov(correct_concept) < ${T_ADDRESSED}), frequency=${mc.freq}`,
      })
    }
  }

  // ---- Timing --------------------------------------------------------------
  const total = plan.activities.reduce((s, a) => s + (a.duration || 0), 0)
  const noTime = plan.activities.filter(a => a.duration == null)
  const budget = (plan.periods || 1) * (plan.minutesPerPeriod || 50)
  if (noTime.length && plan.activities.length) {
    push({
      id: 'T-notime', comparator: 'curriculum', severity: 'medium', kind: 'timing',
      title: `${noTime.length} ขั้นในแผนยังไม่ได้ระบุเวลา เหลือเวลาที่ยังไม่ถูกจัดสรร ${Math.max(0, budget - total)} นาที`,
      body: noTime.map(a => a.label).join(' / '),
      detail: { budget, total, remaining: Math.max(0, budget - total) },
      rule: `sum(activities.duration)=${total} vs periods*minutes=${budget}`,
    })
  }

  // ---- Comparator 3: the teacher's own history ----------------------------
  if (profile && profile.uploads >= 3) {
    for (const [name, n] of profile.frequentActivities || []) {
      if (n >= 2 && ov(name, text) < 0.25) {
        push({
          id: 'C3-' + name, comparator: 'history', severity: 'medium', kind: 'habit',
          title: `${name} ที่คุณใช้ประจำ ไม่ปรากฏในแผนนี้`,
          body: `พบในแผนก่อนหน้า ${n} จาก ${profile.uploads} ครั้ง`,
          rule: `HIST: inserted ${name} x${n}`,
        })
      }
    }
  }

  findings.sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity])
  return { findings, unknownCodes: unknown, knownCodes: known, budget, allocated: total }
}

// ===========================================================================
// Method selection
// ===========================================================================

export function pickMethods(finding, plan, DB, profile = null, excludeIds = []) {
  // Problem-first entry: the catalogue already names the strategy for this
  // problem, so there is nothing to infer.
  if (finding.methodId) {
    const m = DB.method.find(x => x.id === finding.methodId)
    return m ? [m] : []
  }
  if (!finding.miscId) return []
  const mc = DB.misc.find(m => m.id === finding.miscId)
  const remaining = Math.max(0, ((plan.periods || 1) * (plan.minutesPerPeriod || 50)) -
    plan.activities.reduce((s, a) => s + (a.duration || 0), 0))

  let c = DB.method.filter(m => m.addresses.includes(finding.miscId))
  // FR-G-05: whole-plan models are never an insertion into a finished plan.
  c = c.filter(m => m.stage !== 'ทั้งแผน')
  c = c.filter(m => !excludeIds.includes(m.id))
  // FR-K-02: never propose something that cannot fit the period.
  if (remaining > 0) c = c.filter(m => !m.duration || m.duration <= Math.max(remaining, 10))
  // FR-K-03: learned from rejections, not from a form.
  if (profile?.noMaterials) c = c.filter(m => !m.requiresLab)

  const persistent = mc && (mc.persistence === 'สูง' || mc.persistence === 'สูงมาก')
  const EV = { 'สูง': 2, 'ปานกลาง': 1, 'ต่ำ': 0 }
  const score = m => {
    let s = 0
    // The strategy DB2 already names for this misconception wins.
    if (mc && m.nameEn && mc.strategyRef && m.nameEn.toLowerCase() === mc.strategyRef.toLowerCase()) s += 100
    // Persistence decides the class of method, per the schema's rule.
    if (persistent && /Conceptual|Cognitive/i.test(m.nameEn || '')) s += 40
    if (!persistent && m.category === 'strategy' && /Explicit/i.test(m.nameEn || '')) s += 20
    if (finding.stage && m.stage === finding.stage) s += 15
    s += (EV[m.evidenceStrength] || 0) * 5
    if (m.category === 'strategy') s += 6
    if (m.category === 'activity') s += 4
    if (!m.requiresLab) s += 3
    return s
  }
  return c.sort((a, b) => score(b) - score(a))
}

// ===========================================================================
// Problem-first entry  (teacher has no plan yet)
// ===========================================================================

// Which misconceptions the library knows for a chosen standard and grade.
// Empty is a legitimate answer and must be shown as such, never padded.
export function miscForStandard(DB, standardCode, grade) {
  const std = arabize(standardCode).replace(/\s+/g, ' ').trim()
  const codes = DB.curr
    .filter(c => arabize(c.standard).replace(/\s+/g, ' ').trim() === std && (!grade || c.grade === grade))
    .map(c => c.code)
  const ids = new Set(DB.map.filter(r => codes.includes(r.code)).map(r => r.miscId))
  return {
    codes,
    misc: DB.misc.filter(m => ids.has(m.id))
      .sort((a, b) => (FREQ_RANK[b.freq] || 0) - (FREQ_RANK[a.freq] || 0)),
  }
}

// Turn the checked problems into the same finding shape the upload path
// produces, so ranking, decisions, history and the PA draft all work unchanged.
export function problemFindings(DB, problemIds) {
  return problemIds.map(id => {
    const pb = DB.problem.find(x => x.id === id)
    if (!pb) return null
    const bound = pb.methodId ? DB.method.find(m => m.id === pb.methodId) : null
    return {
      id: 'PB-' + pb.id, comparator: 'problem', kind: 'problem',
      severity: bound ? 'high' : 'medium',
      methodId: pb.methodId,
      title: pb.text,
      body: bound ? bound.whenToUse : `คลังจับคู่ปัญหานี้กับวิธี ${pb.strategy}`,
      catalogue: pb,
      rule: `FORM ${pb.id} -> ${pb.strategy}` + (bound ? ` -> ${pb.methodId}` : ' (ยังไม่มีรายละเอียดในคลังชุดนี้)'),
    }
  }).filter(Boolean).sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity])
}

// ===========================================================================
// PA draft
// ===========================================================================

export function paDraft(plan, accepted, DB) {
  const miscs = accepted.map(a => DB.misc.find(m => m.id === a.miscId)).filter(Boolean)
  const methods = accepted.map(a => DB.method.find(m => m.id === a.methodId)).filter(Boolean)
  const codes = plan.currCodes.join(', ')
  const problem = miscs.length
    ? `จากการตรวจสอบแผนการจัดการเรียนรู้ ${plan.unit || ''} รายวิชา${plan.subject || 'วิทยาศาสตร์'} ชั้น${plan.grade || ''} ` +
      `ซึ่งจัดการเรียนรู้ตามตัวชี้วัด ${codes} พบว่าผู้เรียนมีแนวคิดคลาดเคลื่อนที่พบบ่อยในหน่วยนี้ ได้แก่ ` +
      miscs.map((m, i) => `(${i + 1}) ${m.name} โดยผู้เรียนมักแสดงออกว่า ${(m.symptom[0] || m.desc)}`).join(' ') +
      ` แนวคิดคลาดเคลื่อนเหล่านี้ส่งผลต่อการเรียนรู้ในตัวชี้วัดถัดไป จึงจำเป็นต้องออกแบบการจัดการเรียนรู้ที่ทำให้แนวคิดเดิมของผู้เรียนปรากฏออกมาก่อนการสอน`
    : ''
  const how = methods.length
    ? methods.map((m, i) =>
        `${i + 1}. ${m.nameTh}${m.nameEn ? ` (${m.nameEn})` : ''} ` +
        `ในขั้น${m.stage} ใช้เวลาประมาณ ${m.duration} นาที ` +
        `ดำเนินการโดย ${m.steps.join(' จากนั้น ')}`).join('\n')
    : ''
  return {
    problem, how,
    quantitative: null, // FR-I-03: needs measurement, which is phase 2
    qualitative: null,
    covered: [
      ['ประเด็นท้าทาย ข้อ 1 สภาพปัญหาของผู้เรียน', !!problem, 'จาก DB2 MISC ที่พบในแผน'],
      ['ประเด็นท้าทาย ข้อ 2 วิธีการดำเนินการ', !!how, 'จาก DB4 METHOD ที่ครูรับไป'],
      ['ประเด็นท้าทาย ข้อ 3.1 เชิงปริมาณ (10 คะแนน)', false, 'ต้องมีผลการวัดก่อนและหลัง ซึ่งอยู่ในเฟส 2'],
      ['ประเด็นท้าทาย ข้อ 3.2 เชิงคุณภาพ (10 คะแนน)', false, 'ต้องมีบันทึกสังเกตระหว่างทาง ซึ่งอยู่ในเฟส 2'],
      ['ว.PA ด้านที่ 1 แผนการจัดการเรียนรู้', true, 'แผนฉบับปรับแล้วที่ดาวน์โหลดได้'],
    ],
  }
}

// ===========================================================================
// DOCX write
// ===========================================================================

const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const runXml = (t, b) => `<w:r>${b ? '<w:rPr><w:b/></w:rPr>' : ''}<w:t xml:space="preserve">${esc(t)}</w:t></w:r>`

// Real tracked insertions. Word shows these as revision marks, so the teacher
// sees exactly what changed and can accept or reject inside Word.
function insParagraph(text, id, author = 'ตรวจรู้') {
  const d = '2026-08-14T00:00:00Z'
  return `<w:p><w:ins w:id="${id}" w:author="${esc(author)}" w:date="${d}">` +
    runXml(text) + `</w:ins></w:p>`
}

export function buildDocx(plan, doc, insertions) {
  if (doc.kind === 'docx' && doc.xml && doc.files) {
    let xml = doc.xml
    // Insert from the bottom up so earlier offsets stay valid.
    const ordered = [...insertions].sort((a, b) => b.anchorEnd - a.anchorEnd)
    let id = 9000
    for (const ins of ordered) {
      const block = insParagraph(`[ตรวจรู้] ${ins.text}`, id++)
      xml = xml.slice(0, ins.anchorEnd) + block + xml.slice(ins.anchorEnd)
    }
    const files = new Map(doc.files)
    files.set('word/document.xml', new TextEncoder().encode(xml))
    return zip(files)
  }
  // PDF source: formatting cannot be preserved, so emit a clean document and
  // say so in the UI rather than pretending otherwise.
  const body = []
  body.push(`<w:p>${runXml(plan.unit || 'แผนการจัดการเรียนรู้', true)}</w:p>`)
  body.push(`<w:p>${runXml(`${plan.subject || ''} ${plan.grade || ''} ตัวชี้วัด ${plan.currCodes.join(', ')}`)}</w:p>`)
  for (const a of plan.activities) {
    body.push(`<w:p>${runXml(a.label, true)}</w:p>`)
    body.push(`<w:p>${runXml(a.text)}</w:p>`)
    let id = 9000
    for (const ins of insertions.filter(x => x.stage === a.stage)) {
      body.push(insParagraph(`[ตรวจรู้] ${ins.text}`, id++))
    }
  }
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body.join('')}</w:body></w:document>`
  const enc = new TextEncoder()
  return zip(new Map([
    ['[Content_Types].xml', enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`)],
    ['_rels/.rels', enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`)],
    ['word/_rels/document.xml.rels', enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`)],
    ['word/document.xml', enc.encode(docXml)],
  ]))
}

// ===========================================================================
// Storage  (IndexedDB: PLAN + HIST)
// ===========================================================================

const DB_NAME = 'truatroo', DB_VER = 1
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, DB_VER)
    r.onupgradeneeded = () => {
      const d = r.result
      if (!d.objectStoreNames.contains('plans')) d.createObjectStore('plans', { keyPath: 'planId' })
      if (!d.objectStoreNames.contains('hist')) d.createObjectStore('hist', { keyPath: 'eventId', autoIncrement: true })
    }
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}
async function tx(store, mode, fn) {
  const d = await idb()
  return new Promise((res, rej) => {
    const t = d.transaction(store, mode)
    const s = t.objectStore(store)
    const out = fn(s)
    t.oncomplete = () => res(out?.result ?? out)
    t.onerror = () => rej(t.error)
  })
}
export const savePlan = p => tx('plans', 'readwrite', s => s.put(p))
export const allPlans = () => tx('plans', 'readonly', s => s.getAll())
export const addEvent = e => tx('hist', 'readwrite', s => s.add(e))
export const allEvents = () => tx('hist', 'readonly', s => s.getAll())
export async function clearAll() {
  await tx('plans', 'readwrite', s => s.clear())
  await tx('hist', 'readwrite', s => s.clear())
}

// VIEW teacher_profile: computed, never a form. FR-K-01.
export function buildProfile(plans, events) {
  const mins = plans.map(p => p.minutesPerPeriod).filter(Boolean)
  const mode = mins.sort((a, b) =>
    mins.filter(v => v === a).length - mins.filter(v => v === b).length).pop() || 50
  const rejected = events.filter(e => e.action === 'rejected')
  const noMaterials = rejected.filter(e => e.reason === 'no_materials').length >= 3
  const freq = new Map()
  for (const e of events.filter(x => x.action === 'inserted' && x.methodName)) {
    freq.set(e.methodName, (freq.get(e.methodName) || 0) + 1)
  }
  const decisionTimes = events.filter(e => e.shownAt && e.actedAt).map(e => (e.actedAt - e.shownAt) / 1000)
  return {
    uploads: plans.length,
    typicalPeriodMinutes: mode,
    noMaterials,
    frequentActivities: [...freq.entries()].sort((a, b) => b[1] - a[1]),
    rejectCounts: rejected.reduce((m, e) => (m[e.reason] = (m[e.reason] || 0) + 1, m), {}),
    medianDecisionSec: decisionTimes.length
      ? decisionTimes.sort((a, b) => a - b)[Math.floor(decisionTimes.length / 2)] : null,
    grades: [...new Set(plans.map(p => p.grade).filter(Boolean))],
  }
}
