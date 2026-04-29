# UI Redesign: Swiss Precision

## TL;DR

> 将当前深色调 UI 重构为「精密仪器」极简风格：纯黑背景 + 银白强调色 + 左侧 slim sidebar + 卡片列表 + 双栏详情页 + 克制动效。

**Deliverables**:
- 更新后的 `globals.css`（Swiss Precision 配色系统）
- 新字体系统（Space Grotesk + Geist Sans）
- `AppSidebar` 组件（slim sidebar 替代顶部导航）
- 重构后的案例列表页（表格 → 卡片列表）
- 重构后的案例详情页（3列 → 双栏 + 可折叠面板）
- 全局过渡动画

**Estimated Effort**: Medium
**Parallel Execution**: YES - 5 waves
**Critical Path**: CSS → Sidebar → Layout → List → Detail → Animation → Verify

---

## Context

### Current State
- Next.js 16.2.4 + Tailwind v4 + shadcn/ui v4（Base UI）
- 深色主题已迁移到 CSS 变量
- 顶部导航栏（AppNav）+ 全宽内容区
- 案例列表：Table 组件（6 列）
- 案例详情：3 列 grid（客户上下文 | 方案确认 | 相似案例）
- Inter 字体

### Design Direction: Swiss Precision
- **Background**: `#050505` (oklch 0.08) — 纯黑
- **Surface**: `#0a0a0a` (oklch 0.1) — 卡片
- **Elevated**: `#111111` (oklch 0.18) — 强调
- **Border**: `rgba(255,255,255,0.06)` — 极细
- **Text Primary**: `#fafafa`
- **Text Secondary**: `#737373`
- **Accent**: `#e5e7eb` (银白) — 只用于 primary action
- **Fonts**: Space Grotesk (标题) + Geist Sans (正文)

---

## Work Objectives

### Core Objective
重构所有页面和组件为「精密仪器」极简美学，提升信息层次、减少视觉噪音、增强操作效率。

### Concrete Deliverables
1. `app/globals.css` — 更新为 Swiss Precision 配色
2. `app/layout.tsx` — 引入 Space Grotesk + Geist Sans
3. `components/app-sidebar.tsx` — 新建 slim sidebar 组件
4. `app/(app)/layout.tsx` — 移除顶部导航，改为 sidebar 布局
5. `app/(app)/cases/page.tsx` — 表格 → 卡片列表
6. `app/(app)/cases/[id]/page.tsx` — 3列 → 双栏 + 可折叠面板
7. `app/(app)/cases/new/page.tsx` — 适配新布局风格
8. `components/status-badge.tsx` — 更新为极简风格
9. `components/app-nav.tsx` — 删除（被 sidebar 替代）
10. 全局 CSS 过渡动画

### Definition of Done
- [ ] `npm run build` → PASS
- [ ] `npm test` → 65/65 PASS
- [ ] `npm run lint` → PASS
- [ ] Playwright 截图对比：视觉上符合 Swiss Precision 风格

### Must Have
- 左侧 slim sidebar（图标 + hover 展开文字）
- 案例列表为卡片形式（非表格）
- 详情页双栏布局
- 相似历史案例可折叠
- 全局过渡动画

### Must NOT Have
- 不引入新的依赖（除了字体）
- 不改变业务逻辑
- 不删除任何功能
- 不使用渐变色背景

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: YES (after)
- **Framework**: vitest

### QA Scenarios

**Task 6 (案例列表卡片化)**:
- 截图 `/cases` → 验证无表格，显示为卡片列表
- 验证 hover 时卡片有微抬效果
- 验证状态 badge 样式正确

**Task 7 (详情页双栏)**:
- 截图 `/cases/{id}` → 验证双栏布局
- 验证相似案例面板可折叠
- 验证左侧操作面板固定

**Task 9 (全局动画)**:
- 验证页面切换有淡入效果
- 验证卡片 hover 有 transition
- 验证 sidebar hover 展开平滑

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation):
├── Task 1: Update globals.css with Swiss Precision colors
├── Task 2: Update layout.tsx with Space Grotesk + Geist Sans
└── Task 3: Create AppSidebar component

Wave 2 (Layout + List):
├── Task 4: Refactor app/(app)/layout.tsx (sidebar layout)
└── Task 5: Refactor cases list page (table → cards)

Wave 3 (Detail + New):
├── Task 6: Refactor case detail page (3-col → 2-col)
└── Task 7: Refactor new case page (adapt style)

Wave 4 (Polish):
├── Task 8: Update status-badge.tsx style
├── Task 9: Add global CSS transitions & animations
└── Task 10: Delete app-nav.tsx (replaced by sidebar)

Wave FINAL (Verify):
├── Task F1: Build check
├── Task F2: Test check
├── Task F3: Lint check
└── Task F4: Screenshot visual verification
```

---

## TODOs

- [x] 1. Update globals.css with Swiss Precision color system

  **What to do**:
  - Update `:root` CSS variables to Swiss Precision values
  - Remove `.dark` block (same as `:root`, dark-only theme)
  - Update `@theme inline` if needed

  **Must NOT do**:
  - Do not change `@import` statements
  - Do not change `@layer base` structure

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 4-10

  **References**:
  - `app/globals.css` — current CSS variables
  - shadcn/ui v4 docs — `@theme inline` syntax

  **Acceptance Criteria**:
  - [ ] Background is oklch(0.08 0 0) (very dark, near black)
  - [ ] Card is oklch(0.1 0 0)
  - [ ] Border is oklch(1 0 0 / 6%)
  - [ ] Muted-foreground is oklch(0.45 0 0)
  - [ ] No `.dark` block (redundant)

  **Commit**: YES
  - Message: `style: apply Swiss Precision color system`

- [x] 2. Update layout.tsx with Space Grotesk + Geist Sans fonts

  **What to do**:
  - Install `geist` package or use next/font/google for Geist
  - Use `next/font/google` for Space Grotesk
  - Update `app/layout.tsx` to load both fonts
  - Set CSS variables `--font-heading` and `--font-sans`

  **Must NOT do**:
  - Do not change page structure
  - Do not modify `metadata`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1

  **Acceptance Criteria**:
  - [ ] Space Grotesk loaded for headings
  - [ ] Geist Sans loaded for body text
  - [ ] Font CSS variables set in globals.css

  **Commit**: YES
  - Message: `style: add Space Grotesk + Geist Sans fonts`

- [x] 3. Create AppSidebar component

  **What to do**:
  - Create `components/app-sidebar.tsx`
  - Slim sidebar: 48px width collapsed, 180px expanded on hover
  - Icons: LayoutGrid (案例列表), Plus (新建), Settings (设置)
  - Active state: white icon + left border indicator
  - Links to `/cases` and `/cases/new`
  - Use CSS transition for width/opacity

  **Must NOT do**:
  - Do not add dropdown menus
  - Do not add user avatar (not in scope)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1

  **Acceptance Criteria**:
  - [ ] Sidebar renders with icons
  - [ ] Hover expands to show labels
  - [ ] Active route highlighted
  - [ ] Smooth CSS transition

  **Commit**: YES
  - Message: `feat: add AppSidebar component`

- [x] 4. Refactor app/(app)/layout.tsx to use sidebar layout

  **What to do**:
  - Remove `<AppNav />` import and usage
  - Remove `<header>` with top navigation
  - Add `<AppSidebar />` on the left
  - Main content area takes remaining width
  - Keep radial gradient background (or simplify)

  **Must NOT do**:
  - Do not remove the `children` rendering
  - Do not change the `<main>` tag

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 3)
  - **Blocked By**: Task 3
  - **Parallel Group**: Wave 2

  **Acceptance Criteria**:
  - [ ] No top navigation bar
  - [ ] Sidebar visible on left
  - [ ] Content area beside sidebar
  - [ ] Responsive on desktop

  **Commit**: YES
  - Message: `refactor: replace top nav with sidebar layout`

- [x] 5. Refactor cases list page (table → card list)

  **What to do**:
  - Replace Table with card-based layout
  - Each case = one Card component
  - Card content: title (bold), customer, status badge, updated time
  - Hover: card lifts (translateY(-2px)) + border brightens
  - Click card → navigate to detail page
  - Filter tabs: 全部 / 草稿中 / 进行中 / 已完成
  - Remove "新建案例" button from header (moved to sidebar)

  **Must NOT do**:
  - Do not change data fetching logic
  - Do not change `listProposalCases()` call

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 4)
  - **Parallel Group**: Wave 2

  **Acceptance Criteria**:
  - [ ] No Table component used
  - [ ] Cards display case info
  - [ ] Click navigates to detail
  - [ ] Filter tabs work
  - [ ] Hover effect visible

  **Commit**: YES
  - Message: `refactor: cases list from table to card grid`

- [x] 6. Refactor case detail page (3-col → 2-col)

  **What to do**:
  - Left column (narrow, ~320px): Case summary + action buttons
    - Title (editable), customer, status, current round
    - Action buttons: 确认方案, 发送客户, 登记反馈
  - Right column (flex-1, scrollable):
    - Section: 客户上下文 (可折叠)
    - Section: 分析师方案确认
    - Section: PM 客户反馈操作
  - Similar cases panel: right-side collapsible drawer
    - Default collapsed, click to expand
    - Slide-in animation
  - Remove 3-column grid

  **Must NOT do**:
  - Do not change Server Actions
  - Do not change form submissions

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (complex page)
  - **Blocked By**: Task 4
  - **Parallel Group**: Wave 3

  **Acceptance Criteria**:
  - [ ] Two-column layout
  - [ ] Left panel sticky/fixed
  - [ ] Similar cases collapsible
  - [ ] All forms still work
  - [ ] All actions still functional

  **Commit**: YES
  - Message: `refactor: case detail to 2-col with collapsible panels`

- [x] 7. Refactor new case page

  **What to do**:
  - Adapt to new layout (sidebar instead of top nav)
  - Remove "返回工作台" button (sidebar handles navigation)
  - Simplify header (just title)
  - Update card styling to match new theme

  **Must NOT do**:
  - Do not change form fields
  - Do not change Server Action

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 6)
  - **Parallel Group**: Wave 3

  **Acceptance Criteria**:
  - [ ] No "返回工作台" button
  - [ ] Form still submits correctly
  - [ ] Styling matches new theme

  **Commit**: YES
  - Message: `refactor: adapt new case page to new layout`

- [x] 8. Update status-badge.tsx style

  **What to do**:
  - Simplify badge styling
  - Use minimal borders + subtle background
  - Keep status colors (emerald, rose, amber, etc.) but more muted
  - Remove ring and heavy borders

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4

  **Acceptance Criteria**:
  - [ ] Badges are minimal and clean
  - [ ] Status colors still distinguishable

  **Commit**: NO (groups with Task 9)

- [x] 9. Add global CSS transitions & animations

  **What to do**:
  - Card hover: `transition-all duration-200 ease-out`
  - Page content: fade-in on mount
  - Sidebar: width/opacity transition
  - Button hover: subtle scale or color shift
  - Collapsible panel: height/opacity transition

  **Must NOT do**:
  - No heavy animations (no bounce, no spring)
  - Keep transitions under 300ms

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4

  **Acceptance Criteria**:
  - [ ] Card hover has micro-lift
  - [ ] Sidebar expands smoothly
  - [ ] Panel collapse/expand smooth
  - [ ] No jarring transitions

  **Commit**: YES
  - Message: `style: add subtle CSS transitions and animations`

- [x] 10. Delete app-nav.tsx

  **What to do**:
  - Remove `components/app-nav.tsx`
  - Remove any imports of AppNav

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4

  **Commit**: NO (groups with Task 9)

---

## Final Verification Wave

- [x] F1. **Build check** — `npm run build` → PASS
- [x] F2. **Test check** — `npm test` → 65/65 PASS
- [x] F3. **Lint check** — `npm run lint` → PASS
- [x] F4. **Visual verification** — Screenshot `/cases` and `/cases/{id}`, verify Swiss Precision aesthetic

---

## Commit Strategy

- Wave 1: `style: Swiss Precision color system + fonts + sidebar`
- Wave 2: `refactor: sidebar layout + card list`
- Wave 3: `refactor: case detail 2-col + new case adapt`
- Wave 4: `style: minimal badges + transitions`
- Final: `chore: verify build, tests, lint`

---

## Success Criteria

### Verification Commands
```bash
npm run build     # Expected: success
npm test          # Expected: 65 passed
npm run lint      # Expected: no errors
```

### Visual Checklist
- [ ] Pure black background (#050505 feel)
- [ ] Slim sidebar with icon hover expansion
- [ ] Case list as cards (not table)
- [ ] Case detail as 2-column layout
- [ ] Similar cases in collapsible drawer
- [ ] Subtle hover animations
- [ ] Clean typography (Space Grotesk + Geist Sans)
