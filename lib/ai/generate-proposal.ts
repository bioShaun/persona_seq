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
      extractSection(text, "A") || "AI 已生成需求摘要，请分析人员确认。",
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
  return parseLetteredSections(text)[marker]?.trim() ?? null;
}

const sectionHeaderPattern =
  /^[ \t]{0,3}(?:#{1,6}[ \t]*)?([ABC])[ \t]*[.)：:](?:[ \t]*.*)?$/gm;

type SectionMarker = "A" | "B" | "C";

export function parseLetteredSections(text: string) {
  const matches = Array.from(text.matchAll(sectionHeaderPattern)).map((match) => ({
    marker: match[1] as SectionMarker,
    start: match.index ?? 0,
  }));

  const sections: Partial<Record<SectionMarker, string>> = {};
  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    if (!sections[current.marker]) {
      sections[current.marker] = text.slice(current.start, next?.start).trim();
    }
  }

  return sections;
}
