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
    expect(prompt).toContain("需求摘要");
    expect(prompt).toContain("需要客户补充确认的问题");
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
    expect(prompt).toContain("修订说明");
  });
});
