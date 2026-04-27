import { ProposalStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export function buildSimilarCaseSearchText(input: {
  originalRequestText: string;
  requirementSummary: string | null;
}) {
  return [input.originalRequestText, input.requirementSummary]
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n");
}

function extractSearchTerms(query: string) {
  return query
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2)
    .slice(0, 8);
}

export async function findSimilarAcceptedCases(input: {
  originalRequestText: string;
  requirementSummary: string | null;
  limit?: number;
}) {
  const query = buildSimilarCaseSearchText(input);
  const terms = extractSearchTerms(query);

  if (terms.length === 0) return [];

  return prisma.proposalCase.findMany({
    where: {
      status: ProposalStatus.ACCEPTED,
      OR: terms.flatMap((term) => [
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
    include: {
      revisions: {
        orderBy: { revisionNumber: "desc" },
        take: 1,
      },
    },
    take: input.limit ?? 5,
    orderBy: { updatedAt: "desc" },
  });
}
