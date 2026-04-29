import { describe, expect, it } from "vitest";
import { generateInitialProposalDraft } from "@/lib/ai/generate-proposal";
import type { ProposalAiProvider } from "@/lib/ai/types";

function providerReturning(text: string): ProposalAiProvider {
  return {
    async generateText() {
      return text;
    },
  };
}

describe("proposal generation parsing", () => {
  it("only treats line-start A/B/C markers as section boundaries", async () => {
    const result = await generateInitialProposalDraft(
      providerReturning(
        [
          "A. 需求摘要",
          "四倍体突变分析。",
          "",
          "B. 缺失信息清单",
          "- 样本数量",
          "",
          "C. 方案草稿",
          "1. 客户需求理解",
          "需要识别 AAAA/AAAB/AABB/ABBB/BBBB 等基因型。",
          "变异注释包含 c.A123T 这类正文内标记。",
          "2. 分析目标",
          "输出完整方案。",
        ].join("\n"),
      ),
      { originalRequestText: "四倍体突变分析" },
    );

    expect(result.proposalDraft).toContain("AAAA/AAAB");
    expect(result.proposalDraft).toContain("c.A123T");
    expect(result.proposalDraft).toContain("输出完整方案");
  });
});
