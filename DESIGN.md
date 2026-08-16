---
name: ตรวจรู้ TruatRoo — the ledger world
description: A teacher's ruled record book, not a SaaS dashboard — findings are ledger lines you add, never a page you rewrite.
colors:
  paper: "#f5f1e6"
  paper-deep: "#ece5d3"
  card: "#fbf8f0"
  card-white: "#fffdf7"
  rule: "#c3cedb"
  rule-strong: "#94a7bd"
  ink: "#24211a"
  ink-soft: "#5c5646"
  ink-faint: "#948c72"
  red: "#ab332d"
  red-deep: "#832722"
  red-bg: "#f5e2df"
  amber: "#93650f"
  amber-bg: "#f3e6c4"
  green: "#2f6d4a"
  green-deep: "#234f37"
  green-bg: "#e2ebe0"
  blue-ink: "#35577a"
  blue-bg: "#e2eaf1"
  blue-text: "#1f3a52"
  blue-border: "#b9cde0"
  amber-text: "#5c4009"
  amber-border: "#d9c07f"
  red-border: "#d9a9a4"
  green-border: "#b9d2bc"
typography:
  display:
    fontFamily: "Be Vietnam Pro, Noto Sans Thai, Noto Sans, Sarabun, system-ui, sans-serif"
    fontSize: "38px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Be Vietnam Pro, Noto Sans Thai, Noto Sans, Sarabun, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.35
  title:
    fontFamily: "Be Vietnam Pro, Noto Sans Thai, Noto Sans, Sarabun, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "Noto Sans Thai, Noto Sans, Sarabun, Leelawadee UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Be Vietnam Pro, Noto Sans Thai, Noto Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.04em"
  ledger-numeral:
    fontFamily: "Space Mono, ui-monospace, Cascadia Code, Consolas, monospace"
    fontSize: "19px"
    fontWeight: 700
rounded:
  sm: "2px"
  md: "3px"
  lg: "4px"
  xl: "5px"
  full: "9999px"
spacing:
  edge-left: "81px"
  edge-right: "76px"
  gutter: "24px"
  margin-col: "52px"
  spine: "9px"
components:
  button-primary:
    backgroundColor: "{colors.red-deep}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.md}"
    padding: "11px 20px"
  button-primary-hover:
    backgroundColor: "{colors.red}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  stamp-red:
    backgroundColor: "transparent"
    textColor: "{colors.red}"
    rounded: "{rounded.full}"
  stamp-green:
    backgroundColor: "transparent"
    textColor: "{colors.green}"
    rounded: "{rounded.full}"
---

# Design System: ตรวจรู้ TruatRoo — the ledger world

## Overview

**Creative North Star: "The School Ledger" (สมุดพก)**

This system replaced an earlier teal/blue Material-style SaaS dashboard (still documented at `docs/design/stitch_multi_page_website_generator/truatroo_design_system/DESIGN.md`, kept as historical reference, not current). That system was refined once and still read as generic AI-tool output. This one starts from a different question: what object does a Thai teacher already trust to hold a permanent, growing record of her own decisions? The answer is a ledger — the ruled record book every teacher has kept a version of her whole career.

The product's hardest-to-explain constraint — the system never rewrites a plan, it only proposes lines to add — stops being a rule you have to state and becomes the object itself. A ledger is append-only by nature: you don't erase a line, you add the next one. `แผนของฉัน` (the history screen) is literally her growing ledger of past plans. A finding is a numbered ledger line. Accepting it is a green ink stamp; rejecting it fades the line to gray, never removes it.

This is a warm-paper world, but it earns paper deliberately — the subject *is* a physical paper record, not a decorative choice — and it refuses the warm-cream-plus-serif-plus-italic combination that would read as generic "bookish AI." Type stays a clean grotesk throughout; no serif, no italic, no lamplight. The only ornamental device is the ink stamp, and it is used sparingly.

**Key Characteristics:**
- Warm paper ground, near-black ink body text, red/amber/green ink for status — never a filled Material color chip.
- Near-square corners everywhere (2–5px). This is a document, not an app shell.
- A persistent red "bound spine" bar down the left edge of the viewport (`body::before`) — the one constant, physical cue that this is a bound book, not a floating window.
- Ink-stamp badges: an outlined, rotated ring in one ink color, never a filled pill. This is the system's signature device.
- Tabular, monospaced (Space Mono) numerals for anything counted or measured: row numbers, durations, statistics.

## Colors

Ink on paper, with three status inks (red, amber, green) that never fill a background solid — they outline and mark, the way a pen does.

### Primary
- **Ledger Red** (`#ab332d`, deep variant `#832722`): the primary ink. Used for the bound spine, primary buttons, high-severity marks, the brand wordmark, and every "this needs attention" signal. This is the one color allowed to fill a solid background (buttons only).

### Secondary
- **Ledger Green** (`#2f6d4a`, deep `#234f37`): the "accepted / added" ink. Used only for the diff view's added content and the "inserted" decision state — it marks what the teacher chose to add, never a generic success color.
- **Ledger Amber** (`#93650f`): the "medium severity / caution" ink. Used for medium-priority findings and warning notices.

### Tertiary
- **Ledger Blue** (`#35577a`): reserved for neutral informational notices only (`.notice.info`) — the one ink that carries no severity judgment.

### Neutral
- **Paper** (`#f5f1e6`): the page background — warm, not sterile white, not sepia.
- **Paper Deep** (`#ece5d3`): recessed surfaces — dropzones, disabled areas, the technical-view panel.
- **Card / Card White** (`#fbf8f0` / `#fffdf7`): record-card surfaces, a shade lighter than the page they sit on.
- **Ink** (`#24211a`): body text. Warm near-black, never pure `#000`.
- **Ink Soft / Ink Faint** (`#5c5646` / `#948c72`): secondary text and the faint row-number color for uncounted lines.
- **Rule / Rule Strong** (`#c3cedb` / `#94a7bd`): the horizontal and vertical ruled lines throughout — borders, dividers, the diff T-account center line.

### Status Text & Border Tints
Each status ink (red, amber, green, blue) has a darker text variant and a lighter border variant, used together on `.notice`, `.confirm-overview`, and `.summary-bar`: **Blue Text** (`#1f3a52`) / **Blue Border** (`#b9cde0`), **Amber Text** (`#5c4009`) / **Amber Border** (`#d9c07f`), **Red Border** (`#d9a9a4`, text reuses Ledger Red Deep), **Green Border** (`#b9d2bc`, text reuses Ledger Green Deep).

### Named Rules
**The Outline-Only Rule.** Status ink (red/amber/green) marks by outline, dot, or text color — never as a filled background — except on the primary action button and the diff-new panel's soft tint. A filled colored badge is the old Material system's habit; this system stamps, it doesn't paint.

## Typography

**Display/Headline Font:** Be Vietnam Pro (falls back to Noto Sans Thai, since Be Vietnam Pro carries no Thai glyphs and Thai runs render in Noto Sans Thai regardless of the stack order)
**Body Font:** Noto Sans Thai
**Ledger-numeral Font:** Space Mono — reserved for counted or measured things only (row numbers, durations, statistics, PA codes), never for prose or "technical" costume.

**Character:** A working grotesk pairing with no decorative flourish; everything unusual about this system is in color, shape, and the stamp device, not in the letterforms. Thai line-height stays generous (1.5–1.7×) throughout to protect vowel and tone-mark clarity.

### Hierarchy
- **Display** (700, 38px, 1.3): hero `<h1>` on landing-style screens (`.hero h1`).
- **Headline** (700, 30px, 1.35): section headings (`h2`, `.step-title h1`).
- **Title** (700, 19px, 1.5): card and finding titles (`h3`).
- **Body** (400, 16px, 1.6): all prose; measure stays inside the card/column width (≤600px in practice).
- **Label** (700, 12px, uppercase, 0.04em tracking): stamp text, section eyebrows on info panels, form field labels.
- **Ledger numeral** (700, 19px, tabular): finding row numbers (`.fnum`), statistics (`.hist-stats .n`), meta chips, PA table figures.

### Extended Size Scale
The frontmatter's five roles (display/headline/title/body/label) are the canonical hierarchy; a real interface also needs intermediate steps for chips, captions, table cells, and secondary headings. These are legitimate, deliberate steps on the same scale, not undocumented drift:

| Size | Used for |
|---|---|
| 13.5px | Small labels: form field labels, meta captions, evidence-line text, hist-card meta |
| 14.5px | Compact UI text: reason chips, secondary buttons at small scale, notices |
| 15px | Base UI text: field values, `.muted`, checklist rows, textarea |
| 17.5px | Hero paragraph, tagline-adjacent lead text |
| 18px | `.lead` |
| 21px | Finding card title (`.finding h3`) |
| 22px | Detail-screen method name (`h3` inline override) |
| 23px | Brand wordmark, PA-screen finding-detail-adjacent title |
| 26px | Entry-card title (`.entry h3`) |
| 32px | The decorative quotation-mark glyph on `.quote::before` — a single oversized character, not a text-hierarchy role |

### Named Rules
**The One Face Rule.** Only two families carry the interface: Be Vietnam Pro/Noto Sans Thai for everything read as prose or label, Space Mono for everything read as a count or measurement. No third display face.

## Layout

Full-bleed, edge to edge, matching the header bar. The centered `1120px` column from the first cut of this redesign read as a narrow ledger floating in empty margins once the header's own full-bleed bar sat above it; the body now shares the header's edge padding (`81px` left, clearing the spine, `76px` right) instead of capping at a fixed width. Every screen (9 total, spec'd in `docs/design/input-output-spec.md`) inherits this from `.wrap`; grids inside it are already `fr`-based so they gain breathing room on wide viewports rather than breaking.

**The margin column.** Findings render as ledger lines: a fixed `52px` margin column (`.fmargin`) holds the row number, separated from the entry body by a vertical rule. This collapses to `36px` under `860px`.

**The spine.** A `9px` (`6px` under `640px`) red bar is fixed to the left edge of the viewport for the life of the session — the one element that never scrolls, never hides, and is present on every screen.

**Density:** unchanged from the prior implementation — one primary action path per screen, disclosure (`<details>`) for optional or advanced content, three-card and two-column grids collapsing to a single column under `1020px`/`860px`.

## Elevation & Depth

Paper resting on a desk, not Material's floating tonal layers. Shadows are soft, low-contrast, and always paired with a `1px` ink-tint border — the border does the separating; the shadow only adds weight.

### Shadow Vocabulary
- **Page level** (`box-shadow: 0 1px 0 rgba(36,33,26,.07), 0 8px 18px -6px rgba(36,33,26,.16)`, token `--lvl1`): the default for cards, entries, and record panels.
- **Emphasis level** (`box-shadow: 0 1px 0 rgba(36,33,26,.09), 0 14px 30px -8px rgba(36,33,26,.22)`, token `--lvl2`): the recommended entry card only.
- **Letterpress** (`box-shadow: 0 2px 0 rgba(36,33,26,.28)`, collapsing to none on `:active`): the primary button's press-down feedback — a stamp landing, not a card lifting.

### Named Rules
**The Border-Before-Shadow Rule.** Every elevated surface carries a `1–1.5px` ink-tint border first; the shadow is a secondary, low-contrast cue, never the only thing separating a card from the page.

## Shapes

Near-square throughout: `2–5px` radius on every card, button, and input (`--r-sm` through `--r-xl`). This is a deliberate reversal of the prior system's `8–16px` Material rounding — a document doesn't have soft corners. The one true `full` radius is reserved for the ink-stamp ring, the reason chips, and the pill-shaped tagline — small circular or capsule marks, not containers.

Double-line rules (`border-bottom: 3px double`) mark structural boundaries that matter most: under the header, under the footer's top edge, and under each plan-diff stage heading — borrowed from a ledger's own ruled-header convention.

### Named Rules
**The Ring, Not the Fill Rule.** Status and recommendation marks are rings (`.stamp`, `.badge.rec`, severity badges) — a `1.5–1.6px` outline in one ink color, rotated `-3deg`, never a filled shape. A filled colored badge belongs to the retired Material system.

## Components

### Buttons
- **Shape:** `3px` radius (`--r`), never full-round. A rounded pill button reads as consumer-app; this product is explicitly positioned as a tool, and the prior system already made this call for the same reason — this redesign kept it.
- **Primary:** solid Ledger Red Deep (`#832722`) background, cream text, a `2px` letterpress shadow that compresses to `0` on `:active` with a `2px` downward translate — the button visually "stamps" when pressed.
- **Secondary:** `1.5px` ink-outline, transparent fill, ink text.
- **Ghost:** no border or fill, ink-soft text, paper-deep background on hover.

### Ink Stamps (signature component)
`.stamp` and the recommendation/severity badges (`.badge.rec`, `.badge.high`, `.badge.medium`): a `1.5–1.6px` currentColor ring, `9999px` radius, uppercase `11.5px` label text, `-3deg` rotation, no fill. This is the one place the system allows itself a flourish, and it is used only for status/recommendation marks — never for navigation, never for decoration.

### Ledger Lines (signature component)
`.card.finding`: a two-column grid, `52px` margin column + body. The margin holds a tabular row number (`.fnum`) that turns red or amber to echo the finding's severity. This replaced the prior system's plain "numbered rank badge in the card header" — the number is now structural, not decorative.

### Cards / Containers
- **Corner Style:** `4–5px` (`--r-lg` / `--r-xl`).
- **Background:** `--card` (`#fbf8f0`) on `--paper` (`#f5f1e6`) — one step lighter than the page, never a hard white-on-color jump.
- **Shadow Strategy:** `--lvl1`, bordered first (see Elevation & Depth).
- **Border:** `1px` `--ink-line` (12% ink) by default; the recommended entry card and the diff-new panel step up to `1.5–2px` in their status ink.

### Diff View (signature component)
`.diff`: two ledger columns side by side (a T-account), separated by a `1px` center rule (`.diff::before`). The left ("แผนการสอนเดิม") stays plain paper; the right ("ข้อเสนอแนะเพิ่มเติม") gets a green-ink border and tint plus a filled green circle bearing a `+` icon and a green stamp badge reading "แนะนำ" — this directly implements the product's own diff-only design constraint (see `docs/design/input-output-spec.md` §3.5) as the page's visual thesis.

### Inputs / Fields
- **Style:** `1.5px` rule-strong border, `3px` radius, card-white fill.
- **Focus:** `2px` red outline, `1px` offset.

### Navigation
Ink-soft text, `600` weight, red-deep underline on the active screen (`nav.main .nav-link.on`). The step-progress bar (`.pbar`) is a row of thin ruled ledger-tab dividers that fill red as the teacher advances — not a Material progress bar.

## Do's and Don'ts

### Do:
- **Do** keep every ink-stamp ring outlined, never filled — filled color is reserved for the primary button and the diff-new tint only.
- **Do** use Space Mono only for counted/measured values (row numbers, durations, statistics); prose and labels stay in the Be Vietnam Pro / Noto Sans Thai pairing.
- **Do** keep corner radii at 2–5px; a rounded-pill container anywhere but a stamp, chip, or the tagline is a regression to the retired Material system.
- **Do** keep the spine bar (`body::before`) present and unscrolled on every screen — it is the one constant that makes this read as a bound object rather than a page.

### Don't:
- **Don't** reintroduce filled Material-style badge pills (`background: var(--primary); color: #fff` on a status chip) — that is the retired system's device, not this one's.
- **Don't** add a second display typeface. Every new "important" moment is solved with size, weight, ink color, or the stamp ring — not a new font.
- **Don't** treat the `docs/design/stitch_multi_page_website_generator/truatroo_design_system/DESIGN.md` teal/blue system as current guidance for `prototype/index.html`; it documents the retired look and is kept only as historical record.
- **Don't** add rounded (>5px) corners to cards, buttons, or panels without a named, deliberate exception — the near-square corner is a core identity commitment of this world, not a default worth softening for "friendliness."
