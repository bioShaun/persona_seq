import { ProposalStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { computeRerankScore, type RerankCandidate } from "./ranking-weights";

const CJK_SEQUENCE_REGEX =
  /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+$/u;
const TERM_CHUNK_REGEX =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+|[A-Za-z0-9%_]+/gu;

export function buildSimilarCaseSearchText(input: {
  originalRequestText: string;
  requirementSummary: string | null;
}) {
  return [input.originalRequestText, input.requirementSummary]
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n");
}

export function normalizeSearchTerm(term: string) {
  return term.toLowerCase().replace(/[%_]/g, "").trim();
}

export function extractSimilarCaseSearchTerms(text: string, limit = 15) {
  const chunks = text.match(TERM_CHUNK_REGEX) ?? [];
  const seen = new Set<string>();
  const terms: string[] = [];

  const pushTerm = (term: string) => {
    if (!term || seen.has(term) || terms.length >= limit) return;
    seen.add(term);
    terms.push(term);
  };

  for (const chunk of chunks) {
    if (terms.length >= limit) break;

    if (CJK_SEQUENCE_REGEX.test(chunk)) {
      if (chunk.length < 2) continue;

      for (let i = 0; i < chunk.length - 2; i += 1) {
        pushTerm(chunk.slice(i, i + 3));
        if (terms.length >= limit) break;
      }
      continue;
    }

    const normalized = normalizeSearchTerm(chunk);
    if (normalized.length >= 2) {
      pushTerm(normalized);
    }
  }

  return terms;
}

function containsTermInsensitive(content: string | null, term: string) {
  if (!content) return false;
  return content.toLowerCase().includes(term.toLowerCase());
}

export function buildMatchedReason(input: {
  terms: string[];
  requirementSummary: string | null;
  originalRequestText: string;
  latestAnalystConfirmedText: string | null;
}) {
  for (const term of input.terms) {
    if (containsTermInsensitive(input.requirementSummary, term)) {
      return `Matched requirement summary: ${term}`;
    }

    if (containsTermInsensitive(input.originalRequestText, term)) {
      return `Matched original request: ${term}`;
    }

    if (containsTermInsensitive(input.latestAnalystConfirmedText, term)) {
      return `Matched confirmed proposal: ${term}`;
    }
  }

  return "Matched accepted historical case";
}

export async function findSimilarAcceptedCases(input: {
  excludeCaseId?: string;
  originalRequestText: string;
  requirementSummary: string | null;
  limit?: number;
}) {
  const query = buildSimilarCaseSearchText(input);
  const terms = extractSimilarCaseSearchTerms(query);

  if (terms.length === 0) return [];

  const cases = await prisma.proposalCase.findMany({
    where: {
      id: input.excludeCaseId ? { not: input.excludeCaseId } : undefined,
      status: ProposalStatus.ACCEPTED,
      OR: terms.flatMap((term) => [
        { title: { contains: term, mode: "insensitive" as const } },
        { requirementSummary: { contains: term, mode: "insensitive" as const } },
        { originalRequestText: { contains: term, mode: "insensitive" as const } },
        {
          revisions: {
            some: {
              analystConfirmedText: { contains: term, mode: "insensitive" as const },
            },
          },
        },
      ]),
    },
    select: {
      id: true,
      title: true,
      customerName: true,
      requirementSummary: true,
      originalRequestText: true,
      updatedAt: true,
      revisions: {
        orderBy: { revisionNumber: "desc" },
        take: 1,
        select: {
          id: true,
          revisionNumber: true,
          analystConfirmedText: true,
        },
      },
    },
    take: input.limit ?? 5,
    orderBy: { updatedAt: "desc" },
  });

  return cases
    .map((caseItem) => {
      let score = 0;
      for (const term of terms) {
        if (containsTermInsensitive(caseItem.requirementSummary, term)) score += 3;
        if (containsTermInsensitive(caseItem.originalRequestText, term)) score += 2;
        if (containsTermInsensitive(caseItem.title, term)) score += 2;
        if (containsTermInsensitive(caseItem.revisions[0]?.analystConfirmedText, term)) score += 1;
      }
      return {
        ...caseItem,
        matchedReason: buildMatchedReason({
          terms,
          requirementSummary: caseItem.requirementSummary,
          originalRequestText: caseItem.originalRequestText,
          latestAnalystConfirmedText: caseItem.revisions[0]?.analystConfirmedText ?? null,
        }),
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/** Never rejects — similar cases are ancillary; failures should not break case detail SSR. */
export async function findSimilarAcceptedCasesSafely(input: {
  excludeCaseId?: string;
  originalRequestText: string;
  requirementSummary: string | null;
  limit?: number;
}) {
  try {
    return await findSimilarAcceptedCases(input);
  } catch (error: unknown) {
    console.error("findSimilarAcceptedCases:", error);
    return [];
  }
}

type SimilarCaseV2Result = {
  id: string;
  title: string;
  customerName: string;
  requirementSummary: string | null;
  originalRequestText: string;
  updatedAt: Date;
  organism: string | null;
  productLine: string | null;
  application: string | null;
  analysisDepth: string | null;
  sampleTypes: string[];
  platforms: string[];
  keywordTags: string[];
  status: string;
  analystConfirmedText: string | null;
  semanticScore: number;
  totalScore: number;
  matchedDimensions: string[];
  isSameCustomer: boolean;
};

type PgvectorCandidate = {
  id: string;
  title: string;
  customerName: string;
  requirementSummary: string | null;
  originalRequestText: string;
  updatedAt: Date;
  organism: string | null;
  productLine: string | null;
  application: string | null;
  analysisDepth: string | null;
  sampleTypes: string[];
  platforms: string[];
  keywordTags: string[];
  status: string;
  analystConfirmedText: string | null;
  cosine_sim: number;
};

export async function findSimilarCasesV2(input: {
  excludeCaseId: string;
  queryEmbedding: number[];
  queryTags: {
    organism: string | null;
    productLine: string | null;
    customerName: string;
    application: string | null;
    keywordTags: string[];
    analysisDepth: string | null;
    sampleTypes: string[];
  };
  limit?: number;
}): Promise<SimilarCaseV2Result[]> {
  const vectorStr = `[${input.queryEmbedding.join(",")}]`;
  const limit = input.limit ?? 5;

  const candidates = await prisma.$queryRaw<PgvectorCandidate[]>`
    SELECT
      pc.id,
      pc.title,
      pc."customerName",
      pc."requirementSummary",
      pc."originalRequestText",
      pc."updatedAt",
      pc.organism,
      pc."productLine",
      pc.application,
      pc."analysisDepth",
      pc."sampleTypes",
      pc.platforms,
      pc."keywordTags",
      pc.status,
      (SELECT r."analystConfirmedText"
       FROM "Revision" r
       WHERE r."proposalCaseId" = pc.id
       ORDER BY r."revisionNumber" DESC
       LIMIT 1) AS "analystConfirmedText",
      1 - (pc.embedding <=> ${vectorStr}::vector) AS cosine_sim
    FROM "ProposalCase" pc
    WHERE pc.id != ${input.excludeCaseId}
      AND pc.status IN ('accepted', 'ready_to_send', 'waiting_customer_feedback')
      AND pc.embedding IS NOT NULL
    ORDER BY pc.embedding <=> ${vectorStr}::vector
    LIMIT 30
  `;

  const now = new Date();
  const reranked = candidates
    .map((c) => {
      const candidate: RerankCandidate = {
        semanticScore: c.cosine_sim,
        organism: c.organism,
        productLine: c.productLine,
        customerName: c.customerName,
        application: c.application,
        keywordTags: c.keywordTags,
        analysisDepth: c.analysisDepth,
        sampleTypes: c.sampleTypes,
        status: c.status,
        updatedAt: c.updatedAt,
      };
      const rerank = computeRerankScore(candidate, input.queryTags, now);
      return {
        id: c.id,
        title: c.title,
        customerName: c.customerName,
        requirementSummary: c.requirementSummary,
        originalRequestText: c.originalRequestText,
        updatedAt: c.updatedAt,
        organism: c.organism,
        productLine: c.productLine,
        application: c.application,
        analysisDepth: c.analysisDepth,
        sampleTypes: c.sampleTypes,
        platforms: c.platforms,
        keywordTags: c.keywordTags,
        status: c.status,
        analystConfirmedText: c.analystConfirmedText,
        semanticScore: rerank.semanticScore,
        totalScore: rerank.totalScore,
        matchedDimensions: rerank.matchedDimensions,
        isSameCustomer: c.customerName === input.queryTags.customerName,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);

  return reranked;
}

export async function findSimilarCasesV2Safely(input: {
  excludeCaseId: string;
  queryEmbedding: number[] | null;
  queryTags: {
    organism: string | null;
    productLine: string | null;
    customerName: string;
    application: string | null;
    keywordTags: string[];
    analysisDepth: string | null;
    sampleTypes: string[];
  };
  originalRequestText: string;
  requirementSummary: string | null;
  limit?: number;
}): Promise<{ results: SimilarCaseV2Result[]; usedFallback: boolean }> {
  if (input.queryEmbedding) {
    try {
      const results = await findSimilarCasesV2({
        excludeCaseId: input.excludeCaseId,
        queryEmbedding: input.queryEmbedding,
        queryTags: input.queryTags,
        limit: input.limit,
      });
      return { results, usedFallback: false };
    } catch (error) {
      console.error("findSimilarCasesV2 failed, falling back:", error);
    }
  }

  // Fallback to old ILIKE search
  try {
    const fallbackResults = await findSimilarAcceptedCases({
      excludeCaseId: input.excludeCaseId,
      originalRequestText: input.originalRequestText,
      requirementSummary: input.requirementSummary,
      limit: input.limit,
    });
    const mapped: SimilarCaseV2Result[] = fallbackResults.map((r) => ({
      id: r.id,
      title: r.title,
      customerName: r.customerName,
      requirementSummary: r.requirementSummary,
      originalRequestText: r.originalRequestText,
      updatedAt: r.updatedAt,
      organism: null,
      productLine: null,
      application: null,
      analysisDepth: null,
      sampleTypes: [],
      platforms: [],
      keywordTags: [],
      status: "ACCEPTED",
      analystConfirmedText: r.revisions[0]?.analystConfirmedText ?? null,
      semanticScore: 0,
      totalScore: r.score,
      matchedDimensions: [],
      isSameCustomer: r.customerName === input.queryTags.customerName,
    }));
    return { results: mapped, usedFallback: true };
  } catch (error) {
    console.error("findSimilarCasesV2 fallback also failed:", error);
    return { results: [], usedFallback: true };
  }
}
