import { GenerationStatus, ProposalStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { generateInitialProposalDraft } from "@/lib/ai/generate-proposal";
import { errorMessage } from "@/lib/ai/generation-errors";
import { getProposalAiProvider } from "@/lib/ai/get-proposal-ai-provider";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const REGENERATABLE_STATUSES = new Set([
  ProposalStatus.DRAFTING,
  ProposalStatus.ANALYST_REVIEW,
  ProposalStatus.READY_TO_SEND,
  ProposalStatus.WAITING_CUSTOMER_FEEDBACK,
] as const);

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const currentUser = await getCurrentUser();

    const proposalCase = await prisma.proposalCase.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        originalRequestText: true,
        currentRevisionNumber: true,
        finalOutcome: true,
      },
    });

    if (!proposalCase) {
      return NextResponse.json({ error: "Proposal case not found" }, { status: 404 });
    }

    if (proposalCase.finalOutcome !== null) {
      return NextResponse.json(
        { error: "Cannot regenerate a case with a final outcome" },
        { status: 409 },
      );
    }

    if (!REGENERATABLE_STATUSES.has(proposalCase.status as typeof ProposalStatus.DRAFTING)) {
      return NextResponse.json(
        { error: `Cannot regenerate in status "${proposalCase.status}"` },
        { status: 409 },
      );
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
          actorUserId: currentUser.id,
          action: "regenerate_proposal",
          beforeStatus: proposalCase.status,
          afterStatus: ProposalStatus.DRAFTING,
          metadata: { revisionNumber: nextRevisionNumber },
        },
      });
    });

    const provider = getProposalAiProvider();
    const draft = await generateInitialProposalDraft(provider, {
      originalRequestText: proposalCase.originalRequestText,
    });

    await prisma.$transaction(async (tx) => {
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
        },
      });

      if (updateResult.count !== 1) {
        throw new Error("Proposal case state changed during regeneration");
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
          actorUserId: currentUser.id,
          action: "regenerate_proposal_draft",
          beforeStatus: ProposalStatus.DRAFTING,
          afterStatus: ProposalStatus.ANALYST_REVIEW,
          metadata: { revisionNumber: nextRevisionNumber },
        },
      });
    });

    return NextResponse.json({ status: "succeeded" });
  } catch (error) {
    const message = errorMessage(error, "Failed to regenerate proposal");

    try {
      await prisma.proposalCase.update({
        where: { id },
        data: { generationStatus: GenerationStatus.FAILED, generationError: message },
      });
    } catch (_) {
      void _;
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
