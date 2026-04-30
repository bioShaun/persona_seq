import "server-only";

import { revalidatePath } from "next/cache";
import { generateInitialProposalDraft } from "@/lib/ai/generate-proposal";
import { sanitizeGenerationError } from "@/lib/ai/generation-errors";
import type { ProposalAiProvider } from "@/lib/ai/types";
import {
  markInitialGenerationFailed,
  startInitialDraftGeneration,
  updateCaseAfterInitialGeneration,
} from "@/lib/db/proposal-repository";
import type { GenerationInput, InitialGenerationResult } from "./types";

export async function runInitialDraftGeneration(
  input: GenerationInput,
  provider: ProposalAiProvider,
): Promise<InitialGenerationResult> {
  const started = await startInitialDraftGeneration(input);

  if (started.kind === "running") {
    return { kind: "running" };
  }
  if (started.kind === "noop") {
    return { kind: "succeeded" };
  }

  try {
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
      tags: draft.tags,
    });

    revalidatePath("/cases");
    revalidatePath(`/cases/${input.proposalCaseId}`);

    return { kind: "succeeded" };
  } catch (error) {
    const errorMessage = sanitizeGenerationError(error);

    await markInitialGenerationFailed({
      proposalCaseId: input.proposalCaseId,
      actorUserId: input.actorUserId,
      errorMessage,
    });

    revalidatePath("/cases");
    revalidatePath(`/cases/${input.proposalCaseId}`);

    return { kind: "failed", error: errorMessage };
  }
}
