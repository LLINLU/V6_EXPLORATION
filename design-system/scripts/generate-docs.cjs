/**
 * generate-docs.cjs
 *
 * Reads colors.json, resolves all references, and generates
 * a standalone HTML page with visual color swatches for all 3 tiers.
 *
 * Tailwind class display applies the same utility routing as the generator:
 *   surface group → bg-{key}     (group name disappears)
 *   text group    → text-{key}   (group name disappears)
 *   edge group    → border-{key} (group name disappears)
 *   All others    → bg-{group}-{key}  (shared — any utility prefix works)
 */

const fs   = require("fs")
const path = require("path")

const ROOT     = path.resolve(__dirname, "..")
const INPUT    = path.join(ROOT, "tokens", "colors.json")
const DIST     = path.join(ROOT, "dist")
const OUT_HTML = path.join(DIST, "colors.html")

// ── Read and resolve ──────────────────────────────────────────────────────────
const tokens = JSON.parse(fs.readFileSync(INPUT, "utf8"))

function resolveRef(value, root) {
  if (typeof value !== "string") return value
  return value.replace(/\{([^}]+)\}/g, (_, refPath) => {
    let current = root
    for (const part of refPath.split(".")) {
      current = current?.[part]
    }
    if (current === undefined) return `UNRESOLVED:{${refPath}}`
    return typeof current === "string" && current.includes("{")
      ? resolveRef(current, root)
      : current
  })
}

function resolveAll(obj, root) {
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("$")) continue // skip metadata
    if (typeof value === "object" && value !== null) {
      result[key] = resolveAll(value, root)
    } else {
      result[key] = resolveRef(value, root)
    }
  }
  return result
}

const resolved = resolveAll(tokens, tokens)

// ── Tailwind class resolver ───────────────────────────────────────────────────
const UTILITY_ROUTING = {
  surface: "bg",
  text:    "text",
  edge:    "border",
}

/**
 * Returns the Tailwind class name for a given token path.
 * Only applies to semantic tokens (tier 2).
 * For utility-specific groups, the group name disappears.
 * For shared groups, `bg-` is shown as the primary example.
 */
function getTailwindClass(fullPath) {
  const parts = fullPath.split(".")
  if (parts[0] !== "semantic" || parts.length < 3) return null

  const group = parts[1]
  const key   = parts.slice(2).join("-")

  const utilPrefix = UTILITY_ROUTING[group]
  if (utilPrefix) {
    // Utility-specific bucket — group name disappears
    return key === "DEFAULT" ? `${utilPrefix}` : `${utilPrefix}-${key}`
  } else {
    // Shared colors bucket — any utility works, show bg- as primary example
    if (key === "DEFAULT") return `bg-${group}`
    // Flag multi-utility tokens (foreground → text only, line → border only)
    if (key === "foreground") return `text-${group}-foreground`
    if (key === "line")       return `border-${group}-line`
    return `bg-${group}-${key}`
  }
}

/**
 * Returns a note for tokens that should only be used with one utility.
 */
function getTailwindNote(fullPath) {
  const parts = fullPath.split(".")
  if (parts[0] !== "semantic" || parts.length < 3) return null

  const group = parts[1]
  const key   = parts.slice(2).join("-")

  if (UTILITY_ROUTING[group]) return null // already utility-specific
  if (key === "foreground") return "text- only"
  if (key === "line")       return "border- only"
  if (key !== "DEFAULT" && group !== "accent" && group !== "gold") {
    return "also text- border-"
  }
  return null
}

// ── Usage descriptions ────────────────────────────────────────────────────────
const usageMap = {
  // Primitives
  "primitive.white":  "Base white",
  "primitive.black":  "Base black",
  "primitive.blue.50":  "Lightest blue bg",
  "primitive.blue.100": "Very light blue bg",
  "primitive.blue.200": "Light blue border/bg",
  "primitive.blue.300": "TRL early indicator",
  "primitive.blue.400": "TRL mid / TAM sm",
  "primitive.blue.500": "TRL mature / TAM md",
  "primitive.blue.600": "Primary action blue",
  "primitive.blue.700": "Primary hover state",
  "primitive.blue.800": "Strong text / mentions",
  "primitive.blue.900": "Darkest blue text",
  "primitive.gray.100": "Light surface, tags, inactive bg",
  "primitive.gray.200": "Subtle borders, dividers",
  "primitive.gray.300": "Medium borders, count badges",
  "primitive.gray.400": "Muted text, placeholders, disabled",
  "primitive.gray.600": "Secondary text, tag text",
  "primitive.gray.700": "Icon strokes, strong secondary",
  "primitive.gray.900": "Near-black headings, dark text",
  "primitive.red.100":    "Error subtle bg",
  "primitive.red.600":    "Error text/icon",
  "primitive.green.100":  "Success subtle bg",
  "primitive.green.600":  "Success text/icon",
  "primitive.orange.100": "Warning subtle bg",
  "primitive.orange.500": "Bright orange accent",
  "primitive.orange.600": "Warning text/icon",
  "primitive.purple.500": "Accent purple, gradients",
  "primitive.purple.600": "FAST mode purple text",
  "primitive.brand.control-blue":    "Checkbox, focus ring, interactive controls",
  "primitive.brand.blue-subtle":     "Blue-tinted info surface",
  "primitive.brand.blue-border":     "Light blue mode/info borders",
  "primitive.brand.layout-bg":       "Page layout background",
  "primitive.brand.purple-border":   "FAST mode border",
  "primitive.brand.purple-subtle":   "FAST mode subtle surface",
  "primitive.brand.gold-text":       "Gold button text",
  "primitive.brand.gold-border":     "Gold button border",
  "primitive.brand.gold-subtle":     "Gold button surface",
  "primitive.brand.highlight-yellow": "Selected custom node highlight",
  "primitive.brand.sidebar-icon":    "Sidebar icon stroke color",
  "primitive.brand.sidebar-surface": "Sidebar icon background",
  "primitive.brand.level-circle":    "Level indicator circle",
  "primitive.brand.level-1-bg":     "Level 1 node background",
  "primitive.brand.level-1-border": "Level 1 node border",
  "primitive.brand.level-1-text":   "Level 1 node text",
  "primitive.brand.level-2-bg":     "Level 2 node background",
  "primitive.brand.level-2-border": "Level 2 node border",
  "primitive.brand.level-2-text":   "Level 2 node text",
  "primitive.brand.level-3-bg":     "Level 3 node background",
  "primitive.brand.level-3-border": "Level 3 node border",
  "primitive.brand.level-3-text":   "Level 3 node text",
  "primitive.brand.level-4-bg":     "Level 4 node background",
  "primitive.brand.level-4-border": "Level 4 node border",
  "primitive.brand.level-4-text":   "Level 4 node text",
  "primitive.brand.level-5-bg":     "Level 5 node background",
  "primitive.brand.level-5-border": "Level 5 node border",
  "primitive.brand.level-5-text":   "Level 5 node text",
  "primitive.brand.level-6-bg":     "Level 6 node background",
  "primitive.brand.level-6-border": "Level 6 node border",
  "primitive.brand.level-6-text":   "Level 6 node text",
  "primitive.brand.custom-node-bg":     "Custom node background",
  "primitive.brand.custom-node-border": "Custom node border",
  "primitive.brand.custom-node-text":   "Custom node text",

  // Semantic
  "semantic.primary.DEFAULT":    "Primary brand color",
  "semantic.primary.hover":      "Primary hover state",
  "semantic.primary.strong":     "Strong primary text",
  "semantic.primary.darkest":    "Darkest primary (data-viz)",
  "semantic.primary.foreground": "Text on primary bg",
  "semantic.surface.DEFAULT":    "Default page background",
  "semantic.surface.secondary":  "Secondary surface (panels)",
  "semantic.surface.muted":      "Layout background",
  "semantic.surface.info":       "Blue-tinted info surface",
  "semantic.surface.info-strong": "Stronger info bg",
  "semantic.surface.elevated":   "Card/popover surface",
  "semantic.text.DEFAULT":       "Primary text color",
  "semantic.text.secondary":     "Secondary text",
  "semantic.text.muted":         "Muted/placeholder text",
  "semantic.text.icon":          "Icon stroke color",
  "semantic.text.inverse":       "Text on dark backgrounds",
  "semantic.edge.DEFAULT":       "Default border color",
  "semantic.edge.subtle":        "Subtle borders/dividers",
  "semantic.edge.focus":         "Focus ring / interactive border",
  "semantic.edge.info":          "Info panel border",
  "semantic.accent.purple":         "Accent purple (gradients)",
  "semantic.accent.purple-text":    "FAST mode text",
  "semantic.accent.purple-border":  "FAST mode border",
  "semantic.accent.purple-subtle":  "FAST mode surface",
  "semantic.gold.text":   "Gold button text",
  "semantic.gold.border": "Gold button border",
  "semantic.gold.subtle": "Gold button surface",
  "semantic.success.DEFAULT":    "Success fill color",
  "semantic.success.subtle":     "Success subtle bg",
  "semantic.success.foreground": "Text on success bg",
  "semantic.success.line":       "Success border/outline",
  "semantic.warning.DEFAULT":    "Warning fill color",
  "semantic.warning.bright":     "Bright warning accent",
  "semantic.warning.subtle":     "Warning subtle bg",
  "semantic.warning.foreground": "Text on warning bg",
  "semantic.warning.line":       "Warning border/outline",
  "semantic.error.DEFAULT":      "Error fill color",
  "semantic.error.subtle":       "Error subtle bg",
  "semantic.error.foreground":   "Text on error bg",
  "semantic.error.line":         "Error border/outline",
  "semantic.highlight":          "Highlight / selection marker",

  // Elements
  "element.button-primary.bg":       "Primary button background",
  "element.button-primary.bg-hover": "Primary button hover",
  "element.button-primary.text":     "Primary button text",
  "element.button-ghost.text":       "Ghost button text",
  "element.button-ghost.bg-hover":   "Ghost button hover bg",
  "element.button-disabled.bg":      "Disabled button bg",
  "element.button-disabled.text":    "Disabled button text",
  "element.input.bg":          "Input background",
  "element.input.border":      "Input border",
  "element.input.ring":        "Input focus ring",
  "element.input.placeholder": "Input placeholder",
  "element.card.bg":     "Card background",
  "element.card.border": "Card border",
  "element.checkbox.border":      "Checkbox border",
  "element.checkbox.checked-bg":  "Checkbox checked bg",
  "element.checkbox.checked-text": "Checkbox check mark",
  "element.toggle.checked-bg":   "Toggle on bg",
  "element.toggle.unchecked-bg": "Toggle off bg",
  "element.badge-scenario.bg":   "Scenario badge bg",
  "element.badge-scenario.text": "Scenario badge text",
  "element.badge-count.bg":   "Count badge bg",
  "element.badge-count.text": "Count badge text",
  "element.badge-tag.bg":   "Tag badge bg",
  "element.badge-tag.text": "Tag badge text",
  "element.badge-update.bg":        "Update badge bg",
  "element.badge-update.text-color": "Update badge text",
  "element.badge-update.border":    "Update badge border",
  "element.tab-active.bg":    "Active tab bg",
  "element.tab-active.text":  "Active tab text",
  "element.tab-inactive.bg":  "Inactive tab bg",
  "element.tab-inactive.text": "Inactive tab text",
  "element.info-panel.bg": "Info panel background",
  "element.sidebar.bg":         "Sidebar background",
  "element.sidebar.icon-stroke": "Sidebar icon color",
  "element.sidebar.icon-bg":    "Sidebar icon surface",
  "element.mode-ted.text":   "TED mode text",
  "element.mode-ted.bg":     "TED mode bg",
  "element.mode-ted.border": "TED mode border",
  "element.mode-fast.text":   "FAST mode text",
  "element.mode-fast.bg":     "FAST mode bg",
  "element.mode-fast.border": "FAST mode border",
  "element.node-selected.bg":               "Selected node bg",
  "element.node-selected.text":             "Selected node text",
  "element.node-selected.highlight-border": "Selected custom node border",
  "element.node-root.bg":     "Root node bg",
  "element.node-root.border": "Root node border",
  "element.node-root.text":   "Root node text",
  "element.node-default.bg":     "Default node bg",
  "element.node-default.text":   "Default node text",
  "element.node-default.border": "Default node border",
  "element.node-custom.bg":     "Custom node bg",
  "element.node-custom.border": "Custom node border",
  "element.node-custom.text":   "Custom node text",
  "element.ai-gradient.from": "AI gradient start",
  "element.ai-gradient.to":   "AI gradient end",
  "element.mention.bg":     "Mention highlight bg",
  "element.mention.text":   "Mention text",
  "element.mention.border": "Mention border",
  "element.mention-user.bg":     "User mention bg",
  "element.mention-user.text":   "User mention text",
  "element.mention-user.border": "User mention border",
  "element.query-gold-button.bg":     "Gold query button bg",
  "element.query-gold-button.text":   "Gold query button text",
  "element.query-gold-button.border": "Gold query button border",
  "element.query-blue-button.bg":     "Blue query button bg",
  "element.query-blue-button.text":   "Blue query button text",
  "element.query-blue-button.border": "Blue query button border",
  "element.scrollbar.track": "Scrollbar track",
  "element.scrollbar.thumb": "Scrollbar thumb",
  "element.level-circle":    "Level circle indicator",
}

// Level node entries
for (let i = 1; i <= 6; i++) {
  usageMap[`element.node-level-${i}.bg`]     = `Level ${i} node bg`
  usageMap[`element.node-level-${i}.border`] = `Level ${i} node border`
  usageMap[`element.node-level-${i}.text`]   = `Level ${i} node text`
}

// TRL entries
usageMap["element.trl-early.color"]   = "TRL early stage color"
usageMap["element.trl-early.border"]  = "TRL early stage border"
usageMap["element.trl-mid.color"]     = "TRL mid stage color"
usageMap["element.trl-mid.border"]    = "TRL mid stage border"
usageMap["element.trl-mature.color"]  = "TRL mature stage color"
usageMap["element.trl-mature.border"] = "TRL mature stage border"

// CAGR entries
for (const t of ["neutral", "positive", "high", "negative", "warning"]) {
  usageMap[`element.cagr-${t}.text`] = `CAGR ${t} text`
  usageMap[`element.cagr-${t}.bg`]   = `CAGR ${t} bg`
}

// Market entries
for (const t of ["monopoly", "oligopoly", "competitive"]) {
  usageMap[`element.market-${t}.text`] = `Market ${t} text`
  usageMap[`element.market-${t}.bg`]   = `Market ${t} bg`
}

// TAM entries
for (const t of ["xs", "sm", "md", "lg", "default"]) {
  usageMap[`element.tam-${t}.bg`]   = `TAM ${t} bg`
  usageMap[`element.tam-${t}.text`] = `TAM ${t} text`
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isColor(val) {
  if (typeof val !== "string") return false
  return /^#[0-9a-fA-F]{3,8}$/.test(val) || val.startsWith("rgba(") || val.startsWith("rgb(")
}

function textColorFor(hex) {
  if (!hex || !hex.startsWith("#")) return "#000000"
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#1a1a1a" : "#ffffff"
}

function getRef(obj, pathStr) {
  let current = obj
  for (const part of pathStr.split(".")) {
    current = current?.[part]
  }
  return current
}

// ── Build HTML sections ───────────────────────────────────────────────────────
function buildSwatchesHTML(obj, resolvedObj, pathPrefix, tier) {
  let html = ""

  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("$")) continue // skip metadata keys

    const fullPath = pathPrefix ? `${pathPrefix}.${key}` : key
    const resolvedValue = getRef(resolvedObj, fullPath.replace(/^(primitive|semantic|element)\./, ""))

    if (typeof value === "object" && value !== null) {
      const groupLabel = fullPath.split(".").slice(1).join(".")
      html += `<div class="group">`
      html += `<h3 class="group-title">${groupLabel}</h3>`
      html += `<div class="swatches">`
      html += buildSwatchesHTML(value, resolvedObj, fullPath, tier)
      html += `</div></div>`
    } else {
      const resolvedVal = typeof resolvedValue === "string" ? resolvedValue : value
      const isCol    = isColor(resolvedVal)
      const usage    = usageMap[fullPath] || ""
      const tokenName = fullPath.split(".").slice(1).join(".")
      const original = value
      const showRef  = original.includes("{") ? original : ""
      const textCol  = isCol ? textColorFor(resolvedVal) : "#1a1a1a"
      const bgStyle  = isCol
        ? `background-color: ${resolvedVal};`
        : `background: repeating-conic-gradient(#e5e7eb 0% 25%, white 0% 50%) 50% / 16px 16px;`

      const twClass = getTailwindClass(fullPath)
      const twNote  = getTailwindNote(fullPath)

      html += `
        <div class="swatch" onclick="copyToken('${tokenName}', '${resolvedVal}')">
          <div class="swatch-color" style="${bgStyle} color: ${textCol};">
            <span class="swatch-hex">${resolvedVal}</span>
          </div>
          <div class="swatch-info">
            <span class="swatch-name" title="${tokenName}">${tokenName}</span>
            ${twClass ? `<span class="swatch-class">${twClass}${twNote ? `<span class="swatch-class-note">${twNote}</span>` : ""}</span>` : ""}
            ${showRef ? `<span class="swatch-ref">${showRef}</span>` : ""}
            ${usage ? `<span class="swatch-usage">${usage}</span>` : ""}
          </div>
        </div>`
    }
  }

  return html
}

function buildTierHTML(tierName, tierData, resolvedTierData) {
  const label =
    tierName === "primitive" ? "Tier 1 — Primitive" :
    tierName === "semantic"  ? "Tier 2 — Semantic"  : "Tier 3 — Element"
  const desc =
    tierName === "primitive"
      ? "Raw palette values. Never used directly in components — only referenced by semantic tokens."
      : tierName === "semantic"
        ? "Meaning-based tokens. surface/text/edge route to dedicated Tailwind buckets; all others share the colors bucket."
        : "Component-specific tokens. Used directly in all UI components."

  return `
    <section class="tier" id="tier-${tierName}">
      <div class="tier-header">
        <h2>${label}</h2>
        <p class="tier-desc">${desc}</p>
        <span class="tier-count">${countLeaves(tierData)} tokens</span>
      </div>
      <div class="tier-content">
        ${buildSwatchesHTML(tierData, resolvedTierData, tierName, tierName)}
      </div>
    </section>`
}

function countLeaves(obj) {
  let c = 0
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("$")) continue
    if (typeof v === "object" && v !== null) c += countLeaves(v)
    else c++
  }
  return c
}

// ── Build full HTML ───────────────────────────────────────────────────────────
const totalTokens =
  countLeaves(resolved.primitive || {}) +
  countLeaves(resolved.semantic  || {}) +
  countLeaves(resolved.element   || {})

const generatedDate = new Date().toLocaleDateString("en-US", {
  year: "numeric", month: "long", day: "numeric"
})

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Memory AI — Design System Color Tokens</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: #f8f9fa;
    color: #1a1a1a;
    line-height: 1.5;
    padding: 0;
  }

  /* ── Header ── */
  .page-header {
    background: linear-gradient(135deg, #2563EB 0%, #8B5CF6 100%);
    color: white;
    padding: 48px 40px 40px;
  }
  .page-header h1 { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
  .page-header p  { opacity: 0.85; font-size: 14px; }
  .header-meta {
    display: flex; gap: 24px; margin-top: 16px; font-size: 13px; opacity: 0.75;
    flex-wrap: wrap;
  }
  .header-meta span { display: flex; align-items: center; gap: 6px; }

  /* ── Routing legend ── */
  .routing-legend {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 14px 40px;
    display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
    font-size: 12px; color: #565656;
  }
  .routing-legend strong { color: #1a1a1a; margin-right: 4px; }
  .route-chip {
    display: inline-flex; align-items: center; gap: 6px;
    background: #f3f4f6; border-radius: 6px; padding: 4px 10px;
    font-family: "SF Mono", SFMono-Regular, Menlo, monospace;
    font-size: 11px;
  }
  .route-chip .arrow { color: #9CA3AF; }
  .route-chip .cls { color: #2563EB; font-weight: 600; }

  /* ── Nav ── */
  .nav {
    position: sticky; top: 0; z-index: 100;
    background: white; border-bottom: 1px solid #e5e7eb;
    padding: 0 40px;
    display: flex; gap: 0; align-items: stretch;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .nav a {
    padding: 14px 20px; font-size: 13px; font-weight: 500;
    color: #565656; text-decoration: none;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
  }
  .nav a:hover  { color: #2563EB; background: #f8faff; }
  .nav a.active { color: #2563EB; border-bottom-color: #2563EB; }

  /* ── Search ── */
  .search-bar {
    padding: 20px 40px;
    background: white;
    border-bottom: 1px solid #f0f0f0;
  }
  .search-bar input {
    width: 100%; max-width: 480px;
    padding: 10px 16px; font-size: 14px;
    border: 1px solid #e5e7eb; border-radius: 8px;
    outline: none; transition: border-color 0.15s;
  }
  .search-bar input:focus {
    border-color: #2563EB;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }

  /* ── Content ── */
  .content { padding: 0 40px 60px; }

  .tier {
    margin-top: 40px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    overflow: hidden;
  }
  .tier-header {
    padding: 24px 28px 20px;
    border-bottom: 1px solid #f0f0f0;
    display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap;
  }
  .tier-header h2 { font-size: 18px; font-weight: 700; }
  .tier-desc { font-size: 13px; color: #9CA3AF; flex: 1; min-width: 200px; }
  .tier-count {
    font-size: 12px; font-weight: 600; color: #2563EB;
    background: #EFF6FF; padding: 3px 10px; border-radius: 20px;
  }
  .tier-content { padding: 20px 28px 28px; }

  /* ── Groups ── */
  .group { margin-bottom: 28px; }
  .group:last-child { margin-bottom: 0; }
  .group-title {
    font-size: 13px; font-weight: 600; color: #565656;
    text-transform: uppercase; letter-spacing: 0.5px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;
  }

  /* ── Swatches ── */
  .swatches {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 12px;
  }
  .swatch {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.15s;
  }
  .swatch:hover {
    border-color: #2563EB;
    box-shadow: 0 2px 8px rgba(37,99,235,0.12);
    transform: translateY(-1px);
  }
  .swatch-color {
    height: 72px;
    display: flex; align-items: flex-end;
    padding: 8px 10px;
  }
  .swatch-hex {
    font-size: 11px; font-weight: 600;
    font-family: "SF Mono", SFMono-Regular, Menlo, monospace;
    opacity: 0.9;
  }
  .swatch-info {
    padding: 8px 10px;
    display: flex; flex-direction: column; gap: 3px;
    background: white;
  }
  .swatch-name {
    font-size: 11px; font-weight: 600; color: #1a1a1a;
    font-family: "SF Mono", SFMono-Regular, Menlo, monospace;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .swatch-class {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 700; color: #2563EB;
    font-family: "SF Mono", SFMono-Regular, Menlo, monospace;
    background: #EFF6FF; border-radius: 4px;
    padding: 2px 6px; width: fit-content;
  }
  .swatch-class-note {
    font-size: 9px; font-weight: 400; color: #6B7280;
    background: #f3f4f6; border-radius: 3px; padding: 1px 4px;
  }
  .swatch-ref {
    font-size: 10px; color: #9CA3AF;
    font-family: "SF Mono", SFMono-Regular, Menlo, monospace;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .swatch-usage {
    font-size: 10px; color: #6B7280; margin-top: 1px;
  }

  /* ── Toast ── */
  .toast {
    position: fixed; bottom: 24px; left: 50%;
    transform: translateX(-50%) translateY(80px);
    background: #1a1a1a; color: white;
    padding: 10px 20px; border-radius: 8px;
    font-size: 13px; font-weight: 500;
    pointer-events: none; opacity: 0;
    transition: all 0.25s ease;
    z-index: 1000;
  }
  .toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  /* ── Hidden ── */
  .swatch.hidden { display: none; }
  .group.hidden  { display: none; }

  /* ── Nested groups ── */
  .group .group { margin-left: 0; margin-top: 16px; }
  .group .group .group-title {
    font-size: 12px; color: #9CA3AF;
    border-bottom: 1px dashed #f0f0f0;
  }
</style>
</head>
<body>

<div class="page-header">
  <h1>Memory AI Design System</h1>
  <p>Color Token Reference — Single source of truth for all color values</p>
  <div class="header-meta">
    <span>Total: ${totalTokens} tokens</span>
    <span>Primitives: ${countLeaves(resolved.primitive || {})}</span>
    <span>Semantic: ${countLeaves(resolved.semantic || {})}</span>
    <span>Element: ${countLeaves(resolved.element || {})}</span>
    <span>Generated: ${generatedDate}</span>
  </div>
</div>

<div class="routing-legend">
  <strong>Utility routing:</strong>
  <span class="route-chip"><code>semantic.surface.*</code> <span class="arrow">→</span> <span class="cls">bg-{key}</span></span>
  <span class="route-chip"><code>semantic.text.*</code>    <span class="arrow">→</span> <span class="cls">text-{key}</span></span>
  <span class="route-chip"><code>semantic.edge.*</code>    <span class="arrow">→</span> <span class="cls">border-{key}</span></span>
  <span style="color:#9CA3AF">— group name disappears from class</span>
  <span class="route-chip" style="margin-left:8px"><code>all others</code> <span class="arrow">→</span> <span class="cls">bg-{group}-{key}</span></span>
  <span style="color:#9CA3AF">— any utility prefix works</span>
</div>

<nav class="nav" id="nav">
  <a href="#tier-primitive" class="active" data-tier="primitive">Primitive</a>
  <a href="#tier-semantic"  data-tier="semantic">Semantic</a>
  <a href="#tier-element"   data-tier="element">Element</a>
</nav>

<div class="search-bar">
  <input type="text" id="search" placeholder="Search tokens by name, hex value, class, or usage…" autocomplete="off" />
</div>

<div class="content">
  ${buildTierHTML("primitive", tokens.primitive || {}, resolved.primitive || {})}
  ${buildTierHTML("semantic",  tokens.semantic  || {}, resolved.semantic  || {})}
  ${buildTierHTML("element",   tokens.element   || {}, resolved.element   || {})}
</div>

<div class="toast" id="toast">Copied!</div>

<script>
  // Copy token value on click
  function copyToken(name, value) {
    navigator.clipboard.writeText(value).then(() => {
      const toast = document.getElementById('toast');
      toast.textContent = 'Copied: ' + value;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 1500);
    });
  }

  // Search
  const searchInput = document.getElementById('search');
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.swatch').forEach(s => {
      const text = s.textContent.toLowerCase();
      s.classList.toggle('hidden', q && !text.includes(q));
    });
    document.querySelectorAll('.group').forEach(g => {
      const visible = g.querySelectorAll('.swatch:not(.hidden)');
      g.classList.toggle('hidden', q && visible.length === 0);
    });
  });

  // Nav active state on scroll
  const navLinks = document.querySelectorAll('.nav a');
  const tiers    = document.querySelectorAll('.tier');

  function updateActiveNav() {
    let current = 'primitive';
    tiers.forEach(t => {
      if (t.getBoundingClientRect().top <= 120) {
        current = t.id.replace('tier-', '');
      }
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.dataset.tier === current);
    });
  }
  window.addEventListener('scroll', updateActiveNav, { passive: true });
</script>

</body>
</html>`

// ── Write output ──────────────────────────────────────────────────────────────
fs.mkdirSync(DIST, { recursive: true })
fs.writeFileSync(OUT_HTML, html, "utf8")
console.log(`✓ Color docs     → ${path.relative(process.cwd(), OUT_HTML)}`)
console.log(`  ${totalTokens} tokens documented across 3 tiers`)
