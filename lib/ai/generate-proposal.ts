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
    requirementSummary:
      extractSection(text, "A.") ??
      "AI 已生成需求摘要，请分析人员确认。",
    missingInformation:
      extractSection(text, "B.") ?? "AI 未识别出缺失信息。",
    proposalDraft: extractSection(text, "C.") ?? text,
  };
}

export async function generateRevisionProposalDraft(
  provider: ProposalAiProvider,
  input: RevisionProposalInput,
): Promise<ProposalDraftResult> {
  const text = await provider.generateText(buildRevisionProposalPrompt(input));

  return {
    requirementSummary: "修订轮次沿用原始需求摘要。",
    missingInformation:
      extractSection(text, "C.") ?? "AI 未识别出新的待确认问题。",
    proposalDraft: extractSection(text, "B.") ?? text,
    revisionNotes: extractSection(text, "A.") ?? "AI 已根据客户反馈生成修订草稿。",
  };
}

function extractSection(text: string, marker: string) {
  const index = text.indexOf(marker);
  if (index === -1) return null;

  const markers = ["A.", "B.", "C."]
    .map((candidate) => ({ marker: candidate, index: text.indexOf(candidate, index + marker.length) }))
    .filter((candidate) => candidate.index > index)
    .sort((a, b) => a.index - b.index);

  const dashedLine = text.indexOf("\n---", index + marker.length);
  let endExclusive: number | undefined = markers[0]?.index;

  if (typeof endExclusive !== "number" && dashedLine > -1) {
    endExclusive = dashedLine;
  }

  return text.slice(index, endExclusive).trim();
}
