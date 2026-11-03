# Design system: the wizard's star chart

The portfolio is drawn as a celestial atlas plate kept by a wizard-astronomer: a night-sky
ground, chart ink, brass instruments, engraved lettering, and jewel-toned stars. Projects
are stars; the technologies they share are the lines between them.

Mode: **Experience** (Impeccable). The constellation leads; the interface recedes.

## Colour

| Token | Value | Role |
| --- | --- | --- |
| `--night` | `#070b16` | Ground (night sky) |
| `--plate` / `--plate-raised` | `#0c1220` / `#111828` | Panels, one tone step up; no outlines |
| `--ink` / `--ink-soft` / `--ink-muted` | `#eee8da` / `#bdb8ad` / `#8d909a` | Text |
| `--brass` / `--brass-bright` | `#cfa65c` / `#e6c98b` | Interaction only: links, focus, selection, the sight ring |

Domain colours (`src/graph/palette.ts`) are jewel tones loosely following stellar spectral
colours. **Colour always means a domain, and it is earned by attention.** At rest the whole
site is ink and brass: white stars with brass halos, neutral links, project names only. When
a star is hovered or selected, it and the technologies it touches take their domain colours
and its links light up. Sparks, sections and panels stay brass.

## Type

- **Display:** Cormorant Garamond 500/600 and italic. Names, headings, project titles,
  star-chart labels. Never set a full sentence at display size.
- **Text and interface:** IBM Plex Sans (variable). Numerals use `tabular-nums`; no monospace.
- **Scale:** `--text-sm` 13, `--text-md` 15, `--text-lg` 18, `--text-xl` 24, then display sizes.

## Voice

Plain words carry the meaning; a second, italic display line carries the magic.
**"Code is magic"** is the recurring motif (hero, astrolabe inscription, About, footer,
mobile menu). Incantation lines (`.incantation`) sit under section headings and in empty
states, short and dry: "Email arrives faster than an owl." They never replace the factual
label, never make claims about the work, and never appear more than once per section.

## Shape and structure

- Surfaces are nearly square (`--radius-surface: 4px`); controls are fully round.
- Structure comes from space and tone steps. No hairline dividers or outlined boxes.
- No eyebrows, section numbers, middle-dot strings, gradient text, or unicode glyph icons.
  Icons come from `src/components/Icon.tsx` (1.5px stroke).

## Motion (Emil Kowalski's rules)

- One authored entrance: the name resolving from blur (BlurText) while the chart settles.
- Interface feedback under 300ms with `--ease-out: cubic-bezier(.23,1,.32,1)`; drawers use
  `--ease-drawer`. Pressable things scale to `.97` on press.
- Hover effects only under `(hover: hover) and (pointer: fine)`. Keyboard-driven changes are instant.
- Animate `transform` and `opacity`. Never update an inherited CSS variable per frame.
- Ambient motion is limited to the slowly turning astrolabe and star twinkle; both stop
  under `prefers-reduced-motion`.

## React Bits adaptations (dependency-free)

BlurText (hero name), StarBorder (primary action, lights on hover), TargetCursor (rune-ring
sight on the chart), ClickSpark (jewel sparks), DecryptedText (star readout), SpotlightCard
(a lamp over chart panels), StaggeredMenu (phone menu), ASCIIText (Agent Forge plate).

## Performance budget

No WebGL. Off-screen graphs settle only near the viewport, a few ticks per frame. Far
sections use `content-visibility` with measured size estimates. Check any change against the
benchmark: total blocking time and idle frame rate on a 4x-throttled phone.
