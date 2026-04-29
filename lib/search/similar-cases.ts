import { ProposalStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

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
