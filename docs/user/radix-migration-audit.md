# Radix UI Migration Audit
**Date:** February 2026
**Audited by:** Claude Code (Explore agent — read all 90+ component files)
**Status:** Audit complete — ready for prioritized execution

---

## The Problem

Components are hardcoded. Interactive behaviors (modals, dropdowns, tabs, chat overlays) are built from scratch with custom `useState`, `useEffect + addEventListener`, manual z-index stacking, and no accessibility guarantees. The same component concept (chat input, scenario chat, expand/collapse) is implemented multiple times with slight variations.

The goal: Radix UI handles every solved interaction problem. We handle the styling.

---

## 1. Component Inventory

### Root-level (`src/components/`)

| File | Visual summary | Interactive behaviors | Radix primitive | Notes |
|------|---------------|----------------------|-----------------|-------|
| `AppSidebar.tsx` | App-wide nav sidebar shell | None — composition only | No Radix | Thin wrapper |
| `AuthProvider.tsx` | Auth context wrapper | None | No Radix | Logic only |
| `BrowseButton.tsx` | File/URL browse button | Click | No Radix | Simple |
| `ErrorBoundary.tsx` | Full-page error fallback | None (class component) | No Radix | Standard |
| `Navigation.tsx` | Top nav bar | None | No Radix | Layout |
| `PrivateRoute.tsx` | Auth guard redirect | None | No Radix | Logic only |
| `QueryRefiner.tsx` | Keyword chip multi-selector | Click-to-toggle chips; `useState` | No Radix | Has 20+ `.bak` files |
| `SearchSection.tsx` | Search input + submit | `useState`; Enter key | No Radix | Hardcoded `bg-[#F5F9FF]`, `border-[#cddeff]` |
| `TagBadge.tsx` | Colored badge label | None | No Radix | Arbitrary Tailwind values |
| `TreeGenerationSection.tsx` | Tree query entry with mode toggle | `useState` for mode + query; keyboard | No Radix | 21 `.bak` files; hardcoded hex throughout |

### `admin/`

All admin components (`LoadTestTab`, `SettingsTab`, `SystemOverviewTab`, `TeamManagementSection`, `UserManagementTab`, `UserTableSection`) are admin-only data display and form components. No Radix needed — they use shadcn components where relevant.

### `research-context/`

| File | Visual summary | Interactive behaviors | Radix primitive | Notes |
|------|---------------|----------------------|-----------------|-------|
| `RefinementChat.tsx` | Refining prompt chat panel | `useState` for input; scroll | No Radix | Duplicate chat input pattern |
| `ResearchContextSidebar.tsx` | Right sidebar with research cards | Collapsible sections | No Radix | Layout wrapper |
| `chat/ChatInput.tsx` | Textarea + send button | `onKeyDown` Enter; `useState` | No Radix | **THIRD** chat input — duplicates tech-tree versions |
| `chat/LoadingIndicator.tsx` | Animated loading dots | None | No Radix | Pure display |
| `sidebar/*` | Research context info cards | None or click | No Radix | All display-only |

### `scenario/`

| File | Visual summary | Interactive behaviors | Radix primitive | Notes |
|------|---------------|----------------------|-----------------|-------|
| `AddEnrichmentModal.tsx` | Dialog to add a metric column | `Dialog` (shadcn); expand/collapse categories via `useState` | **Already Radix Dialog** ✓ | `TooltipProvider` per-item (should hoist) |
| `CustomViewModal.tsx` | Dialog to create custom table views | `Dialog` (shadcn); same expand/collapse pattern | **Already Radix Dialog** ✓ | Nearly identical UI to AddEnrichmentModal |
| `EditQueryModal.tsx` | Dialog to edit search query | `Dialog` + `Switch` (shadcn) | **Already Radix Dialog** ✓ | 6+ hardcoded hex values |
| `EditScenarioModal.tsx` | Dialog to edit scenario name/tags | `Dialog` (shadcn); two AI regenerate modes | **Already Radix Dialog** ✓ | `style={{ fontWeight: 400 }}` inline |
| `ScenarioCard.tsx` | Checkbox-selectable metric card | `Checkbox` (shadcn) | **Already Radix Checkbox** ✓ | Hardcoded `border-[#5f98ff]` |
| `ScenarioFilters.tsx` | Row of Select + Popover filters | `Select` + `Popover` (shadcn) | **Already Radix** ✓ | Well-structured |
| `ScenarioMindmap.tsx` | Treemap SVG visualization | Canvas/SVG interaction | **DO NOT TOUCH** | Canvas |
| `ScenarioPaperPanel.tsx` | Side panel for scenario papers | Scroll; open/close via raw div | → **Sheet** | Raw positioned div |
| `ScenarioTableView.tsx` | Data comparison table | Sort/column state | **DO NOT TOUCH** | Data table |
| `TRLModal.tsx` | Dialog showing TRL breakdown | `Dialog` (shadcn) | **Already Radix Dialog** ✓ | Hardcoded `bg-[#F5F9FF]` |
| `CAGRIndicator.tsx`, `DifficultyBadge.tsx`, `MarketStructureIndicator.tsx`, `TAMIndicator.tsx`, `TimeToMarketBadge.tsx`, `TRLIndicator.tsx` | Metric badge displays | None | No Radix | All display-only |
| `chat/ScenarioChatBox.tsx` | Floating draggable scenario chat | `useState` for open/drag | → **Sheet** (or keep custom — see Pair D) | Mirrors ChatOverlay |
| `chat/ScenarioChatOverlay.tsx` | Draggable overlay for scenario chat | Drag + resize via mouse events | **DO NOT TOUCH** | Custom drag behavior |
| `chat/ScenarioChatPanel.tsx` | Panel wrapper | Layout | No Radix | Mirrors ChatPanel.tsx |
| `chat/ScenarioChatContent.tsx` | Chat scroll area | Scroll; `useState` | No Radix | Hardcoded hex values |
| `chat/ScenarioChatHeader.tsx` | Chat header with mode toggle | Click; `useState` | No Radix | Duplicates ChatHeader.tsx |
| `value-rationale/RationaleHoverCard.tsx` | Hover popover metric rationale | Click to open modal | No Radix (content only) | Hardcoded `bg-[#F5F9FF]` |
| `value-rationale/RationaleModal.tsx` | Dialog with derivation text | `DialogPrimitive.Root` — **raw Radix, bypasses shadcn wrapper** | → Refactor to shadcn Dialog | Inconsistent with all other dialogs |
| `value-rationale/ValueWithRationale.tsx` | Inline value → hover card + modal | `HoverCard` (shadcn); `useState` | **Already Radix HoverCard** ✓ | Well-structured |

### `search-results/`

| File | Visual summary | Interactive behaviors | Radix primitive | Notes |
|------|---------------|----------------------|-----------------|-------|
| `ResultsTabs.tsx` | Tab bar (Papers / Researchers / Patents) | `Tabs` (shadcn); **redundant `useState` mirroring Tabs' own state** | **Already Radix Tabs** ✓ | Contains hardcoded dummy data — prototype? |
| `SearchBar.tsx` | Search input + submit | `useState`; keyboard | No Radix | Hardcoded `bg-[#E8F0FF]`, `border-[#cddeff]` |
| `SearchCriteria.tsx`, `ResultsHeader.tsx`, `SearchResultsContent.tsx` | Display components | None | No Radix | Display/layout |

### `shared/`

| File | Visual summary | Interactive behaviors | Radix primitive | Notes |
|------|---------------|----------------------|-----------------|-------|
| `ChatMessage.tsx` | Single message bubble | Click on links | No Radix | Shared across all chat instances |

### `sidebar/`

| File | Visual summary | Interactive behaviors | Radix primitive | Notes |
|------|---------------|----------------------|-----------------|-------|
| `CreateProjectDialog.tsx` | Dialog to create a project | `Dialog` (shadcn); `useState` | **Already Radix Dialog** ✓ | Well-structured |
| `SidebarProjects.tsx` | Expandable project list | Click expand/collapse; `useState` | → **Accordion** | Manual toggle |
| `TreeSearchModal.tsx` | Cmd+K command palette | `Dialog` + `Command`; `useEffect` + `addEventListener` for global shortcut | **Already Radix Dialog + Command** ✓ | Well-architected |
| `SidebarFooter.tsx`, `SidebarHeader.tsx`, `SidebarNavigation.tsx`, `SidebarSearches.tsx` | Display components | Click / hover | No Radix | Display |

### `source-pool/`

| File | Visual summary | Interactive behaviors | Radix primitive | Notes |
|------|---------------|----------------------|-----------------|-------|
| `SourcePoolDetailPanel.tsx` | Detail panel for a source pool | Scroll; click | → **Sheet** | Raw positioned div |
| `SourcePoolOverview.tsx` | Grid of source pool entries | Click | No Radix | Display |

### `technology-tree/` (root level)

| File | Visual summary | Interactive behaviors | Radix primitive | Notes |
|------|---------------|----------------------|-----------------|-------|
| `ChatBox.tsx` | Orchestrator: chooses overlay vs panel chat mode | `useState`; delegates drag to hook | No Radix | Thin state router — NOT a duplicate |
| `ChatConversation.tsx` | Message list (OLD) | Click on suggestion buttons | **DEAD CODE** | Superseded by `chat/ChatConversationBox.tsx` |
| `ChatInput.tsx` | Textarea + send (OLD) | `onKeyDown` Enter | **DEAD CODE** | Superseded by `chat/ChatInputBox.tsx` |
| `CollapsedSidebar.tsx` | Icon-only collapsed sidebar | Click to expand | No Radix | Hardcoded hex color |
| `EnrichedDataDisplay.tsx` | Enriched research data viewer | Manual `activeTab` state + conditional render | → **Tabs** | One remaining manual tab implementation |
| `FilterSort.tsx` | Filter + sort dropdowns | `DropdownMenu` (shadcn); redundant `useState` for open | **Already Radix DropdownMenu** ✓ | Controlled state redundant |
| `LevelSelection.tsx` | Multi-level node column navigator | Custom scroll + SVG connections + DOM measurement | **DO NOT TOUCH** | Canvas-adjacent |
| `PaperAnalysisDialog.tsx` | Dialog for deep paper analysis | `Dialog` (shadcn); `useState` | **Already Radix Dialog** ✓ | Well-structured |
| `QueueStatusDisplay.tsx` | Enrichment queue progress | None; polling-driven | No Radix | Hardcoded hex + inline styles |
| `TechTreeMainComponent.tsx` | Main tree view orchestrator | Node click; tab switching; panel toggle | No Radix | Orchestrator |
| `FallbackAlert.tsx`, `PathDisplay.tsx`, `QueryDisplay.tsx`, `Breadcrumb.tsx` | Display components | None / click | No Radix | Display — some with hardcoded hex |
| `TechnologyTreeLoadingState.tsx` | Full-page loading skeleton | None | No Radix | Display |

### `technology-tree/card-based/`

| File | Visual summary | Interactive behaviors | Radix primitive | Notes |
|------|---------------|----------------------|-----------------|-------|
| `AddScenarioModal.tsx` | Dialog with Tabs: AI-gen vs manual scenario | `Dialog` + `Tabs` (shadcn) | **Already Radix Dialog + Tabs** ✓ | Well-structured |
| `CardBasedTreemap.tsx` | Card grid for tree nodes | Click; layout switch | **DO NOT TOUCH** | Custom layout engine |
| `DraggableCard.tsx` | Drag-to-reorder card | `mousedown/mousemove/mouseup` via `useEffect` | **DO NOT TOUCH** | Custom drag |
| `ExpandableNode.tsx` | Card that expands on click | `useState` for expanded | → **Accordion** | Manual expand/collapse |
| `LayoutToggle.tsx` | 3-way layout picker | `ToggleGroup` (shadcn) | **Already Radix ToggleGroup** ✓ | Inline `color: #5F729F` — token gap |
| `ScenarioCard.tsx` *(card-based version)* | Scenario card in card tree view | Click select | No Radix | **Name collision** with `scenario/ScenarioCard.tsx` — rename |
| Icon files (`HorizontalBarsIcon`, `SingleRowIcon`, etc.) | SVG icons | None | No Radix | Icons only |

### `technology-tree/chat/`

| File | Visual summary | Interactive behaviors | Radix primitive | Notes |
|------|---------------|----------------------|-----------------|-------|
| `ChatConversationBox.tsx` | Scrollable messages with auto-scroll | `useEffect` + `addEventListener("scroll")`; `scrollIntoView` | No Radix | **Active version** (replaces ChatConversation.tsx) |
| `ChatInputBox.tsx` | Rich contentEditable input with @mention | `onInput/onKeyDown/onCompositionStart/End`; renders `MentionDropdown`; hardcoded `border-[#eee]`, `background: #f9fafb`, inline style hex | No Radix | **Active version** (replaces ChatInput.tsx) |
| `ChatOverlay.tsx` | Draggable floating chat window | Drag + resize via parent mouse handlers | **DO NOT TOUCH** | Custom drag behavior |
| `ChatPanel.tsx` | Docked panel chat wrapper | Layout composition | No Radix | Active panel wrapper |
| `ChatHeader.tsx` | Panel header with close + mode toggle | Click | No Radix | Display |
| `MentionDropdown.tsx` | @mention node picker dropdown | `useState` for search; keyboard nav by parent; scroll-to-selected | → **Command** | 284 lines → ~60 lines with Radix Command |
| `MessagesList.tsx` | Grouped message list renderer | None | No Radix | Display |
| `SuggestionActions.tsx`, `WelcomeMessage.tsx`, `CompactNodeInfo.tsx`, `ChatLoadingIndicator.tsx`, `ChatAskAIButton.tsx` | Chat UI atoms | Click / none | No Radix | Display |

### `technology-tree/components/`

| File | Visual summary | Interactive behaviors | Radix primitive | Notes |
|------|---------------|----------------------|-----------------|-------|
| `TabNavigator.tsx` | Tab switcher (Papers/Cases/Summary/TechSeeds) | `Tabs` + `Tooltip` (shadcn) | **Already Radix Tabs + Tooltip** ✓ | Note: button inside `TabsList` — layout smell |
| `TabContent.tsx` | Tab panel content area | None (modified in current branch) | No Radix | Layout |
| `TrlHistogram.tsx` | TRL distribution bar chart | None | **DO NOT TOUCH** | SVG |
| `SelectedNodeInfo.tsx`, `SummarySection.tsx`, `UseCaseSearchProgress.tsx`, `PaginationControls.tsx` | Display components | Click / none | No Radix | Some have arbitrary Tailwind |

### `technology-tree/level-selection/`

| File | Visual summary | Interactive behaviors | Radix primitive | Notes |
|------|---------------|----------------------|-----------------|-------|
| `AddNodeDialog.tsx` | Dialog to add a tree node | `Dialog` (shadcn); **raw `<input>` + `<textarea>`** | **Already Radix Dialog** ✓ (shell) | Mixes shadcn Dialog with raw HTML inputs |
| `EditNodeDialog.tsx` | Dialog to edit a tree node | Same as above | Same | Same raw-input inconsistency |
| `TreeNode.tsx` | Clickable tree node | Click; hover actions; `useState` for edit/delete UI | No Radix | Core interaction |
| `ConnectionLines.tsx` | SVG connector lines | None | **DO NOT TOUCH** | SVG |
| Layout/display files (`LevelColumn`, `LevelColumnContent`, `LevelColumnHeader`, `EmptyNodeList`, `NavigationControls`, `node-components/*`) | Layout and display | None / click | No Radix | Some have hardcoded hex |

### `technology-tree/mindmap/`

| File | Visual summary | Interactive behaviors | Radix primitive | Notes |
|------|---------------|----------------------|-----------------|-------|
| `MindMapContainer.original.tsx` | 825 lines, 100% commented out | None | **DEAD CODE** | Delete immediately |
| `MindMapContainer.tsx` | Active mind map orchestrator | Pan/zoom; node click | **DO NOT TOUCH** | Canvas |
| `MindMapContext.tsx` | Context provider | None | No Radix | Context only |
| All other mindmap files | SVG/canvas rendering and interaction | Mouse/wheel events | **DO NOT TOUCH** | Canvas |

---

## 2. Duplicates

### A — Chat Input: three versions

| Version | File | What it does |
|---------|------|-------------|
| **OLD — delete** | `technology-tree/ChatInput.tsx` | Bare textarea + send, Enter-to-send |
| **ACTIVE** | `technology-tree/chat/ChatInputBox.tsx` | Rich `contentEditable` + @mention + Radix Select for context mode |
| **Isolated** | `research-context/chat/ChatInput.tsx` | Same bare textarea pattern — only used in research-context flow |

**Resolution:** Delete `technology-tree/ChatInput.tsx`. `research-context/chat/ChatInput.tsx` is contextually isolated — leave for now, unify if it ever needs @mention.

---

### B — Chat Conversation: two versions

| Version | File | What it does |
|---------|------|-------------|
| **OLD — delete** | `technology-tree/ChatConversation.tsx` | Simple message list, hardcoded Japanese text, inline suggestion logic |
| **ACTIVE** | `technology-tree/chat/ChatConversationBox.tsx` | Scroll tracking, `useMessageGrouping` hook, `scrollIntoView`, modular rendering |

**Resolution:** Delete `technology-tree/ChatConversation.tsx`. Verify no remaining imports first.

---

### C — ScenarioCard: same name, different domains

| Version | File | What it does |
|---------|------|-------------|
| Keep as-is | `scenario/ScenarioCard.tsx` | Checkbox-selectable metric card (TAM, TRL, CAGR) |
| **Rename** | `technology-tree/card-based/ScenarioCard.tsx` | Simpler card in card-tree view; completely different props |

**Resolution:** Rename `card-based/ScenarioCard.tsx` → `TreeScenarioCard.tsx`. Update all imports.

---

### D — Scenario Chat: five overlapping files

| Version | File | Status |
|---------|------|--------|
| Earlier standalone | `scenario/ScenarioChat.tsx` | Self-contained: calls edge function directly, own message management |
| Active subfolder | `scenario/chat/ScenarioChatBox.tsx` | Draggable floating overlay |
| Active subfolder | `scenario/chat/ScenarioChatPanel.tsx` | Panel wrapper |
| Active subfolder | `scenario/chat/ScenarioChatContent.tsx` | Message scroll area |
| Active subfolder | `scenario/chat/ScenarioChatOverlay.tsx` | Drag+resize overlay (mirrors ChatOverlay.tsx) |

**Resolution:** Audit which path is wired in production. If `chat/` subfolder is active, `ScenarioChat.tsx` is dead — delete it. `ScenarioChatOverlay` mirrors `ChatOverlay` — evaluate whether scenario context truly needs a separate overlay or can use the same base with props.

---

### E — AddEnrichmentModal + CustomViewModal: 80% shared UI

Both build the same expand/collapse metric category tree from `UNIFIED_METRICS`. CustomViewModal adds a name input and multi-select.

**Resolution:** Extract `MetricCategoryPicker` component shared by both. Each modal passes `selectionMode` prop (single vs multi). Hoist single `TooltipProvider` to modal level — both currently wrap each metric item in its own `TooltipProvider`.

---

### F — RationaleModal: raw Radix vs shadcn wrapper

`RationaleModal.tsx` uses `DialogPrimitive.Root` / `DialogPrimitive.Content` directly, manually writing a 200-character `cn()` animation className string that `DialogContent` from shadcn already provides.

**Resolution:** Replace with `Dialog`, `DialogContent` from `@/components/ui/dialog`. Remove manual animation string.

---

### G — AddNodeDialog + EditNodeDialog: structural twins

Both have the same two fields (title + description) with different save callbacks and heading text. Both use raw `<input>` and `<textarea>` while the rest of the codebase uses shadcn `Input` and `Textarea`.

**Resolution:** Extract `NodeFormDialog` shared base. Replace raw inputs with `Input` and `Textarea` from `@/components/ui/`.

---

## 3. Dead Code

Delete these **before** any migration work starts.

| File | Reason |
|------|--------|
| `technology-tree/mindmap/MindMapContainer.original.tsx` | 825 lines, 100% commented out. `.original.` in filename confirms it's a snapshot. Active version is `MindMapContainer.tsx`. |
| `technology-tree/ChatConversation.tsx` | Superseded by `chat/ChatConversationBox.tsx`. Verify zero imports then delete. |
| `technology-tree/ChatInput.tsx` | Superseded by `chat/ChatInputBox.tsx`. Verify zero imports then delete. |
| `QueryRefiner.tsx.bak` → `.bak21` | 20+ manual backup files committed to repo. Git provides version history — these are noise. |
| `TreeGenerationSection.tsx.bak` → `.bak21` | Same — 21 manual backup files. Delete all. |
| `scenario/ScenarioChat.tsx` | Audit first. If `scenario/chat/` subfolder is the active path in production, this is superseded. |
| `search-results/ResultsTabs.tsx` | Contains hardcoded dummy data (Japanese paper titles, hardcoded researcher profiles), a `💥 TEMPORARILY DISABLED` comment, and redundant state. Likely prototype. Audit the route before deleting. |

---

## 4. Token Gaps

Color is done. These are missing:

### Spacing
No spacing token system. Raw Tailwind everywhere: `p-4`, `m-2`, `gap-3`, `px-6`. Arbitrary values: `h-[150px]`, `w-[86px]`, `w-[320px]`, `gap-[0.3rem]`.

### Border Radius
No radius token system. Inconsistent usage: the same conceptual element (send button) uses `rounded-xl` in one chat and `rounded-full` in another.

### Shadow / Elevation
No shadow tokens. Ad-hoc: `shadow-xl` on modals, `shadow-2xl` on dragging state, `shadow-lg` on dropdowns — no consistent elevation scale.

### Typography
No type scale. Raw Tailwind sizes everywhere. Worst offenders: `fontSize: "11px"` inline style in `ChatInputBox.tsx`, `style={{ fontWeight: 400 }}` in `EditScenarioModal.tsx`.

### Border Weight
No border weight tokens. Mix of `border` and `border-2` with no documented semantic meaning for the difference.

### Hardcoded hex values still in the codebase (sampled)

| Value | Where | Should become |
|-------|-------|---------------|
| `#F5F9FF` | `TRLModal`, `RationaleHoverCard`, `RationaleModal`, `ScenarioChatContent` | `bg-info` (already a token) |
| `#cddeff` | `ChatInputBox`, `EditQueryModal`, `SearchBar` | `border-info` (already a token) |
| `#9cbef9` | `ChatInputBox` SelectTrigger inline style | `border-info` or `border-focus` |
| `#5F729F` | `LayoutToggle` inline style | `text-icon` or new token |
| `#fdfbff`, `#9151ce`, `#d9c1ef` | FAST mode in `EditQueryModal` | `bg-accent-purple-subtle`, `text-accent-purple-text`, `border-accent-purple-border` |
| `#eeeff0`, `#9f9f9f` | Disabled states in `EditQueryModal` | `bg-muted`, `text-muted` |
| `#5f98ff` | Hover border on `scenario/ScenarioCard.tsx` | `border-focus` |
| `#f9fafb` | `ChatPanel`, `ScenarioChatPanel` bg inline style | `bg-secondary` |
| `#dbdbdb`, `#565656` | `FilterSort` badge colors | `bg-gray-300`, `text-secondary` |

---

## 5. Prioritized To-Do List

> **Order is mandatory.** Later phases depend on earlier ones.

### Phase 1 — Token Foundations
*(Complete before any component work)*

- [ ] **Spacing scale** — Define 4/8/12/16/24/32/40/48px tokens; eliminate `h-[150px]`, `w-[86px]`, `gap-[0.3rem]`
- [ ] **Border radius scale** — Define `radius-sm` (4px), `radius-md` (8px), `radius-lg` (12px), `radius-xl` (16px), `radius-full`. Standardize send-button and panel rounding.
- [ ] **Shadow scale** — Define `shadow-card`, `shadow-overlay`, `shadow-drag`. Replace ad-hoc `shadow-lg/xl/2xl`.
- [ ] **Typography scale** — Define `text-label`, `text-body-sm`, `text-body`, `text-heading-sm`. Eliminate `fontSize: "11px"` inline style.
- [ ] **Sweep hardcoded hex** — Replace all instances in the table above with existing design tokens from `colors.json`. Most already have the right token — they're just not being used.

### Phase 2 — Dead Code Removal

- [ ] **MindMapContainer.original.tsx** — Delete. Confirmed dead.
- [ ] **ChatConversation.tsx** — Verify zero imports, delete.
- [ ] **ChatInput.tsx (old)** — Verify zero imports, delete.
- [ ] **All `.bak` files** — Delete ~42 manual backup files across `QueryRefiner` and `TreeGenerationSection`.
- [ ] **ScenarioChat.tsx** — Audit active route; delete if `scenario/chat/` subfolder is the active path.
- [ ] **ResultsTabs.tsx** — Audit `/search-results` route; if prototype, delete or replace with real data.

### Phase 3 — Consolidation

- [ ] **Rename `card-based/ScenarioCard.tsx`** → `TreeScenarioCard.tsx`. Update imports.
- [ ] **Extract `NodeFormDialog`** from AddNodeDialog + EditNodeDialog. Replace raw `<input>`/`<textarea>` with shadcn `Input`/`Textarea`.
- [ ] **Extract `MetricCategoryPicker`** from AddEnrichmentModal + CustomViewModal. Hoist `TooltipProvider` to modal level.
- [ ] **Refactor `RationaleModal.tsx`** — Replace raw `DialogPrimitive.*` with `Dialog`, `DialogContent` from `@/components/ui/dialog`.
- [ ] **Audit ScenarioChatOverlay vs ChatOverlay** — If scenario chat logic is identical, unify with props rather than duplicating the overlay structure.

### Phase 4 — Modals / Sheets

- [ ] **ScenarioPaperPanel** — Replace raw positioned div with `Sheet` (Radix Dialog variant sliding from edge).
- [ ] **SourcePoolDetailPanel** — Same pattern. Replace with `Sheet`.
- [ ] **ChatOverlay** — Keep as-is. Custom drag + resize is not replaceable with Sheet. Document `useDraggable` hook behavior instead.

### Phase 5 — Dropdowns

- [ ] **MentionDropdown** — Replace with `Command` (Radix `cmdk`). Has search input, grouped list, keyboard nav, empty state — all Command primitives. 284 lines → ~60.
- [ ] **FilterSort** — Already Radix DropdownMenu. Remove redundant `filterOpen` useState — use uncontrolled mode or rely on Radix's internal state.

### Phase 6 — Tabs

- [ ] **EnrichedDataDisplay** — Only remaining manual tab implementation. Replace `activeTab` useState + conditional render with Radix `Tabs`.
- [ ] **ResultsTabs** — Already Radix Tabs. Remove redundant `useState("papers")`; replace className conditionals with `data-[state=active]` CSS selectors.

### Phase 7 — Accordion

- [ ] **SidebarProjects** — Replace manual expand/collapse `useState` with `Accordion`.
- [ ] **ExpandableNode** — Replace `useState` for expanded/collapsed with `Accordion`.
- [ ] **MetricCategoryPicker** (after Phase 3 extraction) — The `expandedCategories: Set<string>` toggle inside both metric modals is exactly Accordion semantics. Use `Accordion` for category rows.

### Phase 8 — Tooltip

- [ ] **AddEnrichmentModal / CustomViewModal** — Hoist single `TooltipProvider` to modal level. Current per-item wrap creates a provider per metric row.

### Phase 9 — Small Fixes

- [ ] **`style={{ fontWeight: 400 }}`** in EditScenarioModal → replace with `font-normal`.
- [ ] **`fontSize: "11px"` inline** in ChatInputBox → replace with `text-xs` or typography token.
- [ ] **`background: "#f9fafb"` inline** in ChatPanel + ScenarioChatPanel → replace with `bg-secondary`.
- [ ] **`LayoutToggle` inline `color: #5F729F`** → replace with `text-icon` token.
- [ ] **TabNavigator** — The expand-summary button rendered inside `TabsList` should live outside `TabsList`. Minor layout fix.
- [ ] **`FilterSort` open state** — Remove redundant controlled `useState` for DropdownMenu open state.

---

## 6. Do Not Touch

| File | Reason |
|------|--------|
| `technology-tree/mindmap/MindMapContainer.tsx` | Pan/zoom canvas; complex mouse event handling |
| `technology-tree/mindmap/MindMapNode.tsx` | Canvas-positioned SVG node |
| `technology-tree/mindmap/MindMapConnections.tsx` | SVG connector rendering |
| `technology-tree/mindmap/components/MindMapController.tsx` | Complex mouse/wheel event management |
| `technology-tree/mindmap/components/MindMapRenderer.tsx` | SVG layout computation |
| `technology-tree/level-selection/ConnectionLines.tsx` | SVG overlay for level connectors |
| `technology-tree/LevelSelection.tsx` | Scrollable multi-level columns with DOM measurement + SVG |
| `technology-tree/card-based/DraggableCard.tsx` | Custom drag-to-reorder with mouse events |
| `technology-tree/card-based/CardBasedTreemap.tsx` | Custom card grid layout engine |
| `scenario/ScenarioTableView.tsx` | Data comparison table; column management |
| `scenario/ScenarioMindmap.tsx` | SVG/canvas treemap visualization |
| `technology-tree/components/TrlHistogram.tsx` | SVG bar chart |
| `technology-tree/chat/ChatOverlay.tsx` | Custom drag + resize — not replaceable with Sheet |
| `scenario/chat/ScenarioChatOverlay.tsx` | Same — custom drag behavior |

---

## Summary Numbers

| Category | Count |
|----------|-------|
| Components audited | 93 |
| Already using Radix correctly | 17 |
| Candidates for Radix migration | 8 |
| Duplicate pairs to resolve | 7 |
| Dead code files to delete | 7+ (plus ~42 .bak files) |
| Token gaps remaining | 5 categories |
| Hardcoded hex values to sweep | 15+ identified |
| Do not touch | 14 |
