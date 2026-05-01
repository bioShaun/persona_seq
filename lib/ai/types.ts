import type { CaseTags } from "@/lib/domain/case-tags";
import type { ZodType } from "zod";

export type InitialProposalInput = {
  originalRequestText: string;
  referencedCaseTexts?: string[];
};

export type RevisionProposalInput = {
  originalRequestText: string;
  previousConfirmedProposal: string;
  customerFeedbackText: string;
};

export type ProposalDraftResult = {
  requirementSummary: string;
  missingInformation: string;
  proposalDraft: string;
  revisionNotes?: string;
  suggestedTitle?: string;
  tags?: CaseTags;
};

export interface ProposalAiProvider {
  generateText(prompt: string): Promise<string>;
  generateJson<T>(
    prompt: string,
    schema: ZodType<T>,
    schemaName: string,
  ): Promise<T>;
}
