# PlainVault Design Guide

## Overview

PlainVault is a secure internal vault for storing secrets, configurations, and team notes. The UI uses a clean, professional design with Tailwind CSS, emphasizing readability and a neutral color palette that keeps focus on content.

---

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Indigo 600 | `#4f46e5` | Primary buttons, links, active states |
| Indigo 700 | `#4338ca` | Primary button hover |
| Indigo 50 | `#eef2ff` | Active nav background, highlights |

### Neutral Colors

| Name | Hex | Usage |
|------|-----|-------|
| Gray 900 | `#111827` | Primary text, headings |
| Gray 700 | `#374151` | Secondary text |
| Gray 600 | `#4b5563` | Body text, nav items |
| Gray 500 | `#6b7280` | Muted text, placeholders |
| Gray 200 | `#e5e7eb` | Borders, dividers |
| Gray 100 | `#f3f4f6` | Alternate row backgrounds, code backgrounds |
| Gray 50 | `#f9fafb` | Page background, sidebar |
| White | `#ffffff` | Card backgrounds, input backgrounds |

### Semantic Colors

| Role | Background | Text | Border | Usage |
|------|------------|------|--------|-------|
| Success (Green) | `bg-green-100` | `text-green-700` | — | Success states, DEVELOPER role |
| Warning (Yellow) | `bg-yellow-50` | `text-yellow-800` | `border-yellow-200` | Pending states |
| Error (Red) | `bg-red-100` | `text-red-700` | — | Destructive actions |
| Info (Blue) | `bg-blue-50` | `text-blue-700` | `border-blue-200` | Informational callouts |

### Role Badge Colors

| Role | Variant | Colors |
|------|---------|--------|
| ADMIN | `default` | `bg-indigo-100 text-indigo-700` |
| DEVELOPER | `secondary` | `bg-gray-100 text-gray-700` |
| VIEWER | `outline` | `border border-gray-300 text-gray-600` |

---

## Typography

### Font Families

- **Sans-serif**: `var(--font-geist-sans)` (Next.js Geist font, CSS variable `--font-geist-sans`)
- **Monospace**: `var(--font-geist-mono)` (Next.js Geist Mono font, CSS variable `--font-geist-mono`)

### Type Scale

| Element | Size | Weight | Line Height | Notes |
|---------|------|--------|-------------|-------|
| H1 (Page title) | `text-3xl` (30px) | `font-bold` | — | Main page headings |
| H2 (Section title) | `text-2xl` (24px) | `font-bold` | — | Section headings |
| H3 (Card title) | `text-lg` (18px) | `font-semibold` | `tracking-tight` | Card headers |
| Body | `text-sm` (14px) | normal | — | Default body text |
| Small | `text-xs` (12px) | normal | — | Muted text, metadata |
| Code | `text-xs` | `font-mono` | — | Inline code, code blocks |

### Text Color Classes

- Headings: `text-gray-900`
- Body: `text-gray-600`
- Muted: `text-gray-500`
- Links: `text-indigo-600` with `hover:underline`

---

## Spacing System

Uses Tailwind CSS default spacing scale. Key values:

| Token | Value | Usage |
|-------|-------|-------|
| `px-3` / `py-2` | 12px / 8px | Standard padding for buttons, nav items |
| `p-4` | 16px | Card content padding |
| `p-6` | 24px | Card header padding |
| `px-6` | 24px | Page horizontal padding |
| `py-8` | 32px | Page vertical padding |
| `gap-1` / `gap-2` / `gap-3` | 4px / 8px / 12px | Element spacing |
| `space-y-1` to `space-y-6` | 4px–24px | Vertical stacking |

### Layout

- **Max content width**: `max-w-6xl` (1152px)
- **Sidebar width**: `w-52` (208px), `flex-shrink-0`
- **Header height**: `h-14` (56px), `sticky top-0`
- **Main content**: `flex-1 min-w-0`

---

## Component Patterns

### Cards

Used for grouping related content.

```tsx
<Card>
  <CardHeader><CardTitle>Title</CardTitle></CardHeader>
  <CardContent className="space-y-3 text-sm text-gray-600">
    {/* content */}
  </CardContent>
</Card>
```

**Styles**:
- Border: `border border-gray-200`
- Background: `bg-white`
- Shadow: `shadow-sm`
- Border radius: `rounded-lg`
- Text color: `text-gray-900` (header), `text-gray-600` (content)

### Buttons

Import from `@/components/ui/button`.

**Variants**:

| Variant | Background | Text | Hover |
|---------|------------|------|-------|
| `default` | `bg-indigo-600` | `text-white` | `hover:bg-indigo-700` |
| `destructive` | `bg-red-600` | `text-white` | `hover:bg-red-700` |
| `outline` | `bg-white` | `text-gray-700` | `hover:bg-gray-50` |
| `secondary` | `bg-gray-100` | `text-gray-900` | `hover:bg-gray-200` |
| `ghost` | transparent | `text-gray-600` | `hover:bg-gray-100` |
| `link` | transparent | `text-indigo-600` | `hover:underline` |

**Sizes**:

| Size | Height | Padding | Use |
|------|--------|---------|-----|
| `default` | `h-10` (40px) | `px-4 py-2` | Standard |
| `sm` | `h-9` (36px) | `px-3` | Compact |
| `lg` | `h-11` (44px) | `px-8` | Primary CTA |
| `icon` | `h-10 w-10` | — | Icon buttons |

### Inputs

Import from `@/components/ui/input`.

```tsx
<Input
  type="text"
  placeholder="Enter value"
  error={false}
/>
```

**Styles**:
- Height: `h-10` (40px)
- Border: `border border-gray-200`
- Focus ring: `focus-visible:ring-2 focus-visible:ring-indigo-500`
- Error state: `border-red-400 focus-visible:ring-red-400`
- Background: `bg-white`
- Text: `text-sm`

### Badges

Import from `@/components/ui/badge`.

```tsx
<Badge variant="default">Label</Badge>
<Badge variant="color" color="#ef4444">Colored</Badge>
```

**Variants**:
- `default`: Indigo (`bg-indigo-100 text-indigo-700`)
- `secondary`: Gray (`bg-gray-100 text-gray-700`)
- `destructive`: Red (`bg-red-100 text-red-700`)
- `outline`: Gray outline (`border border-gray-300 text-gray-600`)
- `success`: Green (`bg-green-100 text-green-700`)
- `color`: Custom color with dot indicator

### Code Blocks

Used for code snippets, file content examples, and API examples.

```tsx
<pre className="bg-gray-50 p-4 rounded-lg text-xs font-mono overflow-x-auto">
  <code>{code}</code>
</pre>
```

**Features**:
- Background: `bg-gray-50`
- Padding: `p-4`
- Border radius: `rounded-lg`
- Font: `text-xs font-mono`
- Overflow: `overflow-x-auto`

### Tables

Used in documentation for feature comparisons (e.g., roles/permissions).

```tsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-gray-200 bg-gray-50">
      <th className="text-left px-4 py-2 font-medium text-gray-700">Header</th>
    </tr>
  </thead>
  <tbody className="text-xs">
    <tr className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
      <td className="px-4 py-2 text-gray-700">Cell</td>
    </tr>
  </tbody>
</table>
```

### Navigation Sidebar

Used in docs pages for section navigation.

```tsx
<aside className="w-52 flex-shrink-0">
  <nav className="sticky top-20 space-y-1">
    <button className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
      active === id
        ? "bg-indigo-50 text-indigo-700 font-medium"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    }`}>
      Label
    </button>
  </nav>
</aside>
```

---

## Layout Structure

### Page Layout

```
┌─────────────────────────────────────────────────┐
│ AppHeader (sticky, h-14)                        │
├─────────────────────────────────────────────────┤
│                                                 │
│   max-w-6xl mx-auto px-6 py-8                  │
│   ┌──────────────┐ ┌────────────────────────┐  │
│   │ Sidebar      │ │ Main Content           │  │
│   │ w-52         │ │ flex-1 min-w-0         │  │
│   │              │ │                        │  │
│   │              │ │                        │  │
│   └──────────────┘ └────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Header (AppHeader)

- Background: `bg-white`
- Border: `border-b border-gray-200`
- Position: `sticky top-0 z-50`
- Height: `h-14` (56px)
- Logo: `<img src="/plainvault/logo.png" className="h-7" />`
- Nav items: `px-3 py-2 rounded-md text-sm`
- User menu: Avatar + name + RoleBadge + dropdown

### Dropdown Menus

- Background: `bg-white`
- Border: `border border-gray-200`
- Shadow: `shadow-lg`
- Border radius: `rounded-md`
- Width: `w-40` (admin), `w-48` (user menu)
- Item padding: `px-4 py-2 text-sm`

---

## Icon System

Uses inline SVG with `w-3 h-3` or `w-4 h-4` for dropdown arrows and indicators.

```tsx
<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
</svg>
```

---

## Form Patterns

### Form Layout

- Labels: `text-sm font-medium text-gray-700`
- Inputs stacked vertically with `space-y-4`
- Error messages: `text-sm text-red-600`
- Submit buttons right-aligned via flexbox

### Loading States

```tsx
<div className="min-h-screen bg-white flex items-center justify-center">
  <p className="text-gray-500 text-sm">Loading...</p>
</div>
```

### Empty States

Use callout cards with icons and descriptive text.

---

## Status Indicators

### HTTP Method Badges (API Docs)

| Method | Background | Text |
|--------|------------|------|
| GET | `bg-green-100` | `text-green-700` |
| POST | `bg-blue-100` | `text-blue-700` |
| PATCH | `bg-yellow-100` | `text-yellow-700` |
| DELETE | `bg-red-100` | `text-red-700` |

### Auth Level Badges

| Level | Style |
|-------|-------|
| Public | `bg-gray-50 text-gray-600 border-gray-200` |
| Required | `bg-blue-50 text-blue-700 border-blue-200` |
| DEVELOPER+ | `bg-green-50 text-green-700 border-green-200` |
| ADMIN | `bg-purple-50 text-purple-700 border-purple-200` |

### Status Badges

- PENDING: Yellow background (`bg-yellow-100 text-yellow-800 px-1 rounded text-xs`)
- APPROVED: Green background
- REJECTED: Red background

---

## CSS Variables

Defined in `src/app/globals.css`:

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

Note: Dark mode is defined but the app currently uses light theme exclusively.

---

## Utility Classes (Common Patterns)

| Pattern | Classes |
|---------|---------|
| Flex center | `flex items-center justify-center` |
| Flex between | `flex items-center justify-between` |
| Flex gap | `flex items-center gap-2` |
| Text truncate | `truncate overflow-ellipsis` |
| Sticky sidebar | `sticky top-20` |
| Transition | `transition-colors` |
| Focus ring | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500` |