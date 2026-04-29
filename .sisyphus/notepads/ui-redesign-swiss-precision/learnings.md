
# Wave 1: globals.css Swiss Precision Color System

## What was done
- Updated `:root` CSS variables with darker Swiss Precision values (background: oklch(0.08 0 0), near-black)
- Removed `.dark` block entirely (redundant; dark-only theme, :root already has dark values)
- Changed `--font-heading: var(--font-sans)` → `--font-heading: var(--font-heading)` in `@theme inline`
- Changed `--radius` from 0.625rem → 0.5rem
- Changed `--border` from oklch(1 0 0 / 10%) → oklch(1 0 0 / 6%) (more subtle)
- Changed `--input` from oklch(1 0 0 / 15%) → oklch(1 0 0 / 8%)
- All sidebar colors darkened: sidebar → oklch(0.06 0 0), sidebar-accent → oklch(0.12 0 0), etc.
- `npm run build` passes successfully

## Key files
- `app/globals.css` — the only file modified

## 2026-04-29: Wave 1 — Font setup (Space Grotesk + Geist Sans)

- `app/layout.tsx` updated: replaced `Inter` + `Geist` from `next/font/google` with `Space_Grotesk` (headings) and `GeistSans` from `geist` npm package (body)
- Space Grotesk configured with `variable: "--font-heading"`, `display: "swap"`
- GeistSans from `geist/font/sans` provides CSS variable `--font-geist-sans`
- `globals.css` `@theme inline` updated: `--font-sans` now maps to `var(--font-geist-sans)` instead of `var(--font-sans)`
- `html` element gets both `spaceGrotesk.variable` and `GeistSans.variable` classes via `cn()`
- `body` gets `font-sans` class (resolves to `var(--font-geist-sans)` via the `@theme inline` mapping)
- Build passes cleanly

## 2026-04-29: AppSidebar Component Created

- Created `components/app-sidebar.tsx` as a Client Component with hover-expand sidebar.
- Reused active route logic from `components/app-nav.tsx`:
  - `/cases` active when `pathname === "/cases"` or on any case detail route
  - `/cases/new` active when pathname starts with `/cases/new`
- Sidebar CSS variables already defined in `globals.css`: `--sidebar`, `--sidebar-foreground`, `--sidebar-border`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-primary`.
- Used Tailwind `group` on `<aside>` with `group-hover:opacity-100` for label expansion.
- Used `border-l-2 border-transparent` on inactive items to prevent layout shift when active state toggles.
- Build verified successfully with `npm run build`.

## 2026-04-29: Cases Page — Table to Card Grid Refactor

### What was done
- Replaced the data table in `app/(app)/cases/page.tsx` with a card-based grid layout.
- Created `app/(app)/cases/cases-list.tsx` as a Client Component to hold filter state.
- Added filter tabs: 全部 / 草稿中 / 进行中 / 已完成.
  - 进行中 = ANALYST_REVIEW, READY_TO_SEND, WAITING_CUSTOMER_FEEDBACK, REVISION_NEEDED
  - 已完成 = ACCEPTED, CANCELED
- Each case renders as a clickable `Card` wrapped in `next/link`.
- Card hover: `hover:-translate-y-0.5 hover:border-border/40 transition-all duration-200`.
- Responsive grid: `grid gap-4 md:grid-cols-2 lg:grid-cols-3`.
- Empty state: `FolderOpen` icon + "暂无案例" message.
- Header updated to "案例列表" with `font-heading` (Space Grotesk) and kept subtitle.
- Removed "新建案例" button from header (now lives in sidebar).
- Kept `listProposalCases()` data fetching and `export const dynamic = "force-dynamic"`.
- Dates pre-formatted on the server and passed as strings to the Client Component.

### Key decisions
- Split into Server Component (`page.tsx`) + Client Component (`cases-list.tsx`) to keep data fetching server-side while enabling interactive filter buttons.
- Avoided importing `@prisma/client` in the client component by defining a local `ProposalStatus` union type.
- `StatusBadge` (a Server Component) is imported and used inside the Client Component; it bundles fine since it contains no server-only APIs.

### Files changed
- `app/(app)/cases/page.tsx` — rewritten
- `app/(app)/cases/cases-list.tsx` — created

### Build status
- `npm run build` passes successfully.

## 2026-04-29: Wave 3 — New Case Page Refactor

### What was done
- Refactored `app/(app)/cases/new/page.tsx` to match Swiss Precision sidebar layout.
- Removed `Link` (next/link) and `ArrowLeft` (lucide-react) imports — sidebar handles navigation.
- Simplified header: removed "返回工作台" button, uses `<header>` with `font-heading` title + `text-muted-foreground` subtitle (matching `cases/page.tsx`).
- Card styling: `border-slate-700 bg-slate-950/70 text-slate-100` → `border-border bg-card text-card-foreground`.
- CardTitle uses `font-heading` (Space Grotesk).
- Input/Textarea styling: `border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500` → `border-border bg-muted text-foreground placeholder:text-muted-foreground`.
- Helper text: `text-slate-400` → `text-muted-foreground`.
- Form logic, Server Action, SubmitButton unchanged.
- Build passes successfully.

## 2026-04-29: Case Detail Page — 2-Column Layout Refactor

### What was done
- Rewrote `app/(app)/cases/[id]/page.tsx` from 3-column grid (`xl:grid-cols-[1.1fr_1.4fr_1fr]`) to 2-column flex layout.
- Left column (`w-80 shrink-0 sticky top-6`):
  - Moved header content (TitleEditor, customer name, status badge, round number, RegenerateProposalButton) into a sticky left sidebar card.
  - Added vertical action button stack: "确认方案" (anchor to #proposal-editor), "发送客户" (form with SubmitButton), "登记反馈" (anchor to #customer-feedback).
- Right column (`flex-1 min-w-0`):
  - 客户上下文 section wrapped in `<details open>` for collapsibility.
  - 分析师方案确认 section with id="proposal-editor" for anchor navigation.
  - PM 客户反馈操作 section with id="customer-feedback" for anchor navigation.
  - 修订时间线 section unchanged.
- Created `app/(app)/cases/[id]/similar-cases-drawer.tsx` as a Client Component:
  - Manages `isSimilarCasesOpen` state.
  - Toggle button with ChevronRight/ChevronDown icons.
  - Content wrapper with `transition-all duration-200` and `w-80` / `w-0` width transition.
  - Reuses `SimilarCasesPanel` internally.
- All Server Actions, form field names, and data fetching logic preserved exactly.
- Build passes successfully.

### Key decisions
- The page remains an async Server Component; collapsible drawer extracted into a Client Component to avoid "use client" at the page level.
- `Button` component from this project uses `@base-ui/react/button` and does NOT support `asChild`. For anchor links styled as buttons, use `buttonVariants` + `cn()` on a plain `<a>` tag.
- `<details>`/`<summary>` used for collapsible customer context section since page is a Server Component and cannot hold client state.
- JSX section comments removed per codebase policy (anti-comment hook).

### Files changed
- `app/(app)/cases/[id]/page.tsx` — rewritten
- `app/(app)/cases/[id]/similar-cases-drawer.tsx` — created
