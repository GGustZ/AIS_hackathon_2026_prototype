// Build a synthetic lesson plan for testing the upload path.
//
//   node tools/make-sample.mjs
//
// Every name in this file is invented. The real sample plan in data/samples/
// carries a real school, teacher and classroom and stays gitignored, so this
// stands in for it and is safe to commit and publish.
//
// The content is deliberately imperfect in ways the comparators should catch:
//   - the Engage answer key says roots absorb food from the soil  (M-PHOTO-01)
//   - the quiz answer says plants only respire at night           (M-PHOTO-03)
//   - the last three 5E stages carry no timing at all
// If you change this file, re-run tools/selftest.mjs to see what moves.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const p = (...a) => path.join(ROOT, ...a)
const { zip } = await import(pathToFileURL(p('prototype', 'lib.js')).href)

const LINES = [
  ['แผนการจัดการเรียนรู้', 1],
  ['กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี', 0],
  ['โรงเรียนบ้านหนองแสงวิทยา (ตัวอย่างสมมติ)   ระดับชั้นมัธยมศึกษาปีที่ 1', 0],
  ['ครูผู้สอน นางสาวสมหญิง ใจซื่อ (ตัวอย่างสมมติ)', 0],
  ['หน่วยการเรียนรู้ที่ 4 การดำรงชีวิตของพืช', 1],
  ['เรื่อง การสังเคราะห์ด้วยแสง', 0],
  ['เวลา 1 คาบ (50 นาที)', 0],
  ['', 0],

  ['1. มาตรฐานการเรียนรู้และตัวชี้วัด', 1],
  ['มาตรฐาน ว 1.2 เข้าใจสมบัติของสิ่งมีชีวิต หน่วยพื้นฐานของสิ่งมีชีวิต', 0],
  ['ตัวชี้วัด ว 1.2 ม.1/6-8', 0],
  ['', 0],

  ['2. สาระสำคัญ', 1],
  ['การสังเคราะห์ด้วยแสงเป็นกระบวนการที่พืชสร้างอาหารโดยใช้แสง แก๊สคาร์บอนไดออกไซด์ ' +
   'คลอโรฟิลล์ และน้ำ ผลผลิตที่ได้คือน้ำตาลและแก๊สออกซิเจน ' +
   'นอกจากนี้กระบวนการสังเคราะห์ด้วยแสงยังเป็นกระบวนการผลิตแก๊สออกซิเจนออกสู่บรรยากาศ ' +
   'ให้สิ่งมีชีวิตอื่นได้ใช้ในการหายใจ', 0],
  ['', 0],

  ['3. จุดประสงค์การเรียนรู้', 1],
  ['ด้านความรู้ (K) นักเรียนระบุปัจจัยที่จำเป็นและผลผลิตของการสังเคราะห์ด้วยแสงได้', 0],
  ['ด้านทักษะ (P) นักเรียนเขียนสมการอย่างง่ายของการสังเคราะห์ด้วยแสงได้', 0],
  ['ด้านคุณลักษณะ (A) นักเรียนเห็นคุณค่าของพืชที่มีต่อสิ่งมีชีวิตอื่น', 0],
  ['', 0],

  ['4. สาระการเรียนรู้', 1],
  ['ปัจจัยที่จำเป็นต่อการสังเคราะห์ด้วยแสง ได้แก่ แสง น้ำ แก๊สคาร์บอนไดออกไซด์ และคลอโรฟิลล์', 0],
  ['ผลผลิตของการสังเคราะห์ด้วยแสง ได้แก่ น้ำตาลและแก๊สออกซิเจน', 0],
  ['', 0],

  ['5. กิจกรรมการเรียนรู้ (รูปแบบ 5E)', 1],
  ['5.1 ขั้นสร้างความสนใจ (5 นาที)', 1],
  ['1. ครูนำกระถางต้นไม้มาให้นักเรียนสังเกต แล้วถามว่าต้นไม้ได้อาหารจากที่ใด', 0],
  ['2. ครูสุ่มถามนักเรียน 3 คน แล้วบันทึกคำตอบบนกระดาน', 0],
  ['เฉลยคำถามนำ ข้อ 2 พืชได้อาหารจากดิน โดยรากจะดูดซึมสารอาหารจากดินขึ้นไปเลี้ยงลำต้นและใบ', 0],
  ['', 0],

  ['5.2 ขั้นสำรวจและค้นหา (20 นาที)', 1],
  ['1. นักเรียนรับชมวีดิทัศน์ เรื่อง กระบวนการสังเคราะห์ด้วยแสง', 0],
  ['2. แบ่งกลุ่มนักเรียนกลุ่มละ 4 คน ให้ช่วยกันสรุปปัจจัยและผลผลิตลงในใบงาน', 0],
  ['3. ครูเดินสังเกตการทำงานของแต่ละกลุ่มและให้คำแนะนำ', 0],
  ['', 0],

  ['5.3 ขั้นอธิบายและลงข้อสรุป', 1],
  ['1. ตัวแทนกลุ่มออกมานำเสนอผลการสรุปหน้าชั้นเรียน', 0],
  ['2. ครูอธิบายเพิ่มเติมและเขียนสมการการสังเคราะห์ด้วยแสงบนกระดาน', 0],
  ['', 0],

  ['5.4 ขั้นขยายความรู้', 1],
  ['1. ครูให้นักเรียนเล่นเกมตอบคำถามท้ายบทจำนวน 10 ข้อ', 0],
  ['เฉลยเกม ข้อ 10 ในเวลากลางคืนพืชมีแต่การหายใจเท่านั้น จึงไม่ควรวางต้นไม้ไว้ในห้องนอน', 0],
  ['', 0],

  ['5.5 ขั้นประเมินผล', 1],
  ['1. นักเรียนทำแบบฝึกหัดท้ายบทเป็นรายบุคคล', 0],
  ['', 0],

  ['6. สื่อและแหล่งเรียนรู้', 1],
  ['สไลด์ประกอบการสอน เรื่อง การสังเคราะห์ด้วยแสง', 0],
  ['ใบงานที่ 4.1 ปัจจัยและผลผลิตของการสังเคราะห์ด้วยแสง', 0],
  ['', 0],

  ['7. การวัดและประเมินผล', 1],
  ['ประเมินจากใบงานที่ 4.1 และแบบฝึกหัดท้ายบท เกณฑ์ผ่านร้อยละ 70', 0],
  ['สังเกตการมีส่วนร่วมในการทำงานกลุ่ม', 0],
  ['', 0],

  ['8. บันทึกหลังสอน', 1],
  ['', 0],
]

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const para = ([text, bold]) => text
  ? `<w:p><w:r>${bold ? '<w:rPr><w:b/></w:rPr>' : ''}` +
    `<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`
  : '<w:p/>'

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${
  LINES.map(para).join('')}</w:body></w:document>`

const enc = new TextEncoder()
const blob = zip(new Map([
  ['[Content_Types].xml', enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`)],
  ['_rels/.rels', enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`)],
  ['word/_rels/document.xml.rels', enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`)],
  ['word/document.xml', enc.encode(documentXml)],
]))

const bytes = new Uint8Array(await blob.arrayBuffer())
const dest = p('prototype', 'sample-plan.docx')
fs.writeFileSync(dest, bytes)
console.log(`wrote ${path.relative(ROOT, dest)}  ${(bytes.length / 1024).toFixed(1)} KB, ${LINES.length} paragraphs`)
