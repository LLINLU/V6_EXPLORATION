# Query Report — AI Generation Spec (RDE-424)

The report content is **AI-generated**. This spec is the authoring contract for
the generator that emits a `QueryReportData` JSON object. It is written to be
**prompt-ready**: it mirrors the house generation-prompt style used by
`be/src/services/scenarioReportService/prompt.ts` (the *scenario* report — a
different report; use it only as a structural reference) and can be lifted into a
new `SYSTEM_PROMPT` for the query report.

- **Field shapes & rendering behavior** → see `./README.md` and `src/types/query-report.ts` (single source of truth). This doc does **not** repeat the field tables; it covers *how to write each field* and the *cross-field rules*.
- A new generator should live alongside the scenario one, e.g. `be/src/services/queryReportService/prompt.ts`, and emit exactly the `QueryReportData` shape.

---

## Output Language
The user message includes a `Language:` field. Follow it strictly — every string
value (titles, labels, body, table headers, notes) in that language. Field names,
enum *codes*, and structure never change.

## Role & Output
You are the "Query Report structuring pipeline." Take the input (theme / scenario
/ query) , research it via web search, and output **one JSON object** that fully
conforms to `QueryReportData`. Output begins with `{` and ends with `}` — no prose,
no code fences, no markdown around it.

## Output Rules
| # | rule |
|---|---|
| O1 | Leading `{`, trailing `}` only. No code fences. |
| O2 | 2-space indent. Do not minify. |
| O3 | All string values double-quoted; no `//` comments. |
| O4 | Field names / types / nesting come from the schema and cannot change. |
| O5 | Escape `"` as `\"` inside strings. For line breaks use `<br>`, never literal `\n`. |
| O6 | URLs are full `https://…`. No relative paths. |
| O7 | **Money units in English (B = billion, M = million).** e.g. `"$13.7B"`, `"$850M"`. No 兆/億/万. |
| O8 | **Do not fabricate numbers.** Mark uncertain values `（推定）`/"(est.)" with a basis in the same field. |

## Processing Phases (internal — do not emit)
1. **RESEARCH** — gather facts per section via web search.
2. **STRUCTURE** — build JSON in order `theme → s01 → … → s07`. Remember IDs you assign (axis IDs, combination IDs) so later sections can reference them.
3. **VALIDATE** — run the Consistency Rules below; fix mismatches.
4. **OUTPUT** — emit the JSON.

## Audience & Tone
| rule | content |
|---|---|
| Reader | business developers **and** researchers |
| Jargon | gloss on first use, ≤1 parenthetical sentence |
| Numbers | USD, calendar-year basis |
| HTML | only in rich-text fields (see Rich-text rule); tags limited to `<p> <strong> <em> <br> <cite>` |
| Conflicting sources | prefer most recent, then publisher authority. Do not present both sides. |

---

## Global content rules (apply across sections)

### R1 — Rich-text (`body`, `definition`) → HTML with `<cite>` for sources
These fields are injected as HTML. Use only `<p> <strong> <em> <br>`, and crucially
**`<cite>` for every inline source reference** — it renders as a small blue
citation pill. Example:
`"<p>現行の単価は$0.5〜$2程度 <cite>NextMSC (2024)</cite>。</p>"`
Do not italicize sources by hand; wrap them in `<cite>`.

### R2 — `confidence` everywhere it exists
Optional `"high" | "medium" | "low"`. Set it on policies, forecasts, events,
combinations, technologies, challenges when you can judge source strength. Omit to
hide the badge. Never invent a value to fill the slot.

### R3 — `sources[]` per section
`{ label, url? }`. Prefer entries with `url`. These are the section footer; keep
3–8 high-quality references. Use `type: "memlab"` only for internal MemoryLab data.

### R4 — Link table cells
Use `{ text, url }` for any cell that should link out (DOIs, application portals);
plain `string` otherwise. Note: in **S07** the link cell's `text` is not shown
(arrow-only), but still send a real `url`.

---

## Section authoring instructions
For each: **Gate** (precondition) → **Content** (what to write) → **Anti-pattern**.
Field-by-field shapes are in README; only generation guidance is below.

### Top level
- `theme` — the query/theme as a noun phrase (H1).
- `scenario` — one line framing the analytical angle.
- `summary` — 2–3 sentence lead; the "so what" of the whole report.

### s01 要請背景 (Background)
- **Gate**: web search (policy docs / statistics first).
- **Content**: 2–4 `kpis` (headline figures driving demand); `body` prose with `<cite>`; `policies[]` for major countries — `flag` is a **flag emoji** (🇺🇸), `country` localized, `text` one tight paragraph, `sourceUrl` when available.
- **Anti-pattern**: KPIs without a clear demand-side meaning; policy text that just restates the country name.

### s02 定義・役割 (Definition & role)
- **Gate**: academic definition → press releases.
- **Content**: `definitionTitle` + `definition` (HTML) = crisp canonical definition; `advantages[]` = technical strengths, each `label` (short tag), `title`, `body` (HTML), optional `sourceStrength`.
- **Anti-pattern**: marketing language; advantages that are restated features, not differentiators.

### s03 市場規模 (Market size)
- **Gate**: compare **multiple** research-firm reports.
- **Content**: `tam` hero (the headline market with `sourceOrg`/`sourceYear`/`sourceUrl`); `tamCards` = 2–4 supporting metrics (shares, CAGR); `forecasts[]` = one row per firm with `current`→`future`, `pctFill` 0–100 (relative bar), `cagr`, optional `scenario`.
- **Anti-pattern**: a single source presented as fact; `pctFill` not proportional to the figures.

### s04 技術史年表 (Tech-history timeline)
- **Gate**: web search.
- **Content**: `intro` (section point) + `body`; `searchKeywords` actually used; `annualData[]` numeric series (`papersDelta`/`patentsDelta` like `"+12"`); `patentLagNote` caveat; `chartPhases[]`; `events[]` milestones (`date`, `title`, `body`, `confidence`); `papersTable` with DOI link cells; `patents` with top assignees (**`country` = Japanese name** from the supported set, see README 3e).
- **Anti-pattern**: invented counts; assignee countries outside the supported flag set; events without dates.

### s05 技術構造 (Tech structure) — most interlinked
- **Gate**: web search.
- **Content**:
  - `scopeDeclaration` — broad vs narrow definition, adopted scope, `excluded[]` adjacent tech with reasons.
  - `subprocesses` — `centralMechanism` sentence + ordered `items[]` (each `isEssential`, `keyVariables[]`).
  - `principleAxes[]` — orthogonal axes; assign `axisId` (e.g. `"軸A1"`), list `values[]`, `linkedSubprocess`.
  - `principleMap` — `totalCombinations`, `axesSummary` (e.g. `"軸A1×3 × 軸A2×3 × 軸A3×3 = 27通り"`), and `combinations[]` each with `id` (e.g. `"C01"`), `axisValues` referencing axis IDs, `methodName`, `classification` A–E, `classificationNote`.
  - `trlIntro`, `trlDefs` (TRL 1–9), `technologies[]` (see TRL rules R5/R6).
- **Anti-pattern**: axes that overlap (not orthogonal); combination `axisValues` referencing undefined axis IDs; `technologies[].principleMapRef` pointing to a non-existent combination `id`.

### s06 課題 (Challenges)
- **Gate**: web search.
- **Content**: `intro` + `body`; `challenges[]` each `title`, `riskType` (enum below), `barrier` (one-line blocker, shown as `障壁：…`), `body` (HTML), `confidence`. Cover a spread of risk types.
- **Anti-pattern**: every challenge tagged `tech`; `barrier` duplicating `title`.

### s07 公的支援 (Public support)
- **Gate**: web search (and provided data if any).
- **Content**: `intro`; `programTable` with `headers` and `rows`. **Column index 4 = status** — its value must be a `QuerySubsidyStatus` (募集中 / 終了 / 定期公募 / 要確認). The application-portal column uses link cells `{text,url}`.
- **Anti-pattern**: status values outside the enum; portal cells without a URL.

---

## Enums (codes are fixed; never localize the code)
| field | allowed values |
|---|---|
| `confidence` | `high` `medium` `low` |
| `classification` (s05) | `A` 商用化 · `B` 実証 · `C` 基礎研究 · `D` 空白 · `E` 不成立 |
| `trlColor` (s05) | `green` (TRL 7–9) · `amber` (4–6) · `blue` (1–3) |
| `riskType` (s06) | `tech` 技術 · `economic` 経済 · `regulatory` 規制 · `social` 社会 · `geopolitical` 地政学 |
| subsidy status (s07 col 4) | `募集中` `終了` `定期公募` `要確認` |
| `scenario` (s03 forecast) | `base-case` `optimistic` `conservative` |

---

## Consistency Rules (validate before output)
- **R5 — TRL band match**: `technologies[].trlColor` matches `trlAvg` (1–3 blue, 4–6 amber, 7–9 green) and `trlVerdict` text agrees.
- **R6 — TRL histogram**: `trlDist` has **9 elements** (levels 1–9) and sums to `trlN`; its weighted mean ≈ `trlAvg`.
- **R7 — principleMap count**: `totalCombinations` equals `combinations.length` (or, if sampling, `axesSummary` math equals `totalCombinations`).
- **R8 — ID references resolve**: every `combination.axisValues[].axisId` exists in `principleAxes`; every `technology.principleMapRef` matches a `combination.id`.
- **R9 — sourceNote URL** (R below): each `technologies[].sourceNote` contains an `https://` URL.
- **R10 — subprocess linkage**: each `principleAxis.linkedSubprocess` names a real `subprocesses.items[].name`.

### Rich-source rule for `sourceNote`
`QueryTechnology.sourceNote` is split by the renderer into `{title, url}`. Write it as
`"<title> <https URL>"` or `"<title>。関連文献: <https URL>"`. The trailing
`関連サーベイ:` / `関連文献:` label and punctuation are stripped automatically; the
title becomes a clickable pill. **Always include a URL.**

---

## Output skeleton (shape only — fill every section)
```json
{
  "theme": "…", "scenario": "…", "summary": "…",
  "s01": { "kpis": [], "body": "<p>…</p>", "policies": [], "sources": [] },
  "s02": { "definitionTitle": "…", "definition": "<p>…</p>", "advantages": [], "sources": [] },
  "s03": { "tam": { "value": "$…B", "label": "…", "sourceOrg": "…", "sourceUrl": "https://…", "sourceYear": "2024" }, "tamCards": [], "forecasts": [], "sources": [] },
  "s04": { "intro": "…", "searchKeywords": [], "body": "<p>…</p>", "annualData": [], "patentLagNote": "…", "chartPhases": [], "events": [], "papersTable": { "headers": [], "rows": [] }, "patents": { "trendNote": "…", "topAssignees": [], "dataSource": "…" }, "sources": [] },
  "s05": { "scopeDeclaration": { "broadDef": "…", "narrowDef": "…", "adoptedScope": "…", "excluded": [] }, "subprocesses": { "centralMechanism": "…", "items": [] }, "principleAxes": [], "principleMap": { "totalCombinations": 0, "axesSummary": "…", "combinations": [] }, "trlIntro": "…", "trlDefs": [], "technologies": [], "sources": [] },
  "s06": { "intro": "…", "body": "<p>…</p>", "challenges": [], "sources": [] },
  "s07": { "intro": "…", "programTable": { "headers": [], "rows": [] }, "sources": [] }
}
```

> Validate the final object against `src/types/query-report.ts` at the service
> boundary before persisting — a shape mismatch is the only thing that breaks the
> approved design.
