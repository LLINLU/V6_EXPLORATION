# Query Report — Dev Handover Style Guide

A practical reference for engineers wiring the **Query Report** (RDE-424) into
generation flows. Every report — whether served from the hard-coded example or
generated dynamically — must render with these conventions so the visual
language stays consistent across queries.

This guide is the source of truth for *visual* decisions; the data contract
lives in [`GENERATION.md`](./GENERATION.md), and the wiring spec lives in
[`README.md`](./README.md).

---

## 1. Where the code lives

```
src/components/scenario/report/query/
├─ QueryReportView.tsx          ← top-level renderer + TOC + reading guide
├─ QueryReportHeader.tsx        ← in-page header (mode dropdown + search + Ask AI)
├─ QuerySectionHeader.tsx       ← "01 — 要請背景" header strip
├─ QuerySources.tsx             ← bottom-of-section external source pills
├─ ConfidenceBadge.tsx          ← labelled 信頼度：高/中/低 pill
├─ proseClasses.ts              ← QUERY_PROSE_CLASS for HTML bodies (incl. <cite> styling)
└─ sections/
   ├─ QuerySection01.tsx … 07.tsx  ← one component per report section
```

Data shape lives in `src/types/query-report.ts`. The single working fixture
lives in `src/data/queryReportExample.ts`. Routing & shell live in
`src/routes/QueryReportPreview.tsx`.

---

## 2. Section ↔ data mapping

| # | Section            | Data field | Notable patterns                                                                                                |
|---|--------------------|------------|-----------------------------------------------------------------------------------------------------------------|
| 1 | 要請背景            | `s01`      | 3 KPI cards (3-up on expanded), HTML body with inline `<cite>` pills, country policy cards with flag + 出典 icon link |
| 2 | 定義・役割           | `s02`      | Blue-50 definition box w/ title, Strength 01–05 cards (white, no top bar) — `01` rendered as small blue mono index |
| 3 | 市場規模            | `s03`      | TAM hero card with source link top-right, sub-cards row, forecasts comparison table with scenario pills           |
| 4 | 技術史年表           | `s04`      | Phase cards (year top, title row with `Phase N` pill on the right), annual bar chart (green=teal-400 for patents), event timeline w/ confidence badge inside the gray event card top-right, papers table (link wraps full row, group-hover), top-assignee cards with country flag |
| 5 | 技術構造（原理の構造化） | `s05`      | Collapsible scope/subprocesses/axes/principleMap/trlDefs blocks (all white-card details), 27-cell A/B/C/D/E classification grid, tech cards with TRL mini-histogram inside white card with gray inner desc box |
| 6 | 課題                | `s06`      | Risk-type filter tabs (analogous pastel family) — challenge cards with **neutral chip per type**; barrier line, gray-inset body |
| 7 | 公的支援            | `s07`      | Subsidy program table with status badges (募集中=emerald, 終了=gray, 定期公募=blue, 要確認=amber); 申請ページ link cell |

---

## 3. Reusable primitives

### `QuerySectionHeader`
- Numeric badge (blue-50 / blue-600) + section title.
- `num` is the 2-char string ("01"…"07"), `title` is Japanese.

### `QuerySources`
- Pills at the bottom of a section listing external sources.
- Auto-hides if `sources` is empty. Use this in **every** section.

### `ConfidenceBadge` ⭐
- The single source of truth for "信頼度" display. **Never** render confidence
  as a coloured dot.
- Props: `value?: "high" | "medium" | "low"` (renders nothing if undefined).
- Visual spec — Tailwind arbitrary values, **no border**:

  | Level | Background    | Text        | Label       |
  |-------|---------------|-------------|-------------|
  | high  | `bg-[#E6FFE6]`| `text-[#256D59]` | 信頼度：高 |
  | medium| `bg-[#FFF8DD]`| `text-[#575529]` | 信頼度：中 |
  | low   | `bg-gray-100` | `text-gray-600`  | 信頼度：低 |

- Shape: `px-2.5 py-0.5 rounded-[10000px]` (pill), `font-mono text-[10px]
  font-medium`.

### `QUERY_PROSE_CLASS` (from `proseClasses.ts`)
- The standard className to apply to any `dangerouslySetInnerHTML` body
  string. Sets sans-serif 14 px body and styles inline `<cite>` tags as blue
  pills.
- Replace bodies that should sit inside a gray inset by adding `bg-gray-50
  rounded-lg px-4 py-3` next to the prose class — see s05 tech card desc and
  s06 challenge body.

### `QueryReportHeader`
- Top nav for the query report page. Layout mirrors `ScenarioSelectionHeader`:
  left spacer / centered search / Ask AI on the right.
- The mode pill on the left of the input is a **trigger pill** —
  `h-9 rounded-[8px]`, gap `[0.2rem]` from the input. The same pill rendered
  inside the dropdown menu uses the standard `h-[28px] rounded-full` toggle
  size (the `size` prop on `ModePill` controls this).

---

## 4. Locked constants — do not regenerate

Anything in the table below comes from frontend code, **not** the AI output.
Strip these fields from any generation prompt or schema so the model doesn't
drift them across runs.

| Constant                  | Where                                                                                              | Why locked                                                            |
|---------------------------|----------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| TRL definitions (9 levels)| `s05.trlDefs` is currently in the data, but the EU H2020 ladder is stable. Move to a frontend const.| Stops translation drift. Same 9 entries every report.                  |
| Section IDs / order        | `QueryReportView.SECTIONS`                                                                         | The TOC depends on stable `id` anchors (`query-s01` … `query-s07`).   |
| Reading-guide intro        | `QueryReportView.READING_GUIDE`                                                                    | Scenario-agnostic copy.                                               |
| Risk-type labels (`tech`/`economic`/`regulatory`/`social`/`geopolitical`) | `QuerySection06.RISK_STYLES` | Maps the data enum to display labels (技術/経済/…). Add new enum values here, not in data. |
| Classification labels (`A`/`B`/`C`/`D`/`E`) | `QuerySection05.CLS_STYLES`                                                       | Same idea — Japanese labels and tint live in frontend.                |
| Subsidy status enum       | `QuerySection07.STATUS_STYLES` — must be `"募集中" \| "終了" \| "定期公募" \| "要確認"`              | Anything else falls back to 要確認 styling.                            |
| Confidence labels         | `ConfidenceBadge.STYLES`                                                                           | Data only carries `"high" \| "medium" \| "low"`; label copy is here.   |

---

## 5. Visual patterns to match

### Typography ladder (project-wide for the query report)

| Element                              | Size           | Weight     | Notes                                  |
|--------------------------------------|----------------|------------|----------------------------------------|
| Hero theme title                     | `text-base` (panel) / `text-2xl` (fullscreen) | bold | `data.theme` |
| Scenario subtitle                    | `text-[14px]` / `text-[15px]` | regular   | Black / gray-700                       |
| Section title                        | section header component handles | bold | "01 — 要請背景"                        |
| **Section sub-header**               | `text-[12px]`  | semibold   | `font-mono`, gray-600, uppercase tracking |
| **Card title / mini-label**          | `text-[12px]`  | bold or semibold | gray-900 (mono) or gray-400 (uppercase) |
| **Body / description**               | `text-[14px]`  | regular    | gray-600/700, `leading-relaxed`         |
| Pill                                 | `text-[10–12px]` | regular  | `font-mono`                            |
| Source / metadata footnote           | `text-[10–11px]` | regular  | gray-400, italic OK for footnotes only  |
| KPI value (numbers)                  | `text-[18–26px]` | bold    | `font-mono`, `text-[#4f5fe0]` for tints |

**The 12/14 rule:** card labels = 12 px, body copy = 14 px. Use this for *every*
new card. Italics are reserved for footnotes (sourceNote, patentLagNote,
nameEn). No italic body text — even short ones — because it reads as
secondary instead of primary.

### Gray content box

For description / body text that needs visual separation inside a white card:

```html
<p class="text-[14px] text-gray-700 leading-relaxed bg-gray-50 rounded-lg px-4 py-3">
  ...
</p>
```

Used in s05 axis `independenceNote`, s05 tech `desc`, s05 scope cards, s06
challenge body, and s05 subprocess centralMechanism (the dark navy version
there is intentional — single highlight).

### Pills

Default pill spec: `font-mono text-[10–12px] rounded` (or `rounded-full` for
toggle pills). Pad `px-2 py-0.5` for the small variant, `px-2.5 py-0.5` for
the confidence badge (slightly wider for legibility).

| Tone           | Background        | Text                | Use case                                                  |
|----------------|-------------------|---------------------|-----------------------------------------------------------|
| Neutral gray   | `bg-gray-100`     | `text-gray-700`     | **Default** for risk-type chips (s06), phase labels (s04 Phase N), countries on Justia, etc. |
| Confidence (3 hues) | see ConfidenceBadge | see ConfidenceBadge | "信頼度：…" only                                   |
| Subsidy status emerald | `bg-emerald-100` | `text-emerald-700` | 募集中                                                   |
| Subsidy status amber   | `bg-amber-100`   | `text-amber-700`   | 要確認                                                   |
| Subsidy status blue    | `bg-blue-100`    | `text-blue-700`    | 定期公募                                                 |
| Subsidy status gray    | `bg-gray-100`    | `text-gray-600`    | 終了                                                     |
| Classification (s05)   | A=emerald-50 / B=amber-50 / C=blue-50 / D=violet-50 / E=red-50 | matching `-700` text | Only on the 27-cell principle map cards |
| Mode pill TED   | `bg-blue-50`         | `text-blue-700`  border `[#cddeff]` | 技術の応用先を探索 (toggle + dropdown) |
| Mode pill FAST  | `bg-[#fdfbff]`        | `text-[#9151ce]` border `[#d9c1ef]` | 技術を深ぼる |
| Mode pill QUERY | `bg-[#f4fff7]`        | `text-emerald-700` border `[#c0ece0]` | クエリを深掘り |

**Rule:** color carries meaning. Don't use color as decoration. Risk-type chips
got neutralized to gray because the type label already carries the meaning
(技術/経済/etc.) — the color was redundant. Same for s05 scope cards (single
`bg-gray-50` across all three).

### Section "▶ このセクションのポイント" callout (s04, s06, s07)

```html
<div class="bg-gray-50 rounded-lg p-3 mb-4">
  <p class="font-mono text-[12px] uppercase tracking-widest text-{tone}-700 mb-1">
    ▶ このセクションのポイント
  </p>
  <p class="text-[14px] text-gray-700 leading-relaxed">{intro}</p>
</div>
```

The label color follows the section accent (blue for s04/s07 intro, amber for
s06). No left border accent — the gray background is the only chrome.

### External-link arrow (top-right or inline)

Whenever a chip / source link points outside the app:

```html
<svg class="w-2.5 h-2.5 text-blue-600 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" ...>
  <path d="M2.5 9.5L9.5 2.5M9.5 2.5H5.5M9.5 2.5V6.5" .../>
</svg>
```

**Hover animation is required** — the arrow slides 2 px up + 2 px right
(`-translate-y-0.5 translate-x-0.5`) over 200 ms `ease-out`. Pair with
`transition-[transform,color]` on the link to also fade in the hover text
color. Used on:

- s01 country policy 出典 icon (icon-only, top-right of card)
- s03 TAM hero source pill (with `group-hover` so the whole pill responds)
- s04 papers table — wrap the entire 論文情報 cell in the `<a>` so the body
  text also turns blue on hover
- Any future inline source / DOI / report-page link

### Top-right metadata pattern

For cards whose primary title shares a row with secondary metadata (a status
badge, a phase pill, or `ConfidenceBadge`):

```tsx
<div class="flex items-center gap-2 mb-1.5 flex-wrap">
  <p class="text-[12px] font-bold text-gray-900">{title}</p>
  <span class="ml-auto"><ConfidenceBadge value={...} /></span>
</div>
```

`ml-auto` on the trailing element pushes it to the right inside the same
flex row. Used in: s04 timeline event card, s04 chart phase card, s06
challenge card.

### Removed/avoided patterns

Things we explicitly **don't** do in the query report (older drafts had
them; do not bring back):

- **Colored left or top borders on cards** — drop them all; the card bg /
  inset gray is the only chrome. (Removed from s02 Strength cards, s05 scope
  cards, s06 challenge cards.)
- **Coloured dots for confidence** — replaced by `ConfidenceBadge` labelled
  pill.
- **Bright navy/purple branded card headers** — the s04 phase pill went from
  navy → `bg-gray-100`.
- **Italic body text** — only footnotes / English latin names are italic.

### TRL band colours (s05 tech cards)

Same band logic as the theme report. Applied to the mini histogram bar
inside the tech card.

```ts
trlAvg >= 7   → trlColor "green" (商用展開 / 高成熟)
trlAvg 4–6.9 → trlColor "amber" (実証段階)
trlAvg < 4   → trlColor "blue"  (基礎研究)
```

Pills use `bg-{tone}-100 / text-{tone}-700`. Bar fills use `bg-{tone}-500`.

### Section sub-headers

`text-[12px] font-mono text-gray-600 font-semibold uppercase tracking-widest mb-2`
— same as the theme report. Don't drop `uppercase` even for Japanese: it's a
no-op visually but keeps the class string scannable.

---

## 6. Citations

The query report uses **inline `<cite>` tags** in HTML body strings, **not**
`[[cite:id]]` markers (the theme-report convention). Reasoning: the AI prompt
emits `<cite>Source Name (Year)</cite>` directly; we style those tags via the
prose class.

Implementation lives in `proseClasses.ts`:

```ts
"[&_cite]:inline [&_cite]:not-italic [&_cite]:font-mono [&_cite]:text-[10px]
 [&_cite]:bg-blue-50 [&_cite]:text-blue-700 [&_cite]:px-1.5 [&_cite]:py-[1px]
 [&_cite]:rounded [&_cite]:ml-1 [&_cite]:align-[1px] [&_cite]:whitespace-nowrap"
```

External source URLs go in the per-section `sources: [{ label, url }]`
array, rendered by `<QuerySources>` at the bottom of each section. There is
no `memlab` purple badge variant in the query report yet — if you add one,
mirror the theme report's `ThemeMemlabBadges` pattern.

---

## 7. Header (`QueryReportHeader`)

The top bar uses the same `ScenarioSelectionHeader` layout (white rounded
strip, `flex items-center justify-between`, query in the centre, Ask AI on
the right), but adds a **mode dropdown** on the left of the input.

```text
+----------------------------------------------------------------+
| [≡ クエリを深掘り ▼]  [search input space         ↑]   [Ask AI]|
+----------------------------------------------------------------+
```

Mode pill sizing in the trigger: `h-9 rounded-[8px] px-3`. Gap from the
input: `gap-[0.2rem]`. Inside the dropdown menu, each option re-uses
`ModePill` with `size="menu"` (28 px tall, pill-shaped). Colours of each
mode pill match the toggle on the Index page exactly — see the table in
§5.

Default selection: `QUERY`. Submit routes:

| Mode  | Destination                  | Router state                       |
|-------|------------------------------|------------------------------------|
| QUERY | `/query-report-preview`      | `{ query, searchMode: "query" }`   |
| TED   | `/scenario-selection`        | `{ query, mode: "TED" }`           |
| FAST  | `/` (Index)                  | `{ query, mode: "FAST" }`          |

---

## 8. Quick sanity-check checklist

When generating or styling a new section, verify:

- [ ] Section anchor `id="query-sNN"` and `<QuerySectionHeader num="NN" ...>`
      match.
- [ ] Sources rendered through `<QuerySources sources={data.sources} />` at
      the very bottom of the section.
- [ ] No coloured left/top borders on cards. Use background tint or the
      `font-bold` title as the only chrome.
- [ ] Card title is 12 px, body is 14 px.
- [ ] Body text wrapped in `QUERY_PROSE_CLASS` (so inline `<cite>` renders
      as a blue pill).
- [ ] `ConfidenceBadge` used for every "high/medium/low" surface.
      Never render a coloured dot for confidence.
- [ ] External-link icons use the up-right arrow with the slide animation
      (200 ms, 2 px diagonal).
- [ ] Risk-type / category chips: neutral `bg-gray-100 text-gray-700`
      unless the colour carries meaning (subsidy status, classification
      A–E).
- [ ] No italic on body text. Italic only on metadata captions
      (sourceNote, nameEn, patentLagNote).
- [ ] Top-right metadata in a card uses `ml-auto` inside the title row.

---

## 9. Known TODOs

- [ ] Lift `s05.trlDefs` into a frontend constant (mirror
      `THEME_TRL_DEFS`); strip from the prompt schema.
- [ ] Add a runtime Zod validator at the report-data boundary covering the
      schema invariants (`principleMap.totalCombinations` equals the product
      of axis values, `trlDist.length === 9`, header lengths, etc.).
- [ ] Decide if `memlab` purple badge variant is needed — mirror the theme
      report if so.
- [ ] Add PDF / print download.
- [ ] Wire real generation pipeline (currently the page renders a single
      hard-coded fixture from `queryReportExample.ts`).
