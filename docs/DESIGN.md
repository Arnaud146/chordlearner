# Design System Document

## 1. Overview & Creative North Star: "The Grand Virtuoso"

This design system is built upon the concept of **The Grand Virtuoso**. Much like a concert grand piano, the interface must feel expensive, meticulously tuned, and command a sense of quiet authority. We are moving away from the "SaaS-standard" look of thin lines and flat grids toward a high-end editorial experience that mirrors the tactility of ivory keys and the depth of polished mahogany.

The "Grand Virtuoso" breaks the template by embracing **monumental typography**, **intentional asymmetry**, and **negative space as a luxury**. By leveraging high-contrast monochromatic foundations with "wooden" secondary accents, we create a digital environment that feels as timeless as a classical composition.

---

## 2. Colors: Tonal Architecture

Our palette is inspired by the physical anatomy of the piano. We do not use color to decorate; we use it to define structure and state.

### Core Palette
- **Piano Black (`primary` / #1A1A1A):** Used for primary CTAs and deep headers. It represents the lacquer of the instrument.
- **Ivory White (`background` / #F9F7F2):** Our primary canvas. It is softer than pure white, reducing eye strain and feeling more "archival."
- **Burnished Gold (`secondary` / #775A19):** Used sparingly for progress indicators, accents, and high-value highlights.
- **Warm Walnut (`tertiary` / #795830):** Depth for interactive elements and subtle semantic meaning.

### The Rules of Surface
- **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. To separate the hero from a feature grid, shift the background from `surface` (#FBF9F4) to `surface-container-low` (#F5F3EE). Boundaries are felt through tone, not seen through lines.
- **Surface Hierarchy:** Treat the UI as stacked sheets of fine vellum. 
    - Base: `surface`
    - Sections: `surface-container-low`
    - Interactive Cards: `surface-container-lowest` (to create a subtle "lift" against a darker section).
- **The Glass & Gradient Rule:** For floating navigation or modal overlays, use a backdrop-blur (16px+) with a semi-transparent `surface` color (80% opacity). Main CTAs should utilize a subtle linear gradient from `primary` to `primary-container` to mimic the light catching a polished key.

---

## 3. Typography: The Editorial Scale

We pair a majestic serif with a technical sans-serif to bridge the gap between classical art and modern learning.

| Level | Token | Font Family | Size | Character |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Cormorant Garamond | 3.5rem | Majestic, tight tracking (-2%). |
| **Headline**| `headline-lg`| Cormorant Garamond | 2.0rem | Graceful, used for section titles. |
| **Title**   | `title-lg`   | Manrope | 1.375rem | Bold, authoritative, modern. |
| **Body**    | `body-lg`    | Manrope | 1.0rem | High readability, generous leading. |
| **Label**   | `label-md`   | Manrope | 0.75rem | Uppercase with 5% letter spacing. |

**Style Note:** Use `display` styles for emotive hooks (e.g., "Master the Art"). Use `title` and `body` for functional information. Never center-align more than three lines of body text; editorial layouts favor strong left-alignment or intentional asymmetrical staggering.

---

## 4. Elevation & Depth: Tonal Layering

Traditional shadows are often "dirty." We use light and tone to create a sense of three-dimensional space.

- **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` (#FFFFFF) card on top of a `surface-container` (#F0EEE9) background. The delta in hex value creates a "natural" lift.
- **Ambient Shadows:** For floating elements (e.g., the "1 Issue" floating button), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(27, 28, 25, 0.06)`. The shadow is a tint of our `on-surface` color, never a generic grey.
- **The "Ghost Border" Fallback:** If a layout requires a container to be defined on a white background, use the `outline-variant` at 15% opacity. It should be felt rather than noticed.
- **Glassmorphism:** Apply to top navigation bars. Use `surface-bright` at 70% opacity with a `backdrop-filter: blur(20px)`. This keeps the "Ivory" warmth while allowing content to scroll underneath beautifully.

---

## 5. Components: The Physicality of the Key

### Buttons
- **Primary:** `primary` (#1A1A1A) background with `on-primary` text. Border radius: `xl` (3rem). The width should be generous—a "wide key" feel.
- **Secondary:** Transparent background with a `Ghost Border`. 
- **Interaction:** On hover, the primary button should shift to `primary-container` (#A7A5A4) with a smooth 300ms transition.

### Cards & Lists
- **Rule:** No divider lines. Use `spacing-6` (2rem) as a minimum vertical gap between items.
- **Library Cards:** Use `surface-container-lowest` with a `2xl` border radius. For song titles, use `headline-sm` to give every entry the importance of a sheet music cover.

### Input Fields
- Avoid "boxed" inputs where possible. Use a "Soft Tray" approach: a `surface-container-low` background with a `2xl` radius.
- **Active State:** On focus, the background stays the same, but a subtle `secondary` (Gold) ghost-border appears at 40% opacity.

### Navigation (The "Piano Tab")
- Active states in the navigation bar should use a `primary` pill shape behind the text, echoing the dark keys of a piano.

---

## 6. Do’s and Don’ts

### Do
- **Do** use large, sweeping white space. If you think there is enough space, add 20% more.
- **Do** use `display-lg` for large numbers (e.g., "10 minutes focus"). Make statistics feel like art.
- **Do** stagger your layout. Place an image slightly off-center from the text block to create a high-end editorial rhythm.

### Don't
- **Don’t** use 1px black borders. It breaks the "Grand Virtuoso" elegance.
- **Don’t** use pure #000000 or #FFFFFF. Stick to the Ivory (#F9F7F2) and Piano Black (#1A1A1A) tokens for a professional, "tuned" look.
- **Don’t** crowd the keyboard. Ensure the piano key visualizations (components) have enough breathing room to feel tactile and playable.
- **Don't** use standard "drop shadows" with high opacity. They make the UI feel heavy and dated.

---

*Director's Final Note: Remember, we are not just building a tool; we are building an instrument. Every interaction should feel as smooth and intentional as a weighted key action on a Steinway.*