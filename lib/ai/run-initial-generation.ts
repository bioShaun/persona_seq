import "server-only";

import { revalidatePath } from "next/cache";
import { generateInitialProposalDraft } from "@/lib/ai/generate-proposal";
import { sanitizeGenerationError } from "@/lib/ai/generation-errors";
import { getProposalAiProvider } from "@/lib/ai/get-proposal-ai-provider";
import {
  markInitialGenerationFailed,
  startInitialDraftGeneration,
  updateCaseAfterInitialGeneration,
} from "@/lib/db/proposal-repository";

type RunInitialGenerationInput = {
  proposalCaseId: string;
  actorUserId: string;
};

type RunInitialGenerationResult =
  | { status: "running" }
  | { status: "succeeded" }
  | { status: "failed"; error: string };

export async function runInitialDraftGeneration(
  input: RunInitialGenerationInput,
): Promise<RunInitialGenerationResult> {
  const started = await startInitialDraftGeneration(input);

  if (started.kind === "running") {
    return { status: "running" };
  }
  if (started.kind === "noop") {
    return { status: "succeeded" };
  }

  try {
    const provider = getProposalAiProvider();
    const draft = await generateInitialProposalDraft(provider, {
      originalRequestText: started.originalRequestText,
    });

    await updateCaseAfterInitialGeneration({
      proposalCaseId: input.proposalCaseId,
      requirementSummary: draft.requirementSummary,
      missingInformation: draft.missingInformation,
      aiDraft: draft.proposalDraft,
      actorUserId: input.actorUserId,
      suggestedTitle: draft.suggestedTitle,
    });

    revalidatePath("/cases");
    revalidatePath(`/cases/${input.proposalCaseId}`);

    return { status: "succeeded" };
  } catch (error) {
    const errorMessage = sanitizeGenerationError(error);

    await markInitialGenerationFailed({
      proposalCaseId: input.proposalCaseId,
      actorUserId: input.actorUserId,
      errorMessage,
    });

    revalidatePath("/cases");
    revalidatePath(`/cases/${input.proposalCaseId}`);

    return { status: "failed", error: errorMessage };
  }
}
