"use server";

import { ProposalStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  generateInitialProposalDraft,
  generateRevisionProposalDraft,
} from "@/lib/ai/generate-proposal";
import { MockProposalAiProvider } from "@/lib/ai/mock-provider";
import {
  assertCaseWaitingCustomerFeedback,
  confirmRevision,
  createProposalCase,
  markCustomerAccepted,
  markCustomerCanceled,
  markSentToCustomer,
  updateCaseAfterInitialGeneration,
} from "@/lib/db/proposal-repository";
import { prisma } from "@/lib/db/prisma";
import { createRevisionFromCustomerFeedback } from "@/lib/domain/proposal-workflow";

const requiredString = (label: string) => z.string().trim().min(1, `${label} is required`);
const createCaseSchema = z.object({
  title: requiredString("title"),
  customerName: requiredString("customerName"),
  originalRequestText: requiredString("originalRequestText"),
  pmUserId: requiredString("pmUserId"),
  analystUserId: z.string().trim().optional(),
});

const confirmCurrentRevisionSchema = z.object({
  proposalCaseId: requiredString("proposalCaseId"),
  revisionId: requiredString("revisionId"),
  analystConfirmedText: requiredString("analystConfirmedText"),
  actorUserId: requiredString("actorUserId"),
});

const sendCurrentRevisionSchema = z.object({
  proposalCaseId: requiredString("proposalCaseId"),
  revisionId: requiredString("revisionId"),
  actorUserId: requiredString("actorUserId"),
});

const markOutcomeSchema = z.object({
  proposalCaseId: requiredString("proposalCaseId"),
  actorUserId: requiredString("actorUserId"),
});

const createRevisionFromFeedbackSchema = z.object({
  proposalCaseId: requiredString("proposalCaseId"),
  customerFeedbackText: requiredString("customerFeedbackText"),
  actorUserId: requiredString("actorUserId"),
});

function readString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function parseFormData<T>(
  schema: z.ZodType<T>,
  rawValues: Record<string, string | undefined>,
): T {
  const parsed = schema.safeParse(rawValues);
  if (parsed.success) {
    return parsed.data;
  }

  throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
}

export async function createCaseAndGenerateDraft(formData: FormData) {
  const input = parseFormData(createCaseSchema, {
    title: readString(formData, "title"),
    customerName: readString(formData, "customerName"),
    originalRequestText: readString(formData, "originalRequestText"),
    pmUserId: readString(formData, "pmUserId"),
    analystUserId: readString(formData, "analystUserId")?.trim() || undefined,
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
    actorUserId: input.pmUserId,
  });

  revalidatePath("/cases");
}

export async function confirmCurrentRevision(formData: FormData) {
  const input = parseFormData(confirmCurrentRevisionSchema, {
    proposalCaseId: readString(formData, "proposalCaseId"),
    revisionId: readString(formData, "revisionId"),
    analystConfirmedText: readString(formData, "analystConfirmedText"),
    actorUserId: readString(formData, "actorUserId"),
  });

  await confirmRevision(input);
  revalidatePath(`/cases/${input.proposalCaseId}`);
}

export async function sendCurrentRevision(formData: FormData) {
  const input = parseFormData(sendCurrentRevisionSchema, {
    proposalCaseId: readString(formData, "proposalCaseId"),
    revisionId: readString(formData, "revisionId"),
    actorUserId: readString(formData, "actorUserId"),
  });

  await markSentToCustomer(input);
  revalidatePath(`/cases/${input.proposalCaseId}`);
}

export async function markAcceptedAction(formData: FormData) {
  const input = parseFormData(markOutcomeSchema, {
    proposalCaseId: readString(formData, "proposalCaseId"),
    actorUserId: readString(formData, "actorUserId"),
  });

  await markCustomerAccepted(input);
  revalidatePath(`/cases/${input.proposalCaseId}`);
}

export async function markCanceledAction(formData: FormData) {
  const input = parseFormData(markOutcomeSchema, {
    proposalCaseId: readString(formData, "proposalCaseId"),
    actorUserId: readString(formData, "actorUserId"),
  });

  await markCustomerCanceled(input);
  revalidatePath(`/cases/${input.proposalCaseId}`);
}

export async function createRevisionFromFeedback(formData: FormData) {
  const input = parseFormData(createRevisionFromFeedbackSchema, {
    proposalCaseId: readString(formData, "proposalCaseId"),
    customerFeedbackText: readString(formData, "customerFeedbackText"),
    actorUserId: readString(formData, "actorUserId"),
  });

  const proposalCase = await prisma.proposalCase.findUnique({
    where: { id: input.proposalCaseId },
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

  if (!proposalCase) {
    throw new Error("Proposal case was not found");
  }
  assertCaseWaitingCustomerFeedback(proposalCase);

  const previousRevision = proposalCase.revisions[0];
  if (!previousRevision?.analystConfirmedText?.trim()) {
    throw new Error(
      "Previous analyst-confirmed proposal is required before creating a revision",
    );
  }

  const provider = new MockProposalAiProvider();
  const draft = await generateRevisionProposalDraft(provider, {
    originalRequestText: proposalCase.originalRequestText,
    previousConfirmedProposal: previousRevision.analystConfirmedText,
    customerFeedbackText: input.customerFeedbackText,
  });

  await prisma.$transaction(async (tx) => {
    const currentCase = await tx.proposalCase.findUnique({
      where: { id: input.proposalCaseId },
      select: {
        id: true,
        status: true,
        currentRevisionNumber: true,
        finalOutcome: true,
      },
    });

    if (!currentCase) {
      throw new Error("Proposal case was not found");
    }
    assertCaseWaitingCustomerFeedback(currentCase);

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

    if (!latestRevision?.analystConfirmedText?.trim()) {
      throw new Error(
        "Previous analyst-confirmed proposal is required before creating a revision",
      );
    }
    if (latestRevision.revisionNumber !== currentCase.currentRevisionNumber) {
      throw new Error("Current revision mismatch while creating a new revision");
    }

    const nextRevision = createRevisionFromCustomerFeedback({
      currentRevisionNumber: currentCase.currentRevisionNumber,
      customerFeedbackText: input.customerFeedbackText,
      aiDraft: draft.proposalDraft,
      revisionNotes: draft.revisionNotes ?? null,
    });

    const updateResult = await tx.proposalCase.updateMany({
      where: {
        id: input.proposalCaseId,
        status: ProposalStatus.WAITING_CUSTOMER_FEEDBACK,
        finalOutcome: null,
        currentRevisionNumber: currentCase.currentRevisionNumber,
      },
      data: {
        status: ProposalStatus.ANALYST_REVIEW,
        currentRevisionNumber: nextRevision.revisionNumber,
      },
    });

    if (updateResult.count !== 1) {
      throw new Error("Proposal case is not waiting for customer feedback");
    }

    const createdRevision = await tx.revision.create({
      data: {
        proposalCaseId: input.proposalCaseId,
        revisionNumber: nextRevision.revisionNumber,
        customerFeedbackText: nextRevision.customerFeedbackText,
        aiDraft: nextRevision.aiDraft,
        revisionNotes: nextRevision.revisionNotes,
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
  });

  revalidatePath(`/cases/${input.proposalCaseId}`);
}
