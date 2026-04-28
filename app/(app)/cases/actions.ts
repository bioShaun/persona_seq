"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  generateRevisionProposalDraft,
} from "@/lib/ai/generate-proposal";
import { errorMessage } from "@/lib/ai/generation-errors";
import { getProposalAiProvider } from "@/lib/ai/get-proposal-ai-provider";
import { runInitialDraftGeneration } from "@/lib/ai/run-initial-generation";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  assertCaseReadyForFeedbackRevision,
  confirmRevision,
  createProposalCase,
  createRevisionFromCustomerFeedback,
  markCustomerAccepted,
  markCustomerCanceled,
  markSentToCustomer,
} from "@/lib/db/proposal-repository";
import { prisma } from "@/lib/db/prisma";
import {
  parseConfirmCurrentRevisionInput,
  parseCreateCaseInput,
  parseCreateRevisionFromFeedbackInput,
  parseMarkOutcomeInput,
  parseSendCurrentRevisionInput,
} from "@/app/(app)/cases/action-inputs";

export async function createCaseAndGenerateDraft(formData: FormData) {
  const input = parseCreateCaseInput(formData);
  const currentUser = await getCurrentUser();

  const proposalCase = await createProposalCase({
    ...input,
    pmUserId: currentUser.id,
  });

  void runInitialDraftGeneration({
    proposalCaseId: proposalCase.id,
    actorUserId: currentUser.id,
  }).catch((error: unknown) => {
    console.error(
      "Initial generation background task failed:",
      errorMessage(error, "background generation failed"),
    );
  });

  revalidatePath("/cases");
  redirect(`/cases/${proposalCase.id}`);
}

export async function confirmCurrentRevision(formData: FormData) {
  const input = parseConfirmCurrentRevisionInput(formData);
  const currentUser = await getCurrentUser();

  await confirmRevision({
    ...input,
    actorUserId: currentUser.id,
  });
  revalidatePath(`/cases/${input.proposalCaseId}`);
}

export async function sendCurrentRevision(formData: FormData) {
  const input = parseSendCurrentRevisionInput(formData);
  const currentUser = await getCurrentUser();

  await markSentToCustomer({
    ...input,
    actorUserId: currentUser.id,
  });
  revalidatePath(`/cases/${input.proposalCaseId}`);
}

export async function markAcceptedAction(formData: FormData) {
  const input = parseMarkOutcomeInput(formData);
  const currentUser = await getCurrentUser();

  await markCustomerAccepted({
    ...input,
    actorUserId: currentUser.id,
  });
  revalidatePath(`/cases/${input.proposalCaseId}`);
}

export async function markCanceledAction(formData: FormData) {
  const input = parseMarkOutcomeInput(formData);
  const currentUser = await getCurrentUser();

  await markCustomerCanceled({
    ...input,
    actorUserId: currentUser.id,
  });
  revalidatePath(`/cases/${input.proposalCaseId}`);
}

export async function createRevisionFromFeedback(formData: FormData) {
  const input = parseCreateRevisionFromFeedbackInput(formData);
  const currentUser = await getCurrentUser();

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
  const previousRevision = proposalCase.revisions[0] ?? null;
  assertCaseReadyForFeedbackRevision(proposalCase, previousRevision);
  const previousConfirmedProposal = previousRevision.analystConfirmedText as string;

  const provider = getProposalAiProvider();
  const draft = await generateRevisionProposalDraft(provider, {
    originalRequestText: proposalCase.originalRequestText,
    previousConfirmedProposal,
    customerFeedbackText: input.customerFeedbackText,
  });

  await createRevisionFromCustomerFeedback({
    proposalCaseId: input.proposalCaseId,
    actorUserId: currentUser.id,
    customerFeedbackText: input.customerFeedbackText,
    aiDraft: draft.proposalDraft,
    revisionNotes: draft.revisionNotes ?? null,
  });

  revalidatePath(`/cases/${input.proposalCaseId}`);
}
