# Design System Foundation
**Owner:** Lindsay (User Flow Lead)
**Started:** February 2026
**Status:** Phase 1 in progress — token system established

---

## The Problem

Components are hardcoded. Colors are written as `#2563EB`, spacing is per-component, interactive behaviors (modals, dropdowns, tabs) are custom-built everywhere. This means:

- Changing a color requires hunting across dozens of files
- Every modal has slightly different focus management, keyboard behavior, and z-index
- No shared vocabulary between design and code
- Accessibility is inconsistent — some components handle Esc/focus/ARIA, most don't

The goal is a proper foundation: a single source of truth for visual values, and Radix UI handling every solved interaction problem.

---

## Target Architecture

```
colors.json              ← one file to rule all color decisions
    ↓ (generate scripts)
Tailwind config          ← token classes available everywhere
    ↓
Radix UI primitives      ← accessible interactive shells
    ↓ (styled with tokens)
Components               ← pure content + styling, no custom behavior logic
```

**What this buys:**
- Change `primitive.blue.600` once → updates everywhere
- Every modal gets focus trap, Esc-close, ARIA for free
- Designers and engineers share the same token vocabulary
- Zero custom implementations of solved problems

---

## Phase 1 — Color Token System ✅

### The 3-Tier Model

```
Tier 1 — Primitive    Raw hex values. Named palettes (blue, gray, green, etc.)
Tier 2 — Semantic     Meaning-based. References primitives. surface/text/edge/primary/etc.
Tier 3 — Element      Component-specific. References semantic. (deferred — see below)
```

**Source of truth:** `design-system/tokens/colors.json`
**Never edit** `design-system/dist/` files directly — they are auto-generated.

After any edit to `colors.json`, run both scripts:
```bash
node design-system/scripts/generate-tailwind-colors.cjs
node design-system/scripts/generate-docs.cjs
```

Visual reference: open `design-system/dist/colors.html` in browser.

---

### Token Naming — How Paths Become Classes

A token's path in `colors.json` determines its Tailwind class name via a two-part formula:

```
semantic . {group} . {key}
            ↓          ↓
       utility-    class suffix
        prefix
```

**The DEFAULT exception:** `DEFAULT` means "no suffix." `semantic.primary.DEFAULT` → `bg-primary` (not `bg-primary-DEFAULT`).

---

### Utility Routing — The Critical Rule

Three group names are reserved and route to dedicated Tailwind buckets. The group name **disappears** from the class:

| Group in JSON | Tailwind bucket   | Class produced      |
|---------------|-------------------|---------------------|
| `surface`     | `backgroundColor` | `bg-{key}`          |
| `text`        | `textColor`       | `text-{key}`        |
| `edge`        | `borderColor`     | `border-{key}`      |

Examples:
- `semantic.surface.secondary` → `bg-secondary`
- `semantic.text.muted` → `text-muted`
- `semantic.edge.focus` → `border-focus`

All other groups go into the shared `colors` bucket — any utility prefix works:
- `semantic.primary.subtle` → `bg-primary-subtle` OR `text-primary-subtle` OR `border-primary-subtle`

**Why `surface` and not `background`?** `bg-background-subtle` is redundant — the prefix repeats itself. `surface` is the semantic concept (a layer or plane), not the CSS property.

**Why `edge` and not `border`?** Same reason — `border-border-subtle` is nonsense. Edge describes the visual boundary role.

---

### Standard Keys for Feedback Groups (success, warning, error)

Each feedback group uses these four keys consistently:

| Key          | Intended utility | Purpose                        |
|--------------|------------------|--------------------------------|
| `DEFAULT`    | `bg-`            | Fill/background color          |
| `subtle`     | `bg-`            | Light-tinted background        |
| `foreground` | `text-`          | Text rendered on DEFAULT bg    |
| `line`       | `border-`        | Border / outline color         |

Usage example:
```tsx
<span className="bg-success-subtle text-success-foreground border border-success-line">
  Saved
</span>
```

Tailwind won't stop you from writing `bg-success-foreground` — it compiles. But `foreground` is a near-dark color designed for text. The key name signals the intended utility even though Tailwind doesn't enforce it.

---

### Current Semantic Groups

| Group       | Routing          | Example classes                         |
|-------------|------------------|-----------------------------------------|
| `surface`   | backgroundColor  | `bg-secondary`, `bg-muted`, `bg-info`   |
| `text`      | textColor        | `text-secondary`, `text-muted`, `text-icon` |
| `edge`      | borderColor      | `border-subtle`, `border-focus`, `border-info` |
| `primary`   | shared colors    | `bg-primary`, `bg-primary-hover`        |
| `success`   | shared colors    | `bg-success-subtle`, `text-success-foreground`, `border-success-line` |
| `warning`   | shared colors    | `bg-warning-subtle`, `text-warning-foreground` |
| `error`     | shared colors    | `bg-error-subtle`, `text-error-foreground` |
| `accent`    | shared colors    | `bg-accent-purple-subtle`, `text-accent-purple-text` |
| `gold`      | shared colors    | `bg-gold-subtle`, `text-gold-text`      |
| `highlight` | shared colors    | `bg-highlight`                          |

---

### Writing Token Classes in Components — Rules

1. **Always prefer semantic tokens over primitives.** Write `bg-primary` not `bg-blue-600`. Write `text-muted` not `text-gray-400`.
2. **Never hardcode hex values** in Tailwind (`bg-[#2563EB]`). If a color doesn't exist as a token, add it to `colors.json` first.
3. **The `foreground` key is for text.** `text-success-foreground` ✓ — `bg-success-foreground` compiles but is semantically wrong.
4. **The `line` key is for borders.** `border-error-line` ✓ — `bg-error-line` compiles but is semantically wrong.
5. **`DEFAULT` needs no suffix.** Write `bg-primary`, not `bg-primary-DEFAULT`.

---

### Token Gaps Still Remaining

Color is done. These token categories don't have a JSON source of truth yet — values are hardcoded per-component. They need to be defined before Phase 3 (Radix migration) starts:

| Category        | Current state                            | Action needed                         |
|-----------------|------------------------------------------|---------------------------------------|
| **Spacing**     | Hardcoded `p-4`, `gap-3`, `mx-6`         | Define a spacing scale in tokens      |
| **Border radius** | `rounded-md`, `rounded-xl` scattered   | Define radius scale (sm/md/lg/full)   |
| **Shadow**      | `shadow-sm`, `shadow-md` per-component   | Define elevation system (0–4)         |
| **Typography**  | Inline `text-sm font-semibold` everywhere | Define type scale (size + weight pairs) |
| **Border weight** | Hardcoded `border`, `border-2`         | Define border width tokens            |

---

## Phase 2 — Token Gaps (Next)

Before any components are touched, fill the token gaps listed above. The order:

1. **Border radius** — smallest surface area, high visual consistency payoff
2. **Spacing** — biggest bang for standardization (padding and gap are everywhere)
3. **Typography** — define paired size+weight tokens (heading-lg, body-sm, caption, etc.)
4. **Shadow / elevation** — define 4 levels (flat, raised, floating, overlay)
5. **Border weight** — simple (hairline, default, thick)

Each category follows the same pattern as color: a JSON source of truth → generate script → Tailwind extension.

---

## Phase 3 — Radix UI Migration

> Full audit with component inventory, duplicates, dead code, token gaps, and prioritized to-do list: **[radix-migration-audit.md](./radix-migration-audit.md)**


### Why Radix

Radix handles the hard parts we're currently reinventing:
- Focus trapping inside modals
- Keyboard navigation (arrow keys in dropdowns, Tab through modals)
- ARIA roles and attributes
- Portal rendering (no z-index battles)
- Scroll locking behind overlays
- Esc-to-close

We keep all existing content and styling. We only replace the interactive shell.

### The Wrapping Rule

**Keep everything inside. Replace only the shell.**

```tsx
// BEFORE — hardcoded modal
{isOpen && (
  <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
    <div className="bg-white rounded-xl p-6 ...">
      {/* content */}
    </div>
  </div>
)}

// AFTER — Radix Dialog, same content, same styling
<Dialog.Root open={isOpen} onOpenChange={onClose}>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-overlay" />
    <Dialog.Content className="bg-white rounded-xl p-6 ...">
      {/* content — unchanged */}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

The content did not change. The Tailwind classes did not change. Only the shell is now a Radix primitive.

### Radix Primitive Mapping

| Component behavior                                    | Radix primitive          |
|-------------------------------------------------------|--------------------------|
| Centered overlay with backdrop, focus trap, Esc-close | **Dialog**               |
| Side panel sliding in from left or right              | **Sheet** (built on Dialog) |
| Hover/click popover anchored to a trigger             | **Popover**              |
| Click-triggered dropdown list                         | **DropdownMenu**         |
| Single-value selection with label                     | **Select**               |
| Search-filtered command list                          | **Command**              |
| Horizontal tab bar switching panels                   | **Tabs**                 |
| Segmented control / pill toggle (mutually exclusive)  | **ToggleGroup**          |
| Expandable/collapsible section with chevron           | **Accordion**            |
| Hover text label                                      | **Tooltip**              |
| On/off binary toggle                                  | **Switch**               |
| True/false checkbox                                   | **Checkbox**             |
| Single-choice radio group                             | **RadioGroup**           |
| Scrollable container with custom scrollbar            | **ScrollArea**           |
| Temporary notification                                | **Toast**                |
| Right-click context menu                              | **ContextMenu**          |
| Value slider / range input                            | **Slider**               |
| Data table                                            | No Radix — keep custom   |
| Canvas / drawing interaction                          | No Radix — keep custom   |
| Pure layout wrapper                                   | No Radix — keep as-is    |

### Migration Order

Do not reorder — later steps depend on earlier ones.

```
0. Fill token gaps (spacing, radius, shadow, type — from Phase 2)
1. Delete dead code (reduces noise before building)
2. Consolidate duplicates (one source of truth per concept)
3. Modals and side panels  → Radix Dialog / Sheet
4. Dropdowns and selects   → Radix Select / DropdownMenu / Popover / Command
5. Tabs and toggle groups  → Radix Tabs / ToggleGroup
6. Collapsible rows        → Radix Accordion
7. Tooltips                → Radix Tooltip
8. Small primitives        → Switch, Checkbox, ScrollArea, RadioGroup, Slider
```

### What NOT to Do During Migration

- Do not rewrite component internals — only replace the interactive shell
- Do not introduce new colors, spacing, or sizing — only use what exists in tokens
- Do not consolidate components that look similar but serve different purposes
- Do not wrap layout-only components in Radix — Radix is for behavior, not structure
- Do not install Radix packages you don't need — only install what has a target component
- Do not change TypeScript interfaces or prop names — call sites must not need to change

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Feb 2026 | Named group `surface` (not `background`) | Avoids `bg-background-*` class name redundancy |
| Feb 2026 | Named group `edge` (not `border`) | Avoids `border-border-*` class name redundancy |
| Feb 2026 | Named group `text` (not `foreground`) | Avoids `text-foreground-*` redundancy; routes cleanly to textColor bucket |
| Feb 2026 | Deferred element token tier | Wait until Radix is adopted so element tokens map 1:1 to Radix component part names |
| Feb 2026 | Added `foreground`+`line` to success/warning/error | Consistent pattern for all feedback states, matches status token convention |

---

## Files Reference

| File | Purpose |
|------|---------|
| `design-system/tokens/colors.json` | Source of truth — edit this |
| `design-system/scripts/generate-tailwind-colors.cjs` | Generates Tailwind config + CSS vars |
| `design-system/scripts/generate-docs.cjs` | Generates visual HTML reference |
| `design-system/dist/tailwind-colors.cjs` | Auto-generated — do not edit |
| `design-system/dist/tokens.css` | Auto-generated CSS custom properties |
| `design-system/dist/colors.html` | Visual swatch reference — open in browser |
| `tailwind.config.ts` | Wires token buckets into Tailwind |
| `docs/user/` | Design explorations, rationale, this file |
