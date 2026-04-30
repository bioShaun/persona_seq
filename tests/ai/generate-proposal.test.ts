import { describe, expect, it } from "vitest";
import {
  generateInitialProposalDraft,
  generateRevisionProposalDraft,
} from "@/lib/ai/generate-proposal";
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

  it("parses tags from section E JSON output", async () => {
    const result = await generateInitialProposalDraft(
      providerReturning(
        [
          "A. 需求摘要",
          "水稻转录组分析。",
          "",
          "C. 方案草稿",
          "1. 客户需求理解",
          "水稻差异基因表达分析方案。",
          "",
          "E. 案例标签",
          JSON.stringify({
            productLine: "RNA-seq",
            organism: "水稻",
            application: "表达分析",
            analysisDepth: "标准变异检测",
            sampleTypes: ["叶片"],
            platforms: ["Illumina"],
            keywordTags: ["差异表达", "GO富集"],
          }),
        ].join("\n"),
      ),
      { originalRequestText: "水稻转录组差异基因表达分析" },
    );

    expect(result.tags).toBeDefined();
    expect(result.tags!.productLine).toBe("RNA-seq");
    expect(result.tags!.organism).toBe("水稻");
    expect(result.tags!.keywordTags).toEqual(["差异表达", "GO富集"]);
  });

  it("returns undefined tags when section E is absent", async () => {
    const result = await generateInitialProposalDraft(
      providerReturning(
        [
          "A. 需求摘要",
          "水稻转录组分析。",
          "",
          "C. 方案草稿",
          "1. 客户需求理解",
          "水稻差异基因表达分析方案。",
        ].join("\n"),
      ),
      { originalRequestText: "水稻转录组差异基因表达分析" },
    );

    expect(result.tags).toBeUndefined();
  });

  it("returns undefined tags when section E contains malformed JSON", async () => {
    const result = await generateInitialProposalDraft(
      providerReturning(
        [
          "A. 需求摘要",
          "水稻转录组分析。",
          "",
          "E. 案例标签",
          "this is not valid json at all {{{",
        ].join("\n"),
      ),
      { originalRequestText: "水稻转录组差异基因表达分析" },
    );

    expect(result.tags).toBeUndefined();
  });

  it("still parses A/B/C/D sections correctly when E is present", async () => {
    const result = await generateInitialProposalDraft(
      providerReturning(
        [
          "A. 需求摘要",
          "水稻转录组分析要点。",
          "",
          "B. 缺失信息清单",
          "- 样本数量",
          "",
          "C. 方案草稿",
          "完整的方案内容。",
          "",
          "D. 建议标题",
          "水稻转录组分析",
          "",
          "E. 案例标签",
          JSON.stringify({ productLine: "RNA-seq", organism: "水稻" }),
        ].join("\n"),
      ),
      { originalRequestText: "水稻转录组差异基因表达分析" },
    );

    expect(result.requirementSummary).toContain("水稻转录组分析要点");
    expect(result.missingInformation).toContain("样本数量");
    expect(result.proposalDraft).toContain("完整的方案内容");
    expect(result.suggestedTitle).toContain("水稻转录组分析");
    expect(result.suggestedTitle).not.toContain("D.");
    expect(result.tags).toBeDefined();
  });

  it("revision draft extracts suggestedTitle and tags from D/E sections", async () => {
    const result = await generateRevisionProposalDraft(
      providerReturning(
        [
          "A. 修订说明",
          "已增加 WGCNA 分析。",
          "",
          "B. 修订后完整方案草稿",
          "1. 客户需求理解",
          "水稻转录组 + WGCNA 共表达网络分析方案。",
          "",
          "C. 仍需客户确认的问题",
          "- 样本数量待确认",
          "",
          "D. 建议标题",
          "水稻 WGCNA 共表达分析",
          "",
          "E. 案例标签",
          JSON.stringify({
            productLine: "RNA-seq",
            organism: "水稻",
            application: "表达分析",
            keywordTags: ["WGCNA", "共表达网络"],
          }),
        ].join("\n"),
      ),
      {
        originalRequestText: "水稻转录组分析",
        previousConfirmedProposal: "上一版方案",
        customerFeedbackText: "增加 WGCNA 分析",
      },
    );

    expect(result.suggestedTitle).toContain("水稻 WGCNA 共表达分析");
    expect(result.tags).toBeDefined();
    expect(result.tags!.productLine).toBe("RNA-seq");
    expect(result.tags!.keywordTags).toEqual(["WGCNA", "共表达网络"]);
    expect(result.revisionNotes).toContain("WGCNA");
    expect(result.proposalDraft).toContain("共表达");
  });

  it("revision draft returns undefined title and tags when sections are absent", async () => {
    const result = await generateRevisionProposalDraft(
      providerReturning(
        [
          "A. 修订说明",
          "已根据反馈修订。",
          "",
          "B. 修订后完整方案草稿",
          "1. 客户需求理解",
          "完整方案。",
        ].join("\n"),
      ),
      {
        originalRequestText: "水稻转录组",
        previousConfirmedProposal: "上一版",
        customerFeedbackText: "请修订",
      },
    );

    expect(result.suggestedTitle).toBeUndefined();
    expect(result.tags).toBeUndefined();
    expect(result.proposalDraft).toContain("完整方案");
  });
});
