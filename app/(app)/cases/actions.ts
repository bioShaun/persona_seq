"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  generateRevisionProposalDraft,
} from "@/lib/ai/generate-proposal";
import { errorMessage } from "@/lib/ai/generation-errors";
import { getProposalAiProvider } from "@/lib/ai/get-proposal-ai-provider";
import { runInitialDraftGeneration } from "@/lib/generation/initial";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRevisionFromCustomerFeedback as buildFeedbackRevision } from "@/lib/domain/proposal-workflow";
import {
  assertCaseReadyForFeedbackRevision,
  confirmRevision,
  createProposalCase,
  loadCaseWithRevision,
  persistFeedbackRevision,
  markCustomerAccepted,
  markCustomerCanceled,
  markSentToCustomer,
  updateCaseTitle as updateCaseTitleInRepo,
} from "@/lib/db/proposal-repository";
import {
  parseConfirmCurrentRevisionInput,
  parseCreateCaseInput,
  parseCreateRevisionFromFeedbackInput,
  parseMarkOutcomeInput,
  parseSendCurrentRevisionInput,
  parseUpdateCaseTitleInput,
} from "@/app/(app)/cases/action-inputs";

export async function createCaseAndGenerateDraft(formData: FormData) {
  const input = parseCreateCaseInput(formData);
  const currentUser = await getCurrentUser();

  const title =
    input.title ||
    input.originalRequestText.replace(/\s+/g, "").slice(0, 20) + "…";

  const proposalCase = await createProposalCase({
    ...input,
    title,
    pmUserId: currentUser.id,
  });

  const provider = getProposalAiProvider();
  void runInitialDraftGeneration(
    { proposalCaseId: proposalCase.id, actorUserId: currentUser.id },
    provider,
  ).catch((error: unknown) => {
    console.error(
      "Initial generation background task failed:",
      errorMessage(error, "background generation failed"),
    );
  });

  revalidatePath("/cases");
  redirect(`/cases/${proposalCase.id}`);
}

export async function updateCaseTitle(formData: FormData) {
  const input = parseUpdateCaseTitleInput(formData);

  await updateCaseTitleInRepo(input.proposalCaseId, input.title);

  revalidatePath(`/cases/${input.proposalCaseId}`);
}

export async function confirmCurrentRevision(formData: FormData) {
  const input = parseConfirmCurrentRevisionInput(formData);
  const currentUser = await getCurrentUser();

  await confirmRevision({
    ...input,
    actorUserId: currentUser.id,
  });
  // Full navigation clears RSC/cache for this segment; revalidate alone can leave stale client state after mutate.
  redirect(`/cases/${input.proposalCaseId}`);
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

  const proposalCase = await loadCaseWithRevision(input.proposalCaseId);

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

  const revisionData = buildFeedbackRevision({
    currentRevisionNumber: proposalCase.currentRevisionNumber,
    customerFeedbackText: input.customerFeedbackText,
    aiDraft: draft.proposalDraft,
    revisionNotes: draft.revisionNotes ?? null,
  });

  await persistFeedbackRevision({
    proposalCaseId: input.proposalCaseId,
    actorUserId: currentUser.id,
    revisionData,
  });

  revalidatePath(`/cases/${input.proposalCaseId}`);
}
