import { CaseTagsSchema } from "@/lib/domain/case-tags";
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

  const suggestedTitle = extractTitle(text);
  return {
    requirementSummary:
      extractSection(text, "A.") ??
      "AI 已生成需求摘要，请分析人员确认。",
    missingInformation:
      extractSection(text, "B.") ?? "AI 未识别出缺失信息。",
    proposalDraft: extractSection(text, "C.") ?? text,
    suggestedTitle: suggestedTitle ?? undefined,
    tags: parseTags(text),
  };
}

export async function generateRevisionProposalDraft(
  provider: ProposalAiProvider,
  input: RevisionProposalInput,
): Promise<ProposalDraftResult> {
  const text = await provider.generateText(buildRevisionProposalPrompt(input));

  const suggestedTitle = extractTitle(text);

  return {
    requirementSummary: "修订轮次沿用原始需求摘要。",
    missingInformation:
      extractSection(text, "C.") ?? "AI 未识别出新的待确认问题。",
    proposalDraft: extractSection(text, "B.") ?? text,
    revisionNotes: extractSection(text, "A.") ?? "AI 已根据客户反馈生成修订草稿。",
    suggestedTitle: suggestedTitle ?? undefined,
    tags: parseTags(text),
  };
}

function extractSection(text: string, marker: string) {
  const headingRegex = /^\s*(A\.|B\.|C\.|D\.|E\.)/gm;
  const headings = [...text.matchAll(headingRegex)].map((match) => ({
    marker: match[1],
    index: match.index ?? 0,
  }));
  const current = headings.find((heading) => heading.marker === marker);

  if (!current) return null;

  const nextHeading = headings.find((heading) => heading.index > current.index);
  const dashedLine = text.indexOf("\n---", current.index + marker.length);
  let endExclusive: number | undefined = nextHeading?.index;

  if (typeof endExclusive !== "number" && dashedLine > -1) {
    endExclusive = dashedLine;
  }

  return text.slice(current.index, endExclusive).trim();
}

function extractTitle(text: string): string | null {
  const section = extractSection(text, "D.");
  if (!section) return null;

  const lines = section.split("\n");
  if (lines.length > 1) {
    const body = lines.slice(1).join("\n").trim();
    if (body) return body;
  }
  return lines[0].replace(/^D\.\s*/, "").trim() || null;
}

export function parseTags(text: string): ProposalDraftResult["tags"] {
  const section = extractSection(text, "E.");
  if (section) {
    try {
      const jsonStart = section.indexOf("{");
      if (jsonStart !== -1) {
        const parsed = JSON.parse(section.slice(jsonStart));
        return CaseTagsSchema.parse(parsed);
      }
    } catch {
    }

    return parseTagsFromJson(section);
  }

  return parseTagsFromJson(text);
}

export function parseTagsFromJson(text: string): ProposalDraftResult["tags"] {
  try {
    const trimmed = text.trim();
    const jsonStart = trimmed.indexOf("{");
    if (jsonStart === -1) return undefined;
    const parsed = JSON.parse(trimmed.slice(jsonStart));
    return CaseTagsSchema.parse(parsed);
  } catch {
    return undefined;
  }
}
