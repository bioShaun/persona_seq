import {
  FinalOutcome,
  GenerationStatus,
  ProposalStatus,
  type ProposalCase,
  type Revision,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";


type CreateProposalCaseInput = {
  title: string;
  customerName: string;
  originalRequestText: string;
  pmUserId: string;
  analystUserId?: string | null;
};

type UpdateCaseAfterInitialGenerationInput = {
  proposalCaseId: string;
  requirementSummary: string;
  missingInformation: string;
  aiDraft: string;
  actorUserId: string;
  suggestedTitle?: string;
  tags?: import("@/lib/domain/case-tags").CaseTags;
};

type ConfirmRevisionInput = {
  proposalCaseId: string;
  revisionId: string;
  analystConfirmedText: string;
  actorUserId: string;
};

type MarkSentToCustomerInput = {
  proposalCaseId: string;
  revisionId: string;
  actorUserId: string;
};

type MarkCustomerOutcomeInput = {
  proposalCaseId: string;
  actorUserId: string;
};

type PersistFeedbackRevisionInput = {
  proposalCaseId: string;
  actorUserId: string;
  revisionData: {
    revisionNumber: number;
    customerFeedbackText: string;
    aiDraft: string;
    revisionNotes: string | null;
  };
  suggestedTitle?: string;
  tags?: CaseTags;
};

export type ProposalCaseInvariantSnapshot = Pick<
  ProposalCase,
  "id" | "status" | "currentRevisionNumber" | "finalOutcome"
>;

export type RevisionInvariantSnapshot = Pick<
  Revision,
  | "id"
  | "proposalCaseId"
  | "revisionNumber"
  | "analystConfirmedText"
  | "sentToCustomerAt"
>;

export function assertCaseReadyForInitialGeneration(
  proposalCase: ProposalCaseInvariantSnapshot,
) {
  if (
    proposalCase.status !== ProposalStatus.DRAFTING ||
    proposalCase.currentRevisionNumber !== 1 ||
    proposalCase.finalOutcome !== null
  ) {
    throw new Error("Proposal case is not ready for initial generation");
  }
}

export function assertRevisionBelongsToCase(
  revision: RevisionInvariantSnapshot,
  proposalCaseId: string,
  currentRevisionNumber: number,
) {
  if (
    revision.proposalCaseId !== proposalCaseId ||
    revision.revisionNumber !== currentRevisionNumber
  ) {
    throw new Error("Revision does not belong to proposal case");
  }
}

export function assertCaseAwaitingAnalystReview(
  proposalCase: ProposalCaseInvariantSnapshot,
) {
  if (
    proposalCase.status !== ProposalStatus.ANALYST_REVIEW ||
    proposalCase.finalOutcome !== null
  ) {
    throw new Error("Proposal case is not awaiting analyst review");
  }
}

export function assertRevisionNotAlreadyConfirmed(
  revision: RevisionInvariantSnapshot,
) {
  if (revision.analystConfirmedText !== null) {
    throw new Error("Revision has already been confirmed");
  }
}

export function assertCaseReadyToSend(
  proposalCase: ProposalCaseInvariantSnapshot,
) {
  if (
    proposalCase.status !== ProposalStatus.READY_TO_SEND ||
    proposalCase.finalOutcome !== null
  ) {
    throw new Error("Proposal case is not ready to send");
  }
}

export function assertRevisionConfirmedBeforeSending(
  revision: RevisionInvariantSnapshot,
) {
  if (revision.analystConfirmedText === null) {
    throw new Error("Revision must be confirmed before sending");
  }
}

export function assertRevisionNotAlreadySent(revision: RevisionInvariantSnapshot) {
  if (revision.sentToCustomerAt !== null) {
    throw new Error("Revision has already been sent to customer");
  }
}

export function assertCaseWaitingCustomerFeedback(
  proposalCase: ProposalCaseInvariantSnapshot,
) {
  if (
    proposalCase.status !== ProposalStatus.WAITING_CUSTOMER_FEEDBACK ||
    proposalCase.finalOutcome !== null
  ) {
    throw new Error("Proposal case is not waiting for customer feedback");
  }
}

export function assertCaseReadyForFeedbackRevision(
  proposalCase: ProposalCaseInvariantSnapshot,
  latestRevision: RevisionInvariantSnapshot | null,
) {
  assertCaseWaitingCustomerFeedback(proposalCase);

  if (!latestRevision) {
    throw new Error("Current revision mismatch while creating a new revision");
  }
  if (!latestRevision.analystConfirmedText?.trim()) {
    throw new Error(
      "Previous analyst-confirmed proposal is required before creating a revision",
    );
  }
  if (latestRevision.revisionNumber !== proposalCase.currentRevisionNumber) {
    throw new Error("Current revision mismatch while creating a new revision");
  }
}

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

export async function updateCaseTitle(caseId: string, title: string) {
  await prisma.proposalCase.update({
    where: { id: caseId },
    data: { title },
  });
}

export async function loadCaseWithRevision(id: string) {
  return prisma.proposalCase.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      currentRevisionNumber: true,
      finalOutcome: true,
      originalRequestText: true,
      revisions: {
        orderBy: { revisionNumber: "desc" },
        take: 1,
        select: {
          id: true,
          proposalCaseId: true,
          revisionNumber: true,
          analystConfirmedText: true,
          sentToCustomerAt: true,
        },
      },
    },
  });
}

export async function createProposalCase(input: CreateProposalCaseInput) {
  return prisma.$transaction(async (tx) => {
    const createdCase = await tx.proposalCase.create({
      data: {
        title: input.title,
        customerName: input.customerName,
        originalRequestText: input.originalRequestText,
        pmUserId: input.pmUserId,
        analystUserId: input.analystUserId ?? null,
        status: ProposalStatus.DRAFTING,
        generationStatus: GenerationStatus.PENDING,
      },
    });

    await tx.auditLog.create({
      data: {
        proposalCaseId: createdCase.id,
        actorUserId: input.pmUserId,
        action: "create_case",
        afterStatus: createdCase.status,
      },
    });

    return createdCase;
  });
}

type StartInitialGenerationInput = {
  proposalCaseId: string;
  actorUserId: string;
};

type InitialGenerationStartResult =
  | {
      kind: "started";
      proposalCaseId: string;
      originalRequestText: string;
    }
  | { kind: "running" }
  | {
      kind: "noop";
      reason: "generation_already_succeeded" | "workflow_advanced";
    };

type FailInitialGenerationInput = {
  proposalCaseId: string;
  actorUserId: string;
  errorMessage: string;
};

const STALE_RUNNING_GENERATION_MS = 5 * 60 * 1000;

export function isStaleRunningGeneration(
  generationStartedAt: Date | null,
  now = new Date(),
) {
  if (!generationStartedAt) return true;
  return now.getTime() - generationStartedAt.getTime() > STALE_RUNNING_GENERATION_MS;
}

export async function startInitialDraftGeneration(
  input: StartInitialGenerationInput,
): Promise<InitialGenerationStartResult> {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const proposalCase = await tx.proposalCase.findUnique({
      where: { id: input.proposalCaseId },
      select: {
        id: true,
        status: true,
        generationStatus: true,
        generationStartedAt: true,
        originalRequestText: true,
      },
    });

    if (!proposalCase) {
      throw new Error("Proposal case was not found");
    }
    if (proposalCase.generationStatus === GenerationStatus.SUCCEEDED) {
      return {
        kind: "noop",
        reason: "generation_already_succeeded",
      };
    }
    if (
      proposalCase.generationStatus === GenerationStatus.RUNNING &&
      !isStaleRunningGeneration(proposalCase.generationStartedAt, now)
    ) {
      return { kind: "running" };
    }
    if (proposalCase.status !== ProposalStatus.DRAFTING) {
      return { kind: "noop", reason: "workflow_advanced" };
    }
    if (
      proposalCase.generationStatus !== GenerationStatus.PENDING &&
      proposalCase.generationStatus !== GenerationStatus.FAILED &&
      proposalCase.generationStatus !== GenerationStatus.RUNNING
    ) {
      throw new Error("Initial generation has already started");
    }

    const staleBefore = new Date(now.getTime() - STALE_RUNNING_GENERATION_MS);
    const updateResult = await tx.proposalCase.updateMany({
      where: {
        id: input.proposalCaseId,
        status: ProposalStatus.DRAFTING,
        OR: [
          { generationStatus: GenerationStatus.PENDING },
          { generationStatus: GenerationStatus.FAILED },
          {
            generationStatus: GenerationStatus.RUNNING,
            OR: [
              { generationStartedAt: null },
              { generationStartedAt: { lt: staleBefore } },
            ],
          },
        ],
      },
      data: {
        generationStatus: GenerationStatus.RUNNING,
        generationError: null,
        generationStartedAt: now,
        generationFinishedAt: null,
        generationAttemptCount: { increment: 1 },
      },
    });

    if (updateResult.count !== 1) {
      return { kind: "running" };
    }

    await tx.auditLog.create({
      data: {
        proposalCaseId: input.proposalCaseId,
        actorUserId: input.actorUserId,
        action: "start_initial_generation",
        afterStatus: ProposalStatus.DRAFTING,
      },
    });

    return {
      kind: "started",
      proposalCaseId: proposalCase.id,
      originalRequestText: proposalCase.originalRequestText,
    };
  });
}

export async function updateCaseAfterInitialGeneration(
  input: UpdateCaseAfterInitialGenerationInput,
) {
  return prisma.$transaction(async (tx) => {
    const proposalCase = await tx.proposalCase.findUnique({
      where: { id: input.proposalCaseId },
      select: {
        id: true,
        status: true,
        generationStatus: true,
        currentRevisionNumber: true,
        finalOutcome: true,
      },
    });

    if (!proposalCase) {
      throw new Error("Proposal case is not ready for initial generation");
    }
    assertCaseReadyForInitialGeneration(proposalCase);

    const updateResult = await tx.proposalCase.updateMany({
      where: {
        id: input.proposalCaseId,
        status: ProposalStatus.DRAFTING,
        generationStatus: GenerationStatus.RUNNING,
        currentRevisionNumber: 1,
        finalOutcome: null,
      },
      data: {
        requirementSummary: input.requirementSummary,
        missingInformation: input.missingInformation,
        ...(input.suggestedTitle ? { title: input.suggestedTitle } : {}),
        status: ProposalStatus.ANALYST_REVIEW,
        generationStatus: GenerationStatus.SUCCEEDED,
        generationError: null,
        generationFinishedAt: new Date(),
        ...(input.tags
          ? {
              productLine: input.tags.productLine ?? null,
              organism: input.tags.organism ?? null,
              application: input.tags.application ?? null,
              analysisDepth: input.tags.analysisDepth ?? null,
              sampleTypes: input.tags.sampleTypes ?? [],
              platforms: input.tags.platforms ?? [],
              keywordTags: input.tags.keywordTags ?? [],
              tagsGeneratedAt: new Date(),
              tagsModel: process.env.AI_MODEL ?? null,
            }
          : {}),
      },
    });

    if (updateResult.count !== 1) {
      throw new Error("Proposal case is not ready for initial generation");
    }

    const revision = await tx.revision.create({
      data: {
        proposalCaseId: input.proposalCaseId,
        revisionNumber: 1,
        aiDraft: input.aiDraft,
      },
    });

    await tx.auditLog.create({
      data: {
        proposalCaseId: input.proposalCaseId,
        revisionId: revision.id,
        actorUserId: input.actorUserId,
        action: "generate_initial_draft",
        beforeStatus: ProposalStatus.DRAFTING,
        afterStatus: ProposalStatus.ANALYST_REVIEW,
      },
    });

    return tx.proposalCase.findUniqueOrThrow({
      where: { id: input.proposalCaseId },
    });
  });
}

export async function markInitialGenerationFailed(
  input: FailInitialGenerationInput,
) {
  return prisma.$transaction(async (tx) => {
    const updateResult = await tx.proposalCase.updateMany({
      where: {
        id: input.proposalCaseId,
        status: ProposalStatus.DRAFTING,
        generationStatus: GenerationStatus.RUNNING,
      },
      data: {
        generationStatus: GenerationStatus.FAILED,
        generationError: input.errorMessage,
        generationFinishedAt: new Date(),
      },
    });

    if (updateResult.count !== 1) {
      return;
    }

    await tx.auditLog.create({
      data: {
        proposalCaseId: input.proposalCaseId,
        actorUserId: input.actorUserId,
        action: "initial_generation_failed",
        afterStatus: ProposalStatus.DRAFTING,
        metadata: {
          message: input.errorMessage,
        },
      },
    });
  });
}

export async function confirmRevision(input: ConfirmRevisionInput) {
  return prisma.$transaction(async (tx) => {
    const proposalCase = await tx.proposalCase.findUnique({
      where: { id: input.proposalCaseId },
      select: {
        id: true,
        status: true,
        currentRevisionNumber: true,
        finalOutcome: true,
      },
    });

    if (!proposalCase) {
      throw new Error("Proposal case is not awaiting analyst review");
    }
    assertCaseAwaitingAnalystReview(proposalCase);

    const revision = await tx.revision.findUnique({
      where: { id: input.revisionId },
      select: {
        id: true,
        proposalCaseId: true,
        revisionNumber: true,
        analystConfirmedText: true,
        sentToCustomerAt: true,
      },
    });

    if (!revision) {
      throw new Error("Revision does not belong to proposal case");
    }
    assertRevisionBelongsToCase(
      revision,
      proposalCase.id,
      proposalCase.currentRevisionNumber,
    );
    assertRevisionNotAlreadyConfirmed(revision);

    const updatedRevision = await tx.revision.update({
      where: { id: input.revisionId },
      data: {
        analystConfirmedText: input.analystConfirmedText,
        confirmedByAnalystAt: new Date(),
      },
    });

    const updateResult = await tx.proposalCase.updateMany({
      where: {
        id: input.proposalCaseId,
        status: ProposalStatus.ANALYST_REVIEW,
        finalOutcome: null,
        currentRevisionNumber: proposalCase.currentRevisionNumber,
      },
      data: {
        status: ProposalStatus.READY_TO_SEND,
      },
    });

    if (updateResult.count !== 1) {
      throw new Error("Proposal case is not awaiting analyst review");
    }

    const updatedCase = await tx.proposalCase.findUniqueOrThrow({
      where: { id: input.proposalCaseId },
    });

    await tx.auditLog.create({
      data: {
        proposalCaseId: input.proposalCaseId,
        revisionId: input.revisionId,
        actorUserId: input.actorUserId,
        action: "confirm_revision",
        beforeStatus: ProposalStatus.ANALYST_REVIEW,
        afterStatus: ProposalStatus.READY_TO_SEND,
      },
    });

    return [updatedRevision, updatedCase] as const;
  });
}

export async function markSentToCustomer(input: MarkSentToCustomerInput) {
  return prisma.$transaction(async (tx) => {
    const proposalCase = await tx.proposalCase.findUnique({
      where: { id: input.proposalCaseId },
      select: {
        id: true,
        status: true,
        currentRevisionNumber: true,
        finalOutcome: true,
      },
    });

    if (!proposalCase) {
      throw new Error("Proposal case is not ready to send");
    }
    assertCaseReadyToSend(proposalCase);

    const revision = await tx.revision.findUnique({
      where: { id: input.revisionId },
      select: {
        id: true,
        proposalCaseId: true,
        revisionNumber: true,
        analystConfirmedText: true,
        sentToCustomerAt: true,
      },
    });

    if (!revision) {
      throw new Error("Revision does not belong to proposal case");
    }
    assertRevisionBelongsToCase(
      revision,
      proposalCase.id,
      proposalCase.currentRevisionNumber,
    );
    assertRevisionConfirmedBeforeSending(revision);
    assertRevisionNotAlreadySent(revision);

    const updatedRevision = await tx.revision.update({
      where: { id: input.revisionId },
      data: {
        sentToCustomerAt: new Date(),
      },
    });

    const updateResult = await tx.proposalCase.updateMany({
      where: {
        id: input.proposalCaseId,
        status: ProposalStatus.READY_TO_SEND,
        finalOutcome: null,
        currentRevisionNumber: proposalCase.currentRevisionNumber,
      },
      data: {
        status: ProposalStatus.WAITING_CUSTOMER_FEEDBACK,
      },
    });

    if (updateResult.count !== 1) {
      throw new Error("Proposal case is not ready to send");
    }

    const updatedCase = await tx.proposalCase.findUniqueOrThrow({
      where: { id: input.proposalCaseId },
    });

    await tx.auditLog.create({
      data: {
        proposalCaseId: input.proposalCaseId,
        revisionId: input.revisionId,
        actorUserId: input.actorUserId,
        action: "send_revision_to_customer",
        beforeStatus: ProposalStatus.READY_TO_SEND,
        afterStatus: ProposalStatus.WAITING_CUSTOMER_FEEDBACK,
      },
    });

    return [updatedRevision, updatedCase] as const;
  });
}

export async function markCustomerAccepted(input: MarkCustomerOutcomeInput) {
  return prisma.$transaction(async (tx) => {
    const proposalCase = await tx.proposalCase.findUnique({
      where: { id: input.proposalCaseId },
      select: {
        id: true,
        status: true,
        currentRevisionNumber: true,
        finalOutcome: true,
      },
    });

    if (!proposalCase) {
      throw new Error("Proposal case is not waiting for customer feedback");
    }
    assertCaseWaitingCustomerFeedback(proposalCase);

    const updateResult = await tx.proposalCase.updateMany({
      where: {
        id: input.proposalCaseId,
        status: ProposalStatus.WAITING_CUSTOMER_FEEDBACK,
        finalOutcome: null,
      },
      data: {
        status: ProposalStatus.ACCEPTED,
        finalOutcome: FinalOutcome.ACCEPTED,
      },
    });

    if (updateResult.count !== 1) {
      throw new Error("Proposal case is not waiting for customer feedback");
    }

    const updatedCase = await tx.proposalCase.findUniqueOrThrow({
      where: { id: input.proposalCaseId },
    });

    await tx.auditLog.create({
      data: {
        proposalCaseId: input.proposalCaseId,
        actorUserId: input.actorUserId,
        action: "mark_customer_accepted",
        beforeStatus: ProposalStatus.WAITING_CUSTOMER_FEEDBACK,
        afterStatus: ProposalStatus.ACCEPTED,
      },
    });

    return updatedCase;
  });
}

export async function markCustomerCanceled(input: MarkCustomerOutcomeInput) {
  return prisma.$transaction(async (tx) => {
    const proposalCase = await tx.proposalCase.findUnique({
      where: { id: input.proposalCaseId },
      select: {
        id: true,
        status: true,
        currentRevisionNumber: true,
        finalOutcome: true,
      },
    });

    if (!proposalCase) {
      throw new Error("Proposal case is not waiting for customer feedback");
    }
    assertCaseWaitingCustomerFeedback(proposalCase);

    const updateResult = await tx.proposalCase.updateMany({
      where: {
        id: input.proposalCaseId,
        status: ProposalStatus.WAITING_CUSTOMER_FEEDBACK,
        finalOutcome: null,
      },
      data: {
        status: ProposalStatus.CANCELED,
        finalOutcome: FinalOutcome.CANCELED,
      },
    });

    if (updateResult.count !== 1) {
      throw new Error("Proposal case is not waiting for customer feedback");
    }

    const updatedCase = await tx.proposalCase.findUniqueOrThrow({
      where: { id: input.proposalCaseId },
    });

    await tx.auditLog.create({
      data: {
        proposalCaseId: input.proposalCaseId,
        actorUserId: input.actorUserId,
        action: "mark_customer_canceled",
        beforeStatus: ProposalStatus.WAITING_CUSTOMER_FEEDBACK,
        afterStatus: ProposalStatus.CANCELED,
      },
    });

    return updatedCase;
  });
}

export async function persistFeedbackRevision(
  input: PersistFeedbackRevisionInput,
) {
  return prisma.$transaction(async (tx) => {
    const proposalCase = await tx.proposalCase.findUnique({
      where: { id: input.proposalCaseId },
      select: {
        id: true,
        status: true,
        currentRevisionNumber: true,
        finalOutcome: true,
      },
    });

    if (!proposalCase) {
      throw new Error("Proposal case was not found");
    }

    const latestRevision = await tx.revision.findFirst({
      where: { proposalCaseId: input.proposalCaseId },
      orderBy: { revisionNumber: "desc" },
      select: {
        id: true,
        proposalCaseId: true,
        revisionNumber: true,
        analystConfirmedText: true,
        sentToCustomerAt: true,
      },
    });

    assertCaseReadyForFeedbackRevision(proposalCase, latestRevision);

    const updateResult = await tx.proposalCase.updateMany({
      where: {
        id: input.proposalCaseId,
        status: ProposalStatus.WAITING_CUSTOMER_FEEDBACK,
        finalOutcome: null,
        currentRevisionNumber: proposalCase.currentRevisionNumber,
      },
      data: {
        status: ProposalStatus.ANALYST_REVIEW,
        currentRevisionNumber: input.revisionData.revisionNumber,
      },
    });

    if (updateResult.count !== 1) {
      throw new Error("Proposal case is not waiting for customer feedback");
    }

    const createdRevision = await tx.revision.create({
      data: {
        proposalCaseId: input.proposalCaseId,
        revisionNumber: input.revisionData.revisionNumber,
        customerFeedbackText: input.revisionData.customerFeedbackText,
        aiDraft: input.revisionData.aiDraft,
        revisionNotes: input.revisionData.revisionNotes,
      },
    });

    await tx.auditLog.create({
      data: {
        proposalCaseId: input.proposalCaseId,
        revisionId: createdRevision.id,
        actorUserId: input.actorUserId,
        action: "generate_revision_draft",
        beforeStatus: ProposalStatus.WAITING_CUSTOMER_FEEDBACK,
        afterStatus: ProposalStatus.ANALYST_REVIEW,
      },
    });

    if (input.suggestedTitle || input.tags) {
      const caseUpdateData: Record<string, unknown> = {};

      if (input.suggestedTitle) {
        caseUpdateData.title = input.suggestedTitle;
      }

      if (input.tags) {
        caseUpdateData.productLine = input.tags.productLine ?? null;
        caseUpdateData.organism = input.tags.organism ?? null;
        caseUpdateData.application = input.tags.application ?? null;
        caseUpdateData.analysisDepth = input.tags.analysisDepth ?? null;
        caseUpdateData.sampleTypes = input.tags.sampleTypes ?? [];
        caseUpdateData.platforms = input.tags.platforms ?? [];
        caseUpdateData.keywordTags = input.tags.keywordTags ?? [];
        caseUpdateData.tagsGeneratedAt = new Date();
        caseUpdateData.tagsModel = process.env.AI_MODEL ?? null;
      }

      await tx.proposalCase.update({
        where: { id: input.proposalCaseId },
        data: caseUpdateData,
      });
    }

    return createdRevision;
  });
}

export async function getCaseEmbedding(caseId: string): Promise<number[] | null> {
  const rows = await prisma.$queryRaw<{ embedding: string | null }[]>`
    SELECT embedding::text AS embedding
    FROM "ProposalCase"
    WHERE id = ${caseId}
  `;
  const raw = rows[0]?.embedding;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveEmbedding(caseId: string, embedding: number[]) {
  return prisma.$executeRaw`
    UPDATE "ProposalCase"
    SET embedding = ${`[${embedding.join(",")}]`}::vector,
        "updatedAt" = NOW()
    WHERE id = ${caseId}
  `;
}

export async function invalidateEmbedding(caseId: string) {
  return prisma.$executeRaw`
    UPDATE "ProposalCase"
    SET embedding = NULL,
        "updatedAt" = NOW()
    WHERE id = ${caseId}
  `;
}

export function assertCaseTagsEditable(status: ProposalStatus) {
  if (status === ProposalStatus.ACCEPTED || status === ProposalStatus.CANCELED) {
    throw new Error("标签不可编辑：案例已归档");
  }
}

type UpdateCaseTagsInput = {
  productLine?: string | null;
  organism?: string | null;
  application?: string | null;
  analysisDepth?: string | null;
  sampleTypes?: string[];
  platforms?: string[];
  keywordTags?: string[];
};

export async function reExtractCaseTags(
  caseId: string,
  provider: { generateText: (prompt: string) => Promise<string> },
) {
  const proposalCase = await prisma.proposalCase.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      originalRequestText: true,
      requirementSummary: true,
      revisions: {
        orderBy: { revisionNumber: "desc" },
        take: 1,
        select: { analystConfirmedText: true },
      },
    },
  });

  if (!proposalCase) {
    throw new Error("案例不存在");
  }

  const confirmedText = proposalCase.revisions[0]?.analystConfirmedText ?? "";
  const prompt = `请从以下案例信息中提取结构化标签（JSON格式）：\n\n客户原始需求：${proposalCase.originalRequestText}\n需求摘要：${proposalCase.requirementSummary ?? "无"}\n确认方案：${confirmedText}\n\n请输出JSON对象，包含以下字段（均可选）：productLine, organism, application, analysisDepth, sampleTypes, platforms, keywordTags`;

  const text = await provider.generateText(prompt);

  const { parseTagsFromJson } = await import("@/lib/ai/generate-proposal");
  const tags = parseTagsFromJson(text);

  return prisma.proposalCase.update({
    where: { id: caseId },
    data: {
      ...(tags
        ? {
            productLine: tags.productLine ?? null,
            organism: tags.organism ?? null,
            application: tags.application ?? null,
            analysisDepth: tags.analysisDepth ?? null,
            sampleTypes: tags.sampleTypes ?? [],
            platforms: tags.platforms ?? [],
            keywordTags: tags.keywordTags ?? [],
          }
        : {}),
      tagsGeneratedAt: new Date(),
      tagsModel: "re-extract",
    },
  });
}

export async function updateCaseTags(
  caseId: string,
  tags: UpdateCaseTagsInput,
) {
  return prisma.proposalCase.update({
    where: { id: caseId },
    data: {
      ...(tags.productLine !== undefined ? { productLine: tags.productLine } : {}),
      ...(tags.organism !== undefined ? { organism: tags.organism } : {}),
      ...(tags.application !== undefined ? { application: tags.application } : {}),
      ...(tags.analysisDepth !== undefined ? { analysisDepth: tags.analysisDepth } : {}),
      ...(tags.sampleTypes !== undefined ? { sampleTypes: tags.sampleTypes } : {}),
      ...(tags.platforms !== undefined ? { platforms: tags.platforms } : {}),
      ...(tags.keywordTags !== undefined ? { keywordTags: tags.keywordTags } : {}),
      updatedAt: new Date(),
    },
  });
}
