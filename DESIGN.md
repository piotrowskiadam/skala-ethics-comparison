# Design System — SKALA (Swiss Editorial Instrument)

<!-- impeccable:design-schema 1 -->

## Visual World

**Swiss Editorial Daylight & Interactive Instrument** — inspired by museum exhibition graphics, *The Pudding* / *NYT Graphics*, and contemporary Swiss editorial typography. Replaces heavy wireframe boxes, dot-matrix noise, and warm-cream/terracotta clichés with pure architectural daylight (`#FFFFFF` / `#F6F7F9`), whisper hairlines (`#E5E7EB`), International Cobalt (`#1D4ED8`) interactive focus, Signal Vermilion (`#DC2626`) excess-burden alerts, Emerald (`#34D399`) verified savings, and a full-bleed Midnight Navy (`#0B1120`) contrast band for multi-year diet trajectories.

## Color Tokens

| Token | Value | Role |
|---|---|---|
| `--bg` | `#FFFFFF` | Primary gallery canvas |
| `--bg-stone` | `#F6F7F9` | Alternating editorial stone bands (Landing Hero, Scale Explorer, Weight Chamber) |
| `--bg-soft` | `#EEF1F5` | Tonal pills, segmented control tracks, secondary actions |
| `--ink` | `#0E1116` | Primary charcoal typography and solid primary CTA |
| `--ink-secondary` | `#374151` | Body prose and analytical verdicts |
| `--ink-muted` | `#64748B` | Captions, units, axis labels |
| `--cobalt` | `#1D4ED8` | Primary interactive accent, active needle/arc, verified source links, 1:1 counterweight blocks |
| `--vermilion` | `#DC2626` | Heavier pan indicator, 1.5°C budget threshold, excess-burden (`+`) alerts |
| `--emerald-bright` | `#34D399` | Verified savings (`−`) on the Midnight Navy diet band |
| `--navy` | `#0B1120` | Full-bleed dark contrast band for multi-year diet accumulation |

## Typography

- **Display & Headings:** `Bricolage Grotesque` (weights 500–800) — expressive contemporary grotesque with full Polish diacritics for hero headlines, monumental ratios, and pan values.
- **Body & Tabular Data:** `Hanken Grotesk` (weights 400–700, `font-variant-numeric: tabular-nums`) — crisp, human editorial sans across controls, prose, and measurements without all-caps monospace kicker clutter.

## Layout & Component Language

- **Sticky Segmented Top Bar:** Clean pill track (`#EEF1F5` with elevated `#FFFFFF` active tab) carrying live micro-ratio badges across all 4 physical lenses.
- **Asymmetric Editorial Landing Hero:** 2-column split (monumental headline left, unboxed hairline-ruled interactive story rows right — zero 3-card row).
- **Borderless Elevated Balance Cards:** Soft ambient elevation (`0 12px 30px rgba(14,17,22,0.07)`) with crisp `3.5px` top accent bar (`--vermilion` heavier / `--cobalt` counterweighted).
- **Unboxed Below-the-Fold Rhythm:** Open typographic stats in the Midnight Navy diet band (zero 2×2 boxed grid), unboxed visual bar essay for the Order-of-Magnitude Scale, and a 2-column numbered Swiss academic index for the 12 LCA sources.
