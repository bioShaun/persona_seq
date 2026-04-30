import type { CaseTags } from "@/lib/domain/case-tags";

export type InitialProposalInput = {
  originalRequestText: string;
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
}
