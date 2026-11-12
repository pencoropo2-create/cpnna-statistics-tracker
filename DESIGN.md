# Design Brief

## Direction

Ledger Marine — an institutional audit-ledger interface for CPNNA's weekly statistics registry, precise as a paper form and fast as a spreadsheet.

## Tone

Restrained utilitarian precision: dense, high-contrast, zero decoration, engineered so a field officer can capture 35+ numeric rows on a phone without error.

## Differentiation

Monospaced tabular numerals in every data cell turn the table itself into the signature — digits align in columns like a printed ledger, making sums and discrepancies scannable at a glance.

## Color Palette

| Token      | OKLCH         | Role                                        |
| ---------- | ------------- | ------------------------------------------- |
| background | 0.975 0.006 245 | Cool off-white app surface                |
| foreground | 0.22 0.03 250 | Marine-ink text, AA+ on background          |
| card       | 1.0 0.003 245 | Pure white capture surfaces and tables      |
| primary    | 0.32 0.075 255 | Deep marine navy — app bar, primary actions |
| accent     | 0.62 0.11 225 | Steel-cyan — active day tab, focus, links   |
| muted      | 0.945 0.01 245 | Row alternation, disabled, section bands    |
| warning    | 0.72 0.15 72  | Amber/copper audit-alert accent             |

## Typography

- Display: Space Grotesk — headings, KPI values, section titles (engineered, technical)
- Body: Plus Jakarta Sans — labels, form text, Spanish UI copy (high legibility)
- Mono: JetBrains Mono — all numeric table cells, totals, tabular alignment
- Scale: hero `text-3xl md:text-5xl font-bold tracking-tight`, h2 `text-xl md:text-2xl font-semibold`, label `text-xs font-semibold tracking-widest uppercase`, body `text-sm md:text-base`

## Elevation & Depth

Flat surfaces separated by hairline borders; shadows are reserved for floating popovers and sticky bars (`shadow-subtle`, `shadow-elevated`), never for static cards.

## Structural Zones

| Zone    | Background        | Border      | Notes                                          |
| ------- | ----------------- | ----------- | ---------------------------------------------- |
| Header  | `bg-primary`      | `border-b`  | Marine app bar, white text, day-tab strip below |
| Content | `bg-background`   | —           | Alternating `bg-muted/40` section bands        |
| Tables  | `bg-card`         | `border`    | White cells, `bg-muted/50` sticky header row   |
| Footer  | `bg-muted/40`     | `border-t`  | Summary totals + bottom nav                    |

## Spacing & Rhythm

Compact 4/8px micro-grid; table rows 40–44px tall with 8px cell padding; 16px card padding on phone, 24px on tablet; 24–32px between sections.

## Component Patterns

- Buttons: 8px radius, marine `bg-primary` for commit actions, steel-cyan `bg-accent` for active/filter, ghost for secondary; `hover:brightness-110` on solid, 150ms.
- Cards: 8px radius, `bg-card`, hairline `border`, no shadow unless floating; KPI cards use a 3px left accent bar.
- Badges: pill (`rounded-full`), amber for audit alerts, green for validated, steel-grey for neutral states.

## Motion

- Entrance: `fade-in` 200ms ease-out on section mount, no bounce.
- Hover: color/background shift only, 150ms `transition-smooth`.
- Decorative: none — motion signals state change (row saved, validation pass) via brief accent pulse.

## Constraints

- Mobile-first; all touch targets ≥44px; numeric inputs use `inputMode="numeric"`.
- Never use raw color literals or arbitrary color classes — semantic tokens only.
- Spanish UI copy throughout; both light and dark modes must hold AA+ contrast.

## Signature Detail

The tabular-mono ledger grid: monospaced digits, hairline rules, and a bold auto-sum row that reads like a printed statistical form — a data-capture tool that looks auditable.
