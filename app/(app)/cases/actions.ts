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
  assertCaseTagsEditable,
  confirmRevision,
  createProposalCase,
  getProposalCaseDetail,
  invalidateEmbedding,
  loadCaseWithRevision,
  persistFeedbackRevision,
  markCustomerAccepted,
  markCustomerCanceled,
  markSentToCustomer,
  reExtractCaseTags as reExtractCaseTagsInRepo,
  saveEmbedding,
  updateCaseTags as updateCaseTagsInRepo,
  updateCaseTitle as updateCaseTitleInRepo,
} from "@/lib/db/proposal-repository";
import {
  buildEmbeddingInput,
  generateEmbedding,
  getEmbeddingProvider,
} from "@/lib/ai/embedding";
import {
  parseConfirmCurrentRevisionInput,
  parseCreateCaseInput,
  parseCreateRevisionFromFeedbackInput,
  parseMarkOutcomeInput,
  parseSendCurrentRevisionInput,
  parseUpdateCaseTagsInput,
  parseUpdateCaseTitleInput,
} from "@/app/(app)/cases/action-inputs";

function extractFallbackTitle(text: string): string {
  const firstLine = text.split(/[\n\r。！？]/)[0].trim();
  if (firstLine.length <= 40) return firstLine;
  return firstLine.slice(0, 40) + "…";
}

export async function createCaseAndGenerateDraft(formData: FormData) {
  const input = parseCreateCaseInput(formData);
  const currentUser = await getCurrentUser();

  const title = input.title || extractFallbackTitle(input.originalRequestText);

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

  // Generate embedding after analyst confirms — fire-and-forget on failure
  void (async () => {
    try {
      const detail = await getProposalCaseDetail(input.proposalCaseId);
      if (!detail) return;
      const currentRev = detail.revisions.find(
        (r) => r.revisionNumber === detail.currentRevisionNumber,
      );
      const text = buildEmbeddingInput(
        detail.title,
        detail.requirementSummary,
        currentRev?.analystConfirmedText ?? input.analystConfirmedText,
      );
      const provider = getEmbeddingProvider();
      const embedding = await generateEmbedding(provider, text);
      if (embedding) {
        await saveEmbedding(input.proposalCaseId, embedding);
      }
    } catch (error) {
      console.error("Embedding generation failed after confirm:", error);
    }
  })();

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
    suggestedTitle: draft.suggestedTitle,
    tags: draft.tags,
  });

  // Invalidate stale embedding when content changes
  void invalidateEmbedding(input.proposalCaseId).catch((error) => {
    console.error("Embedding invalidation failed:", error);
  });

  revalidatePath(`/cases/${input.proposalCaseId}`);
}

export async function logSimilarCaseAction(formData: FormData) {
  const proposalCaseId = formData.get("proposalCaseId");
  const targetCaseId = formData.get("targetCaseId");
  const action = formData.get("action"); // "similar_case_clicked" or "similar_case_referenced"
  const rank = formData.get("rank");
  const matchedDimensions = formData.get("matchedDimensions");
  const semanticScore = formData.get("semanticScore");

  if (
    typeof proposalCaseId !== "string" ||
    typeof targetCaseId !== "string" ||
    (action !== "similar_case_clicked" && action !== "similar_case_referenced")
  ) {
    return;
  }

  const currentUser = await getCurrentUser().catch(() => null);
  if (!currentUser) return;

  const { prisma } = await import("@/lib/db/prisma");
  await prisma.auditLog.create({
    data: {
      proposalCaseId,
      actorUserId: currentUser.id,
      action,
      metadata: {
        sourceCaseId: proposalCaseId,
        targetCaseId,
        rank: typeof rank === "string" ? Number(rank) : null,
        matchedDimensions: typeof matchedDimensions === "string"
          ? matchedDimensions.split(",").filter(Boolean)
          : [],
        semanticScore: typeof semanticScore === "string" ? Number(semanticScore) : null,
      },
    },
  }).catch((error) => {
    console.error("Failed to log similar case action:", error);
  });
}

export async function updateCaseTags(formData: FormData) {
  const input = parseUpdateCaseTagsInput(formData);

  const proposalCase = await loadCaseWithRevision(input.proposalCaseId);
  if (!proposalCase) {
    throw new Error("案例不存在");
  }
  assertCaseTagsEditable(proposalCase.status);

  await updateCaseTagsInRepo(input.proposalCaseId, input.tags);
  revalidatePath(`/cases/${input.proposalCaseId}`);
}

export async function reExtractCaseTagsAction(formData: FormData) {
  const proposalCaseId = formData.get("proposalCaseId");
  if (typeof proposalCaseId !== "string" || !proposalCaseId.trim()) {
    throw new Error("proposalCaseId is required");
  }

  const currentUser = await getCurrentUser();
  if (currentUser.role !== "ADMIN") {
    throw new Error("管理员权限不足");
  }

  const proposalCase = await loadCaseWithRevision(proposalCaseId);
  if (!proposalCase) {
    throw new Error("案例不存在");
  }
  assertCaseTagsEditable(proposalCase.status);

  const provider = getProposalAiProvider();
  await reExtractCaseTagsInRepo(proposalCaseId, provider);
  revalidatePath(`/cases/${proposalCaseId}`);
}
