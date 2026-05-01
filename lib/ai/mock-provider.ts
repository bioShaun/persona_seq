import {
  InitialProposalJsonSchema,
  RevisionProposalJsonSchema,
  TagExtractionSchema,
} from "./proposal-schema";
import type { ProposalAiProvider } from "./types";
import type { ZodType } from "zod";

const MOCK_TAGS = {
  productLine: "其他" as const,
  organism: "其他" as const,
  application: "基础科研" as const,
  analysisDepth: "仅下机数据" as const,
  sampleTypes: ["其他" as const],
  platforms: ["Illumina" as const],
  keywordTags: ["生物信息"],
};

const MOCK_PROPOSAL_DRAFT = [
  "1. 客户需求理解",
  "本方案根据客户提供的信息形成初步分析路线。",
  "2. 分析目标",
  "明确关键生物学问题并设计对应分析模块。",
  "3. 样本与数据要求",
  "请客户补充样本与数据细节。",
  "4. 推荐分析流程",
  "根据确认后的数据类型设计分析流程。",
  "5. 交付结果与图表",
  "交付分析报告、结果表格和核心图表。",
  "6. 周期、注意事项与风险提示",
  "周期需在样本和分析模块确认后评估。",
  "7. 需要客户补充确认的问题",
  "请确认样本、数据和重点分析目标。",
].join("\n");

const MOCK_INITIAL_PROPOSAL_JSON = InitialProposalJsonSchema.parse({
  requirementSummary:
    "根据客户原始描述，客户需要围绕生物信息数据开展个性化分析方案设计。",
  missingInformation:
    "样本类型、样本数量、物种、数据类型、期望交付物需要进一步确认。",
  proposalDraft: MOCK_PROPOSAL_DRAFT,
  suggestedTitle: "生物信息分析方案",
  tags: MOCK_TAGS,
});

const MOCK_REVISION_PROPOSAL_JSON = RevisionProposalJsonSchema.parse({
  revisionNotes: "已根据客户反馈调整方案内容，补充了分析模块说明。",
  missingInformation: "样本分组信息待确认。",
  proposalDraft: MOCK_PROPOSAL_DRAFT,
  suggestedTitle: "生物信息分析方案",
  tags: MOCK_TAGS,
});

const MOCK_TAG_EXTRACTION_JSON = TagExtractionSchema.parse({
  tags: MOCK_TAGS,
});

const MOCK_JSON_BY_SCHEMA = new Map<ZodType, unknown>([
  [InitialProposalJsonSchema, MOCK_INITIAL_PROPOSAL_JSON],
  [RevisionProposalJsonSchema, MOCK_REVISION_PROPOSAL_JSON],
  [TagExtractionSchema, MOCK_TAG_EXTRACTION_JSON],
]);

export class MockProposalAiProvider implements ProposalAiProvider {
  async generateText(prompt: string) {
    return [
      "A. 需求摘要",
      "根据客户原始描述，客户需要围绕生物信息数据开展个性化分析方案设计。",
      "",
      "B. 缺失信息清单",
      "- 样本类型、样本数量、物种、数据类型、期望交付物需要进一步确认。",
      "",
      "C. 方案草稿",
      "1. 客户需求理解",
      "本方案根据客户提供的信息形成初步分析路线。",
      "2. 分析目标",
      "明确关键生物学问题并设计对应分析模块。",
      "3. 样本与数据要求",
      "请客户补充样本与数据细节。",
      "4. 推荐分析流程",
      "根据确认后的数据类型设计分析流程。",
      "5. 交付结果与图表",
      "交付分析报告、结果表格和核心图表。",
      "6. 周期、注意事项与风险提示",
      "周期需在样本和分析模块确认后评估。",
      "7. 需要客户补充确认的问题",
      "请确认样本、数据和重点分析目标。",
      "",
      "D. 建议标题",
      "生物信息分析方案",
      "",
      "E. 案例标签",
      JSON.stringify({
        productLine: "其他",
        organism: "其他",
        application: "基础科研",
        analysisDepth: "仅下机数据",
        sampleTypes: ["其他"],
        platforms: ["Illumina"],
        keywordTags: ["生物信息"],
      }),
      "",
      `--- prompt length: ${prompt.length}`,
    ].join("\n");
  }

  async generateJson<T>(_prompt: string, schema?: ZodType<T>): Promise<T> {
    if (schema) {
      const mock = MOCK_JSON_BY_SCHEMA.get(schema);
      if (mock !== undefined) return mock as T;
    }
    return MOCK_INITIAL_PROPOSAL_JSON as T;
  }
}
