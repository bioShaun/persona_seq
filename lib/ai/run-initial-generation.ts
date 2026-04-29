import "server-only";

import { getProposalAiProvider } from "@/lib/ai/get-proposal-ai-provider";
import { runInitialDraftGeneration as runInitialDraftGenerationImpl } from "@/lib/generation/initial";
import type { InitialGenerationResult } from "@/lib/generation/types";

type RunInitialGenerationResult =
  | { status: "running" }
  | { status: "succeeded" }
  | { status: "failed"; error: string };

function toLegacyResult(result: InitialGenerationResult): RunInitialGenerationResult {
  switch (result.kind) {
    case "running":
      return { status: "running" };
    case "succeeded":
      return { status: "succeeded" };
    case "failed":
      return { status: "failed", error: result.error };
  }
}

export async function runInitialDraftGeneration(input: {
  proposalCaseId: string;
  actorUserId: string;
}): Promise<RunInitialGenerationResult> {
  const provider = getProposalAiProvider();
  const result = await runInitialDraftGenerationImpl(input, provider);
  return toLegacyResult(result);
}
