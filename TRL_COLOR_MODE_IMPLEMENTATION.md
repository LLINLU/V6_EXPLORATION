# TRL Color Mode — Full Implementation Guide

## Overview

A toggle on the mindmap canvas switches nodes from level-based colors to TRL-based pastel backgrounds. The legend simultaneously swaps to show TRL groups + the existing expand/collapse controls.

---

## Color Distribution

Three groups, each sharing one background color:

| TRL | Group | Background | Label |
|-----|-------|------------|-------|
| 1, 2, 3 | 基礎研究 | `#feeeee` | Light red |
| 4, 5, 6 | 実証段階 | `#feffec` | Light yellow |
| 7, 8, 9 | 商業化済み | `#f1f7ff` | Light blue |

When TRL mode is on, all nodes also get:
- **Border color:** `#e5e7eb` (unified, overrides level-based border)
- **Text color:** `#374151` (unified, overrides level-based text)
- **Selected nodes:** unchanged (TRL background is not applied when `node.isSelected`)

---

## 1. `src/types/tree.ts`

Add `trl` to `TreeNode`:

```ts
export interface TreeNode {
  // ...existing fields...
  trl?: number // TRL 1–9
}
```

---

## 2. `src/utils/mindMapDataTransform.ts`

Add `trl?: number` to the `HierarchicalNode` interface:

```ts
interface HierarchicalNode {
  // ...existing fields...
  trl?: number
}
```

In `createHierarchicalNode`, pass it through:

```ts
trl: item.trl,
```

In `createD3Nodes`, add in **both** the horizontal and vertical node mapping blocks (next to `children_count`):

```ts
trl: node.data.trl,
```

---

## 3. `src/stores/treeUIStore.ts`

**State interface:**
```ts
trlColorMode: boolean
```

**Actions interface:**
```ts
toggleTrlColorMode: () => void
setTrlColorMode: (on: boolean) => void
```

**Initial state:**
```ts
trlColorMode: false,
```

**Actions implementation:**
```ts
toggleTrlColorMode: () =>
  set((state) => ({ trlColorMode: !state.trlColorMode })),
setTrlColorMode: (on: boolean) => set({ trlColorMode: on }),
```

---

## 4. `src/components/technology-tree/mindmap/MindMapNode.tsx`

Add at the **top of the file** (before other imports):

```ts
const TRL_META: Record<number, { label: string; bg: string }> = {
  1: { label: "基礎研究",   bg: "#feeeee" },
  2: { label: "基礎研究",   bg: "#feeeee" },
  3: { label: "基礎研究",   bg: "#feeeee" },
  4: { label: "実証段階",   bg: "#feffec" },
  5: { label: "実証段階",   bg: "#feffec" },
  6: { label: "実証段階",   bg: "#feffec" },
  7: { label: "商業化済み", bg: "#f1f7ff" },
  8: { label: "商業化済み", bg: "#f1f7ff" },
  9: { label: "商業化済み", bg: "#f1f7ff" },
}
function getTrlMeta(trl: number) {
  return TRL_META[trl] ?? TRL_META[3]
}
```

In the component body, read store and derive background:

```ts
const trlColorMode = useTreeUIStore((s) => s.trlColorMode)

const trlBg = trlColorMode && node.trl !== undefined && !node.isSelected
  ? getTrlMeta(node.trl).bg
  : undefined
```

On the inner node `div`, add `style` override:

```tsx
<div
  className={`w-full h-full rounded-lg border flex flex-col justify-center relative ${nodeStyles.colorClasses} p-2`}
  style={trlBg ? { background: trlBg, borderColor: "#e5e7eb", color: "#374151" } : undefined}
>
```

After the node title div, add the TRL badge (skip root node):

```tsx
{/* TRL badge */}
{!nodeFlags.isRoot && trlColorMode && node.trl !== undefined && (() => {
  const { label, bg } = getTrlMeta(node.trl)
  return (
    <div className="flex justify-center mt-1">
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-700"
        style={{ background: bg }}
      >
        TRL {node.trl} · {label}
      </span>
    </div>
  )
})()}
```

---

## 5. `src/components/technology-tree/mindmap/components/MindMapRenderer.tsx`

Add the floating toggle button inside the canvas wrapper, **after the toolbar block**, gated on `toolbarOrientation !== "horizontal"`:

```tsx
{/* TRL colour toggle */}
{toolbarOrientation !== "horizontal" && (() => {
  const { trlColorMode, toggleTrlColorMode } = uiStore
  return (
    <button
      type="button"
      onClick={toggleTrlColorMode}
      className="absolute top-4 right-4 z-40 inline-flex items-center gap-2 text-xs font-medium text-gray-700"
    >
      TRL カラー
      {/* Track */}
      <span
        className="relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors duration-200"
        style={{ background: trlColorMode ? "#b29dc4" : "#d1d5db" }}
      >
        {/* Thumb */}
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform duration-200 ${
            trlColorMode ? "translate-x-3.5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  )
})()}
```

Toggle track color: `#b29dc4` (purple) when ON, `#d1d5db` (gray) when OFF.

---

## 6. `src/components/technology-tree/mindmap/MindMapLegend.tsx`

Add at the top (after existing imports):

```ts
import { useTreeUIStore } from "@/stores/treeUIStore"

const TRL_LEGEND = [
  { trl: "1–3", label: "基礎研究",   bg: "#feeeee" },
  { trl: "4–6", label: "実証段階",   bg: "#feffec" },
  { trl: "7–9", label: "商業化済み", bg: "#f1f7ff" },
]
```

In the component body, read mode:

```ts
const trlColorMode = useTreeUIStore((s) => s.trlColorMode)
```

Inside `CollapsibleContent`, wrap the existing legend in a conditional. When TRL mode is on, show expand/collapse controls (no colored dots) + a divider + TRL rows:

```tsx
<CollapsibleContent>
  {trlColorMode ? (
    <div className="px-3 pb-3 pt-0 space-y-1.5 min-w-[160px]">
      {/* Level expand/collapse — no dots, same typography as non-TRL mode */}
      <TooltipProvider>
        {legendItems.map(({ level, label }) => {
          const levelIsExpanded = isLevelExpanded ? isLevelExpanded(level) : false
          const showToggleButton = onLevelExpand && onLevelCollapse && isLevelExpanded && level > 1
          const showAddButton = treeMode === "FAST" && level === 1 && onAddNode
          if (!showToggleButton && !showAddButton) return null
          return (
            <div key={level} className="flex items-center gap-1.5 text-sm">
              <span className="font-normal text-sm text-gray-500 flex-1">
                {t("mindmap.legend.level_label", { level })}: {label}
              </span>
              {showAddButton && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={onAddNode}
                      className="p-1 bg-[#EBF3FF] hover:bg-[#D6E6FF] rounded-sm transition-colors flex-shrink-0">
                      <Plus className="h-3 w-3 text-[#4A7DFC]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {t("mindmap.legend.add_element")}
                  </TooltipContent>
                </Tooltip>
              )}
              {showToggleButton && (
                <button onClick={() => handleLevelToggle(level)}
                  className="p-1 hover:bg-gray-100 rounded-sm transition-colors flex-shrink-0"
                  title={levelIsExpanded ? `Collapse Level ${level}` : `Expand Level ${level}`}>
                  {levelIsExpanded
                    ? <Shrink className="h-3 w-3 text-gray-500" />
                    : <Expand className="h-3 w-3 text-gray-500" />}
                </button>
              )}
            </div>
          )
        })}
      </TooltipProvider>

      {/* Divider */}
      <div className="border-t border-gray-100 my-1" />

      {/* TRL color legend */}
      {TRL_LEGEND.map(({ trl, label, bg }) => (
        <div key={trl} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: bg, border: "0.5px solid rgba(0,0,0,0.12)" }}
          />
          <span className="font-normal text-sm text-gray-500 flex-1">
            TRL {trl} · {label}
          </span>
        </div>
      ))}
    </div>
  ) : (
    // ...existing non-TRL legend JSX — leave completely unchanged...
  )}
</CollapsibleContent>
```

**Legend dot spec:** `w-3 h-3 rounded-full`, background = group color, border = `0.5px solid rgba(0,0,0,0.12)` for visibility on white.

---

## Notes

- Call `setTrlColorMode(true)` in a `useEffect` on the page component to default the toggle to ON when the route loads.
- The TRL value must be populated on `TreeNode` objects in the data layer for the colors to appear. Nodes with `trl === undefined` render with default level colors even when TRL mode is on.
- Selected nodes always use the selected color regardless of TRL mode.
