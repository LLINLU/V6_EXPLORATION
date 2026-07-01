# Report primitives

Three small components every report section should reach for **before** writing inline `bg-gray-50 rounded-md ...` blocks. Use them everywhere — the goal is that all generated reports look identical without engineers thinking about styles.

```tsx
import {
  ReportInfoCallout,
  ReportFoldableCard,
  ReportTabs,
} from "@/components/scenario/report/primitives"
```

---

## `ReportInfoCallout`

Gray card for short, soft-emphasis paragraphs (caveats, structural barriers, current limits, proposed solutions).

```tsx
<ReportInfoCallout>
  {data.someCaveat}
</ReportInfoCallout>

// With pill label + tone
<ReportInfoCallout label="現状手法の限界" labelTone="red">
  {item.currentLimit}
</ReportInfoCallout>

// With info icon (for explanatory notes)
<ReportInfoCallout showInfoIcon>
  {data.structuralBarriers}
</ReportInfoCallout>
```

| Prop          | Type                                                  | Default   |
| ------------- | ----------------------------------------------------- | --------- |
| `label`       | `string`                                              | —         |
| `labelTone`   | `"red" \| "blue" \| "emerald" \| "amber" \| "neutral"` | `neutral` |
| `showInfoIcon`| `boolean`                                             | `false`   |
| `children`    | `ReactNode`                                           | required  |
| `className`   | `string`                                              | —         |

**Use it whenever** you'd otherwise write `<div className="bg-gray-50 rounded-md ...">`.

---

## `ReportFoldableCard`

Foldable card with number badge + title + chevron in a gray header. Body collapses on click.

```tsx
{items.map((item, i) => (
  <ReportFoldableCard
    key={i}
    badge={String(i + 1).padStart(2, "0")}
    title={item.issue}
  >
    <ReportInfoCallout label="現状手法の限界" labelTone="red">
      {item.currentLimit}
    </ReportInfoCallout>
    <ReportInfoCallout label="本技術による解決" labelTone="emerald">
      {item.solution}
    </ReportInfoCallout>
  </ReportFoldableCard>
))}
```

| Prop          | Type        | Default  |
| ------------- | ----------- | -------- |
| `badge`       | `string`    | —        |
| `title`       | `ReactNode` | required |
| `trailing`    | `ReactNode` | —        |
| `defaultOpen` | `boolean`   | `true`   |
| `children`    | `ReactNode` | required |
| `className`   | `string`    | —        |

**Use it for** any list-of-items pattern with a brief header and a longer body.

---

## `ReportTabs`

Blue-outlined tab strip with optional counts. Controlled component — owner holds the active key.

```tsx
const [active, setActive] = useState<MyKey>("a")

<ReportTabs
  tabs={[
    { key: "a", label: "競合企業",   count: rows.competitors.length },
    { key: "b", label: "協力機関",   count: rows.collaborators.length },
    { key: "c", label: "主要研究者", count: rows.researchers.length },
  ]}
  activeKey={active}
  onChange={setActive}
  className="mb-3"
/>
```

| Prop        | Type                              | Default  |
| ----------- | --------------------------------- | -------- |
| `tabs`      | `readonly ReportTab<K>[]`         | required |
| `activeKey` | `K`                               | required |
| `onChange`  | `(key: K) => void`                | required |
| `className` | `string`                          | —        |

`ReportTab<K>` is `{ key: K; label: string; count?: number }`. Generic on `K extends string` so the active key stays type-safe.

---

## Rules of thumb

1. **Don't write inline `bg-gray-50 rounded-md ...`** for callouts — use `ReportInfoCallout`.
2. **Don't write inline accordion logic** for cards — use `ReportFoldableCard`.
3. **Don't write inline tab buttons** — use `ReportTabs`.
4. If you need a variant the primitive doesn't cover, extend the primitive (add a prop) — don't fork. The whole point is one source of truth for report styling.
