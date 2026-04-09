# Design System Document

## 1. Overview & Creative North Star: "The Kinetic Arena"

This design system is not a mere e-commerce template; it is a high-performance digital environment designed to mirror the intensity, speed, and premium nature of professional football. The **Creative North Star—"The Kinetic Arena"**—dictates a UI that feels alive and pressurized, using deep shadows and neon strikes to guide the eye like stadium lights cutting through the night.

To move beyond "standard" UI, we break the rigid container-based grid in favor of **Intentional Asymmetry**. Large-scale typography should overlap high-action imagery, and product cards will utilize tonal depth rather than borders to create a seamless, editorial flow. This is where "Athletic Precision" meets "Digital Luxury."

---

## 2. Colors

The palette is engineered for high contrast, ensuring that every call to action feels like a tactical strike.

### Palette Strategy
*   **Primary (`#ffffff` / `#c2f35b`):** White is used for core clarity, while the vibrant neon green (`primary_container`) acts as the "Player Highlight," used only for critical interactions and success states.
*   **Surface Foundation:** We utilize a "Dark Matter" approach. The base is `surface` (`#131313`). Content chunks are differentiated through shifting values rather than lines.
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through background color shifts. For example, a `surface_container_low` section sitting on a `surface` background creates a natural edge that feels integrated, not "boxed in."
*   **Signature Textures:** Use subtle linear gradients for primary buttons, transitioning from `primary_fixed` (`#c2f35b`) to `primary_fixed_dim` (`#a7d641`) at a 135-degree angle. This adds a "weighted" feel that flat hex codes cannot replicate.

---

## 3. Typography

The typography strategy leverages the technical precision of **Plus Jakarta Sans** and the utility of **Inter** to create an editorial hierarchy.

*   **Display & Headlines (Plus Jakarta Sans):** These are the "Power Players." Used for hero statements and category titles. Set these with tight letter-spacing (-0.02em) to mimic the condensed look of jersey typography.
*   **Titles & Body (Plus Jakarta Sans):** Optimized for readability. Body text should maintain a generous line height (1.6) to provide "breathing room" against the heavy dark background.
*   **Labels (Inter):** Used for technical specs, price tags, and micro-copy. Inter provides a neutral, functional contrast to the more expressive Jakarta headings.

---

## 4. Elevation & Depth: Tonal Layering

In "The Kinetic Arena," we do not use drop shadows to indicate height; we use light.

*   **The Layering Principle:** Depth is achieved by stacking surface tiers. A `surface_container_highest` card placed on a `surface_container_lowest` section creates a natural lift.
*   **Glassmorphism (The "Fog of War"):** For floating elements like navigation bars or quick-buy overlays, use semi-transparent surface colors (60% opacity) with a `32px` backdrop blur. This ensures the vibrant product colors bleed through the UI, making the experience feel immersive.
*   **Ambient Shadows:** If a "floating" effect is mandatory, shadows must be extra-diffused. Use the `on_surface` color at 4% opacity with a blur radius of at least `24px`.
*   **The Ghost Border:** If accessibility requires a container edge, use the `outline_variant` token at 15% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons
*   **Primary:** High-gloss. Gradient of `#c2f35b` to `#a7d641`. `4px` rounded corners. Text in `on_primary_fixed` (`#141f00`).
*   **Secondary:** Ghost style. Transparent background with a `1px` "Ghost Border" of `white` at 20% opacity. 
*   **Interaction:** On hover, primary buttons should "glow" using a soft neon outer shadow.

### Cards & Product Grids
*   **Rule:** Forbid divider lines. Use `surface_container_low` for the card background and `surface` for the global background.
*   **Imagery:** Use high-contrast photography. Products should occasionally "break" the card container (overlapping the header) to create a 3D effect.

### Input Fields
*   **State:** Default state uses `surface_container_high`. 
*   **Focus State:** The border transitions to `primary_fixed` (`#c2f35b`) with a `2px` thickness. Helper text sits in `label-sm` using the `secondary` color.

### Athletic Chips
*   **Function:** Used for sizes (S, M, L) or categories.
*   **Style:** `9999px` (full) roundedness. Unselected chips should be `surface_container_highest`. Selected chips flip to `primary_fixed` with `on_primary_fixed` text.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts where text blocks are offset from image centers.
*   **Do** lean into the "Deep Black" (`#0e0e0e`) for footer and navigation backgrounds to frame the content.
*   **Do** use the `lg` (8px) corner radius for large containers and `sm` (2px) for small interactive elements like checkboxes to maintain a "sharp" athletic feel.

### Don't
*   **Don't** use standard "Material" blue or grey shadows. They will muddy the neon green.
*   **Don't** use 100% white text for long body copy; use `secondary` (`#c7c6c5`) to reduce eye strain in dark mode.
*   **Don't** use dividers. If you feel the need to separate content, increase the vertical whitespace (e.g., jump from 32px to 64px).