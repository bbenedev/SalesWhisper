# SalesWhisper v2 Design Migration — Drop-in Guide

## Files generated

```
tailwind.config.ts          → Replace your existing tailwind config
globals.css                 → Replace your existing globals.css
components/
  Sidebar.tsx               → Drop into dashboard/components/ or src/components/
  Topbar.tsx
  PerfStrip.tsx
  ScoreRing.tsx
  StatusPill.tsx
  CallsTable.tsx
app/dashboard/
  layout.tsx                → Replace existing dashboard layout
  page.tsx                  → Replace existing dashboard page
  call/[id]/page.tsx        → Replace existing call detail page
```

## Step-by-step integration

### 1. Update tailwind.config.ts
Replace your `tailwind.config.ts` with the provided file.
The custom color tokens (bg, surface, accent, teal, green, amber, red) are now available as Tailwind classes:
- `bg-bg`, `bg-surface`, `bg-surface-2`, `bg-surface-3`
- `text-text`, `text-text-2`, `text-text-3`
- `text-accent`, `text-teal`, `text-green`, `text-amber`, `text-red`

### 2. Update globals.css
Replace your `globals.css`. This sets CSS variables used throughout the components via inline styles.

> **Why inline styles instead of pure Tailwind?** The design uses opacity-based rgba colors (e.g. `rgba(139,157,181,0.08)`) that can't be expressed cleanly in Tailwind without a full JIT config. CSS vars keep the design system consistent between Next.js and the Chrome extension.

### 3. Place components
Copy all `components/*.tsx` files into:
```
frontend/dashboard/src/components/
```
or wherever your component folder is. Update imports accordingly.

### 4. Update layout.tsx
The new `layout.tsx` uses `createServerComponentClient` from `@supabase/auth-helpers-nextjs` to get the current user server-side. It passes the user's name/initials to Sidebar and Topbar.

**If you're using a different auth pattern**, replace the Supabase call with your existing `getUser()` call.

### 5. Update pages
- `page.tsx`: Fetches calls from `calls` table. Column mapping assumes:
  - `prospect_name`, `company`, `created_at`, `duration`, `score`, `status`
  - Adjust column names to match your actual schema.
  
- `call/[id]/page.tsx`: Fetches single call by `id`. 
  - Currently renders **mock data for transcript, timeline, signals** — replace with real data from your `call_analysis` or equivalent table when available.
  - Score breakdown, coaching tips, and follow-up draft will eventually come from GPT-4o analysis stored in Supabase.

### 6. Font
The design uses **Inter**. The CSS imports it from Google Fonts. For production, replace with `next/font/google`:

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700','800'] })
```
Remove the Google Fonts `@import` from `globals.css` and apply `inter.className` to `<body>`.

## Supabase schema assumed
```sql
CREATE TABLE calls (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id),
  prospect_name TEXT,
  company      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  duration     TEXT,          -- e.g. "38:24"
  score        INT,           -- 0-100
  status       TEXT,          -- 'done' | 'review' | 'live'
  summary      TEXT,          -- AI-generated summary
  transcript   JSONB,         -- [{speaker, text, ts}]
  analysis     JSONB          -- signals, objections, coaching tips
);
```

## RLS
Ensure row-level security is enabled on `calls`:
```sql
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_calls" ON calls
  USING (auth.uid() = user_id);
```

## Extension live status
`Topbar` accepts `extensionLive={boolean}`. Wire this to a real-time Supabase channel or a cookie set by the Chrome extension to show the "Extension Live" chip dynamically.

## Checklist

- [ ] Replace column names in `page.tsx` to match your actual DB schema
- [ ] Add RLS policy on `calls` table
- [ ] Replace `createServerComponentClient` if using different auth helper version
- [ ] Switch from Google Fonts import to `next/font/google`
- [ ] Replace mock transcript/timeline in `call/[id]/page.tsx` with real data
- [ ] Update component import paths to match your folder structure
