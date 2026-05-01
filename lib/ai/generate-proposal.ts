import {
  InitialProposalJsonSchema,
  RevisionProposalJsonSchema,
} from "./proposal-schema";
import { buildInitialProposalPrompt, buildRevisionProposalPrompt } from "./prompts";
import type {
  InitialProposalInput,
  ProposalAiProvider,
  ProposalDraftResult,
  RevisionProposalInput,
} from "./types";

export async function generateInitialProposalDraft(
  provider: ProposalAiProvider,
  input: InitialProposalInput,
): Promise<ProposalDraftResult> {
  return provider.generateJson(
    buildInitialProposalPrompt(input),
    InitialProposalJsonSchema,
    "InitialProposal",
  );
}

export async function generateRevisionProposalDraft(
  provider: ProposalAiProvider,
  input: RevisionProposalInput,
): Promise<ProposalDraftResult> {
  const json = await provider.generateJson(
    buildRevisionProposalPrompt(input),
    RevisionProposalJsonSchema,
    "RevisionProposal",
  );

  return {
    requirementSummary: "修订轮次沿用原始需求摘要。",
    ...json,
  };
}
