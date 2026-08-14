---
name: TruatRoo Design System
colors:
  surface: '#f3faff'
  surface-dim: '#c7dde9'
  surface-bright: '#f3faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e6f6ff'
  surface-container: '#dbf1fe'
  surface-container-high: '#d5ecf8'
  surface-container-highest: '#cfe6f2'
  on-surface: '#071e27'
  on-surface-variant: '#3e494a'
  inverse-surface: '#1e333c'
  inverse-on-surface: '#dff4ff'
  outline: '#6e797a'
  outline-variant: '#bdc9ca'
  surface-tint: '#006970'
  primary: '#006168'
  on-primary: '#ffffff'
  primary-container: '#0d7c84'
  on-primary-container: '#d9fcff'
  inverse-primary: '#7cd4dd'
  secondary: '#516161'
  on-secondary: '#ffffff'
  secondary-container: '#d4e6e5'
  on-secondary-container: '#576867'
  tertiary: '#7a4f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#9a6500'
  on-tertiary-container: '#fff3e8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#98f1f9'
  primary-fixed-dim: '#7cd4dd'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#d4e6e5'
  secondary-fixed-dim: '#b8cac9'
  on-secondary-fixed: '#0e1e1e'
  on-secondary-fixed-variant: '#3a4a49'
  tertiary-fixed: '#ffddb4'
  tertiary-fixed-dim: '#ffb954'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#633f00'
  background: '#f3faff'
  on-background: '#071e27'
  surface-variant: '#cfe6f2'
  success-green: '#2E7D32'
  error-red: '#D32F2F'
  surface-muted: '#F8FAFB'
  highlight-blue: '#E3F2FD'
typography:
  display-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1120px
  gutter: 24px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-gap: 64px
---

## Brand & Style

The design system is crafted for **TruatRoo (ตรวจรู้)**, a specialized EdTech tool for Thai science teachers. The brand personality is **Professional, Supportive, and Focused**. It moves away from the typical "playful/gamified" EdTech aesthetic in favor of a "Productive Assistant" feel—akin to a calm workspace that respects the teacher's time and expertise.

The design style is **Modern Corporate / Minimalist**, characterized by:
- **High Readability:** Prioritizing Thai typography with generous leading and clear hierarchy.
- **Calm Layouts:** Utilizing significant whitespace to prevent cognitive overload during lesson plan analysis.
- **Trust-Based Visuals:** Using soft teal and blue tones to evoke reliability and scientific precision.
- **Subtle Depth:** Using soft shadows and containment to organize information without the "clutter" of heavy borders or loud gradients.

The emotional response should be one of **relief and clarity**: "This tool understands my workflow and helps me improve without making extra work for me."

## Colors

The palette is anchored in **Trustworthy Teals and Blues**.
- **Primary (#0D7C84):** A deep, professional teal used for main actions, headers, and brand identification. It signifies expertise and stability.
- **Secondary (#E0F2F1):** A very light mint-teal used for large surface areas, card backgrounds, or subtle section highlights to keep the UI "airy."
- **Tertiary (#FFB74D):** A soft amber used sparingly for the "แนะนำ" (Recommended) badge or to draw attention to critical misconceptions.
- **Neutral (#455A64):** A cool slate grey for body text and icons, ensuring high legibility without the harshness of pure black.

**Functional Colors:**
- **Success/Error:** Standard tones for confirmation and rejection states.
- **Surface Muted:** Used for background containers to separate the "page" from the "cards."

## Typography

The typography system prioritizes **Thai-first legibility**.
- **Headlines (Be Vietnam Pro):** Chosen for its clean, geometric, and modern construction. It feels professional and contemporary.
- **Body (Noto Sans):** A highly reliable sans-serif that excels in Thai script rendering. It ensures that long-form lesson plans remain readable even on smaller screens.
- **Hierarchy:** We use a clear distinction between "Display" (for hero sections) and "Headline" (for card titles and sections). 

**Notes on Thai Script:**
- Line height is increased (1.5x - 1.6x) for body text to accommodate Thai vowels and tone marks without clipping.
- Avoid using weights below 400 for Thai text to maintain stroke clarity on low-resolution displays.

## Layout & Spacing

The design system employs a **Fixed-Fluid Hybrid Grid**. 
- **Desktop:** A 12-column grid with a maximum content width of 1120px. Centered with large side margins to create a "focused" reading environment.
- **Mobile/Tablet:** Transitions to a fluid single-column layout with 16px lateral margins.
- **Rhythm:** An 8px base unit drives all spacing.
- **The "Two-Card" Rule:** On the entry screen, cards are side-by-side (6 columns each) on desktop and stacked on mobile. The "Recommended" card maintains priority through visual weight, not just size.

**Content Reflow:**
- Lesson plan "diffs" should use a side-by-side view on desktop (>1024px) but transition to an "Above/Below" stacked view on mobile to maintain font size integrity.

## Elevation & Depth

To maintain a professional and clean feel, this design system uses **Tonal Layering** combined with **Ambient Shadows**.

1.  **Level 0 (Background):** A very light neutral or secondary tint (#F8FAFB).
2.  **Level 1 (Cards):** Pure white (#FFFFFF) with a very soft, diffused shadow (15% opacity, 12px blur, 4px Y-offset). This is the primary container for findings and options.
3.  **Level 2 (Active/Prominent):** For the "Recommended" upload card, increase the shadow spread and add a 2px stroke using the primary color at 20% opacity.
4.  **No High-Gloss:** Avoid glassmorphism or heavy gradients. Depth is used strictly to indicate "interactable" vs "informative" layers.

## Shapes

The design system uses a **Rounded** (8px / 0.5rem) corner radius as the standard.
- **Buttons and Inputs:** Use the base 8px radius to feel friendly but structured.
- **Cards:** Use `rounded-lg` (16px / 1rem) to create a distinct container feel that separates different analysis points.
- **Badges:** Use "Pill-shaped" (Full round) for status indicators like "แนะนำ" or "สำคัญ" to differentiate them from buttons.

Avoid sharp 0px corners, as they appear too technical/harsh for an educational environment, and avoid full-round buttons for primary actions to maintain a "tool" rather than "app" aesthetic.

## Components

### Buttons
- **Primary:** Solid Teal (#0D7C84) with White text. Used for "Upload" and "Add to Plan."
- **Secondary:** Outline Primary or Light Teal background. Used for "Try other options."
- **Ghost/Tertiary:** No background, Grey text. Used for "Do not use this suggestion."

### Cards (The "Finding" Card)
- White background, 16px rounded corners.
- Header area with a Label (e.g., "Finding 1") and a Priority Badge.
- A "Diff" section with a soft background color for added content (Success-green at 5% opacity).

### Progress Indicators
- For the file processing state, use a horizontal "Step Progress" bar. Avoid circular spinners which can cause anxiety. Label each step clearly (e.g., "Reading document...", "Identifying gaps...").

### Input Fields
- Understated borders (1px, Neutral-light). 
- Large touch targets for mobile confirmation screens.
- Avoid free-text where possible; use "Reason Chips" for rejecting suggestions.

### Diff Views
- **Original Content:** Standard text weight.
- **Suggested Content:** Bolded with a leading "+" icon and a light blue or green highlight background to clearly demarcate the system's contribution.