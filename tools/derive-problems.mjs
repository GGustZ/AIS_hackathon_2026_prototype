// Derive the problem -> method map from the 110-row catalogue.
//
//   node tools/derive-problems.mjs
//
// The 26 entries under "ปัญหานักเรียนที่ต้องการเเก้" in FORM_frontend_options.csv
// are exactly the "เหมาะกับปัญหา" column of the Instructional Strategy section
// of DB4_teaching_methods_110.csv. Nothing here is authored: this reads the
// spreadsheet, forward-fills its merged cells, and writes a flat table.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const p = (...a) => path.join(ROOT, ...a)

function parseCSV(text) {
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
  return rows
}

const rows = parseCSV(fs.readFileSync(p('data', 'DB4_teaching_methods_110.csv'), 'utf8'))

// The strategy block runs from its header row to the activity header row.
const start = rows.findIndex(r => (r[0] || '').includes('Instructional Strategy Database'))
const end = rows.findIndex((r, i) => i > start && (r[2] || '').includes('Activity (Show/Recommend)'))
if (start < 0 || end < 0) { console.error('could not locate the strategy block'); process.exit(1) }

const out = []
let major = '', strategy = ''
for (const r of rows.slice(start, end)) {
  // Merged cells arrive as blanks; carry the last value forward.
  if ((r[1] || '').trim()) major = r[1].trim()
  if ((r[2] || '').trim()) strategy = r[2].trim()
  const problem = (r[4] || '').trim()
  if (!problem) continue
  out.push({
    problem,
    major, strategy,
    variant: (r[3] || '').trim(),
    keywords: (r[5] || '').trim(),
    bloomMain: (r[6] || '').trim(),
    bloomSub: (r[7] || '').trim(),
    why: (r[8] || '').trim(),
  })
}

// Cross-reference against the bound library so the gap between the 110-row
// catalogue and the 20 methods that are actually recommendable stays visible.
const bound = parseCSV(fs.readFileSync(p('data', 'DB4_methods_bound_draft.csv'), 'utf8'))
const bHead = bound[0].map(h => h.trim())
const bRows = bound.slice(1).filter(r => r.length > 1)
  .map(r => Object.fromEntries(bHead.map((h, i) => [h, (r[i] || '').trim()])))

for (const o of out) {
  const hit = bRows.find(b => b.name_en.toLowerCase() === o.strategy.toLowerCase())
  o.methodId = hit ? hit.method_id : ''
}

const esc = v => /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v
const head = ['problem_id', 'problem_text', 'major_type', 'strategy_en', 'variant',
  'bloom_main', 'bloom_sub', 'why_match', 'method_id']
const lines = [head.join(',')]
out.forEach((o, i) => lines.push([
  'PB-' + String(i + 1).padStart(2, '0'), o.problem, o.major, o.strategy, o.variant,
  o.bloomMain, o.bloomSub, o.why, o.methodId,
].map(v => esc(v || '')).join(',')))

fs.writeFileSync(p('data', 'FORM_problem_method_map.csv'), lines.join('\n') + '\n')

const linked = out.filter(o => o.methodId).length
console.log(`wrote data/FORM_problem_method_map.csv  ${out.length} problems`)
console.log(`  linked to a bound method: ${linked}`)
console.log(`  catalogue only (no detail yet): ${out.length - linked}`)
