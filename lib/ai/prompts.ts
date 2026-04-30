import type { InitialProposalInput, RevisionProposalInput } from "./types";

const proposalStructure = [
  "1. 客户需求理解",
  "2. 分析目标",
  "3. 样本与数据要求",
  "4. 推荐分析流程",
  "5. 交付结果与图表",
  "6. 周期、注意事项与风险提示",
  "7. 需要客户补充确认的问题",
].join("\n");

const tagFieldDescriptions = [
  "productLine（业务类型，单选）: 液相芯片捕获测序 / BSA-seq / EMS 突变体分析 / WGS 重测序 / RAD-seq / GBS / RNA-seq / 甲基化 / GWAS / QTL 定位 / 图位克隆 / 群体遗传 / 其他",
  "organism（物种，单选）: 小麦 / 水稻 / 玉米 / 大豆 / 棉花 / 油菜 / 蔬菜 / 果树 / 牧草 / 其他作物 / 微生物 / 其他",
  "application（应用场景，单选）: 分子育种 / 基因定位 / 突变体筛选 / 群体遗传与进化 / 表达分析 / 基础科研 / 其他",
  "analysisDepth（分析深度，单选）: 仅下机数据 / 标准变异检测 / 高级分析(GWAS/QTL/关联) / 个性化定制分析",
  "sampleTypes（样本类型，多选）: 叶片 / 种子 / 根 / 幼苗 / 穗 / 花药 / 愈伤组织 / 群体混样(BSA pool) / DNA 抽提物 / RNA 抽提物 / 其他",
  "platforms（测序平台，多选）: Illumina / MGI / ONT / PacBio HiFi / 其他",
  'keywordTags（关键词标签，多选）: 从需求中提取 2-5 个关键术语，如 "抗赤霉病" "春化" "VRN1"',
  '示例: {"productLine":"液相芯片捕获测序","organism":"小麦","application":"分子育种","analysisDepth":"标准变异检测","sampleTypes":["叶片"],"platforms":["Illumina"],"keywordTags":["春化","抗赤霉病"]}',
];

export function buildInitialProposalPrompt(
  input: InitialProposalInput & { referencedCaseTexts?: string[] },
) {
  return [
    "你是资深生物信息分析方案顾问。请把客户的原始需求整理成专业、清晰、可交付的分析方案草稿。",
    "",
    "客户原始需求:",
    input.originalRequestText,
    "",
    ...(input.referencedCaseTexts && input.referencedCaseTexts.length > 0
      ? [
          "以下相似案例的已确认方案供参考（few-shot 示例）：",
          ...input.referencedCaseTexts.map((text, i) => `参考案例 ${i + 1}:\n${text}`),
          "",
        ]
      : []),
      "请输出以下五部分:",
      "A. 需求摘要",
      "B. 缺失信息清单",
      "C. 方案草稿，结构如下:",
      proposalStructure,
      "D. 建议标题（10 字以内，概括客户核心需求）",
      "E. 案例标签，输出为 JSON 对象。只填写能从客户信息中明确推断的字段，不确定的字段设为 null 或空数组。可用字段与枚举值：",
      ...tagFieldDescriptions,
      "",
    "要求: 不要编造客户没有提供的样本数量、物种、测序类型或交付周期；不确定的信息放入需要客户补充确认的问题。",
    "篇幅要求: 生成可供分析师二次编辑的简洁初稿，尽量控制在 1200-1800 中文字。",
  ].join("\n");
}

export function buildRevisionProposalPrompt(input: RevisionProposalInput) {
  return [
    "你是资深生物信息分析方案顾问。请基于客户反馈修订上一版方案。",
    "",
    "客户原始需求:",
    input.originalRequestText,
    "",
    "上一版已确认方案:",
    input.previousConfirmedProposal,
    "",
    "客户最新反馈:",
    input.customerFeedbackText,
    "",
      "请输出以下五部分:",
      "A. 修订说明，逐条说明如何回应客户反馈",
      "B. 修订后完整方案草稿，必须是可直接发送给客户的完整方案，不要只输出改动片段。结构如下:",
      proposalStructure,
      "C. 仍需客户确认的问题或风险",
      "D. 建议标题（10 字以内，概括客户核心需求）",
      "E. 案例标签，输出为 JSON 对象（同初次生成格式，如标签未变化可沿用之前的值）。只填写能从客户信息中明确推断的字段，不确定的字段设为 null 或空数组。可用字段与枚举值：",
      ...tagFieldDescriptions,
      "",
    "要求: 保留上一版仍然有效的内容；把客户反馈整合进完整方案正文；明确回应客户反馈；不要让 AI 草稿看起来像已经经过人工最终确认。",
    "篇幅要求: 输出完整但精炼的更新版方案，便于分析师直接审阅、微调并发送。",
  ].join("\n");
}
