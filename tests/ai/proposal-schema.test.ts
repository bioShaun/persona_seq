import { describe, expect, it } from "vitest";
import {
  InitialProposalJsonSchema,
  RevisionProposalJsonSchema,
} from "@/lib/ai/proposal-schema";

describe("proposal schemas", () => {
  it("accepts valid initial and revision proposal JSON objects", () => {
    const initialProposal = {
      requirementSummary: "客户需要水稻转录组差异表达分析方案。",
      missingInformation: "缺少样本数量与分组信息。",
      proposalDraft: "1. 需求理解\n2. 实验设计\n3. 数据分析",
      suggestedTitle: "水稻转录组分析",
      tags: {
        productLine: "RNA-seq",
        organism: "水稻",
        application: "表达分析",
        analysisDepth: "标准变异检测",
        sampleTypes: ["叶片"],
        platforms: ["Illumina"],
        keywordTags: ["差异表达", "转录组"],
      },
    };

    const revisionProposal = {
      revisionNotes: "已补充 WGCNA 分析与交付内容。",
      proposalDraft: "1. 修订需求理解\n2. 修订实验设计\n3. 修订数据分析",
      missingInformation: "仍缺少样本数量。",
      suggestedTitle: "水稻WGCNA分析",
      tags: {
        productLine: "RNA-seq",
        organism: "水稻",
        application: "表达分析",
        analysisDepth: "个性化定制分析",
        sampleTypes: ["叶片"],
        platforms: ["Illumina"],
        keywordTags: ["WGCNA"],
      },
    };

    expect(InitialProposalJsonSchema.parse(initialProposal)).toEqual(initialProposal);
    expect(RevisionProposalJsonSchema.parse(revisionProposal)).toEqual(revisionProposal);
  });

  it("rejects suggestedTitle values longer than 20 characters", () => {
    expect(() =>
      InitialProposalJsonSchema.parse({
        requirementSummary: "需求摘要",
        missingInformation: "缺失信息",
        proposalDraft: "方案草稿",
        suggestedTitle: "这是一个超过二十个字符的建议标题用于校验失败",
        tags: {},
      }),
    ).toThrow();
  });

  it("rejects tags containing enum values outside CaseTagsSchema", () => {
    expect(() =>
      InitialProposalJsonSchema.parse({
        requirementSummary: "需求摘要",
        missingInformation: "缺失信息",
        proposalDraft: "方案草稿",
        suggestedTitle: "合法标题",
        tags: {
          productLine: "火箭制造",
        },
      }),
    ).toThrow();
  });

  it("rejects objects missing required fields", () => {
    expect(() =>
      RevisionProposalJsonSchema.parse({
        proposalDraft: "方案草稿",
        missingInformation: "缺失信息",
        suggestedTitle: "合法标题",
        tags: {},
      }),
    ).toThrow();
  });
});
