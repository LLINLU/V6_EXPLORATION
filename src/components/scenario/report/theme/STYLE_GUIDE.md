# Theme Report — Dev Handover Style Guide

A practical reference for engineers picking up Theme Report styles from this branch
(`Exploration/RDE-294/Apr27/Lindsay`) into their own dev branch. Read this first
before grafting components or replicating patterns elsewhere.

---

## 1. Where the code lives

```
src/components/scenario/report/
├─ primitives/                          ← shared, reusable across reports
│  ├─ ReportFoldableCard.tsx            ← collapsible card with badge + title bar
│  ├─ ReportInfoCallout.tsx             ← labeled info box (gray/red/emerald/etc.)
│  ├─ ReportTabs.tsx                    ← tab switcher (key+label+optional count)
│  └─ index.ts                          ← barrel export
└─ theme/
   ├─ ThemeReportView.tsx               ← top-level renderer + TOC + reading guide
   ├─ ThemeSectionHeader.tsx            ← "01 — シナリオの背景" header strip
   ├─ ThemeMemlabBadges.tsx             ← purple "MEMORY LAB 調査結果" pill
   ├─ ThemeSourceList.tsx               ← bottom-of-section external source pills
   ├─ citations.tsx                     ← [[cite:id]] inline citation icons
   ├─ constants.ts                      ← THEME_TRL_DEFS (9 EU H2020 levels)
   └─ sections/
      ├─ ThemeSection01.tsx … 08.tsx    ← one component per report section
```

Data shape lives in `src/types/theme-report.ts`. Sample data in
`src/data/mock-theme-report.json`.

---

## 2. Section ↔ data mapping

| # | Section          | Data field    | Notable patterns                                     |
|---|------------------|---------------|------------------------------------------------------|
| 1 | 背景             | `s01`         | KPI cards, HTML body with `[[cite:id]]` markers, policy strip |
| 2 | 定義             | `s02`         | Definition block (blue-50), advantage gray cards, customer cards |
| 3 | 市場規模予測     | `s03`         | TAM hero + tamCards, forecasts table, SAM block, formula bar with info tooltip, dataType legend dots |
| 4 | 規制・制度上の課題 | `s04`         | Issue cards with neutral gray category pill in top-right |
| 5 | 現状アプローチ   | `s05`         | Approaches table, structural-barriers `ReportInfoCallout` |
| 6 | 技術の優位性     | `s06`         | One `ReportFoldableCard` per comparison row; red + green `ReportInfoCallout`s inside |
| 7 | 技術の成熟度     | `s07`         | EU TRL definitions card (collapsed by default); per-tech card with band-coloured value/histogram and click-to-toggle literature |
| 8 | プレイヤー分析   | `s08`         | `ReportTabs` switching between competitors / collaborators / researchers tables |

---

## 3. Reusable primitives

These are the components you should pull first when adding a new report or section.

### `ReportFoldableCard`
- White rounded card with a clickable header. Header has a numbered badge (e.g. `01`),
  a title string, and a chevron that rotates with state.
- Children render below the header when expanded.
- Default-open state controlled via `defaultOpen` (true by default).

### `ReportInfoCallout`
- Labeled info box with a left-aligned pill.
- Props: `label`, `labelTone` (`"gray" | "red" | "emerald" | "blue"`), `showInfoIcon` (lucide `Info` icon prefix).
- Use it for any "label + content" pattern. Examples in the codebase:
  - s05 structural barriers (no label, `showInfoIcon` only)
  - s06 currentLimit (red label) and solution (emerald label) inside each comparison row.

### `ReportTabs`
- Horizontal tab switcher with optional `(count)` suffix.
- Wraps `data.{tab}.rows.length` etc. Keeps the active key in parent state.
- Used by s08 for the player tabs (競合企業 / 協力機関 / 主要研究者).

---

## 4. Locked constants — never let the model regenerate these

These live in code, not in the JSON / model output, because they're either boilerplate
or reference values that should not drift across reports.

| Constant | Where | Why locked |
|---|---|---|
| `THEME_TRL_DEFS` | `theme/constants.ts` | EU H2020 TRL definitions are stable; same 9 entries every report. Saves tokens, prevents translation drift. |
| `GROUP_INTROS` | `theme/ThemeReportView.tsx` | Reading guide intros are scenario-agnostic copy. Roman numerals (`I` / `II` / `III`) act as labels. |
| `TABLE_HEADERS` (s08) | `sections/ThemeSection08.tsx` | Player table column headers are fixed per tab type. Model only produces row data. |
| `sam.note` boilerplate | `sections/ThemeSection03.tsx` | Currently still in JSON; consider moving to a constant. |

If you're forking the prompt, **drop these fields from the prompt schema**. The frontend supplies them.

---

## 5. Visual patterns to match

### White-card-with-gray-inset
For sub-rows or secondary content. Used in s02 advantages, s06 callouts, s03 SAM source table.

```html
<div class="bg-white rounded-lg border border-gray-200 px-5 py-4">
  <div class="bg-gray-50 rounded-md px-3 py-2"> ... </div>
</div>
```

### Pills

| Tone | Background | Text | Use case |
|---|---|---|---|
| Neutral gray | `bg-gray-100` | `text-gray-600` | Default — categories that don't need colour signal (s04, s05, s07 paper years if generic) |
| Emerald | `bg-emerald-50` | `text-emerald-700` | "実測値" or positive resolution ("本技術による解決" in s06) |
| Blue | `bg-blue-50` | `text-blue-700` | "推計値" |
| Amber | `bg-amber-50` | `text-amber-700` | "想定値" |
| Red | `bg-red-50` | `text-red-700` | Limitations / blockers ("現状手法の限界" in s06) |
| Purple | `bg-purple-50` | `text-purple-700` | Reserved for **MEMORY LAB** badges only — don't use for content pills |

Default size: `font-mono text-[12px] px-2 py-0.5 rounded-full`. Use `w-fit` if the parent is a block element.

### TRL band colours (s07 only)

```ts
trlAvg >= 6.0  → emerald (TRL 6.0以上 — 実証済)
trlAvg >= 4.0  → blue    (TRL 4.0〜5.9 — 関連環境実証)
trlAvg <  4.0  → amber   (TRL 3.9以下 — 概念実証)
```

The legend dots use raw RGBA values to match a Figma reference:
- Emerald: `bg-[rgba(91,225,180,1)] border border-[rgba(59,222,138,1)]`
- Blue:    `bg-[rgba(114,167,253,1)]`
- Amber:   `bg-[rgba(255,201,107,1)]`

> **TODO:** Migrate these to tokens in `design-system/tokens/colors.json` and re-export.

### Section sub-headers
`text-[12px] font-mono text-gray-600 font-semibold mb-2` — no `uppercase` or `tracking-widest`
when the label contains Japanese characters (those modifiers are no-ops on Japanese and add
unwanted spacing).

### External-link arrow
Whenever a bold title links externally (paper rows in s07, source rows in s03):

```html
<a class="text-[14px] font-semibold text-gray-900 hover:text-blue-700 transition-colors">
  {title}
  <svg class="inline-block w-2.5 h-2.5 ml-1 align-middle text-blue-600" ...>
    <path d="M2.5 9.5L9.5 2.5M9.5 2.5H5.5M9.5 2.5V6.5" .../>
  </svg>
</a>
```

---

## 6. Typography ladder (theme report)

| Element | Size | Weight | Notes |
|---|---|---|---|
| Hero theme title | `text-base` (panel) / `text-2xl` (fullscreen) | bold | `data.theme` |
| Scenario subtitle | `text-[14px]` / `text-[15px]` | regular | gray-700 |
| Section title | section header component handles | bold | "01 — シナリオの背景" |
| Sub-header | `text-[12px]` | semibold | `font-mono`, gray-600 |
| Body | `text-[14px]` | regular | gray-700, `leading-relaxed` |
| Pill | `text-[12px]` | regular | `font-mono` |
| Source / metadata | `text-[12px]` or `text-[11px]` | regular | gray-400 / gray-500 |
| Mini stat (e.g. trlAvg) | `text-[28px]` | bold | band-coloured |

`leading-snug` for titles, `leading-relaxed` for body text.

---

## 7. Tooltip pattern

Use the project's Radix wrapper at `@/components/ui/tooltip`. Two-line tooltips with
constrained width:

```tsx
<TooltipProvider delayDuration={150}>
  <Tooltip>
    <TooltipTrigger asChild>
      <button aria-label="..."><Info className="w-3.5 h-3.5" /></button>
    </TooltipTrigger>
    <TooltipContent side="top" align="start" className="max-w-[260px] text-[12px] leading-relaxed whitespace-normal">
      {message}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

`max-w-[260px]` + `whitespace-normal` is what makes long Japanese copy wrap cleanly.

---

## 8. Click-to-toggle pattern

For full-card click-to-fold (used by tech cards in s07):

```tsx
<div
  onClick={hasContent ? toggle : undefined}
  onKeyDown={hasContent ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle() } } : undefined}
  role={hasContent ? "button" : undefined}
  tabIndex={hasContent ? 0 : undefined}
  aria-expanded={hasContent ? open : undefined}
  className={`px-5 py-4 ${hasContent ? "cursor-pointer hover:bg-gray-50/50 transition-colors" : ""}`}
>
  ...
  <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform ${open ? "" : "rotate-180"}`} />
</div>
```

The chevron is **decorative** — no separate `<button>`. Avoid nesting clickable
elements inside the clickable parent (event bubbling causes double-toggles).

---

## 9. Print / PDF download

`window.print()` is wired to a `Download` lucide icon in `ScenarioPaperPanel.tsx`. Shown
**only** when:

- the active tab is `summary` (the Theme Report tab), AND
- the panel is in fullscreen mode (`isExpanded === true`).

There is no `@media print` style block yet — the print output reflects the live DOM. If
you need a polished PDF layout, add print-specific CSS to `src/index.css` (hide chrome,
expand container, force light theme).

---

## 10. Sources / citations

- **Inline citations** in HTML body strings use `[[cite:id]]` markers. `citations.tsx`
  replaces them with anchor + arrow icon at render time.
- **MEMORY LAB sources** are sources with `type: "memlab"` — surfaced as purple badges
  via `ThemeMemlabBadges` near the top of any section that uses them.
- **External sources** are `{ id?, label, url }` — surface them inline via
  `[[cite:id]]` markers OR via `ThemeSourceList` at the bottom of a section.
- **Don't mix** memlab and external URLs inside one source object.

---

## 11. Migrating styles into your branch

If you're cherry-picking the visual pattern (not the whole feature), the order that
minimizes conflicts:

1. Copy `src/types/theme-report.ts` (no runtime deps).
2. Copy `src/components/scenario/report/primitives/` — these have no theme-specific imports.
3. Copy `src/components/scenario/report/theme/constants.ts` and `ThemeMemlabBadges.tsx` /
   `ThemeSourceList.tsx` / `ThemeSectionHeader.tsx` / `citations.tsx` — these are leaf utilities.
4. Copy `src/components/scenario/report/theme/sections/ThemeSection01.tsx … 08.tsx`.
5. Copy `src/components/scenario/report/theme/ThemeReportView.tsx` last.
6. Copy `src/data/mock-theme-report.json` if you want a working render without backend.

Tailwind classes used:
- All standard utilities — no plugin dependencies.
- A handful of arbitrary values (`bg-[rgba(...)]`, `text-[28px]`, etc.). These are picked
  up automatically by Tailwind's JIT — no `safelist` needed.

---

## 12. Known TODOs

- [ ] Migrate inline RGBA TRL band colours into design tokens.
- [ ] Move `sam.note` boilerplate ("複数データ組み合わせによる試算値") from the prompt to
      a frontend constant.
- [ ] Add a runtime Zod validator at the report-data boundary covering R1–R7 (s05↔s06 row
      parity, samFormula↔samFactors name match, trlDist length 9, headers length match).
- [ ] Add `@media print` CSS so the download action produces a clean full-width PDF.
- [ ] Sweep the rest of the codebase for `億` → `B` if the convention is meant to be
      project-wide (currently only the theme mock fixture has been swept).

---

## 13. Quick sanity-check checklist

When you copy a section to a different report, verify:

- [ ] Section ID anchor (`id="theme-sNN"`) and `<ThemeSectionHeader num="NN" ...>` match.
- [ ] Source rendering: external sources go through `ThemeSourceList` or inline citations;
      memlab sources go through `ThemeMemlabBadges`.
- [ ] Pill colours follow the table in §5 — neutral gray by default, colour only when
      it carries meaning.
- [ ] `font-mono` appears only on small uppercase / mono labels (years, badges, sub-headers).
      Body text uses the default sans-serif.
- [ ] Cards use `px-5 py-4` (or larger) padding. Avoid `p-3` — feels cramped.
