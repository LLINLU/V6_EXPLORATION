# Query Report — Implementation Guide (RDE-424)

This guide is for engineers wiring up the **Query Report** for every query. Read
the "Golden rule" first — it changes how you think about the rest.

---

## Golden rule: the design lives in the components, not in the data

You do **not** restyle anything per query. The look (spacing, colors, badges,
filters, source-pills, typography) is fully baked into the React components in
this folder. To make a query render in this design, you only need to **produce
one correctly-shaped `QueryReportData` object** and hand it to the view:

```tsx
import { QueryReportView } from "@/components/scenario/report/query/QueryReportView"
import type { QueryReportData } from "@/types/query-report"

const data: QueryReportData = await getQueryReport(queryId) // your data source

<QueryReportView data={data} isExpanded={true} />
```

If the data matches the contract below, the report is automatically consistent
with the approved design — across every query, forever. **Getting the data shape
and content conventions right IS the design work.** There is no per-query CSS.

> The single source of truth for the shape is **`src/types/query-report.ts`**.
> This doc explains the *meaning, formatting rules, and gotchas* behind that type.

---

## 1. Integration

| Thing | Value |
|---|---|
| Entry component | `QueryReportView` (`./QueryReportView.tsx`) |
| Props | `data: QueryReportData` (required), `isExpanded?: boolean` (default `false`) |
| Live example data | `src/data/queryReportExample.ts` (`queryReportExample`) |
| Standalone report route | `/query-report?id=:id` (`src/routes/QueryReportPreview.tsx`) |

### `isExpanded`
- `true` → full-width layout, sticky left **table of contents**, 2–3 column grids. Use for a dedicated/fullscreen report page.
- `false` → narrow "panel" layout (~520px), inline 目次, single-column grids. Use when the report sits in a side panel.

Both modes render the **same data**; only layout/columns differ. Don't fork data per mode.

### Where the data comes from
Each query's report content is produced upstream (generator / edge function / DB)
and must be serialized into `QueryReportData`. Validate against the TS type at the
boundary — a shape mismatch is the only way to break the design.

---

## 2. Top-level shape

```ts
interface QueryReportData {
  theme: string      // H1 hero title
  scenario: string   // one-line subtitle under the title
  summary: string    // lead paragraph (rendered in a left-border blockquote)
  s01: QueryS01      // 要請背景   (Background)
  s02: QueryS02      // 定義・役割 (Definition & role)
  s03: QueryS03      // 市場規模   (Market size)
  s04: QueryS04      // 技術史年表 (Tech history timeline)
  s05: QueryS05      // 技術構造   (Tech structure)
  s06: QueryS06      // 課題       (Challenges)
  s07: QueryS07      // 公的支援   (Public support)
}
```

All 7 sections are always rendered in order, separated by hairline dividers.
Within a section, **arrays that are empty are simply skipped** (the block doesn't
render), so optional blocks can be omitted by sending `[]`.

---

## 3. Shared primitives & content conventions

These behaviors apply across multiple sections — learn them once.

### 3a. Rich-text `body` fields → HTML, not Markdown
Fields named `body` / `definition` / `intro`(some) are injected via
`dangerouslySetInnerHTML` and styled by `QUERY_PROSE_CLASS` (`./proseClasses.ts`).

- **Send HTML**, not Markdown. Supported/styled inline tags:
  - `<p>…</p>` — paragraphs (auto-spaced).
  - `<strong>…</strong>` — bold, darkened to gray-900.
  - `<cite>…</cite>` — **renders as a small blue citation pill** (e.g. `<cite>NextMSC (2024)</cite>`). This is the canonical way to inline a source reference inside prose. Do not italicize manually; the component handles it.
- Sanitize upstream — this is raw HTML insertion.

### 3b. `ConfidenceBadge` — optional everywhere it appears
Any `confidence?: "high" | "medium" | "low"` field renders a pill:

| value | renders |
|---|---|
| `"high"` | 信頼度：高 (green) |
| `"medium"` | 信頼度：中 (amber) |
| `"low"` | 信頼度：低 (gray) |
| omitted/`undefined` | nothing |

### 3c. `sources: QueryReportSource[]` — the footer of every section
```ts
{ label: string; url?: string; type?: "memlab" }
```
- With `url` → clickable external pill (↗). Without → plain text pill.
- Renders under a 出典・参考資料 heading. Send `[]` to hide.

### 3d. `QueryTableCell` — table cells are string **or** link
```ts
type QueryTableCell = string | { text: string; url: string }
```
- Plain `string` → text.
- `{ text, url }` → external link. **Section-specific rendering:**
  - **S04** (papers table): renders `text` + animated ↗ arrow (DOI-style link).
  - **S07** (program table): renders **arrow only** — the `text` is intentionally dropped, so just pass any non-empty string with the real `url`.

### 3e. Country flags
`QueryPolicy.flag` (S01) expects a **flag emoji** (e.g. `"🇺🇸"`); it's converted to an
ISO code internally. S04 assignee `country` expects a **Japanese country name**
from this supported set: 米国, 日本, 英国, 韓国, スイス, ドイツ, フランス, 中国,
台湾, イスラエル, カナダ, オランダ, シンガポール. Unlisted names render without a flag.

---

## 4. Section-by-section data contract

> ✅ = required, ⬜ = optional (omit field or send empty array)

### S01 要請背景 — `QueryS01`
| field | req | type | notes |
|---|---|---|---|
| `kpis` | ✅ | `QueryKpi[]` | Big-number cards (`value` accent-colored, `label` muted). `[]` hides the row. |
| `body` | ✅ | HTML | Prose with `<cite>` pills (see 3a). |
| `policies` | ✅ | `QueryPolicy[]` | "主要国の政策動向" cards: `flag`(emoji)+`country`+`text`, optional `confidence`, `sourceUrl`. |
| `sources` | ✅ | `QueryReportSource[]` | See 3c. |

### S02 定義・役割 — `QueryS02`
| field | req | type | notes |
|---|---|---|---|
| `definitionTitle` | ✅ | string | Bold title inside the blue 定義 callout. |
| `definition` | ✅ | HTML | Prose inside the callout. |
| `advantages` | ✅ | `QueryAdvantage[]` | "技術的優位性" cards: `label`(any leading `Strength ` is stripped), `title`, `body`(HTML), optional `sourceStrength`. |
| `sources` | ✅ | source[] | |

### S03 市場規模 — `QueryS03`
| field | req | type | notes |
|---|---|---|---|
| `tam` | ✅ | `QueryTam` | Full-width hero card. `value` is the big number; `sourceOrg`/`sourceYear`/`sourceUrl` render the clickable source chip. |
| `tamCards` | ✅ | `QueryKpi[]` | Secondary metric cards, **one row** (3-col when expanded). |
| `forecasts` | ✅ | `QueryForecast[]` | "主要市場予測の比較" table. `pctFill` (0–100) drives the bar width; `scenario` adds a ベース/強気/保守 tag. |
| `sources` | ✅ | source[] | |

### S04 技術史年表 — `QueryS04`
| field | req | type | notes |
|---|---|---|---|
| `intro` | ✅ | string | "このセクションのポイント" blue callout. |
| `searchKeywords` | ✅ | string[] | Keyword chips. |
| `body` | ✅ | HTML | Prose. |
| `annualData` | ✅ | `QueryAnnualDataPoint[]` | Year rows with paper/patent bars (auto-scaled to max). |
| `patentLagNote` | ✅ | string | Renders in a gray ⚠ note box. |
| `chartPhases` | ✅ | `QueryChartPhase[]` | Phase cards. |
| `events` | ✅ | `QueryEvent[]` | **Timeline**: `date`+`confidence` on the rail, `title`+`body` in a gray card. |
| `papersTable` | ✅ | `QueryPapersTable` | `headers` + `rows` of `QueryTableCell` (use `{text,url}` for DOIs). |
| `patents` | ✅ | `QueryPatents` | Trend note + top assignees (Japanese `country` names → flags). |
| `sources` | ✅ | source[] | |

### S05 技術構造 — `QueryS05` (the most complex)
| field | req | type | notes |
|---|---|---|---|
| `scopeDeclaration` | ✅ | `QueryScopeDeclaration` | Collapsible スコープ宣言 (`<details>`, open by default). `excluded[]` lists adjacent tech. |
| `subprocesses` | ✅ | `QuerySubprocesses` | `centralMechanism` (light-blue callout) + numbered `items` (each `isEssential` → 必須/任意, `keyVariables` chips). |
| `principleAxes` | ✅ | `QueryPrincipleAxis[]` | Axis cards. |
| `principleMap` | ✅ | `QueryPrincipleMap` | **Interactive filter** — see 5b. `combinations[].classification` is `A`–`E`. |
| `trlIntro` | ✅ | string | Intro paragraph. |
| `trlDefs` | ✅ | `QueryTrlDef[]` | TRL 1–9 list; badges **auto-colored by level** (see 5c). |
| `technologies` | ✅ | `QueryTechnology[]` | Tech cards w/ TRL histogram. `trlColor` must match maturity (5c). `sourceNote` is special (5a). |
| `sources` | ✅ | source[] | |

### S06 課題 — `QueryS06`
| field | req | type | notes |
|---|---|---|---|
| `intro` | ✅ | string | Blue callout. |
| `body` | ✅ | HTML | Prose. |
| `challenges` | ✅ | `QueryChallenge[]` | Cards filterable by `riskType` (5d). Each card: `title`, `riskType` label chip, `barrier` line (`障壁：…`), `body`(HTML) in a gray box, optional `confidence`. |
| `sources` | ✅ | source[] | |

### S07 公的支援 — `QueryS07`
| field | req | type | notes |
|---|---|---|---|
| `intro` | ✅ | string | Blue callout. |
| `programTable` | ✅ | `QueryProgramTable` | `headers` + `rows`. **Column index 4 = status** → rendered as a gray badge (use the `QuerySubsidyStatus` enum values). Link cells render as **arrow-only** (3d). |
| `sources` | ✅ | source[] | |

---

## 5. Special formatting rules (the easy-to-miss ones)

### 5a. `QueryTechnology.sourceNote` must embed its URL
The component **splits this single string** into a clickable source pill. Format:

```
"<human title> <https URL>"
// or with a label that gets stripped:
"…に基づく。関連文献: <https URL>"
```

The parser pulls out the first `https?://…`, drops trailing `関連サーベイ:` /
`関連文献:` labels and dangling punctuation, and renders the title as a link to
the URL. **Always include a URL**, or it renders as plain text.

### 5b. Principle map (S05) is filter-gated — empty by default
The A–E classification chips are a **filter button group**. On first render
**no combination cards are shown** (a prompt invites selection); clicking a
classification reveals only its cards. So:
- Provide `combinations[]` with accurate `classification` (`A`–`E`) and `tally` is computed automatically.
- `totalCombinations` and `axesSummary` are shown as header text.

Classification meaning & color (fixed):

| code | label | color |
|---|---|---|
| A | 商用化 | emerald |
| B | 実証 | amber |
| C | 基礎研究 | blue |
| D | 空白 | violet |
| E | 不成立 | red |

### 5c. TRL color must match maturity
`QueryTechnology.trlColor` drives the histogram + verdict pill, and the TRL
definition badges auto-color by **level band**. Keep `trlColor` consistent with
`trlAvg`:

| band | levels | `trlColor` | typical verdict |
|---|---|---|---|
| research | 1–3 | `"blue"` | 基礎研究・開発中 |
| demonstration | 4–6 | `"amber"` | 実証・実用化前 |
| commercial | 7–9 | `"green"` | 商用展開中 |

### 5d. Challenge risk types (S06)
`riskType` selects the label chip + filter tab. Fixed mapping (soft pastel
palette — deliberately distinct from the semantic green/amber/red used elsewhere):

| `riskType` | label | hue |
|---|---|---|
| `tech` | 技術 | violet (lavender) |
| `economic` | 経済 | sky (light blue) |
| `regulatory` | 規制 | pink |
| `social` | 社会 | indigo (periwinkle) |
| `geopolitical` | 地政学 | fuchsia (mauve) |

Filter tabs default to **all-on**; the label chip shows beside each card's title.

---

## 6. Visual design language (only if you build *new* markup)

You won't need this to render the report — it's for anyone extending it (new
section, new card type) so additions stay on-system.

- **Card**: `bg-white rounded-lg border border-gray-200 p-4` (or `p-5` for roomier cards).
- **Body copy block**: place rich text in a `bg-gray-50 rounded-lg px-4 py-3` box.
- **Section header**: numbered blue chip (`bg-blue-50 text-blue-600`) + bold title — use `QuerySectionHeader`.
- **"Section point" callout**: `bg-blue-50 rounded-lg p-3/4`, mono `text-blue-600` label with a bulb icon.
- **Big numbers / KPI values**: accent `text-[#4f5fe0]`, `font-mono font-bold`.
- **Eyebrow labels**: `font-mono text-[10px]/[12px] uppercase tracking-widest text-gray-400`.
- **External-link arrow**: the inline `↗` SVG that lifts on hover (`group-hover:-translate-y-0.5 group-hover:translate-x-0.5`). Reuse for any "opens in new tab" affordance.
- **Type scale**: body 14px, secondary 12px, eyebrow/badge 10px. Titles `text-base` bold.
- **Semantic colors are reserved**: green = mature/good, amber = caution, red = fail. Do **not** reuse these for categorical tags — use a neutral/pastel hue (see S06).
- **Section rhythm**: sections are stacked with `space-y-8` and hairline `border-t border-gray-100` dividers.

---

## 7. Interactive behavior (free with the components)

- **TOC active-section highlight** — IntersectionObserver, automatic.
- **S05 collapsibles** (scope / TRL defs) — native `<details>`; scope is open by default.
- **S05 principle-map filter** & **S06 risk filter** — React state; require JS.

### Static export caveat
If you render this to a static HTML file (e.g. for download/PDF), native
`<details>` still toggle, but the JS filters and TOC scroll **do not** run, so the
report shows its **default state** (principle-map combinations hidden, all
challenges visible). Account for this if a static snapshot must show all content.

---

## 8. Implementation checklist

- [ ] Produce/transform each query's content into a `QueryReportData` object.
- [ ] Validate it against `src/types/query-report.ts` at the data boundary.
- [ ] `body`/`definition` fields are **HTML** with `<cite>` for inline sources.
- [ ] Every `QueryTechnology.sourceNote` embeds an `https://` URL.
- [ ] `trlColor` matches the TRL band (5c); `classification` ∈ A–E; `riskType` ∈ the 5 enums.
- [ ] S07 status sits in **column index 4**; link cells use `{text,url}`.
- [ ] Pick `isExpanded` for the surface (fullscreen page vs side panel).
- [ ] Empty optional blocks → send `[]` (don't fabricate placeholder content).
