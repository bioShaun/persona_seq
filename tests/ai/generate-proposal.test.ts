import { describe, expect, it } from "vitest";
import { MockProposalAiProvider } from "@/lib/ai/mock-provider";
import {
  generateInitialProposalDraft,
  generateRevisionProposalDraft,
} from "@/lib/ai/generate-proposal";
import {
  InitialProposalJsonSchema,
  RevisionProposalJsonSchema,
} from "@/lib/ai/proposal-schema";
import type { ProposalAiProvider } from "@/lib/ai/types";

function providerReturning<T>(json: T): ProposalAiProvider {
  return {
    async generateText() {
      return JSON.stringify(json);
    },
    async generateJson<U>() {
      return json as unknown as U;
    },
  };
}

describe("proposal generation", () => {
  it("generateInitialProposalDraft returns a complete structured object", async () => {
    const json = InitialProposalJsonSchema.parse({
      requirementSummary: "小麦 BSA-seq 抗病基因定位需求。",
      missingInformation: "样本数量和交付时间待确认。",
      proposalDraft: "1. 客户需求理解\n小麦 BSA-seq 方案草稿。",
      suggestedTitle: "小麦抗病定位方案",
      tags: {
        productLine: "BSA-seq",
        organism: "小麦",
        application: "基因定位",
        analysisDepth: "个性化定制分析",
        sampleTypes: ["叶片"],
        platforms: ["Illumina"],
        keywordTags: ["抗病", "BSA-seq"],
      },
    });

    const result = await generateInitialProposalDraft(providerReturning(json), {
      originalRequestText: "小麦 BSA-seq 抗病基因定位",
    });

    expect(result).toEqual(json);
  });

  it("generateRevisionProposalDraft keeps requirementSummary fixed", async () => {
    const json = RevisionProposalJsonSchema.parse({
      revisionNotes: "已加入 WGCNA 模块并补充风险说明。",
      missingInformation: "样本分组信息待确认。",
      proposalDraft: "1. 客户需求理解\n修订后的完整方案。",
      suggestedTitle: "水稻 WGCNA 方案",
      tags: {
        productLine: "RNA-seq",
        organism: "水稻",
        application: "表达分析",
        analysisDepth: "个性化定制分析",
        sampleTypes: ["叶片"],
        platforms: ["Illumina"],
        keywordTags: ["WGCNA", "共表达"],
      },
    });

    const result = await generateRevisionProposalDraft(providerReturning(json), {
      originalRequestText: "水稻转录组分析",
      previousConfirmedProposal: "上一版方案",
      customerFeedbackText: "增加 WGCNA 分析",
    });

    expect(result).toEqual({
      requirementSummary: "修订轮次沿用原始需求摘要。",
      ...json,
    });
  });

  it("mock generateJson and generateText produce equivalent semantics", async () => {
    const provider = new MockProposalAiProvider();
    const json = (await provider.generateJson("prompt")) as {
      requirementSummary: string;
      missingInformation: string;
      proposalDraft: string;
      suggestedTitle: string;
      tags: unknown;
    };
    const text = await provider.generateText("prompt");

    expect(text).toContain(json.requirementSummary);
    expect(text).toContain(json.missingInformation);
    expect(text).toContain(json.proposalDraft);
    expect(text).toContain(json.suggestedTitle);
    expect(text).toContain(JSON.stringify(json.tags));
  });
});
