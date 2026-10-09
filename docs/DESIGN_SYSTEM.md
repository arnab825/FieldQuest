# FieldQuest - Visual Theme: Forest Atelier

## 1. Design Philosophy

**Forest Atelier** is inspired by classic botanical field journals, herbarium specimens, vintage lithographs, and modern editorial publication design. 

Rather than looking like a generic Silicon Valley SaaS dashboard or futuristic dark-purple neon crypto web app, FieldQuest evokes the tactile feeling of warm textured parchment, pressed leaves, damp moss, dark forest loam, and elegant editorial typography.

### Core Aesthetic Principles
1. **Editorial Elegance:** Headlines utilize **Fraunces**, an optical-size variable serif with warm, expressive botanical curves. Body copy utilizes **DM Sans**, providing crystal-clear legibility on mobile screens under direct sunlight.
2. **Tactile Color Harmony:** Organic earthen tones (Deep Forest, Bark Brown, Warm Parchment) accented with vibrant energetic living Leaf Green accents.
3. **Restrained Motion:** Natural, gentle spring transitions (`ease-out`) that feel like turning the page of a naturalist's notebook or glancing down at a path.
4. **Outdoor Legibility:** High contrast, large touch targets (minimum 44x44px), and sunlight-readable typography for outdoor use.

---

## 2. Design Tokens

### 2.1 Color Palette

| Token Name | Hex Code | HSL Equivalent | Role & Application |
|---|---|---|---|
| `--color-forest-deep` | `#173D32` | `hsl(164, 45%, 16%)` | Primary brand tone, header background, dark cards |
| `--color-forest-dark` | `#102C25` | `hsl(166, 47%, 12%)` | Deepest ground tone, high-contrast dark accents |
| `--color-moss-green` | `#71866B` | `hsl(107, 11%, 47%)` | Subdued ecological secondary tone, borders, badges |
| `--color-leaf-accent` | `#B8E986` | `hsl(89, 69%, 72%)` | Vibrant call-to-action highlights, badges, completion indicators |
| `--color-parchment-warm` | `#F5F2E8` | `hsl(45, 33%, 94%)` | Primary canvas background, soothing warm backdrop |
| `--color-paper-white` | `#FFFEFA` | `hsl(48, 100%, 99%)` | Elevated cards, inputs, journal entry containers |
| `--color-bark-brown` | `#806A55` | `hsl(30, 20%, 42%)` | Earthy secondary text, category tags, divider lines |
| `--color-text-muted` | `#66756A` | `hsl(136, 7%, 43%)` | Secondary metadata, timestamps, instructions |
| `--color-border-subtle` | `#DDE3D5` | `hsl(91, 19%, 86%)` | Delicate organic borders for cards and inputs |

### 2.2 Typography

```css
/* Editorial Serif for Headings and Brand Titles */
font-family: 'Fraunces', serif;

/* Clean Sans for Body, Instructions, Metadata and UI Controls */
font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
```

Scale:
- **Display 1:** `3.25rem` (52px), line-height 1.1, Fraunces serif (Landing headline)
- **Heading 1:** `2.25rem` (36px), line-height 1.2, Fraunces serif
- **Heading 2:** `1.75rem` (28px), line-height 1.25, Fraunces serif
- **Heading 3:** `1.25rem` (20px), line-height 1.35, Fraunces serif / semi-bold
- **Body Large:** `1.125rem` (18px), line-height 1.6, DM Sans (Mission instructions)
- **Body Regular:** `1.0rem` (16px), line-height 1.5, DM Sans
- **Small / Meta:** `0.875rem` (14px), line-height 1.4, DM Sans (Badges, tags)
- **Micro / Subtext:** `0.75rem` (12px), line-height 1.3, DM Sans

---

## 3. Component Patterns

### 3.1 Buttons & Interactive Controls
- **Primary Action (Leaf Botanical):** Solid Deep Forest background (`#173D32`) with Crisp Paper White text (`#FFFEFA`) and Leaf Accent border highlight (`#B8E986`), or solid Leaf Accent (`#B8E986`) with Deep Forest text for critical calls to action.
- **Secondary Action (Parchment Card):** Warm Parchment background with subtle `#DDE3D5` border, Bark Brown typography.
- **Focus States:** 2px solid `#173D32` with a 2px offset for WCAG compliance.

### 3.2 Mission Cards
- Background: Paper White (`#FFFEFA`) with 1px border `#DDE3D5`.
- Header: Category badge (e.g. "Botanical Observation • 10m") in subtle moss pill.
- Body: Large, generous line-height instructions.
- Callouts: Safety guidance highlighted in a light moss container with shield/warning iconography.
- Footer: Observation checklist & interactive notes expansion.

### 3.3 Screen-Down Mode
- When toggled, the application interface transitions into a gentle, very low-brightness dark forest slate (`#102C25`).
- Displays a simple reminder: *"Put your phone in your pocket. Listen and look around you."*
- Minimalist pulse indicator and large "Wake Screen" tap area.

---

## 4. Accessibility & Motion
- All text meets minimum contrast ratio of 4.5:1 against its background.
- Minimum interactive touch targets are 44 x 44 CSS pixels.
- Respects `@media (prefers-reduced-motion: reduce)` by disabling spring animations and replacing them with instant state transitions.
