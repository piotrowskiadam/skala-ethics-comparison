# Design System — SKALA (Waga Metrologiczna)

<!-- impeccable:design-schema 1 -->

## Visual World

**Waga Metrologiczna (Precision Metrology Balance)** — inspired by laboratory analytical balances, SI metrology reference scales, and engraved brass/enamel measurement instruments. Rather than an eco-green SaaS dashboard, SKALA behaves like a calibrated physical instrument: warm enamel stock, 1.5px machined graphite hairlines, copper weight/lens indicators, and technical slate-blue badges reserved exclusively for verified scientific LCA citations.

## Color Tokens

| Token | Value | Role |
|---|---|---|
| `--bg-enamel` | `#ECEAE3` | Primary laboratory enamel canvas ground with subtle 24px calibration dot matrix |
| `--bg-card` | `#F4F2EC` | Elevated pan cards, ledger panels, scale table, source cards |
| `--bg-card-hover` | `#F9F7F2` | Interactive row hover state |
| `--ink` | `#141615` | Primary graphite ink, 1.5px structural hairlines, active pill fills |
| `--ink-secondary` | `#3F4441` | Secondary analytical copy and sub-labels |
| `--ink-muted` | `#5A605C` | Unit metadata, axis captions, subtle footnotes |
| `--copper` | `#A44B27` | Active physical lens underline, heavier pan highlight, fulcrum needle, cumulative vegan progress bar, 1.5°C budget line |
| `--copper-tint` | `rgba(164, 75, 39, 0.09)` | Highlighted selected row / active baseline tint |
| `--slate-source` | `#344E61` | Exclusively for clickable verified scientific source pills (`DEFRA 2024`, `Poore & Nemecek 2018`, etc.) |

## Typography

- **Display & UI Sans:** `Archivo` (weights 400–800) — crisp industrial grotesque for the `SKALA` wordmark, section headings, pan metric values (`-0.03em` tight tracking), and editorial copy.
- **Measurement & Instrument Monospace:** `JetBrains Mono` (weights 400–600) — strictly reserved for measurements, ratios (`1 : 32,6`), vernier scale ticks, unit badges, and source citations (`font-variant-numeric: tabular-nums`).

## Layout & Surface Rhythm

- **Top Instrument Bar (`62px` sticky):** 3-column hairline header (`SKALA / INSTRUMENT METROLOGICZNY` | 4 physical lens tabs `CO₂e`, `WODA (L)`, `GLEBA (m²)`, `ENERGIA (kWh)` | `Baza badań LCA`).
- **First Viewport Balance Stage:** Full-width interactive SVG balance beam with log-scaled physical tilt (`±16.5°`), central 51-tick vernier ratio dial with rotating copper needle, two gravity-leveled pan cards with live `<select>` controls and clickable source pills, engraved millimeter ruler, and quick-swap duel pills.
- **Split Calibration Ledger:** Two-column hairline-divided band anchoring the fold — Left: `KONTEKST ETYCZNY I GREENWASHING`; Right: `KUMULACJA: DIETA WEGAŃSKA` with copper vernier bar and quick horizon pills.
- **Below-the-Fold Sections:** Unified 16-item Order-of-Magnitude Scale (`Logarytmiczna` / `Liniowa 1:1`) with 1.5°C vertical copper marker; Deep-Dive Vegan Cumulative Simulator (1 day → 10 years, 4 metrics + SVG trajectory curve); 12-source Scientific Evidence Ledger grid.

## Motion Grammar

- Single orchestrated mechanical motion: exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`, `720ms`) driving the balance beam rotation, copper fulcrum needle sweep, and gravity-leveled pan translation simultaneously.
- Bar fills animate via GPU-composited `transform: scaleX(...)` (`transform-origin: left center`), never layout-thrashing `width`.
- Full `@media (prefers-reduced-motion: reduce)` support.
