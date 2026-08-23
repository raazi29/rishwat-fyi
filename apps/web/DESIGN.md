---
name: Rishwat.fyi
description: The gap between what a government service officially costs and what citizens actually experience, published as public data.
colors:
  paper: "#FCFCFB"
  surface: "#FFFFFF"
  surface-sunken: "#F7F8F5"
  surface-sage: "#ECF0E8"
  surface-sand: "#F4F0E4"
  line: "#E4E6E0"
  line-inner: "#EFF0EC"
  ink: "#14170F"
  ink-secondary: "#4A514A"
  ink-muted: "#6B7268"
  official: "#0B3A20"
  official-deep: "#062A15"
  official-mid: "#0F3D26"
  official-soft: "#2F6B47"
  reported: "#A8201A"
  reported-bar: "#BB3122"
  reported-tint: "#FAEFED"
  evidence: "#33257F"
  evidence-tint: "#EFEBFA"
  process: "#1B3A93"
  process-tint: "#F0F4FC"
  ramp-1: "#F7E3B8"
  ramp-2: "#F5C77E"
  ramp-3: "#EE9A4B"
  ramp-4: "#D9643A"
  ramp-5: "#B02F22"
  dark-paper: "#0D110E"
  dark-surface: "#141A15"
  dark-line: "#242C25"
  dark-ink: "#EDEFE9"
  dark-official: "#7DBE97"
  dark-reported: "#E8776A"
typography:
  wordmark:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "4.25rem"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  h1:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  h2:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  h3:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0"
  column-label:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.08em"
  figure:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  figure-serif:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-0.01em"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  tile: "10px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
  "16": "64px"
components:
  button-primary:
    backgroundColor: "{colors.official}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 18px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.official-deep}"
    textColor: "#FFFFFF"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
    height: "42px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  panel:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  icon-tile:
    backgroundColor: "{colors.surface-sage}"
    textColor: "{colors.official-mid}"
    rounded: "{rounded.tile}"
    size: "36px"
  badge-validated:
    backgroundColor: "{colors.surface-sage}"
    textColor: "{colors.official-mid}"
    rounded: "{rounded.sm}"
    padding: "3px 8px"
    typography: "{typography.label}"
  badge-evidence:
    backgroundColor: "{colors.evidence-tint}"
    textColor: "{colors.evidence}"
    rounded: "{rounded.sm}"
    padding: "3px 8px"
  badge-process:
    backgroundColor: "{colors.process-tint}"
    textColor: "{colors.process}"
    rounded: "{rounded.sm}"
    padding: "3px 8px"
  figure-official:
    textColor: "{colors.ink}"
    typography: "{typography.figure}"
  figure-reported:
    textColor: "{colors.reported}"
    typography: "{typography.figure}"
---

# Rishwat.fyi — design system

## Overview

**THESIS.** One idea: *the paired number*. Every screen puts an official figure and a citizen-reported figure side by side, in different colours, each carrying its own provenance, with the delta named between them. The surface refuses the transparency-site default — a dark dashboard of glowing KPI cards, or a campaign page of outrage typography — and instead behaves like a **public record**: a printed government gazette rendered for the browser, where the paper is calm and the only saturation in the room belongs to data.

**OWN-WORLD.** Warm near-white paper (`#FCFCFB`) as the ground; white bordered cards, never shadowed; hairline rules doing the work that shadows usually do; a deep forest green (`#0B3A20`) for institutional/official voice and every primary action; a single deep red (`#A8201A`) reserved *exclusively* for citizen-reported figures and gaps; sage and sand tiles behind authored line icons. Display serif (Source Serif 4) for the record's voice — wordmark, page titles, section headings, hero statistics. Civic grotesque (Public Sans, the USWDS face) for everything operational — labels, tables, controls, body. With all content removed the surface is recognisable by: paper ground, hairline-bordered white cards at 12px radius, a two-column green/red figure pairing, and serif titles over sans labels.

**STORY.** The visitor understands in one viewport that this compares official cost against reported experience; believes it because each number names its source, its report count, and its verification level; and acts by searching a service or filing an anonymous report.

**FIRST VIEWPORT (home).** Left half: the serif question at display scale with `government` in official green, the two-line proposition, a single wide search field with an attached green Search button, popular searches as underlined links, and two bordered action cards. Right half: the authored line-drawing of an institutional building over paper, above a bordered panel holding the four-figure stat strip and, below a hairline, the India choropleth with the top-five-states gap list beside it. Primary action is the search field; the persistent `Report anonymously` button sits top-right in the header.

**FORM.** Public record / gazette, rendered as a data instrument. Not selected from a tournament: the visual world is **pinned by the user** in `design_uiux/*.png` (6 approved boards), which are simultaneously the direction and the quality bar. No seed key — a brief-pinned direction beats the roll.

Modes by surface: `/` and `/about` are **Persuade**; `/search`, `/services/*`, `/map`, `/states/*`, `/departments/*`, `/report/*`, `/reports/*`, `/admin/*` are **Operate**; `/methodology`, `/privacy`, `/governance`, `/moderation`, `/contribute`, `/mirroring`, `/data/*` are **Read**.

## Colors

Strategy: **Restrained** — paper and neutrals plus one institutional green, with a second colour (red) that is *not* decoration but a data channel.

| Role | Token | Value | Where |
| --- | --- | --- | --- |
| Page ground | `--paper` | `#FCFCFB` | every page background |
| Card | `--surface` | `#FFFFFF` | bordered cards, table body |
| Sunken | `--surface-sunken` | `#F7F8F5` | panels, sidebars, table headers, footer |
| Sage tile | `--surface-sage` | `#ECF0E8` | icon tiles, validated/corroborated badges, official callouts |
| Sand tile | `--surface-sand` | `#F4F0E4` | secondary tiles, notice strips |
| Hairline | `--line` | `#E4E6E0` | all card and input borders |
| Inner rule | `--line-inner` | `#EFF0EC` | dividers inside a card |
| Ink | `--ink` | `#14170F` | headings, official figures |
| Ink secondary | `--ink-secondary` | `#4A514A` | body |
| Ink muted | `--ink-muted` | `#6B7268` | captions, placeholders (4.6:1 on paper) |
| Official | `--official` | `#0B3A20` | primary buttons, wordmark, official column label |
| Official deep | `--official-deep` | `#062A15` | hover/pressed |
| Official mid | `--official-mid` | `#0F3D26` | links, serif accent words, icon glyphs |
| Official soft | `--official-soft` | `#2F6B47` | official series in charts |
| Reported | `--reported` | `#A8201A` | citizen-reported figures and deltas (6.9:1 on paper) |
| Reported bar | `--reported-bar` | `#BB3122` | reported series in charts |
| Evidence | `--evidence` | `#33257F` on `#EFEBFA` | `evidence_backed` badge only |
| Process | `--process` | `#1B3A93` on `#F0F4FC` | in-progress / informational strip only |
| Gap ramp | `--ramp-1…5` | `#F7E3B8 → #B02F22` | choropleth and distribution intensity only |

Rules:

1. **Red is a data channel.** `--reported` may only be used for a citizen-reported quantity, its delta, or a chart series representing it. Never for errors, never for emphasis, never for a decorative rule. Form errors use `--reported` *with* an error icon and message so red is never the only signal.
2. **Green means official or actionable.** Official figures/labels and primary actions. Never as a success wash across a card.
3. Verification badges are the only place a third or fourth hue appears, and each maps to exactly one ladder state: `submitted` neutral, `validated` / `corroborated` sage, `evidence_backed` evidence-indigo, `officially_acknowledged` official-green solid, `rejected` / `withdrawn` neutral with strikethrough-free muted ink.
4. Secondary text on a tinted surface is tinted from that surface's hue, never grey.
5. **Dark theme** exists because the reporter is often on a phone at night: ground `#0D110E`, cards `#141A15`, hairlines `#242C25`, ink `#EDEFE9`, official accent lightens to `#7DBE97`, reported lightens to `#E8776A`, primary button becomes `#2F6B47` with `#F2F7F1` text. Light is the default: the record is a document.

## Typography

Two families, one mono. Fixed rem scale (Operate discipline) — no fluid clamp on product surfaces; the home hero is the single exception and steps down by breakpoint, not by viewport interpolation.

- **Source Serif 4** (600/700) — wordmark, page titles, section headings, hero stat figures, and the numbers inside `THE GAP`. This is the record's voice.
- **Public Sans** (400/500/600) — all labels, controls, table content, body copy, data figures inside panels. Numeric cells set `font-variant-numeric: tabular-nums` and right-align.
- **JetBrains Mono** (500) — only report IDs, API paths, CSV/JSON snippets, and hashes. Never as a "technical" costume.

Scale: display `4.25rem` (→ `2.75rem` at ≤768px, `2.25rem` at ≤480px) · h1 `2.25rem` · h2 `1.5rem` · h3 `1.0625rem` · body `0.9375rem/1.6` · label `0.8125rem` · column-label `0.6875rem` uppercase `0.08em` · figure `1.5rem` · figure-serif `2rem`.

Tracking floor `-0.03em`, used only at display sizes. Prose measure 65–75ch; table and panel content may run denser. The uppercase tracked style is a **named two-part system** — `OFFICIAL (As per government)` and `CITIZEN EXPERIENCE (Median reported)` — and is forbidden as a generic section eyebrow anywhere else.

## Layout

- Container `1440px` max, gutters `40px` desktop / `24px` tablet / `16px` phone.
- Section rhythm: `32px` between major panels on desktop, `20px` on phone. More space above a heading than below it (`32px` above / `12px` below at h2).
- Grids in the reference, preserved: home hero `1fr 1fr` collapsing to one column at ≤1024px; search `264px` filter rail + fluid results, rail becomes a collapsible sheet at ≤1024px; service overview four panels `1.05fr 1.15fr 1fr 1.15fr` → 2×2 at ≤1200px → stacked at ≤768px; report flow is one centered ≤800px column (the trust and tips rails are removed; the anonymity assurance moved inline below the intro).
- **Responsive behaviour is structural, never fluid type.** The comparison table is the sharpest case: at ≤900px each row becomes a card with a two-column official/reported block and the verification badge on its own line. Tables never scroll horizontally on phones.
- Sticky: header always; the report wizard's step bar sticks under it; the service page tab bar sticks under it.
- On phones, the header exposes the complete navigation in a focused drawer; no bottom tab bar duplicates those destinations.

## Elevation & Depth

Elevation is declared **once, as a border**. Cards, panels, inputs, and table shells carry `1px solid var(--line)` and no shadow. A 1px border under a soft shadow is forbidden.

Only surfaces that genuinely leave the page get a shadow, and they drop the border: dropdown menus, the mobile filter sheet, the command/search suggestion popover, and dialogs — `0 8px 24px -8px rgb(20 23 15 / 0.18)` (real offset, real blur). Focus is a 2px `--official-mid` ring at 2px offset, on every interactive element.

## Shapes

Cards and panels `12px`. Buttons, inputs and selects `12px` (a visibly curved corner, distinct from the `8px` tile family). Badges and chips `6px`. Icon tiles `10px` at `36px` square; standalone square icon controls (menu, close, theme toggle) share the `12px` card radius. Step markers and avatars are circles. Fully-rounded pills are reserved for the header descriptor chip and filter chips — never for a card or a primary button. Authored line icons only: 1.5px stroke, round caps and joins, 20px or 24px box, drawn from the product's own vocabulary (document, counter, rupee, clock, footsteps, shield, scale, map pin, database). No icon library aesthetic mixing, no sketch/doodle illustration, no `feTurbulence` texture.

The home hero uses the supplied Neoclassical Capitol illustration with the Indian flag, optimised as WebP and presented within a restrained bordered surface. It is the only large illustrative image in the system; all other imagery remains purposeful empty, offline, or data-context artwork.

## Components

Every interactive component ships default, hover, focus-visible, active, disabled, loading, and error states. Buttons: primary (green fill), secondary (white with hairline), quiet (text + underline on hover), destructive is not part of the public surface.

- **Gap panel** — the system's signature. Three columns: `OFFICIAL`, `THE GAP`, `CITIZEN EXPERIENCE`, joined by `=` glyph rules at the seams. Deltas render as `+ ₹2,000` / `+ 14 days` / `+ 1.8 visits` in reported red with a plain-language qualifier beneath. This is the one authored motion moment: on first view the gap rows draw their connecting rule and the delta values settle upward once, exponential ease-out, ≤400ms total, disabled under `prefers-reduced-motion`.
- **Comparison table** — grouped headers (official group green, reported group red), sticky header, tabular numerals, verification badge column, row link arrow. Card mode at ≤900px.
- **Verification ladder** — five nodes with the reached ones filled official-green and connected; the current level named in serif above it; counts (reports / independent contributors / evidence-backed / confidence level) beneath.
- **Charts** — hand-authored SVG only (distribution bars, dual-series timeline, horizontal issue bars). Official series `--official-soft`, reported series `--reported-bar`. Every chart has an axis, a stated median chip, an accessible table fallback, and no sparkline-as-decoration.
- **Threshold empty state** — when `published: false`, the panel states the rule (“needs ≥3 reports from ≥2 independent sources”), shows what exists, and offers the report action. Never a shrug.
- **Choropleth** — pre-projected SVG paths, `--ramp-1…5` bins, legend with `Lower gap → Higher gap`, keyboard-focusable states, tooltip on hover/focus, and a state list beside it so the data is readable without the map.
- **Report wizard** — 5 steps in one centered ≤800px column (no side rails); a single inline anonymity assurance (`Your identity is safe`) with a `What can I report?` disclosure below the intro; a compact progress header (current step title, `Step N of M`, progress bar, small markers) instead of a five-column stepper; `Continue` primary (`Submit report` on the last step) with `Save draft & exit` quiet; per-step client validation from `@rishwat/validation`. See §Custom controls & simplified report wizard.
- **Sample-data banner** — when the API is unreachable and fixtures render, a persistent labelled strip says so. Fallback content is never presented as live data.

## Custom controls & simplified report wizard

The dropdown layer is a **custom, dependency-free control system** — no native `<select>` on any high-traffic flow. Three pieces share one model and one overlay:

- **SearchableCombobox** — long lists (department, service, state, district, city): custom trigger, an in-overlay search field, filtered options with a selected check and optional description line, and a politely-announced result count.
- **CustomSelect** — short lists (service type, time period, frequency, delay unit, sort): same trigger and overlay, no search field; supports type-ahead.
- **FormSelect** — the bridge that keeps the no-JS `GET` filter forms (search rail, service department filter) working: it renders a synchronized hidden `<input name>` carrying the exact query value, re-seeds from the server default across navigations, and drops the hidden input when disabled so a disabled control submits nothing — exactly like a disabled native select.

`NativeSelect` remains exported **only** as a compatibility fallback; no public flow renders it.

**One adaptive overlay.** Desktop: an anchored popover beneath the trigger — a shadowed, borderless surface (§Elevation) at `z-30`, below the sticky header (`z-40`) so it scrolls *under*, never over it. Mobile (≤639px): a fixed bottom sheet with backdrop, drag-handle affordance, large title, and 48px option rows; body scroll locks only while the sheet is open. Reduced-motion disables the overlay's entrance.

**Trigger.** Reuses the shared input shell — hairline border, `--radius-md`, ≥44px tall for touch — with a chevron that rotates on open and a red hairline (`--reported`) when invalid. The global 2px `--official-mid` focus ring applies.

**Keyboard & ARIA.** Trigger is `role="combobox"` with `aria-expanded`/`aria-controls`; the list is a `role="listbox"` with `aria-activedescendant` and `aria-selected`. Enter/Space/↓ open; ↑/↓ move; Home/End jump; type-ahead matches labels; Enter selects; Escape closes and restores focus to the trigger; Tab leaves normally. Movement clamps at the ends (no wrap) to match a native select. Real `<label>`/`aria-describedby`/`aria-invalid` pass through, and every trigger also carries an `aria-label` equal to its visible label (a `<button>` trigger is not reliably named by `label htmlFor`), so the accessible name always contains the visible label (WCAG 2.5.3). Never nest a trigger inside its `<label>`; associate by id, and prefix repeated instances (the filter rail and its mobile sheet) with a per-form `formId` so ids stay unique.

**Geography stays correct.** Controls consume the entire `/locations/tree` (all 36 states/UTs, every district and city) with no cap; labels are defensively sorted with `localeCompare("en-IN")`. Changing State clears District and City; changing District clears City; membership is validated (a district must belong to the chosen state, a nonempty city to the chosen district); a rehydrated draft is pruned of any service/district/city that no longer exists. Empty City and empty frequency are valid — they are not in the submission schema.

**Simplified wizard.** One centered ≤800px column, no side rails. Below the intro sits one concise anonymity assurance plus an optional `What can I report?` disclosure — the duplicated "100% Anonymous" card and the unsupported "encrypted at rest" claim are gone. A compact progress header (current step title, `Step N of M`, a progress bar, small markers) replaces the five-column stepper. Step 1 shows at most five primary controls (Department, Service, State, District, When) with City optional, and moves service type, office, and frequency into `Add more detail (optional)`. Primary action is `Continue` (`Submit report` on the last step); step headings drop numeric prefixes; a warning before submit states the one-time status token cannot be recovered; on a failed step, focus moves to the first invalid control. The submission payload is unchanged and resolves the service by `service_slug`.

## Do's and Don'ts

**Do**

- Pair every figure with its provenance: official → source link + `last_verified`; reported → report count + independence count + verification level.
- Keep the mandatory notice verbatim wherever citizen aggregates appear.
- Right-align and tabular-number every numeric cell; use `₹` with Indian digit grouping (`₹12,482`).
- Say what is missing when data is below threshold.
- Give the phone layout the same information, restructured — never a truncated subset.

**Don't**

- No gradient text, no glass, no coloured `border-left` accents thicker than 1px, no nested cards, no card-grid-as-page-structure, no `01 / 02 / 03` section numbering, no uppercase tracked eyebrow outside the OFFICIAL/CITIZEN pair.
- No red outside the reported data channel; no green wash as "success"; no third accent invented for a chart.
- No shadow on a bordered card; no border on a shadowed overlay.
- No monospace for prose, headings, or labels.
- No chart or map library runtime, no client-side fetch for primary content, no `h-screen` hero.
- Never name an official, never render a personal identifier, never present sample data as live, never invent a funder, partner, endorsement, or acknowledgement.
