// PDF text extraction with ToUnicode CMap decoding.
//
// Thai PDFs from Word and InDesign store text as CID glyph ids, not Unicode.
// The only way back to readable text is the font's ToUnicode CMap. When that
// CMap is incomplete, characters are lost permanently. That is the documented
// cause of the missing ส ห ว ษ in the sample lesson plan.
//
// This module is the build-time twin of the browser extractor in the app.
// Keep the two in sync: same CMap parsing, same fallbacks.

import { inflateSync } from 'node:zlib'

const L = (b) => b.toString('latin1')

// Split the file into indirect objects. Good enough for linearized and
// non-linearized files alike; we do not need the xref table because we are
// reading everything, not seeking.
function parseObjects(buf) {
  const raw = L(buf)
  const objs = new Map()
  const re = /(\d+)\s+(\d+)\s+obj\b/g
  let m
  while ((m = re.exec(raw))) {
    const num = +m[1]
    const start = m.index + m[0].length
    const end = raw.indexOf('endobj', start)
    if (end < 0) continue
    const body = raw.slice(start, end)
    const sIdx = body.indexOf('stream')
    let dict = body
    let stream = null
    if (sIdx > -1) {
      dict = body.slice(0, sIdx)
      let s = start + sIdx + 6
      if (buf[s] === 13) s++
      if (buf[s] === 10) s++
      const e = raw.indexOf('endstream', s)
      if (e > -1) stream = buf.subarray(s, e)
    }
    objs.set(num, { dict, stream })
  }
  return objs
}

function decodeStream(obj) {
  if (!obj || !obj.stream) return null
  if (/\/FlateDecode/.test(obj.dict)) {
    try {
      return inflateSync(obj.stream)
    } catch {
      // Some writers pad the stream; retry tolerantly.
      try {
        return inflateSync(obj.stream, { finishFlush: 2 })
      } catch {
        return null
      }
    }
  }
  return obj.stream
}

const hexToStr = (h) => {
  let out = ''
  for (let i = 0; i + 3 < h.length + 1; i += 4) out += String.fromCharCode(parseInt(h.slice(i, i + 4), 16))
  return out
}

// Parse a ToUnicode CMap into { codeBytes, map: Map(code -> string) }
function parseCMap(text) {
  const map = new Map()
  let codeBytes = 2

  const csr = /begincodespacerange([\s\S]*?)endcodespacerange/g
  let m
  while ((m = csr.exec(text))) {
    const first = m[1].match(/<([0-9A-Fa-f]+)>/)
    if (first) codeBytes = Math.max(1, Math.round(first[1].length / 2))
  }

  const bfc = /beginbfchar([\s\S]*?)endbfchar/g
  while ((m = bfc.exec(text))) {
    const pairs = m[1].match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) || []
    for (const p of pairs) {
      const g = p.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/)
      map.set(parseInt(g[1], 16), hexToStr(g[2]))
    }
  }

  const bfr = /beginbfrange([\s\S]*?)endbfrange/g
  while ((m = bfr.exec(text))) {
    const body = m[1]
    // <lo> <hi> [<a> <b> ...]
    const arrRe = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([\s\S]*?)\]/g
    let a
    while ((a = arrRe.exec(body))) {
      const lo = parseInt(a[1], 16)
      const items = a[3].match(/<([0-9A-Fa-f]+)>/g) || []
      items.forEach((it, i) => map.set(lo + i, hexToStr(it.slice(1, -1))))
    }
    // <lo> <hi> <dstStart>
    const seqRe = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g
    let s
    while ((s = seqRe.exec(body))) {
      const lo = parseInt(s[1], 16)
      const hi = parseInt(s[2], 16)
      const dst = s[3]
      const base = parseInt(dst.slice(-4), 16)
      const prefix = dst.length > 4 ? hexToStr(dst.slice(0, -4)) : ''
      if (hi - lo > 65535) continue
      for (let c = lo; c <= hi; c++) map.set(c, prefix + String.fromCharCode(base + (c - lo)))
    }
  }
  return { codeBytes, map }
}

function collectFonts(objs) {
  const cmaps = new Map() // font object number -> parsed cmap
  for (const [num, o] of objs) {
    const tu = o.dict.match(/\/ToUnicode\s+(\d+)\s+\d+\s+R/)
    if (!tu) continue
    const data = decodeStream(objs.get(+tu[1]))
    if (!data) continue
    cmaps.set(num, parseCMap(L(data)))
  }
  return cmaps
}

// Map a page's resource names (/F1) to font object numbers.
function resourceFonts(dict, objs) {
  const out = new Map()
  let res = dict
  const ref = dict.match(/\/Resources\s+(\d+)\s+\d+\s+R/)
  if (ref) res = objs.get(+ref[1])?.dict || dict
  const fIdx = res.indexOf('/Font')
  if (fIdx < 0) return out
  const seg = res.slice(fIdx, fIdx + 2000)
  const re = /\/([A-Za-z0-9.+_-]+)\s+(\d+)\s+\d+\s+R/g
  let m
  while ((m = re.exec(seg))) out.set(m[1], +m[2])
  return out
}

// Walk a content stream, tracking the current font so each string is decoded
// with the right CMap. Without this, mixed-font documents come out scrambled.
function decodeContent(content, fontsByName, cmaps) {
  let cur = null
  let out = ''
  const tok = /\/([A-Za-z0-9.+_-]+)\s+[\d.]+\s+Tf|<([0-9A-Fa-f\s]+)>|\(((?:[^()\\]|\\.)*)\)|(TJ|Tj|T\*|Td|TD|ET)/g
  let m
  while ((m = tok.exec(content))) {
    if (m[1]) {
      const fnum = fontsByName.get(m[1])
      cur = fnum != null ? cmaps.get(fnum) : null
      continue
    }
    if (m[2] != null) {
      const hex = m[2].replace(/\s+/g, '')
      if (!cur) continue
      const step = cur.codeBytes * 2
      for (let i = 0; i + step <= hex.length; i += step) {
        const code = parseInt(hex.slice(i, i + step), 16)
        const ch = cur.map.get(code)
        // A code with no CMap entry is unrecoverable. Emit nothing rather
        // than a placeholder, and let the caller measure the loss.
        if (ch != null) out += ch
      }
      continue
    }
    if (m[3] != null) {
      // Literal strings appear in simple-font PDFs.
      if (!cur || cur.map.size === 0) out += m[3].replace(/\\([()\\])/g, '$1')
      continue
    }
    if (m[4] === 'T*' || m[4] === 'Td' || m[4] === 'TD' || m[4] === 'ET') out += '\n'
  }
  return out
}

export function extractPages(buf) {
  const objs = parseObjects(buf)
  const cmaps = collectFonts(objs)
  const pages = []
  for (const [, o] of objs) {
    if (!/\/Type\s*\/Page\b/.test(o.dict)) continue
    const fontsByName = resourceFonts(o.dict, objs)
    const refs = []
    const single = o.dict.match(/\/Contents\s+(\d+)\s+\d+\s+R/)
    if (single) refs.push(+single[1])
    const arr = o.dict.match(/\/Contents\s*\[([^\]]*)\]/)
    if (arr) for (const r of arr[1].match(/(\d+)\s+\d+\s+R/g) || []) refs.push(+r.split(/\s+/)[0])
    let text = ''
    for (const r of refs) {
      const data = decodeStream(objs.get(r))
      if (data) text += decodeContent(L(data), fontsByName, cmaps)
    }
    pages.push(text)
  }
  return pages
}

export function extractText(buf) {
  return extractPages(buf).join('\n')
}

// Rough integrity signal: share of Thai codepoints among visible characters.
// A healthy Thai document sits high; the damaged sample sits far lower.
export function thaiRatio(text) {
  const visible = text.replace(/\s/g, '')
  if (!visible.length) return 0
  const thai = visible.match(/[฀-๿]/g) || []
  return thai.length / visible.length
}
