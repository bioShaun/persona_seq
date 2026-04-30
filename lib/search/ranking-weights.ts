export const RANKING_WEIGHTS = {
  cosineSim: 1.0,
  organismMatch: 0.4,
  productLineMatch: 0.35,
  customerNameMatch: 0.15,
  applicationMatch: 0.1,
  keywordTagsJaccard: 0.1,
  analysisDepthMatch: 0.05,
  sampleTypesJaccard: 0.05,
  recencyDecay: 0.05,
  statusPenalty: 0.05,
} as const;

const RECENCY_HALF_LIFE_DAYS = 180;

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function recencyDecay(updatedAt: Date, now: Date): number {
  const daysSince = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-Math.LN2 * daysSince / RECENCY_HALF_LIFE_DAYS);
}

export type RerankCandidate = {
  semanticScore: number;
  organism: string | null;
  productLine: string | null;
  customerName: string;
  application: string | null;
  keywordTags: string[];
  analysisDepth: string | null;
  sampleTypes: string[];
  status: string;
  updatedAt: Date;
};

export type RerankResult = {
  totalScore: number;
  matchedDimensions: string[];
  semanticScore: number;
};

export function computeRerankScore(
  candidate: RerankCandidate,
  query: {
    organism: string | null;
    productLine: string | null;
    customerName: string;
    application: string | null;
    keywordTags: string[];
    analysisDepth: string | null;
    sampleTypes: string[];
  },
  now: Date = new Date(),
): RerankResult {
  const w = RANKING_WEIGHTS;
  const matchedDimensions: string[] = [];

  const organismScore = candidate.organism && query.organism && candidate.organism === query.organism ? 1 : 0;
  if (organismScore) matchedDimensions.push(`同物种`);

  const productLineScore = candidate.productLine && query.productLine && candidate.productLine === query.productLine ? 1 : 0;
  if (productLineScore) matchedDimensions.push(`同业务类型`);

  const customerScore = candidate.customerName === query.customerName ? 1 : 0;
  if (customerScore) matchedDimensions.push(`同客户`);

  const applicationScore = candidate.application && query.application && candidate.application === query.application ? 1 : 0;
  if (applicationScore) matchedDimensions.push(`同应用场景`);

  const keywordScore = jaccardSimilarity(candidate.keywordTags, query.keywordTags);
  if (keywordScore > 0) matchedDimensions.push(`关键词匹配`);

  const analysisDepthScore = candidate.analysisDepth && query.analysisDepth && candidate.analysisDepth === query.analysisDepth ? 1 : 0;
  if (analysisDepthScore) matchedDimensions.push(`同分析深度`);

  const sampleTypesScore = jaccardSimilarity(candidate.sampleTypes, query.sampleTypes);
  if (sampleTypesScore > 0) matchedDimensions.push(`同样本类型`);

  const recencyScore = recencyDecay(candidate.updatedAt, now);

  const isAccepted = candidate.status === "ACCEPTED";
  const statusPenalty = isAccepted ? 0 : 1;

  const totalScore =
    candidate.semanticScore * w.cosineSim +
    organismScore * w.organismMatch +
    productLineScore * w.productLineMatch +
    customerScore * w.customerNameMatch +
    applicationScore * w.applicationMatch +
    keywordScore * w.keywordTagsJaccard +
    analysisDepthScore * w.analysisDepthMatch +
    sampleTypesScore * w.sampleTypesJaccard +
    recencyScore * w.recencyDecay -
    statusPenalty * w.statusPenalty;

  return {
    totalScore: Math.round(totalScore * 1000) / 1000,
    matchedDimensions,
    semanticScore: candidate.semanticScore,
  };
}
