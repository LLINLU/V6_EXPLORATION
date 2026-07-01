# Design Token Documentation — Visual Style Guide

Restyle the existing design token documentation page to match this visual spec. Do not change any content, structure, or functionality — only update CSS properties.

---

## Global

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: #f8f9fa;
  color: #1a1a1a;
  line-height: 1.5;
}
```

All monospace text (token names, hex values, class names, references):
`"SF Mono", SFMono-Regular, Menlo, monospace`

---

## Color Palette (for the page chrome itself)

| Role | Value |
|---|---|
| Page background | `#f8f9fa` |
| Card / section background | `white` |
| Primary text | `#1a1a1a` |
| Secondary text | `#565656` |
| Muted text | `#9CA3AF` |
| Description / usage text | `#6B7280` |
| Border (default) | `#e5e7eb` |
| Border (subtle / dividers) | `#f0f0f0` |
| Accent / brand | `#2563EB` |
| Accent background (pills, highlights) | `#EFF6FF` |
| Hover tint | `#f8faff` |
| Toast background | `#1a1a1a` |

---

## Header

- `background: linear-gradient(135deg, #2563EB 0%, #8B5CF6 100%)` — adapt the two colors to your brand
- `color: white; padding: 48px 40px 40px`
- Title: `font-size: 28px; font-weight: 700; margin-bottom: 6px`
- Subtitle: `font-size: 14px; opacity: 0.85`
- Metadata row: `display: flex; gap: 24px; margin-top: 16px; font-size: 13px; opacity: 0.75; flex-wrap: wrap`

---

## Sticky Navigation

- `position: sticky; top: 0; z-index: 100`
- `background: white; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.04)`
- `padding: 0 40px; display: flex; align-items: stretch`
- Tab links: `padding: 14px 20px; font-size: 13px; font-weight: 500; color: #565656; border-bottom: 2px solid transparent; transition: all 0.15s`
- Hover: `color: #2563EB; background: #f8faff`
- Active: `color: #2563EB; border-bottom-color: #2563EB`

---

## Search Input

- Container: `padding: 20px 40px; background: white; border-bottom: 1px solid #f0f0f0`
- Input: `max-width: 480px; padding: 10px 16px; font-size: 14px; border: 1px solid #e5e7eb; border-radius: 8px; transition: border-color 0.15s`
- Focus: `border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.1)`

---

## Tier Section Cards

- `margin-top: 40px; border: 1px solid #e5e7eb; border-radius: 12px; background: white; overflow: hidden`
- Content area padding: `0 40px 60px` on the outer container

### Tier Header
- `padding: 24px 28px 20px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap`
- Title: `font-size: 18px; font-weight: 700`
- Description: `font-size: 13px; color: #9CA3AF; flex: 1; min-width: 200px`
- Count pill: `font-size: 12px; font-weight: 600; color: #2563EB; background: #EFF6FF; padding: 3px 10px; border-radius: 20px`

### Tier Content
- `padding: 20px 28px 28px`

---

## Group Headings

- `font-size: 13px; font-weight: 600; color: #565656; text-transform: uppercase; letter-spacing: 0.5px`
- `margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0`
- Group spacing: `margin-bottom: 28px` (last child: 0)
- Nested subgroup title: `font-size: 12px; color: #9CA3AF; border-bottom: 1px dashed #f0f0f0`

---

## Swatch Grid

- `display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px`

---

## Swatch Card

- `border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; cursor: pointer; transition: all 0.15s`
- Hover: `border-color: #2563EB; box-shadow: 0 2px 8px rgba(37,99,235,0.12); transform: translateY(-1px)`

### Color Preview (top zone)
- `height: 72px; display: flex; align-items: flex-end; padding: 8px 10px`
- Hex label: `font-size: 11px; font-weight: 600; opacity: 0.9` (monospace)

### Info Zone (bottom)
- `padding: 8px 10px; display: flex; flex-direction: column; gap: 3px; background: white`
- Token name: `font-size: 11px; font-weight: 600; color: #1a1a1a` (monospace, ellipsis overflow)
- Utility class pill: `font-size: 10px; font-weight: 700; color: #2563EB; background: #EFF6FF; border-radius: 4px; padding: 2px 6px; width: fit-content` (monospace)
- Class note badge (inside pill): `font-size: 9px; font-weight: 400; color: #6B7280; background: #f3f4f6; border-radius: 3px; padding: 1px 4px`
- Reference: `font-size: 10px; color: #9CA3AF` (monospace, ellipsis overflow)
- Usage: `font-size: 10px; color: #6B7280; margin-top: 1px`

---

## Toast

- `position: fixed; bottom: 24px; left: 50%; background: #1a1a1a; color: white; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; z-index: 1000`
- Hidden: `opacity: 0; transform: translateX(-50%) translateY(80px)`
- Visible: `opacity: 1; transform: translateX(-50%) translateY(0)`
- `transition: all 0.25s ease`

---

## Key Ratios to Preserve

- Content horizontal padding: **40px**
- Card inner padding: **28px**
- Swatch min-width: **190px**
- Color preview height: **72px**
- Card corner radius: **12px**, small elements: **8px**, pills: **20px**
- Transitions: **0.15s** for hover, **0.25s** for toast
