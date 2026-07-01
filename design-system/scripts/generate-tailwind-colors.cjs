/**
 * generate-tailwind-colors.cjs
 *
 * Reads design-system/tokens/colors.json and outputs:
 *   1. design-system/dist/tailwind-colors.cjs  — importable Tailwind color object
 *   2. design-system/dist/tokens.css            — CSS custom properties
 *
 * Utility routing:
 *   semantic.text    → textColor        (text-secondary, text-muted, etc.)
 *   semantic.surface → backgroundColor  (bg-subtle, bg-muted, etc.)
 *   semantic.edge    → borderColor      (border-subtle, border-focus, etc.)
 *   Everything else  → colors           (shared across all utilities)
 *
 * Keys starting with "$" are metadata and are skipped by the generator.
 *
 * Usage:
 *   node design-system/scripts/generate-tailwind-colors.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT       = path.resolve(__dirname, '..');
const INPUT      = path.join(ROOT, 'tokens', 'colors.json');
const DIST       = path.join(ROOT, 'dist');
const TAILWIND_OUT = path.join(DIST, 'tailwind-colors.cjs');
const CSS_OUT    = path.join(DIST, 'tokens.css');

// Groups routed to a dedicated Tailwind bucket (group name disappears from class)
const UTILITY_ROUTING = {
  text:    'textColor',
  surface: 'backgroundColor',
  edge:    'borderColor',
};

const rawTokens = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));

// ── Reference resolver ───────────────────────────────────────────────────────
function resolveRef(value, root) {
  if (typeof value !== 'string') return value;
  return value.replace(/\{([^}]+)\}/g, (_, refPath) => {
    const parts = refPath.split('.');
    let current = root;
    for (const part of parts) {
      if (current && current[part] !== undefined) {
        current = current[part];
      } else {
        console.warn(`  Warning: unresolved reference {${refPath}}`);
        return `{${refPath}}`;
      }
    }
    if (typeof current === 'string' && current.includes('{')) {
      return resolveRef(current, root);
    }
    return current;
  });
}

function resolveObject(obj, root) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue; // skip metadata keys
    if (typeof value === 'object' && value !== null) {
      result[key] = resolveObject(value, root);
    } else {
      result[key] = resolveRef(value, root);
    }
  }
  return result;
}

// ── Build Tailwind token buckets ─────────────────────────────────────────────
function buildTailwindTokens(tokens) {
  const resolved = resolveObject(tokens, tokens);

  const colors          = {};
  const textColor       = {};
  const backgroundColor = {};
  const borderColor     = {};
  const utilityTargets  = { textColor, backgroundColor, borderColor };

  // Primitives → shared colors bucket (bg-blue-600, text-gray-900, etc.)
  if (resolved.primitive) {
    for (const [name, palette] of Object.entries(resolved.primitive)) {
      colors[name] = typeof palette === 'object' ? { ...palette } : palette;
    }
  }

  // Semantic tokens → routed or shared colors
  if (resolved.semantic) {
    for (const [group, values] of Object.entries(resolved.semantic)) {
      const targetKey = UTILITY_ROUTING[group];
      if (targetKey) {
        // Utility-specific: keys go directly into the bucket, group name disappears
        const target = utilityTargets[targetKey];
        if (typeof values === 'object' && values !== null) {
          Object.assign(target, values);
        } else {
          target[group] = values;
        }
      } else {
        // Shared: goes into colors bucket, works with any utility prefix
        colors[group] = typeof values === 'object' ? { ...values } : values;
      }
    }
  }

  // Element tokens → shared colors bucket
  if (resolved.element) {
    for (const [name, values] of Object.entries(resolved.element)) {
      colors[name] = typeof values === 'object' ? { ...values } : values;
    }
  }

  return { colors, textColor, backgroundColor, borderColor };
}

// ── Build CSS custom properties ──────────────────────────────────────────────
function buildCssProperties(obj, prefix = '') {
  const lines = [];
  for (const [key, value] of Object.entries(obj)) {
    const varName = prefix ? `${prefix}-${key}` : key;
    if (typeof value === 'object' && value !== null) {
      lines.push(...buildCssProperties(value, varName));
    } else {
      lines.push(`  --color-${varName}: ${value};`);
    }
  }
  return lines;
}

// ── Generate ─────────────────────────────────────────────────────────────────
fs.mkdirSync(DIST, { recursive: true });

const output = buildTailwindTokens(rawTokens);

const tailwindContent = `/**
 * Auto-generated from design-system/tokens/colors.json
 * Do NOT edit manually — run: node design-system/scripts/generate-tailwind-colors.cjs
 * Generated: ${new Date().toISOString()}
 */

module.exports = ${JSON.stringify(output, null, 2)};
`;

fs.writeFileSync(TAILWIND_OUT, tailwindContent, 'utf-8');
console.log(`✓ Tailwind colors → ${path.relative(process.cwd(), TAILWIND_OUT)}`);

// CSS vars: write all buckets under logical prefixes
const allForCss = {
  ...output.colors,
  text:    output.textColor,
  surface: output.backgroundColor,
  edge:    output.borderColor,
};
const cssLines = buildCssProperties(allForCss);
const cssContent = `/**
 * Auto-generated from design-system/tokens/colors.json
 * Do NOT edit manually — run: node design-system/scripts/generate-tailwind-colors.cjs
 * Generated: ${new Date().toISOString()}
 */

:root {
${cssLines.join('\n')}
}
`;

fs.writeFileSync(CSS_OUT, cssContent, 'utf-8');
console.log(`✓ CSS tokens     → ${path.relative(process.cwd(), CSS_OUT)}`);

const total =
  Object.keys(output.colors).length +
  Object.keys(output.textColor).length +
  Object.keys(output.backgroundColor).length +
  Object.keys(output.borderColor).length;
console.log(`\nDone. ${total} top-level token groups generated.`);
