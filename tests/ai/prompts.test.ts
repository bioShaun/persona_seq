import { describe, expect, it } from "vitest";
import {
  buildInitialProposalPrompt,
  buildRevisionProposalPrompt,
} from "@/lib/ai/prompts";

describe("AI proposal prompts", () => {
  it("builds an initial prompt from original customer text", () => {
    const prompt = buildInitialProposalPrompt({
      originalRequestText: "客户想做水稻转录组差异分析，并关注抗逆相关基因。",
    });

    expect(prompt).toContain("客户原始需求");
    expect(prompt).toContain("水稻转录组差异分析");
    expect(prompt).toContain("requirementSummary");
    expect(prompt).toContain("proposalDraft");
    expect(prompt).toContain("tags");
    expect(prompt).toContain("1. 客户需求理解");
    expect(prompt).toContain("7. 需要客户补充确认的问题");
  });

  it("builds a revision prompt using previous confirmed proposal and feedback", () => {
    const prompt = buildRevisionProposalPrompt({
      originalRequestText: "客户想做水稻转录组差异分析。",
      previousConfirmedProposal: "上一版建议包含差异分析和 GO/KEGG 富集。",
      customerFeedbackText: "客户希望增加 WGCNA 分析。",
    });

    expect(prompt).toContain("上一版已确认方案");
    expect(prompt).toContain("客户最新反馈");
    expect(prompt).toContain("WGCNA");
    expect(prompt).toContain("revisionNotes");
    expect(prompt).toContain("proposalDraft");
    expect(prompt).toContain("missingInformation");
    expect(prompt).toContain("suggestedTitle");
    expect(prompt).toContain("tags");
    expect(prompt).toContain("不要只输出改动片段");
    expect(prompt).toContain("1. 客户需求理解");
    expect(prompt).toContain("7. 需要客户补充确认的问题");
  });

  it("revision prompt describes field-level output instead of A-E sections", () => {
    const prompt = buildRevisionProposalPrompt({
      originalRequestText: "水稻转录组",
      previousConfirmedProposal: "上一版方案",
      customerFeedbackText: "增加 WGCNA",
    });

    expect(prompt).toContain("请返回一个结构化对象");
    expect(prompt).not.toContain("A. 修订说明");
    expect(prompt).not.toContain("B. 修订后完整方案草稿");
  });

  it("both prompts instruct AI to leave uncertain tags as null", () => {
    const initial = buildInitialProposalPrompt({
      originalRequestText: "水稻转录组",
    });
    const revision = buildRevisionProposalPrompt({
      originalRequestText: "水稻转录组",
      previousConfirmedProposal: "上一版",
      customerFeedbackText: "增加分析",
    });

    for (const prompt of [initial, revision]) {
      expect(prompt).toContain("不确定");
      expect(prompt).toContain("null");
    }
  });
});
