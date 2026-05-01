import { z } from "zod";
import { CaseTagsSchema } from "@/lib/domain/case-tags";

const SuggestedTitleSchema = z.string().max(20);

const SharedProposalFieldsSchema = {
  proposalDraft: z.string(),
  missingInformation: z.string(),
  suggestedTitle: SuggestedTitleSchema,
  tags: CaseTagsSchema,
};

export const InitialProposalJsonSchema = z.object({
  requirementSummary: z.string(),
  ...SharedProposalFieldsSchema,
});

export const RevisionProposalJsonSchema = z.object({
  revisionNotes: z.string(),
  ...SharedProposalFieldsSchema,
});

export const TagExtractionSchema = z.object({
  tags: CaseTagsSchema,
});

export type InitialProposalJson = z.infer<typeof InitialProposalJsonSchema>;
export type RevisionProposalJson = z.infer<typeof RevisionProposalJsonSchema>;
export type TagExtractionJson = z.infer<typeof TagExtractionSchema>;
