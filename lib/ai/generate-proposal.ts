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
  const text = await provider.generateText(buildInitialProposalPrompt(input));

  return {
    requirementSummary: extractSection(text, "A") || "AI 已生成需求摘要，请分析人员确认。",
    missingInformation: extractSection(text, "B") || "AI 未识别出缺失信息。",
    proposalDraft: extractSection(text, "C") || text,
  };
}

export async function generateRevisionProposalDraft(
  provider: ProposalAiProvider,
  input: RevisionProposalInput,
): Promise<ProposalDraftResult> {
  const text = await provider.generateText(buildRevisionProposalPrompt(input));

  return {
    requirementSummary: "修订轮次沿用原始需求摘要。",
    missingInformation: extractSection(text, "C") || "AI 未识别出新的待确认问题。",
    proposalDraft: extractSection(text, "B") || text,
    revisionNotes: extractSection(text, "A") || "AI 已根据客户反馈生成修订草稿。",
  };
}

function extractSection(text: string, marker: "A" | "B" | "C") {
  const sectionPattern = /(^|\n)\s*([ABC])\.\s/g;
  const matches = Array.from(text.matchAll(sectionPattern)).map((match) => ({
    marker: match[2] as "A" | "B" | "C",
    start: (match.index ?? 0) + match[1].length,
  }));

  const currentSectionIndex = matches.findIndex(
    (match) => match.marker === marker,
  );
  if (currentSectionIndex === -1) return null;

  const currentSection = matches[currentSectionIndex];
  const nextSection = matches
    .slice(currentSectionIndex + 1)
    .find((match) => match.start > currentSection.start);

  return text.slice(currentSection.start, nextSection?.start).trim();
}
