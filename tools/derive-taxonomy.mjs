// Derive the Bloom / DOK / PISA reference table from the 110-row catalogue.
//
//   node tools/derive-taxonomy.mjs
//
// FR-M-05 says the taxonomies are a fixed reference file, not a database
// table. This reads the three lookup blocks at the top of
// DB4_teaching_methods_110.csv and flattens them. Nothing is authored here.

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
const cell = (r, i) => (rows[r]?.[i] || '').trim()
const out = []

// ---- Bloom: six levels, "1. จำ" through "6. การสร้างสรรค์" -----------------
for (let r = 0; r < rows.length; r++) {
  const a = cell(r, 0)
  if (/^[1-6]\.\s/.test(a) && /^(Remember|Understand|Apply|Analyze|Evaluate|Create)$/i.test(cell(r, 1))) {
    out.push({
      kind: 'bloom', code: 'B' + a[0], label_th: a, label_en: cell(r, 1),
      description: cell(r, 2), keywords: cell(r, 3), group: '',
    })
  }
}

// ---- DOK: four levels ------------------------------------------------------
for (let r = 0; r < rows.length; r++) {
  const a = cell(r, 0)
  if (/^DOK\s*[1-4]$/.test(a)) {
    out.push({
      kind: 'dok', code: a.replace(/\s+/g, ''), label_th: a, label_en: cell(r, 1),
      description: cell(r, 2), keywords: cell(r, 3), group: '',
    })
  }
}

// ---- PISA: four domains, each with its skills ------------------------------
// The domain name sits only on the first row of its block, so carry it forward.
let domain = '', domainCode = ''
for (let r = 0; r < rows.length; r++) {
  const a = cell(r, 0), b = cell(r, 1), c = cell(r, 2)
  const dm = a.match(/^([A-D])\.\s*(.+?)\s*—/)
  if (dm) {
    domainCode = dm[1]
    domain = dm[2].trim()
    out.push({
      kind: 'pisa-domain', code: domainCode, label_th: domain, label_en: domain,
      description: '', keywords: '', group: '',
    })
  }
  if (!domainCode) continue
  const sm = b.match(/^(\d+)\.\s*(.+)$/)
  if (sm && c) {
    out.push({
      kind: 'pisa-skill', code: domainCode + sm[1], label_th: c, label_en: sm[2].trim(),
      description: c, keywords: '', group: domainCode,
    })
  }
  // Stop carrying a domain once the block ends.
  if (a && !dm && !/^\s*$/.test(a) && !/^[A-D]\./.test(a)) domainCode = domainCode
}

const esc = v => /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v
const head = ['kind', 'code', 'label_th', 'label_en', 'description', 'keywords', 'group']
const lines = [head.join(',')]
for (const o of out) lines.push(head.map(h => esc(o[h] || '')).join(','))
fs.writeFileSync(p('data', 'TAXONOMY_reference.csv'), lines.join('\n') + '\n')

const count = k => out.filter(o => o.kind === k).length
console.log('wrote data/TAXONOMY_reference.csv')
console.log(`  bloom ${count('bloom')} | dok ${count('dok')} | pisa domains ${count('pisa-domain')} | pisa skills ${count('pisa-skill')}`)
