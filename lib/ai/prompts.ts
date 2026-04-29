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

export function buildInitialProposalPrompt(input: InitialProposalInput) {
  return [
    "你是资深生物信息分析方案顾问。请把客户的原始需求整理成专业、清晰、可交付的分析方案草稿。",
    "",
    "客户原始需求:",
    input.originalRequestText,
    "",
     "请输出以下四部分:",
    "A. 需求摘要",
    "B. 缺失信息清单",
    "C. 方案草稿，结构如下:",
    proposalStructure,
    "D. 建议标题（10 字以内，概括客户核心需求）",
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
    "请输出以下三部分:",
    "A. 修订说明，逐条说明如何回应客户反馈",
    "B. 修订后完整方案草稿，必须是可直接发送给客户的完整方案，不要只输出改动片段。结构如下:",
    proposalStructure,
    "C. 仍需客户确认的问题或风险",
    "",
    "要求: 保留上一版仍然有效的内容；把客户反馈整合进完整方案正文；明确回应客户反馈；不要让 AI 草稿看起来像已经经过人工最终确认。",
    "篇幅要求: 输出完整但精炼的更新版方案，便于分析师直接审阅、微调并发送。",
  ].join("\n");
}
