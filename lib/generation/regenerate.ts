import "server-only";
import { ProposalStatus, GenerationStatus } from "@prisma/client";
import { generateInitialProposalDraft } from "@/lib/ai/generate-proposal";
import { errorMessage } from "@/lib/ai/generation-errors";
import type { ProposalAiProvider } from "@/lib/ai/types";
import { prisma } from "@/lib/db/prisma";
import type { GenerationInput, RegenerateGenerationResult } from "./types";

const REGENERATABLE_STATUSES = new Set([
  ProposalStatus.DRAFTING,
  ProposalStatus.ANALYST_REVIEW,
  ProposalStatus.READY_TO_SEND,
  ProposalStatus.WAITING_CUSTOMER_FEEDBACK,
] as const);

export async function regenerateProposalDraft(
  input: GenerationInput,
  provider: ProposalAiProvider,
): Promise<RegenerateGenerationResult> {
  const proposalCase = await prisma.proposalCase.findUnique({
    where: { id: input.proposalCaseId },
    select: {
      id: true,
      status: true,
      originalRequestText: true,
      currentRevisionNumber: true,
      finalOutcome: true,
    },
  });

  if (!proposalCase) {
    return { kind: "case_not_found" };
  }

  if (proposalCase.finalOutcome !== null) {
    return { kind: "already_completed" };
  }

  if (
    !REGENERATABLE_STATUSES.has(
      proposalCase.status as typeof ProposalStatus.DRAFTING,
    )
  ) {
    return {
      kind: "state_not_regeneratable",
      currentStatus: proposalCase.status,
    };
  }

  const nextRevisionNumber = proposalCase.currentRevisionNumber + 1;

  await prisma.$transaction(async (tx) => {
    await tx.proposalCase.update({
      where: { id: proposalCase.id },
      data: {
        status: ProposalStatus.DRAFTING,
        generationStatus: GenerationStatus.RUNNING,
        requirementSummary: null,
        missingInformation: null,
        generationError: null,
        generationStartedAt: new Date(),
        generationFinishedAt: null,
        generationAttemptCount: { increment: 1 },
        currentRevisionNumber: nextRevisionNumber,
      },
    });

    await tx.auditLog.create({
      data: {
        proposalCaseId: proposalCase.id,
        actorUserId: input.actorUserId,
        action: "regenerate_proposal",
        beforeStatus: proposalCase.status,
        afterStatus: ProposalStatus.DRAFTING,
        metadata: { revisionNumber: nextRevisionNumber },
      },
    });
  });

  // Query AuditLog for referenced similar cases (few-shot injection)
  const referencedLogs = await prisma.auditLog.findMany({
    where: {
      proposalCaseId: proposalCase.id,
      action: "similar_case_referenced",
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { metadata: true },
  });

  const referencedCaseIds = [...new Set(
    referencedLogs
      .map((log) => {
        const meta = log.metadata as { targetCaseId?: string } | null;
        return meta?.targetCaseId;
      })
      .filter((id): id is string => Boolean(id)),
  )];

  let referencedCaseTexts: string[] = [];
  if (referencedCaseIds.length > 0) {
    const referencedCases = await prisma.revision.findMany({
      where: {
        proposalCaseId: { in: referencedCaseIds },
      },
      orderBy: { revisionNumber: "desc" },
      distinct: ["proposalCaseId"],
      select: { analystConfirmedText: true },
    });
    referencedCaseTexts = referencedCases
      .map((r) => r.analystConfirmedText)
      .filter((t): t is string => Boolean(t?.trim()));
  }

  try {
    const draft = await generateInitialProposalDraft(provider, {
      originalRequestText: proposalCase.originalRequestText,
      referencedCaseTexts,
    });

    const stateChanged = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.proposalCase.updateMany({
        where: {
          id: proposalCase.id,
          status: ProposalStatus.DRAFTING,
          generationStatus: GenerationStatus.RUNNING,
          currentRevisionNumber: nextRevisionNumber,
          finalOutcome: null,
        },
        data: {
          requirementSummary: draft.requirementSummary,
          missingInformation: draft.missingInformation,
          ...(draft.suggestedTitle ? { title: draft.suggestedTitle } : {}),
          status: ProposalStatus.ANALYST_REVIEW,
          generationStatus: GenerationStatus.SUCCEEDED,
          generationError: null,
          generationFinishedAt: new Date(),
          ...(draft.tags
            ? {
                productLine: draft.tags.productLine ?? null,
                organism: draft.tags.organism ?? null,
                application: draft.tags.application ?? null,
                analysisDepth: draft.tags.analysisDepth ?? null,
                sampleTypes: draft.tags.sampleTypes ?? [],
                platforms: draft.tags.platforms ?? [],
                keywordTags: draft.tags.keywordTags ?? [],
                tagsGeneratedAt: new Date(),
                tagsModel: process.env.AI_MODEL ?? null,
              }
            : {}),
        },
      });

      if (updateResult.count !== 1) {
        return true;
      }

      await tx.revision.create({
        data: {
          proposalCaseId: proposalCase.id,
          revisionNumber: nextRevisionNumber,
          aiDraft: draft.proposalDraft,
        },
      });

      await tx.auditLog.create({
        data: {
          proposalCaseId: proposalCase.id,
          actorUserId: input.actorUserId,
          action: "regenerate_proposal_draft",
          beforeStatus: ProposalStatus.DRAFTING,
          afterStatus: ProposalStatus.ANALYST_REVIEW,
          metadata: { revisionNumber: nextRevisionNumber },
        },
      });

      return false;
    });

    if (stateChanged) {
      return { kind: "state_changed" };
    }

    return { kind: "succeeded" };
  } catch (error) {
    const message = errorMessage(error, "Failed to regenerate proposal");

    try {
      await prisma.proposalCase.update({
        where: { id: input.proposalCaseId },
        data: {
          generationStatus: GenerationStatus.FAILED,
          generationError: message,
        },
      });
    } catch (_) {
      void _;
    }

    return { kind: "failed", error: message };
  }
}
