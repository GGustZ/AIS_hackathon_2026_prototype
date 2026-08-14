# โครงสร้างข้อมูลรายตาราง

อ้างอิงโครงในเอกสาร `05_Input_Output_Spec.md` ส่วนที่ 2

**บันทึกการตัดสินใจ 13 ส.ค. 2569:** หน้าจอที่ 1 รองรับสองทางเข้า ครูที่มีแผนอยู่แล้วให้อัปโหลด ครูที่ยังไม่มีแผนเริ่มจากเอกสารเปล่าได้ ระบบร่างให้จากคลัง ผลคือ `PLAN.source` ต้องมีสามค่า และหน้าจอ 1 มีสองรูปแบบ (ดูท้ายเอกสาร)

---

## แผนภาพความสัมพันธ์

```
กลุ่ม ก  คลังอ้างอิง สร้างล่วงหน้า

   DB1 CURR ──┐
              │
   DB3 MAP ───┼──→ DB2 MISC ──┬──→ DB6 ITEM
              │               │
              │               ├──→ EVID_MISC ───┐
              │               │                 ├─→ DB5 EVID
              │               │   EVID_METHOD ──┘
              │               ↓
              └────────→ DB4 METHOD

กลุ่ม ข  ข้อมูลจากการใช้งาน

   DB7 PLAN ──→ (เทียบกับ DB1 DB2 DB8) ──→ DB8 HIST
                                              │
                                              ↓
                                    VIEW teacher_profile
```

---

# DB1 CURR หลักสูตรและตัวชี้วัด

สาธารณะ สกัดจาก PDF ครั้งเดียว ไม่มีใครเขียนทับ

| ฟิลด์ | ชนิด | ตัวอย่าง | หมายเหตุ |
|---|---|---|---|
| `curr_code` | TEXT PK | `ว 2.2 ป.5/1` | รหัสทางการ ใช้เป็น key ทั้งระบบ |
| `subject_group` | TEXT | วิทยาศาสตร์และเทคโนโลยี | |
| `strand` | TEXT | สาระที่ 2 วิทยาศาสตร์กายภาพ | |
| `standard` | TEXT | ว 2.2 | |
| `grade` | TEXT | ป.5 | |
| `seq` | INT | 1 | ลำดับในมาตรฐานนั้น |
| `indicator_text` | TEXT | ข้อความตัวชี้วัดเต็ม | |
| `core_content` | TEXT[] | สาระการเรียนรู้แกนกลาง | |
| `prereq_codes` | TEXT[] | `["ว 2.2 ป.4/1"]` | **ตัวชี้วัดที่ควรผ่านมาก่อน** |
| `curriculum_version` | TEXT | `2560` | |

`prereq_codes` มีค่ามากกว่าที่เห็น มันทำให้ระบบพูดได้ว่า "หน่วยนี้ต่อยอดจาก ว 2.2 ป.4/1 ถ้าเด็กยังไม่แน่นตรงนั้น จะติดตรงนี้" ซึ่งเป็นคำแนะนำที่ครูสอนหลายชั้นต้องการ

---

# DB2 MISC คลังความเข้าใจผิด

**ทรัพย์สินชิ้นเดียวของทีม** ทีมเขียน คนตรวจรับรอง

| ฟิลด์ | ชนิด | ตัวอย่าง | หมายเหตุ |
|---|---|---|---|
| `misc_id` | TEXT PK | `M-FORCE-01` | **คงที่ตลอดไป ห้ามเปลี่ยน** |
| `name_th` | TEXT | วัตถุที่หยุดนิ่งแปลว่าไม่มีแรงกระทำ | |
| `description_th` | TEXT | สิ่งที่นักเรียนเชื่อจริงๆ | |
| `correct_concept` | TEXT | สิ่งที่ถูกต้อง | ใช้เขียนคำอธิบายให้ครู |
| `symptom` | TEXT[] | อาการที่สังเกตได้ (พูดว่าอะไร เขียนว่าอะไร วาดว่าอะไร) | |
| `frequency` | ENUM | high / medium / low | ใช้จัดอันดับความรุนแรง |
| `persistence` | ENUM | high / medium / low | **ทนต่อการสอนแค่ไหน** |
| `grade_band` | TEXT | ป.4-ม.1 | ช่วงที่พบ ไม่ใช่ชั้นเดียว |
| `prerequisite_misc` | TEXT[] | ความเข้าใจผิดที่เป็นต้นเหตุของอันนี้ | |
| `status` | ENUM | verified / candidate | |
| `created_by` | ENUM | seed / teacher_cluster | |
| `reviewed_by` | TEXT | ชื่อผู้รับรอง | |

**`persistence` เป็นฟิลด์ที่กำหนดกฎการเลือกวิธี** ความเข้าใจผิดที่ทนสูง (เรื่องแรงเป็นตัวอย่างคลาสสิก) การอธิบายชัดๆ ไม่พอ ต้องใช้ Cognitive Conflict ส่วนที่ทนต่ำแค่สอนใหม่ให้ชัดก็หาย ถ้าไม่แยกสองอย่างนี้ ระบบจะแนะนำกิจกรรมหนักเกินจำเป็น

**`status = candidate`** คือกลไกให้คลังโตเอง รายการที่มาจากการจัดกลุ่มคำตอบครูจะเข้ามาเป็น candidate ก่อน และไม่ถูกใช้แนะนำจนกว่าคนจะรับรอง ถ้าไม่มีฟิลด์นี้ taxonomy จะแตกเป็นพันรายการภายในหนึ่งเทอมแล้วนับรวมไม่ได้

---

# DB3 MAP ตารางเชื่อมความเข้าใจผิดกับตัวชี้วัด

แยกออกมาเป็นตารางของตัวเอง ไม่ใช่ฟิลด์ใน MISC

| ฟิลด์ | ชนิด | ตัวอย่าง |
|---|---|---|
| `map_id` | SERIAL PK | |
| `misc_id` | FK → MISC | `M-FORCE-01` |
| `curr_code` | FK → CURR | `ว 2.2 ป.5/1` |
| `curriculum_version` | TEXT | `2560` |
| `relevance` | ENUM | primary / secondary |
| `note` | TEXT | |

**เหตุผลที่ต้องแยก:** สพฐ. นำร่องหลักสูตรฐานสมรรถนะใน ป.4-6 ปีการศึกษานี้ พอเปลี่ยน คุณเขียน MAP ชุดใหม่ที่มี `curriculum_version` ใหม่ โดย MISC และ HIST ไม่ต้องแตะเลย

ความเข้าใจผิดเรื่องแรงไม่เปลี่ยนตามหลักสูตร สิ่งที่เปลี่ยนคือรหัสราชการ

---

# DB4 METHOD คลังวิธีสอน

จากชีต 110 แถวเดิม 4 หมวด พร้อมฟิลด์ที่ยังว่างอยู่

| ฟิลด์ | ชนิด | ตัวอย่าง | หมายเหตุ |
|---|---|---|---|
| `method_id` | TEXT PK | `T-CC-01` | |
| `db_category` | ENUM | model / strategy / activity / assessment | **คือ 4 ฐานเดิมของคุณ** |
| `major_type` | TEXT | Conceptual | |
| `name_en` | TEXT | Cognitive Conflict | |
| `name_th` | TEXT | | |
| `variant` | TEXT | Prediction → Evidence → Revision | |
| `steps` | TEXT[] | ขั้นตอนเรียงลำดับ | |
| `duration_min` | INT | 10 | |
| `materials` | TEXT[] | | ว่าง = ไม่ต้องใช้อะไร |
| `requires_lab` | BOOL | false | |
| `requires_internet` | BOOL | false | |
| `class_size_min/max` | INT | | |
| `grade_band` | TEXT | | |
| **`addresses_misc`** | TEXT[] FK | `["M-FORCE-01","M-FORCE-03"]` | **คอลัมน์ที่ว่างอยู่ในชีต** |
| **`when_to_use`** | TEXT | | **คอลัมน์ที่ว่างอยู่ในชีต** |
| **`not_suitable_when`** | TEXT | | ข้อจำกัดที่พูดตรงๆ |
| `plan_stage` | ENUM | ขั้นนำ / ขั้นสอน / ขั้นสรุป | **แทรกตรงไหนของแผน** |
| `compatible_with` | TEXT[] | | |
| `incompatible_with` | TEXT[] | | เช่น Direct Instruction ขัดกับ Open Inquiry |

สามฟิลด์ที่ตัวหนาคือส่วนที่ทำให้ตารางนี้เป็น recommender แทนที่จะเป็นรายชื่อวิธีสอน

**`plan_stage` เป็นของใหม่ที่ชีตยังไม่มี** และขาดไม่ได้ในดีไซน์นี้ เพราะ output คือ "แทรกตรงไหน" ไม่ใช่แค่ "ใช้อะไร"

---

# DB5 EVID หลักฐานงานวิจัย

กรอกตอนสร้าง ไม่ใช่ดึงสดตอนรัน

| ฟิลด์ | ชนิด | ตัวอย่าง |
|---|---|---|
| `evid_id` | TEXT PK | |
| `citation` | TEXT | |
| `year` | INT | |
| `type` | ENUM | meta-analysis / RCT / quasi-exp / case / review / textbook |
| `population` | TEXT | ระดับชั้น ประเทศ จำนวนตัวอย่าง |
| `finding` | TEXT | |
| `effect_size` | TEXT nullable | |
| `quality` | ENUM | high / medium / low |
| **`thai_context_note`** | TEXT | **งานนี้ทำในบริบทไหน โอนมาไทยได้แค่ไหน** |
| `url` | TEXT | |

ตารางเชื่อมสองตัว: `EVID_MISC(evid_id, misc_id)` และ `EVID_METHOD(evid_id, method_id)`

**`thai_context_note` คือฟิลด์ที่ตอบจุดอ่อนข้อ 3 ของข้อเสนอโดยตรง** (การแม็ปงานวิจัยตะวันตกเข้าบริบทไทยยังไม่ได้ทำ) การมีช่องนี้และกรอกว่า "งานนี้ทำกับนักเรียนอเมริกัน ยังไม่มีการทดสอบซ้ำในไทย" ได้คะแนนมากกว่าการไม่มีช่อง

**กฎที่ต้องเขียน:** ถ้า `quality = low` ระบบยังแนะนำได้ แต่ต้องลดอันดับและแสดงคำเตือน ห้ามซ่อน ถ้ามีฟิลด์แต่ไม่มีกฎ คุณมีคอลัมน์ ไม่ได้มีความต่าง

---

# DB6 ITEM คลังข้อวัด

| ฟิลด์ | ชนิด | ตัวอย่าง |
|---|---|---|
| `item_id` | TEXT PK | `I-FORCE-002` |
| `curr_code` | FK → CURR | |
| `stem` | TEXT | หนังสือวางนิ่งบนโต๊ะ ข้อใดถูกต้อง |
| `options` | JSON | ดูด้านล่าง |
| `item_type` | ENUM | mcq / short / drawing |
| `dok_level` | INT 1-4 | |
| `pisa_skill` | TEXT | Explain scientifically |
| `pass_threshold` | FLOAT | 0.70 |
| `est_time_sec` | INT | 60 |

```json
"options": [
  {"label":"ก","text":"มีแรงโน้มถ่วงและแรงจากโต๊ะ ขนาดเท่ากัน ทิศตรงข้าม",
   "is_correct":true,  "misc_id":null},
  {"label":"ข","text":"ไม่มีแรงกระทำ เพราะหนังสือไม่เคลื่อนที่",
   "is_correct":false, "misc_id":"M-FORCE-01"},
  {"label":"ค","text":"มีแรงโน้มถ่วงอย่างเดียว",
   "is_correct":false, "misc_id":"M-FORCE-04"},
  {"label":"ง","text":"มีแรงจากโต๊ะอย่างเดียว",
   "is_correct":false, "misc_id":"M-FORCE-05"}
]
```

**ตัวลวงทุกตัวต้องมี `misc_id`** ตัวเลือกผิดที่ไม่ผูกกับอะไรคือตัวเลือกที่อ่านผลไม่ได้ ถ้าออกแบบตอนนี้ให้ถูก เฟส 2 จะปิดลูปได้โดยไม่ต้องแก้อะไรเลย

`dok_level` และ `pisa_skill` คือที่ที่ taxonomy ทั้งสามถูกใช้จริง เป็นชั้นเทียบระดับความยากของข้อ ไม่ใช่ชั้นวินิจฉัย

---

# DB7 PLAN แผนการสอนที่แยกโครงแล้ว

สิ่งของหลักของทั้งโปรดักต์

| ฟิลด์ | ชนิด | หมายเหตุ |
|---|---|---|
| `plan_id` | UUID PK | |
| `teacher_id` | FK | |
| `source` | ENUM | **uploaded / generated / blank_template** |
| `file_ref` | TEXT | ไฟล์ต้นฉบับ |
| `unit_name` | TEXT | |
| `subject`, `grade` | TEXT | |
| `periods` | INT | จำนวนคาบ |
| `minutes_per_period` | INT | |
| `curr_codes` | TEXT[] | สกัดจากหัวกระดาษ หรือถามครั้งเดียว |
| `key_concept` | TEXT | สาระสำคัญ |
| `objectives` | JSON | `[{"type":"K","text":"..."}]` แยก K / P / A |
| `content` | TEXT | สาระการเรียนรู้ |
| `activities` | JSON | ดูด้านล่าง |
| `materials` | TEXT[] | ใช้อนุมานข้อจำกัดอุปกรณ์ |
| `assessment` | JSON | `[{"method":"","instrument":"","criteria":""}]` |
| `post_note` | TEXT | บันทึกหลังสอน ถ้ามี |
| `extraction_confidence` | JSON | ความมั่นใจรายฟิลด์ |
| `created_at` | TIMESTAMP | |

```json
"activities": [
  {"stage":"ขั้นนำ",  "order":1, "text":"...", "duration_min":10},
  {"stage":"ขั้นสอน", "order":2, "text":"...", "duration_min":30},
  {"stage":"ขั้นสรุป","order":3, "text":"...", "duration_min":10}
]
```

**`extraction_confidence` รายฟิลด์ ไม่ใช่รายไฟล์** การอ่านเอกสารคือส่วนที่เสี่ยงที่สุดของระบบ ฟิลด์ที่มั่นใจต่ำต้องถามครูให้ยืนยัน ไม่ใช่เดาเงียบๆ แล้วเอาไปเปรียบเทียบ

**`source = blank_template`** คือเคสที่ทีมเพิ่งตกลงกัน ครูที่ยังไม่มีแผนเริ่มจากเอกสารเปล่า ระบบร่างให้จาก CURR + MISC + METHOD

---

# DB8 HIST ประวัติและการตัดสินใจของครู

| ฟิลด์ | ชนิด | หมายเหตุ |
|---|---|---|
| `event_id` | UUID PK | |
| `teacher_id` | FK | |
| `plan_id` | FK → PLAN | |
| `comparator` | ENUM | curriculum / misconception / history |
| `severity` | ENUM | high / medium / low |
| `misc_id` | FK nullable | |
| `method_id` | FK nullable | |
| `action` | ENUM | inserted / rejected / requested_variant / ignored |
| `reject_reason` | ENUM | no_time / no_materials / not_suitable / disagree / other |
| `shown_at` | TIMESTAMP | |
| `acted_at` | TIMESTAMP | |

**คู่ `shown_at` กับ `acted_at` ให้ตัวเลขที่คุณจะโดนถามพอดี** มันคือ "ครูใช้เวลาตัดสินใจกี่วินาที" ซึ่งเป็นหลักฐานตรงของคำเคลมเรื่องลดเวลา และเก็บได้ฟรีตั้งแต่วันแรก

`reject_reason` เป็น enum ไม่ใช่ free text เพราะต้องนับรวมได้

---

# VIEW teacher_profile ไม่ใช่ตาราง

คำนวณจาก PLAN + HIST ไม่มีฟอร์มให้กรอก

| ค่า | คำนวณจาก | ใช้ทำอะไร |
|---|---|---|
| `typical_period_minutes` | ค่าฐานนิยมของ `PLAN.minutes_per_period` | กรองวิธีที่ใช้เวลาเกินคาบ |
| `grades_taught`, `subjects_taught` | จาก PLAN ทั้งหมด | ขอบเขต |
| `detail_level` | ความยาวเฉลี่ยของ `activities.text` | ปรับความละเอียดของข้อเสนอให้เข้ากับสไตล์ |
| `frequent_activities` | ประเภทกิจกรรมที่พบบ่อยในแผนของเขา | ใช้ในตัวเปรียบเทียบที่ 3 |
| `constraint_profile` | นับ `HIST.reject_reason` | **ถ้าปฏิเสธเพราะไม่มีอุปกรณ์ 5 ครั้ง เลิกแนะนำวิธีที่ต้องใช้อุปกรณ์** |

แถวสุดท้ายคือการปรับให้เข้ากับครูโดยไม่ขอข้อมูลเพิ่มแม้แต่ช่องเดียว ครูไม่เคยบอกว่าโรงเรียนไม่มีอุปกรณ์ ระบบเรียนรู้จากปุ่มที่เขากด

---

# REF taxonomy.json ไฟล์อ้างอิงคงที่ ไม่ใช่ตาราง

`taxonomy.json` เก็บ Bloom 6 ระดับ, DOK 4 ระดับ, PISA science skills 4 domain 21 skills

ไม่มีใครเขียน ไม่เคยเปลี่ยน อ่านอย่างเดียว ใช้ติดป้าย `ITEM.dok_level` และ `ITEM.pisa_skill`

**แก้ที่ต้องทำในชีตปัจจุบัน:** แถว Bloom ระดับ 6 เขียนว่า "5. ประเมิน" ซ้ำ ทั้งที่ภาษาอังกฤษคือ Create ต้องเป็น "6. สร้างสรรค์"

---

# ภาคผนวก ผลจากการรองรับเอกสารเปล่า

ทางเข้าสองทางทำให้**หน้าจอ 1 มีสองรูปแบบ** ต้องออกแบบทั้งคู่ อย่าใช้หน้าเดียวแล้วปล่อยให้ครูที่ไม่มีแผนเจอหน้าจอที่ว่างเปล่า

| ทางเข้า | `PLAN.source` | หน้าจอ 1 แสดงอะไร |
|---|---|---|
| มีแผนอยู่แล้ว | uploaded | **diff** ไม่เกิน 3 รายการ ว่าแผนขาดอะไร |
| ยังไม่มีแผน | blank_template | **ร่างแผน** พร้อมส่วน "หน่วยนี้เด็กมักติด 3 อย่าง" เด่นที่สุดบนหน้า |

**ทางที่สองคือทางที่ ChatGPT แข่งตรงที่สุด** เพราะ output เป็นแผนที่สร้างขึ้นใหม่เหมือนกัน ดังนั้นส่วนความเข้าใจผิดต้องอยู่**บนสุด**ของหน้า ไม่ใช่ท้ายแผน ถ้าวางไว้ท้าย ครูจะอ่านแผนแล้วปิด แล้วไม่เห็นสิ่งเดียวที่ทำให้เราต่าง

ทางแรกป้องกันตัวเองได้ดีกว่า เพราะ ChatGPT ไม่รู้ว่าแผนของครูขาดอะไรเมื่อเทียบกับคลังที่คัดมา

**ข้อเสนอสำหรับเดโม:** โชว์ทางแรกเป็นพระเอก แล้วพูดถึงทางที่สองเป็นทางเลือกสำหรับครูใหม่ เพราะทางแรกคือทางที่ตอบคำถาม "ต่างจาก ChatGPT ยังไง" ได้โดยไม่ต้องอธิบาย
