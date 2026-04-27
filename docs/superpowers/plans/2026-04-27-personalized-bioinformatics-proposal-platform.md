# Personalized Bioinformatics Proposal Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the MVP internal proposal workspace described in `docs/superpowers/specs/2026-04-27-personalized-bioinformatics-proposal-platform-design.md`.

**Architecture:** Use a single Next.js App Router application with server actions for workflow mutations, Prisma for PostgreSQL persistence, shadcn/ui for internal workflow screens, and a server-side AI service boundary. Keep domain workflow logic in testable modules outside React components.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL, Auth.js-compatible role model, Vitest, AI provider abstraction.

---

## File Structure

Create these areas:

- `app/`: Next.js routes and layouts.
- `app/(app)/cases/`: PM workspace, new case page, case detail page, customer feedback page.
- `components/`: reusable shadcn-based UI components for status badges, proposal editor, similar cases, and revision timeline.
- `lib/domain/`: framework-independent workflow types and status transition logic.
- `lib/db/`: Prisma client and database query helpers.
- `lib/ai/`: AI provider abstraction, prompt builders, and generation service.
- `lib/search/`: historical case search service.
- `prisma/schema.prisma`: database schema.
- `tests/`: unit tests for workflow, AI prompt building, search query shaping, and route/service behavior.

The implementation should keep React pages thin. Pages call server actions; server actions call domain services; domain services call database, search, and AI services.

## Task 1: Scaffold The Next.js Application

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `components.json`

- [ ] **Step 1: Create the Next.js project files**

Run:

```bash
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir false --import-alias "@/*"
```

Expected: Next.js files are created in the current project root.

- [ ] **Step 2: Add shadcn/ui**

Run:

```bash
npx shadcn@latest init
```

Recommended selections:

```text
Style: New York
Base color: Slate
CSS variables: yes
```

Expected: `components.json`, `lib/utils.ts`, and shadcn-compatible Tailwind setup exist.

- [ ] **Step 3: Add required shadcn components**

Run:

```bash
npx shadcn@latest add button card badge table tabs textarea input label dialog dropdown-menu toast separator scroll-area skeleton
```

Expected: component files exist under `components/ui/`.

- [ ] **Step 4: Add app dependencies**

Run:

```bash
npm install @prisma/client prisma zod next-auth
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

Expected: dependencies are recorded in `package.json`.

- [ ] **Step 5: Add test scripts**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 6: Commit**

Run:

```bash
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs tailwind.config.ts app components lib components.json
git commit -m "chore: scaffold nextjs proposal platform"
```

Expected: if the directory is not a git repository, skip the commit and record that in the final implementation notes.

## Task 2: Define Domain Types And Status Transitions

**Files:**
- Create: `lib/domain/proposal-status.ts`
- Create: `lib/domain/proposal-types.ts`
- Create: `tests/domain/proposal-status.test.ts`

- [ ] **Step 1: Write failing status transition tests**

Create `tests/domain/proposal-status.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  assertTransitionAllowed,
  getNextActionsForRole,
  type ProposalStatus,
  type UserRole,
} from "@/lib/domain/proposal-status";

describe("proposal status transitions", () => {
  it("allows the first proposal round to move from drafting to analyst review", () => {
    expect(() =>
      assertTransitionAllowed("drafting", "analyst_review", "system"),
    ).not.toThrow();
  });

  it("allows analyst confirmation to move a case to ready to send", () => {
    expect(() =>
      assertTransitionAllowed("analyst_review", "ready_to_send", "analyst"),
    ).not.toThrow();
  });

  it("allows PM to mark sent proposal as waiting for customer feedback", () => {
    expect(() =>
      assertTransitionAllowed("ready_to_send", "waiting_customer_feedback", "pm"),
    ).not.toThrow();
  });

  it("allows customer requested changes to create a revision_needed state", () => {
    expect(() =>
      assertTransitionAllowed("waiting_customer_feedback", "revision_needed", "pm"),
    ).not.toThrow();
  });

  it("blocks analysts from marking a case accepted", () => {
    expect(() =>
      assertTransitionAllowed("waiting_customer_feedback", "accepted", "analyst"),
    ).toThrow("Transition waiting_customer_feedback -> accepted is not allowed for analyst");
  });

  it("returns PM next actions for waiting customer feedback", () => {
    expect(getNextActionsForRole("waiting_customer_feedback", "pm")).toEqual([
      "enter_customer_feedback",
      "mark_customer_accepted",
      "mark_customer_canceled",
    ]);
  });

  it("returns analyst next actions for analyst review", () => {
    expect(getNextActionsForRole("analyst_review", "analyst")).toEqual([
      "confirm_current_proposal",
      "request_customer_clarification",
      "save_draft_edits",
    ]);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm test -- tests/domain/proposal-status.test.ts
```

Expected: FAIL because `@/lib/domain/proposal-status` does not exist.

- [ ] **Step 3: Implement proposal statuses**

Create `lib/domain/proposal-status.ts`:

```ts
export const proposalStatuses = [
  "drafting",
  "analyst_review",
  "ready_to_send",
  "waiting_customer_feedback",
  "revision_needed",
  "accepted",
  "canceled",
] as const;

export type ProposalStatus = (typeof proposalStatuses)[number];

export const userRoles = ["pm", "analyst", "admin", "system"] as const;

export type UserRole = (typeof userRoles)[number];

type Transition = {
  from: ProposalStatus;
  to: ProposalStatus;
  roles: UserRole[];
};

const transitions: Transition[] = [
  { from: "drafting", to: "analyst_review", roles: ["system", "pm"] },
  { from: "analyst_review", to: "ready_to_send", roles: ["analyst"] },
  { from: "analyst_review", to: "revision_needed", roles: ["analyst"] },
  { from: "ready_to_send", to: "waiting_customer_feedback", roles: ["pm"] },
  { from: "waiting_customer_feedback", to: "revision_needed", roles: ["pm"] },
  { from: "waiting_customer_feedback", to: "accepted", roles: ["pm"] },
  { from: "waiting_customer_feedback", to: "canceled", roles: ["pm"] },
  { from: "revision_needed", to: "drafting", roles: ["system", "pm"] },
  { from: "revision_needed", to: "analyst_review", roles: ["system"] },
];

export function assertTransitionAllowed(
  from: ProposalStatus,
  to: ProposalStatus,
  role: UserRole,
) {
  const allowed = transitions.some(
    (transition) =>
      transition.from === from &&
      transition.to === to &&
      transition.roles.includes(role),
  );

  if (!allowed) {
    throw new Error(`Transition ${from} -> ${to} is not allowed for ${role}`);
  }
}

export function getNextActionsForRole(status: ProposalStatus, role: UserRole) {
  if (role === "pm") {
    if (status === "drafting") return ["generate_initial_draft"];
    if (status === "ready_to_send") return ["copy_confirmed_proposal", "mark_sent_to_customer"];
    if (status === "waiting_customer_feedback") {
      return [
        "enter_customer_feedback",
        "mark_customer_accepted",
        "mark_customer_canceled",
      ];
    }
  }

  if (role === "analyst") {
    if (status === "analyst_review") {
      return [
        "confirm_current_proposal",
        "request_customer_clarification",
        "save_draft_edits",
      ];
    }
  }

  return [];
}
```

Create `lib/domain/proposal-types.ts`:

```ts
import type { ProposalStatus, UserRole } from "./proposal-status";

export type ProposalCaseSummary = {
  id: string;
  title: string;
  customerName: string;
  requirementSummary: string | null;
  status: ProposalStatus;
  pmUserId: string;
  analystUserId: string | null;
  currentRevisionNumber: number;
  updatedAt: Date;
};

export type RevisionDraft = {
  revisionNumber: number;
  customerFeedbackText: string | null;
  aiDraft: string;
  analystConfirmedText: string | null;
  revisionNotes: string | null;
};

export type AuthenticatedUser = {
  id: string;
  name: string;
  role: Exclude<UserRole, "system">;
};
```

- [ ] **Step 4: Run the test**

Run:

```bash
npm test -- tests/domain/proposal-status.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add lib/domain tests/domain
git commit -m "feat: define proposal workflow states"
```

## Task 3: Add Prisma Schema And Database Client

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/db/prisma.ts`
- Create: `.env.example`

- [ ] **Step 1: Initialize Prisma**

Run:

```bash
npx prisma init
```

Expected: `prisma/schema.prisma` and `.env` exist.

- [ ] **Step 2: Replace Prisma schema**

Write `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  PM
  ANALYST
  ADMIN
}

enum ProposalStatus {
  DRAFTING
  ANALYST_REVIEW
  READY_TO_SEND
  WAITING_CUSTOMER_FEEDBACK
  REVISION_NEEDED
  ACCEPTED
  CANCELED
}

enum FinalOutcome {
  ACCEPTED
  CANCELED
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  role      UserRole
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  pmCases      ProposalCase[] @relation("PmCases")
  analystCases ProposalCase[] @relation("AnalystCases")
  auditLogs    AuditLog[]
}

model ProposalCase {
  id                    String         @id @default(cuid())
  title                 String
  customerName          String
  originalRequestText   String
  requirementSummary    String?
  missingInformation    String?
  status                ProposalStatus @default(DRAFTING)
  currentRevisionNumber Int            @default(1)
  finalOutcome          FinalOutcome?
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  pmUserId      String
  pmUser        User    @relation("PmCases", fields: [pmUserId], references: [id])
  analystUserId String?
  analystUser   User?   @relation("AnalystCases", fields: [analystUserId], references: [id])

  revisions Revision[]
  auditLogs AuditLog[]

  @@index([status])
  @@index([pmUserId])
  @@index([analystUserId])
  @@index([updatedAt])
}

model Revision {
  id                    String   @id @default(cuid())
  proposalCaseId        String
  revisionNumber        Int
  customerFeedbackText  String?
  aiDraft               String
  analystConfirmedText  String?
  revisionNotes         String?
  sentToCustomerAt      DateTime?
  confirmedByAnalystAt  DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  proposalCase ProposalCase @relation(fields: [proposalCaseId], references: [id], onDelete: Cascade)
  auditLogs    AuditLog[]

  @@unique([proposalCaseId, revisionNumber])
  @@index([proposalCaseId])
}

model AuditLog {
  id             String          @id @default(cuid())
  proposalCaseId String
  revisionId     String?
  actorUserId    String
  action         String
  beforeStatus   ProposalStatus?
  afterStatus    ProposalStatus?
  metadata       Json?
  createdAt      DateTime        @default(now())

  proposalCase ProposalCase @relation(fields: [proposalCaseId], references: [id], onDelete: Cascade)
  revision     Revision?    @relation(fields: [revisionId], references: [id])
  actor        User         @relation(fields: [actorUserId], references: [id])

  @@index([proposalCaseId])
  @@index([actorUserId])
  @@index([createdAt])
}
```

- [ ] **Step 3: Add environment example**

Create `.env.example`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/persona_seq"
NEXTAUTH_SECRET="replace-with-a-local-secret"
NEXTAUTH_URL="http://localhost:3000"
AI_PROVIDER="mock"
AI_API_KEY=""
```

- [ ] **Step 4: Add Prisma singleton**

Create `lib/db/prisma.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 5: Validate schema**

Run:

```bash
npx prisma validate
```

Expected: schema validates successfully.

- [ ] **Step 6: Commit**

Run:

```bash
git add prisma lib/db .env.example
git commit -m "feat: add proposal database schema"
```

## Task 4: Implement AI Prompt Builders And Mock Provider

**Files:**
- Create: `lib/ai/types.ts`
- Create: `lib/ai/prompts.ts`
- Create: `lib/ai/mock-provider.ts`
- Create: `lib/ai/generate-proposal.ts`
- Create: `tests/ai/prompts.test.ts`

- [ ] **Step 1: Write prompt builder tests**

Create `tests/ai/prompts.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildInitialProposalPrompt, buildRevisionProposalPrompt } from "@/lib/ai/prompts";

describe("AI proposal prompts", () => {
  it("builds an initial prompt from original customer text", () => {
    const prompt = buildInitialProposalPrompt({
      originalRequestText: "客户想做水稻转录组差异分析，并关注抗逆相关基因。",
    });

    expect(prompt).toContain("客户原始需求");
    expect(prompt).toContain("水稻转录组差异分析");
    expect(prompt).toContain("需求摘要");
    expect(prompt).toContain("需要客户补充确认的问题");
  });

  it("builds a revision prompt using previous confirmed proposal and feedback", () => {
    const prompt = buildRevisionProposalPrompt({
      originalRequestText: "客户想做水稻转录组差异分析。",
      previousConfirmedProposal: "上一版建议包含差异分析和 GO/KEGG 富集。",
      customerFeedbackText: "客户希望增加 WGCNA 分析。",
    });

    expect(prompt).toContain("上一版已确认方案");
    expect(prompt).toContain("客户最新反馈");
    expect(prompt).toContain("WGCNA");
    expect(prompt).toContain("修订说明");
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm test -- tests/ai/prompts.test.ts
```

Expected: FAIL because prompt files do not exist.

- [ ] **Step 3: Implement AI types**

Create `lib/ai/types.ts`:

```ts
export type InitialProposalInput = {
  originalRequestText: string;
};

export type RevisionProposalInput = {
  originalRequestText: string;
  previousConfirmedProposal: string;
  customerFeedbackText: string;
};

export type ProposalDraftResult = {
  requirementSummary: string;
  missingInformation: string;
  proposalDraft: string;
  revisionNotes?: string;
};

export interface ProposalAiProvider {
  generateText(prompt: string): Promise<string>;
}
```

- [ ] **Step 4: Implement prompt builders**

Create `lib/ai/prompts.ts`:

```ts
import type { InitialProposalInput, RevisionProposalInput } from "./types";

const proposalStructure = [
  "1. 客户需求理解",
  "2. 分析目标",
  "3. 样本与数据要求",
  "4. 推荐分析流程",
  "5. 交付结果与图表",
  "6. 周期、注意事项与风险提示",
  "7. 需要客户补充确认的问题",
].join("\n");

export function buildInitialProposalPrompt(input: InitialProposalInput) {
  return [
    "你是资深生物信息分析方案顾问。请把客户的原始需求整理成专业、清晰、可交付的分析方案草稿。",
    "",
    "客户原始需求:",
    input.originalRequestText,
    "",
    "请输出以下三部分:",
    "A. 需求摘要",
    "B. 缺失信息清单",
    "C. 方案草稿，结构如下:",
    proposalStructure,
    "",
    "要求: 不要编造客户没有提供的样本数量、物种、测序类型或交付周期；不确定的信息放入需要客户补充确认的问题。",
  ].join("\n");
}

export function buildRevisionProposalPrompt(input: RevisionProposalInput) {
  return [
    "你是资深生物信息分析方案顾问。请基于客户反馈修订上一版方案。",
    "",
    "客户原始需求:",
    input.originalRequestText,
    "",
    "上一版已确认方案:",
    input.previousConfirmedProposal,
    "",
    "客户最新反馈:",
    input.customerFeedbackText,
    "",
    "请输出以下三部分:",
    "A. 修订说明，逐条说明如何回应客户反馈",
    "B. 修订后方案草稿",
    "C. 仍需客户确认的问题或风险",
    "",
    "要求: 保留上一版仍然有效的内容；明确回应客户反馈；不要让 AI 草稿看起来像已经经过人工最终确认。",
  ].join("\n");
}
```

- [ ] **Step 5: Implement mock provider and generation service**

Create `lib/ai/mock-provider.ts`:

```ts
import type { ProposalAiProvider } from "./types";

export class MockProposalAiProvider implements ProposalAiProvider {
  async generateText(prompt: string) {
    return [
      "A. 需求摘要",
      "根据客户原始描述，客户需要围绕生物信息数据开展个性化分析方案设计。",
      "",
      "B. 缺失信息清单",
      "- 样本类型、样本数量、物种、数据类型、期望交付物需要进一步确认。",
      "",
      "C. 方案草稿",
      "1. 客户需求理解",
      "本方案根据客户提供的信息形成初步分析路线。",
      "2. 分析目标",
      "明确关键生物学问题并设计对应分析模块。",
      "3. 样本与数据要求",
      "请客户补充样本与数据细节。",
      "4. 推荐分析流程",
      "根据确认后的数据类型设计分析流程。",
      "5. 交付结果与图表",
      "交付分析报告、结果表格和核心图表。",
      "6. 周期、注意事项与风险提示",
      "周期需在样本和分析模块确认后评估。",
      "7. 需要客户补充确认的问题",
      "请确认样本、数据和重点分析目标。",
      "",
      `--- prompt length: ${prompt.length}`,
    ].join("\n");
  }
}
```

Create `lib/ai/generate-proposal.ts`:

```ts
import { buildInitialProposalPrompt, buildRevisionProposalPrompt } from "./prompts";
import type {
  InitialProposalInput,
  ProposalAiProvider,
  ProposalDraftResult,
  RevisionProposalInput,
} from "./types";

export async function generateInitialProposalDraft(
  provider: ProposalAiProvider,
  input: InitialProposalInput,
): Promise<ProposalDraftResult> {
  const text = await provider.generateText(buildInitialProposalPrompt(input));

  return {
    requirementSummary: extractSection(text, "A.") || "AI 已生成需求摘要，请分析人员确认。",
    missingInformation: extractSection(text, "B.") || "AI 未识别出缺失信息。",
    proposalDraft: extractSection(text, "C.") || text,
  };
}

export async function generateRevisionProposalDraft(
  provider: ProposalAiProvider,
  input: RevisionProposalInput,
): Promise<ProposalDraftResult> {
  const text = await provider.generateText(buildRevisionProposalPrompt(input));

  return {
    requirementSummary: "修订轮次沿用原始需求摘要。",
    missingInformation: extractSection(text, "C.") || "AI 未识别出新的待确认问题。",
    proposalDraft: extractSection(text, "B.") || text,
    revisionNotes: extractSection(text, "A.") || "AI 已根据客户反馈生成修订草稿。",
  };
}

function extractSection(text: string, marker: string) {
  const index = text.indexOf(marker);
  if (index === -1) return null;
  const next = ["A.", "B.", "C."]
    .filter((candidate) => candidate !== marker)
    .map((candidate) => text.indexOf(candidate, index + marker.length))
    .filter((candidateIndex) => candidateIndex > index)
    .sort((a, b) => a - b)[0];

  return text.slice(index, next ?? undefined).trim();
}
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm test -- tests/ai/prompts.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add lib/ai tests/ai
git commit -m "feat: add proposal ai draft service"
```

## Task 5: Implement Proposal Workflow Service

**Files:**
- Create: `lib/domain/proposal-workflow.ts`
- Create: `tests/domain/proposal-workflow.test.ts`

- [ ] **Step 1: Write workflow tests**

Create `tests/domain/proposal-workflow.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createInitialRevision,
  createRevisionFromCustomerFeedback,
  markRevisionConfirmed,
  markRevisionSent,
} from "@/lib/domain/proposal-workflow";

describe("proposal workflow helpers", () => {
  it("creates the first revision with revision number 1", () => {
    expect(
      createInitialRevision({
        aiDraft: "首轮 AI 草稿",
      }),
    ).toEqual({
      revisionNumber: 1,
      customerFeedbackText: null,
      aiDraft: "首轮 AI 草稿",
      analystConfirmedText: null,
      revisionNotes: null,
    });
  });

  it("creates a customer feedback revision using the next revision number", () => {
    expect(
      createRevisionFromCustomerFeedback({
        currentRevisionNumber: 2,
        customerFeedbackText: "客户希望增加 WGCNA。",
        aiDraft: "修订草稿",
        revisionNotes: "增加 WGCNA 模块。",
      }),
    ).toMatchObject({
      revisionNumber: 3,
      customerFeedbackText: "客户希望增加 WGCNA。",
      aiDraft: "修订草稿",
      revisionNotes: "增加 WGCNA 模块。",
    });
  });

  it("confirms a revision with analyst text", () => {
    expect(
      markRevisionConfirmed({
        aiDraft: "AI 草稿",
        analystConfirmedText: "分析人员确认版",
      }).analystConfirmedText,
    ).toBe("分析人员确认版");
  });

  it("rejects empty analyst confirmed text", () => {
    expect(() =>
      markRevisionConfirmed({
        aiDraft: "AI 草稿",
        analystConfirmedText: " ",
      }),
    ).toThrow("Analyst confirmed text is required");
  });

  it("sets sent timestamp when PM sends a confirmed proposal", () => {
    const sent = markRevisionSent({
      analystConfirmedText: "确认方案",
      sentAt: new Date("2026-04-27T00:00:00.000Z"),
    });

    expect(sent.sentToCustomerAt?.toISOString()).toBe("2026-04-27T00:00:00.000Z");
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm test -- tests/domain/proposal-workflow.test.ts
```

Expected: FAIL because workflow service does not exist.

- [ ] **Step 3: Implement workflow helpers**

Create `lib/domain/proposal-workflow.ts`:

```ts
type RevisionState = {
  revisionNumber?: number;
  customerFeedbackText?: string | null;
  aiDraft?: string;
  analystConfirmedText?: string | null;
  revisionNotes?: string | null;
  sentToCustomerAt?: Date | null;
};

export function createInitialRevision(input: { aiDraft: string }) {
  return {
    revisionNumber: 1,
    customerFeedbackText: null,
    aiDraft: input.aiDraft,
    analystConfirmedText: null,
    revisionNotes: null,
  };
}

export function createRevisionFromCustomerFeedback(input: {
  currentRevisionNumber: number;
  customerFeedbackText: string;
  aiDraft: string;
  revisionNotes: string | null;
}) {
  if (!input.customerFeedbackText.trim()) {
    throw new Error("Customer feedback text is required");
  }

  return {
    revisionNumber: input.currentRevisionNumber + 1,
    customerFeedbackText: input.customerFeedbackText,
    aiDraft: input.aiDraft,
    analystConfirmedText: null,
    revisionNotes: input.revisionNotes,
  };
}

export function markRevisionConfirmed(input: RevisionState & { analystConfirmedText: string }) {
  if (!input.analystConfirmedText.trim()) {
    throw new Error("Analyst confirmed text is required");
  }

  return {
    ...input,
    analystConfirmedText: input.analystConfirmedText,
    confirmedByAnalystAt: new Date(),
  };
}

export function markRevisionSent(input: RevisionState & { sentAt?: Date }) {
  if (!input.analystConfirmedText?.trim()) {
    throw new Error("Cannot send a revision before analyst confirmation");
  }

  return {
    ...input,
    sentToCustomerAt: input.sentAt ?? new Date(),
  };
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- tests/domain/proposal-workflow.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add lib/domain/proposal-workflow.ts tests/domain/proposal-workflow.test.ts
git commit -m "feat: add proposal revision workflow helpers"
```

## Task 6: Implement Database Query Services

**Files:**
- Create: `lib/db/proposal-repository.ts`
- Create: `lib/db/proposal-mappers.ts`

- [ ] **Step 1: Create Prisma-to-domain mappers**

Create `lib/db/proposal-mappers.ts`:

```ts
import type { ProposalCase, ProposalStatus as PrismaProposalStatus } from "@prisma/client";
import type { ProposalCaseSummary } from "@/lib/domain/proposal-types";
import type { ProposalStatus } from "@/lib/domain/proposal-status";

const statusMap: Record<PrismaProposalStatus, ProposalStatus> = {
  DRAFTING: "drafting",
  ANALYST_REVIEW: "analyst_review",
  READY_TO_SEND: "ready_to_send",
  WAITING_CUSTOMER_FEEDBACK: "waiting_customer_feedback",
  REVISION_NEEDED: "revision_needed",
  ACCEPTED: "accepted",
  CANCELED: "canceled",
};

export function mapProposalCaseSummary(caseRecord: ProposalCase): ProposalCaseSummary {
  return {
    id: caseRecord.id,
    title: caseRecord.title,
    customerName: caseRecord.customerName,
    requirementSummary: caseRecord.requirementSummary,
    status: statusMap[caseRecord.status],
    pmUserId: caseRecord.pmUserId,
    analystUserId: caseRecord.analystUserId,
    currentRevisionNumber: caseRecord.currentRevisionNumber,
    updatedAt: caseRecord.updatedAt,
  };
}
```

- [ ] **Step 2: Create proposal repository**

Create `lib/db/proposal-repository.ts`:

```ts
import { FinalOutcome, ProposalStatus } from "@prisma/client";
import { prisma } from "./prisma";

export async function listProposalCases() {
  return prisma.proposalCase.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      pmUser: true,
      analystUser: true,
    },
  });
}

export async function getProposalCaseDetail(id: string) {
  return prisma.proposalCase.findUnique({
    where: { id },
    include: {
      pmUser: true,
      analystUser: true,
      revisions: {
        orderBy: { revisionNumber: "asc" },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function createProposalCase(input: {
  title: string;
  customerName: string;
  originalRequestText: string;
  pmUserId: string;
  analystUserId?: string | null;
}) {
  return prisma.proposalCase.create({
    data: {
      title: input.title,
      customerName: input.customerName,
      originalRequestText: input.originalRequestText,
      pmUserId: input.pmUserId,
      analystUserId: input.analystUserId,
      status: ProposalStatus.DRAFTING,
    },
  });
}

export async function updateCaseAfterInitialGeneration(input: {
  proposalCaseId: string;
  requirementSummary: string;
  missingInformation: string;
  aiDraft: string;
}) {
  return prisma.proposalCase.update({
    where: { id: input.proposalCaseId },
    data: {
      requirementSummary: input.requirementSummary,
      missingInformation: input.missingInformation,
      status: ProposalStatus.ANALYST_REVIEW,
      revisions: {
        create: {
          revisionNumber: 1,
          aiDraft: input.aiDraft,
        },
      },
    },
  });
}

export async function confirmRevision(input: {
  proposalCaseId: string;
  revisionId: string;
  analystConfirmedText: string;
}) {
  return prisma.$transaction([
    prisma.revision.update({
      where: { id: input.revisionId },
      data: {
        analystConfirmedText: input.analystConfirmedText,
        confirmedByAnalystAt: new Date(),
      },
    }),
    prisma.proposalCase.update({
      where: { id: input.proposalCaseId },
      data: { status: ProposalStatus.READY_TO_SEND },
    }),
  ]);
}

export async function markSentToCustomer(input: {
  proposalCaseId: string;
  revisionId: string;
}) {
  return prisma.$transaction([
    prisma.revision.update({
      where: { id: input.revisionId },
      data: { sentToCustomerAt: new Date() },
    }),
    prisma.proposalCase.update({
      where: { id: input.proposalCaseId },
      data: { status: ProposalStatus.WAITING_CUSTOMER_FEEDBACK },
    }),
  ]);
}

export async function markCustomerAccepted(proposalCaseId: string) {
  return prisma.proposalCase.update({
    where: { id: proposalCaseId },
    data: {
      status: ProposalStatus.ACCEPTED,
      finalOutcome: FinalOutcome.ACCEPTED,
    },
  });
}

export async function markCustomerCanceled(proposalCaseId: string) {
  return prisma.proposalCase.update({
    where: { id: proposalCaseId },
    data: {
      status: ProposalStatus.CANCELED,
      finalOutcome: FinalOutcome.CANCELED,
    },
  });
}
```

- [ ] **Step 3: Typecheck**

Run:

```bash
npm run build
```

Expected: build succeeds after Prisma client generation. If Prisma client is missing, run `npx prisma generate` and retry.

- [ ] **Step 4: Commit**

Run:

```bash
git add lib/db
git commit -m "feat: add proposal repository"
```

## Task 7: Implement Historical Case Search

**Files:**
- Create: `lib/search/similar-cases.ts`
- Create: `tests/search/similar-cases.test.ts`

- [ ] **Step 1: Write search query tests**

Create `tests/search/similar-cases.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildSimilarCaseSearchText } from "@/lib/search/similar-cases";

describe("similar case search", () => {
  it("combines original request and requirement summary for search", () => {
    expect(
      buildSimilarCaseSearchText({
        originalRequestText: "客户想做水稻转录组分析",
        requirementSummary: "关注差异基因和富集分析",
      }),
    ).toBe("客户想做水稻转录组分析\n关注差异基因和富集分析");
  });

  it("ignores empty summary", () => {
    expect(
      buildSimilarCaseSearchText({
        originalRequestText: "肿瘤样本突变注释",
        requirementSummary: null,
      }),
    ).toBe("肿瘤样本突变注释");
  });
});
```

- [ ] **Step 2: Implement search helpers**

Create `lib/search/similar-cases.ts`:

```ts
import { ProposalStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export function buildSimilarCaseSearchText(input: {
  originalRequestText: string;
  requirementSummary: string | null;
}) {
  return [input.originalRequestText, input.requirementSummary]
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n");
}

export async function findSimilarAcceptedCases(input: {
  originalRequestText: string;
  requirementSummary: string | null;
  limit?: number;
}) {
  const query = buildSimilarCaseSearchText(input);
  const terms = query
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (terms.length === 0) return [];

  return prisma.proposalCase.findMany({
    where: {
      status: ProposalStatus.ACCEPTED,
      OR: terms.flatMap((term) => [
        { requirementSummary: { contains: term, mode: "insensitive" as const } },
        { originalRequestText: { contains: term, mode: "insensitive" as const } },
        {
          revisions: {
            some: {
              analystConfirmedText: { contains: term, mode: "insensitive" as const },
            },
          },
        },
      ]),
    },
    include: {
      revisions: {
        orderBy: { revisionNumber: "desc" },
        take: 1,
      },
    },
    take: input.limit ?? 5,
    orderBy: { updatedAt: "desc" },
  });
}
```

- [ ] **Step 3: Run tests**

Run:

```bash
npm test -- tests/search/similar-cases.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```bash
git add lib/search tests/search
git commit -m "feat: add similar proposal search"
```

## Task 8: Add Server Actions For Proposal Workflow

**Files:**
- Create: `app/(app)/cases/actions.ts`

- [ ] **Step 1: Implement server actions**

Create `app/(app)/cases/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateInitialProposalDraft, generateRevisionProposalDraft } from "@/lib/ai/generate-proposal";
import { MockProposalAiProvider } from "@/lib/ai/mock-provider";
import {
  confirmRevision,
  createProposalCase,
  markCustomerAccepted,
  markCustomerCanceled,
  markSentToCustomer,
  updateCaseAfterInitialGeneration,
} from "@/lib/db/proposal-repository";
import { prisma } from "@/lib/db/prisma";

const createCaseSchema = z.object({
  title: z.string().min(1),
  customerName: z.string().min(1),
  originalRequestText: z.string().min(1),
  pmUserId: z.string().min(1),
  analystUserId: z.string().optional(),
});

export async function createCaseAndGenerateDraft(formData: FormData) {
  const input = createCaseSchema.parse({
    title: formData.get("title"),
    customerName: formData.get("customerName"),
    originalRequestText: formData.get("originalRequestText"),
    pmUserId: formData.get("pmUserId"),
    analystUserId: formData.get("analystUserId") || undefined,
  });

  const proposalCase = await createProposalCase(input);
  const provider = new MockProposalAiProvider();
  const draft = await generateInitialProposalDraft(provider, {
    originalRequestText: input.originalRequestText,
  });

  await updateCaseAfterInitialGeneration({
    proposalCaseId: proposalCase.id,
    requirementSummary: draft.requirementSummary,
    missingInformation: draft.missingInformation,
    aiDraft: draft.proposalDraft,
  });

  revalidatePath("/cases");
}

export async function confirmCurrentRevision(formData: FormData) {
  const proposalCaseId = String(formData.get("proposalCaseId"));
  const revisionId = String(formData.get("revisionId"));
  const analystConfirmedText = String(formData.get("analystConfirmedText"));

  await confirmRevision({
    proposalCaseId,
    revisionId,
    analystConfirmedText,
  });

  revalidatePath(`/cases/${proposalCaseId}`);
}

export async function sendCurrentRevision(formData: FormData) {
  const proposalCaseId = String(formData.get("proposalCaseId"));
  const revisionId = String(formData.get("revisionId"));

  await markSentToCustomer({ proposalCaseId, revisionId });
  revalidatePath(`/cases/${proposalCaseId}`);
}

export async function markAcceptedAction(formData: FormData) {
  const proposalCaseId = String(formData.get("proposalCaseId"));
  await markCustomerAccepted(proposalCaseId);
  revalidatePath(`/cases/${proposalCaseId}`);
}

export async function markCanceledAction(formData: FormData) {
  const proposalCaseId = String(formData.get("proposalCaseId"));
  await markCustomerCanceled(proposalCaseId);
  revalidatePath(`/cases/${proposalCaseId}`);
}

export async function createRevisionFromFeedback(formData: FormData) {
  const proposalCaseId = String(formData.get("proposalCaseId"));
  const customerFeedbackText = String(formData.get("customerFeedbackText"));

  const proposalCase = await prisma.proposalCase.findUniqueOrThrow({
    where: { id: proposalCaseId },
    include: {
      revisions: {
        orderBy: { revisionNumber: "desc" },
        take: 1,
      },
    },
  });

  const previousRevision = proposalCase.revisions[0];
  if (!previousRevision?.analystConfirmedText) {
    throw new Error("Previous analyst-confirmed proposal is required before revision");
  }

  const provider = new MockProposalAiProvider();
  const draft = await generateRevisionProposalDraft(provider, {
    originalRequestText: proposalCase.originalRequestText,
    previousConfirmedProposal: previousRevision.analystConfirmedText,
    customerFeedbackText,
  });

  await prisma.proposalCase.update({
    where: { id: proposalCaseId },
    data: {
      status: "ANALYST_REVIEW",
      currentRevisionNumber: proposalCase.currentRevisionNumber + 1,
      revisions: {
        create: {
          revisionNumber: proposalCase.currentRevisionNumber + 1,
          customerFeedbackText,
          aiDraft: draft.proposalDraft,
          revisionNotes: draft.revisionNotes,
        },
      },
    },
  });

  revalidatePath(`/cases/${proposalCaseId}`);
}
```

- [ ] **Step 2: Typecheck**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

Run:

```bash
git add "app/(app)/cases/actions.ts"
git commit -m "feat: add proposal workflow actions"
```

## Task 9: Build PM Workspace And Case Creation UI

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/cases/page.tsx`
- Create: `app/(app)/cases/new/page.tsx`
- Create: `components/status-badge.tsx`

- [ ] **Step 1: Create status badge**

Create `components/status-badge.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";

const labels: Record<string, string> = {
  DRAFTING: "草稿中",
  ANALYST_REVIEW: "待分析确认",
  READY_TO_SEND: "待发送客户",
  WAITING_CUSTOMER_FEEDBACK: "等待客户反馈",
  REVISION_NEEDED: "需修订",
  ACCEPTED: "客户已同意",
  CANCELED: "客户已取消",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant="secondary">{labels[status] ?? status}</Badge>;
}
```

- [ ] **Step 2: Create app layout**

Create `app/(app)/layout.tsx`:

```tsx
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/cases" className="font-semibold">
            生信方案工作台
          </Link>
          <nav className="flex gap-4 text-sm text-slate-600">
            <Link href="/cases">方案单</Link>
            <Link href="/cases/new">新建方案</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Create PM workspace page**

Create `app/(app)/cases/page.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { listProposalCases } from "@/lib/db/proposal-repository";

export default async function CasesPage() {
  const cases = await listProposalCases();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">PM 工作台</h1>
          <p className="text-sm text-slate-600">查看方案单状态和下一步动作。</p>
        </div>
        <Button asChild>
          <Link href="/cases/new">新建方案单</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>全部方案单</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>项目</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>当前轮次</TableHead>
                <TableHead>更新</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((proposalCase) => (
                <TableRow key={proposalCase.id}>
                  <TableCell>{proposalCase.title}</TableCell>
                  <TableCell>{proposalCase.customerName}</TableCell>
                  <TableCell>
                    <StatusBadge status={proposalCase.status} />
                  </TableCell>
                  <TableCell>{proposalCase.currentRevisionNumber}</TableCell>
                  <TableCell>{proposalCase.updatedAt.toLocaleString("zh-CN")}</TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/cases/${proposalCase.id}`}>打开</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Create case creation page**

Create `app/(app)/cases/new/page.tsx`:

```tsx
import { createCaseAndGenerateDraft } from "@/app/(app)/cases/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewCasePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>新建方案单</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCaseAndGenerateDraft} className="space-y-4">
            <input type="hidden" name="pmUserId" value="seed-pm-user" />
            <div className="space-y-2">
              <Label htmlFor="title">项目名称</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerName">客户简称</Label>
              <Input id="customerName" name="customerName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originalRequestText">客户原文需求</Label>
              <Textarea
                id="originalRequestText"
                name="originalRequestText"
                required
                rows={12}
                className="font-mono"
              />
            </div>
            <Button type="submit">生成需求摘要和方案草稿</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

Run:

```bash
git add app components/status-badge.tsx
git commit -m "feat: add pm proposal workspace"
```

## Task 10: Build Proposal Detail, Analyst Review, And Feedback UI

**Files:**
- Create: `app/(app)/cases/[id]/page.tsx`
- Create: `components/proposal-editor.tsx`
- Create: `components/revision-timeline.tsx`
- Create: `components/similar-cases-panel.tsx`

- [ ] **Step 1: Create proposal editor component**

Create `components/proposal-editor.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { confirmCurrentRevision } from "@/app/(app)/cases/actions";

export function ProposalEditor({
  proposalCaseId,
  revisionId,
  initialText,
}: {
  proposalCaseId: string;
  revisionId: string;
  initialText: string;
}) {
  return (
    <form action={confirmCurrentRevision} className="space-y-3">
      <input type="hidden" name="proposalCaseId" value={proposalCaseId} />
      <input type="hidden" name="revisionId" value={revisionId} />
      <Textarea
        name="analystConfirmedText"
        rows={24}
        defaultValue={initialText}
        className="font-mono text-sm"
      />
      <Button type="submit">确认本轮方案</Button>
    </form>
  );
}
```

- [ ] **Step 2: Create revision timeline**

Create `components/revision-timeline.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RevisionItem = {
  id: string;
  revisionNumber: number;
  customerFeedbackText: string | null;
  revisionNotes: string | null;
  confirmedByAnalystAt: Date | null;
  sentToCustomerAt: Date | null;
};

export function RevisionTimeline({ revisions }: { revisions: RevisionItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>修订记录</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {revisions.map((revision) => (
          <div key={revision.id} className="rounded-lg border p-3 text-sm">
            <div className="font-medium">第 {revision.revisionNumber} 轮</div>
            {revision.customerFeedbackText ? (
              <p className="mt-2 text-slate-600">客户反馈：{revision.customerFeedbackText}</p>
            ) : (
              <p className="mt-2 text-slate-600">首轮方案</p>
            )}
            {revision.revisionNotes ? (
              <p className="mt-2 text-slate-600">修订说明：{revision.revisionNotes}</p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create similar cases panel**

Create `components/similar-cases-panel.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SimilarCase = {
  id: string;
  title: string;
  requirementSummary: string | null;
};

export function SimilarCasesPanel({ cases }: { cases: SimilarCase[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>相似历史案例</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cases.length === 0 ? (
          <p className="text-sm text-slate-500">暂无匹配的已同意历史方案。</p>
        ) : (
          cases.map((caseItem) => (
            <div key={caseItem.id} className="rounded-lg border p-3">
              <div className="font-medium">{caseItem.title}</div>
              <p className="mt-1 text-sm text-slate-600">
                {caseItem.requirementSummary ?? "该历史案例暂无需求摘要。"}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create case detail page**

Create `app/(app)/cases/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import {
  createRevisionFromFeedback,
  markAcceptedAction,
  markCanceledAction,
  sendCurrentRevision,
} from "@/app/(app)/cases/actions";
import { ProposalEditor } from "@/components/proposal-editor";
import { RevisionTimeline } from "@/components/revision-timeline";
import { SimilarCasesPanel } from "@/components/similar-cases-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getProposalCaseDetail } from "@/lib/db/proposal-repository";
import { findSimilarAcceptedCases } from "@/lib/search/similar-cases";

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const proposalCase = await getProposalCaseDetail(params.id);
  if (!proposalCase) notFound();

  const currentRevision = proposalCase.revisions.at(-1);
  const similarCases = await findSimilarAcceptedCases({
    originalRequestText: proposalCase.originalRequestText,
    requirementSummary: proposalCase.requirementSummary,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{proposalCase.title}</h1>
          <p className="text-sm text-slate-600">{proposalCase.customerName}</p>
        </div>
        <StatusBadge status={proposalCase.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>客户上下文</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <section>
              <h3 className="font-medium">客户原文</h3>
              <p className="mt-2 whitespace-pre-wrap text-slate-600">
                {proposalCase.originalRequestText}
              </p>
            </section>
            <section>
              <h3 className="font-medium">需求摘要</h3>
              <p className="mt-2 whitespace-pre-wrap text-slate-600">
                {proposalCase.requirementSummary ?? "尚未生成需求摘要。"}
              </p>
            </section>
            <section>
              <h3 className="font-medium">缺失信息</h3>
              <p className="mt-2 whitespace-pre-wrap text-slate-600">
                {proposalCase.missingInformation ?? "尚未生成缺失信息清单。"}
              </p>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>方案编辑</CardTitle>
          </CardHeader>
          <CardContent>
            {currentRevision ? (
              <ProposalEditor
                proposalCaseId={proposalCase.id}
                revisionId={currentRevision.id}
                initialText={currentRevision.analystConfirmedText ?? currentRevision.aiDraft}
              />
            ) : (
              <p className="text-sm text-slate-500">尚无方案草稿。</p>
            )}
          </CardContent>
        </Card>

        <SimilarCasesPanel cases={similarCases} />
      </div>

      {currentRevision?.analystConfirmedText ? (
        <Card>
          <CardHeader>
            <CardTitle>PM 客户反馈操作</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            <form action={sendCurrentRevision}>
              <input type="hidden" name="proposalCaseId" value={proposalCase.id} />
              <input type="hidden" name="revisionId" value={currentRevision.id} />
              <Button type="submit" variant="outline">标记已发送客户</Button>
            </form>

            <form action={markAcceptedAction}>
              <input type="hidden" name="proposalCaseId" value={proposalCase.id} />
              <Button type="submit" variant="outline">客户已同意</Button>
            </form>

            <form action={markCanceledAction}>
              <input type="hidden" name="proposalCaseId" value={proposalCase.id} />
              <Button type="submit" variant="outline">客户已取消</Button>
            </form>

            <form action={createRevisionFromFeedback} className="space-y-3 lg:col-span-3">
              <input type="hidden" name="proposalCaseId" value={proposalCase.id} />
              <Textarea name="customerFeedbackText" rows={5} placeholder="粘贴客户反馈意见" />
              <Button type="submit">生成修订草稿</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <RevisionTimeline revisions={proposalCase.revisions} />
    </div>
  );
}
```

- [ ] **Step 5: Build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

Run:

```bash
git add "app/(app)/cases/[id]/page.tsx" components/proposal-editor.tsx components/revision-timeline.tsx components/similar-cases-panel.tsx
git commit -m "feat: add proposal review and feedback pages"
```

## Task 11: Add Seed Data For Local Testing

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json`

- [ ] **Step 1: Add seed script**

Create `prisma/seed.ts`:

```ts
import { PrismaClient, ProposalStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const pm = await prisma.user.upsert({
    where: { email: "pm@example.com" },
    update: {},
    create: {
      id: "seed-pm-user",
      email: "pm@example.com",
      name: "PM User",
      role: UserRole.PM,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@example.com" },
    update: {},
    create: {
      id: "seed-analyst-user",
      email: "analyst@example.com",
      name: "Analyst User",
      role: UserRole.ANALYST,
    },
  });

  await prisma.proposalCase.upsert({
    where: { id: "seed-accepted-case" },
    update: {},
    create: {
      id: "seed-accepted-case",
      title: "水稻转录组差异分析历史方案",
      customerName: "历史客户",
      originalRequestText: "客户关注水稻抗逆处理后的表达变化。",
      requirementSummary: "水稻转录组差异表达分析，包含 GO/KEGG 富集。",
      missingInformation: "样本分组和重复数已确认。",
      status: ProposalStatus.ACCEPTED,
      currentRevisionNumber: 1,
      pmUserId: pm.id,
      analystUserId: analyst.id,
      revisions: {
        create: {
          revisionNumber: 1,
          aiDraft: "历史 AI 草稿",
          analystConfirmedText: "最终方案包含质控、比对、定量、差异表达、GO/KEGG 富集和结果报告。",
          confirmedByAnalystAt: new Date(),
          sentToCustomerAt: new Date(),
        },
      },
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 2: Add Prisma seed config**

Modify `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Install `tsx`:

```bash
npm install -D tsx
```

- [ ] **Step 3: Run migration and seed locally**

Run:

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Expected: seed users and one accepted historical case exist.

- [ ] **Step 4: Commit**

Run:

```bash
git add prisma/seed.ts package.json package-lock.json prisma/migrations
git commit -m "chore: add local seed data"
```

## Task 12: Add Basic Auth Boundary

**Files:**
- Create: `lib/auth/current-user.ts`
- Modify: `app/(app)/cases/new/page.tsx`
- Modify: `app/(app)/cases/actions.ts`

- [ ] **Step 1: Add current user helper**

Create `lib/auth/current-user.ts`:

```ts
import { prisma } from "@/lib/db/prisma";

export async function getCurrentUser() {
  const user = await prisma.user.findUnique({
    where: { id: "seed-pm-user" },
  });

  if (!user) {
    throw new Error("Seed PM user is required. Run `npx prisma db seed`.");
  }

  return user;
}
```

This keeps the MVP implementation moving while preserving a clear replacement point for Auth.js session lookup.

- [ ] **Step 2: Use current user in new case page**

Modify `app/(app)/cases/new/page.tsx` so the hidden PM field comes from `getCurrentUser()`:

```tsx
import { createCaseAndGenerateDraft } from "@/app/(app)/cases/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function NewCasePage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>新建方案单</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCaseAndGenerateDraft} className="space-y-4">
            <input type="hidden" name="pmUserId" value={user.id} />
            <div className="space-y-2">
              <Label htmlFor="title">项目名称</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerName">客户简称</Label>
              <Input id="customerName" name="customerName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originalRequestText">客户原文需求</Label>
              <Textarea
                id="originalRequestText"
                name="originalRequestText"
                required
                rows={12}
                className="font-mono"
              />
            </div>
            <Button type="submit">生成需求摘要和方案草稿</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

Run:

```bash
git add lib/auth app
git commit -m "feat: add current user boundary"
```

## Task 13: Verification Pass

**Files:**
- Verify all files touched by prior tasks.

- [ ] **Step 1: Run unit tests**

Run:

```bash
npm test
```

Expected: all Vitest tests pass.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: no lint errors.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: production build succeeds.

- [ ] **Step 4: Run local app**

Run:

```bash
npm run dev
```

Expected: app starts on `http://localhost:3000`.

- [ ] **Step 5: Manually verify core workflow**

In the browser:

1. Open `/cases`.
2. Open `/cases/new`.
3. Create a proposal case from pasted customer text.
4. Open the generated case.
5. Confirm the proposal as analyst.
6. Mark the proposal sent to customer.
7. Paste customer feedback and generate a revised draft.
8. Confirm revised proposal.
9. Mark customer accepted.
10. Confirm the accepted case appears in similar case references for a related new case.

- [ ] **Step 6: Commit verification fixes**

If verification required changes:

```bash
git add .
git commit -m "fix: stabilize proposal platform mvp"
```

If no changes were required, do not create an empty commit.

## Scope Deliberately Deferred

These are in the spec but should not be built in the MVP implementation pass:

- Customer login and customer-facing review pages.
- Multi-model AI draft generation with `AIDraftCandidate`.
- Vector search.
- Structured biological intake forms.
- Analytics dashboards.
- Full Auth.js login flow beyond the `getCurrentUser()` boundary.

## Self-Review

Spec coverage:

- PM workspace: Task 9.
- Proposal creation from pasted original request: Tasks 8 and 9.
- AI initial generation: Task 4 and Task 8.
- Analyst review and confirmation: Tasks 5, 8, and 10.
- Customer feedback loop: Tasks 5, 8, and 10.
- Status flow: Task 2.
- Revision preservation: Tasks 3, 5, 6, 8, and 10.
- Similar historical cases: Task 7 and Task 10.
- Next.js + shadcn/ui stack: Tasks 1, 9, and 10.
- PostgreSQL + Prisma: Tasks 3, 6, and 11.
- Future multi-model support: schema leaves MVP as one selected AI draft per revision and defers `AIDraftCandidate`.

No task builds customer portal, vector search, dashboards, or multi-model generation.
