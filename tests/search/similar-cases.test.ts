import { describe, expect, it, vi } from "vitest";

const findManyMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    proposalCase: {
      findMany: findManyMock,
    },
  },
}));

import {
  buildSimilarCaseSearchText,
  findSimilarAcceptedCases,
  findSimilarAcceptedCasesSafely,
  findSimilarCasesV2Safely,
  extractSimilarCaseSearchTerms,
  normalizeSearchTerm,
} from "@/lib/search/similar-cases";

describe("similar case search", () => {
  it("combines original request and requirement summary for search", () => {
    expect(
      buildSimilarCaseSearchText({
        originalRequestText: "客户想做水稻转录组分析",
        requirementSummary: "关注差异基因和富集分析",
      }),
    ).toBe("客户想做水稻转录组分析\n关注差异基因和富集分析");
  });

  it("ignores empty summary", () => {
    expect(
      buildSimilarCaseSearchText({
        originalRequestText: "肿瘤样本突变注释",
        requirementSummary: null,
      }),
    ).toBe("肿瘤样本突变注释");
  });

  it("extracts cjk 3-char ngrams from contiguous text", () => {
    const terms = extractSimilarCaseSearchTerms("水稻转录组分析");

    expect(terms).toContain("水稻转");
    expect(terms).toContain("转录组");
    expect(terms).toContain("录组分");
  });

  it("lowercases and deduplicates english tokens", () => {
    expect(
      extractSimilarCaseSearchTerms("RNA Seq analysis RNA analysis", 10),
    ).toEqual(["rna", "seq", "analysis"]);
  });

  it("removes wildcard characters from normalized term", () => {
    expect(normalizeSearchTerm("Ab%c_d")).toBe("abcd");
  });

  it("caps extracted terms by the provided limit", () => {
    const terms = extractSimilarCaseSearchTerms(
      "alpha beta gamma delta epsilon zeta eta theta iota",
      4,
    );
    expect(terms).toEqual(["alpha", "beta", "gamma", "delta"]);
  });

  it("derives reason from requirement summary", async () => {
    findManyMock.mockResolvedValueOnce([
      {
        id: "case-1",
        title: "RNA analysis",
        customerName: "ACME",
        requirementSummary: "Need alpha marker validation",
        originalRequestText: "General biology support",
        updatedAt: new Date("2025-01-01T00:00:00.000Z"),
        revisions: [],
      },
    ]);

    const results = await findSimilarAcceptedCases({
      originalRequestText: "alpha",
      requirementSummary: null,
    });

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          originalRequestText: true,
        }),
      }),
    );
    expect(results[0]?.matchedReason).toBe("Matched requirement summary: alpha");
  });

  it("excludes the current case from similar accepted results", async () => {
    findManyMock.mockResolvedValueOnce([]);

    await findSimilarAcceptedCases({
      excludeCaseId: "case-current",
      originalRequestText: "alpha",
      requirementSummary: null,
    });

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: "case-current" },
        }),
      }),
    );
  });

  it("derives reason from original request text", async () => {
    findManyMock.mockResolvedValueOnce([
      {
        id: "case-2",
        title: "Sequencing support",
        customerName: "ACME",
        requirementSummary: "General support only",
        originalRequestText: "Customer asked for alpha redesign",
        updatedAt: new Date("2025-01-01T00:00:00.000Z"),
        revisions: [],
      },
    ]);

    const results = await findSimilarAcceptedCases({
      originalRequestText: "alpha",
      requirementSummary: null,
    });

    expect(results[0]?.matchedReason).toBe("Matched original request: alpha");
  });

  it("derives reason from latest confirmed proposal", async () => {
    findManyMock.mockResolvedValueOnce([
      {
        id: "case-3",
        title: "Proposal revision",
        customerName: "ACME",
        requirementSummary: "General support only",
        originalRequestText: "General support only",
        updatedAt: new Date("2025-01-01T00:00:00.000Z"),
        revisions: [
          {
            id: "rev-1",
            revisionNumber: 3,
            analystConfirmedText: "Final alpha implementation proposal",
          },
        ],
      },
    ]);

    const results = await findSimilarAcceptedCases({
      originalRequestText: "alpha",
      requirementSummary: null,
    });

    expect(results[0]?.matchedReason).toBe("Matched confirmed proposal: alpha");
  });

  it("uses neutral fallback when no selected field includes terms", async () => {
    findManyMock.mockResolvedValueOnce([
      {
        id: "case-4",
        title: "Fallback case",
        customerName: "ACME",
        requirementSummary: "No overlap here",
        originalRequestText: "No overlap here either",
        updatedAt: new Date("2025-01-01T00:00:00.000Z"),
        revisions: [
          {
            id: "rev-2",
            revisionNumber: 1,
            analystConfirmedText: "Still no overlap",
          },
        ],
      },
    ]);

    const results = await findSimilarAcceptedCases({
      originalRequestText: "alpha",
      requirementSummary: null,
    });

    expect(results[0]?.matchedReason).toBe("Matched accepted historical case");
  });

  it("safely returns empty array when the query fails", async () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});
    findManyMock.mockRejectedValueOnce(new Error("database unavailable"));
    try {
      const results = await findSimilarAcceptedCasesSafely({
        originalRequestText: "alpha beta",
        requirementSummary: null,
      });
      expect(results).toEqual([]);
    } finally {
      stderr.mockRestore();
    }
  });

  it("findSimilarCasesV2Safely falls back to ILIKE when embedding is null", async () => {
    findManyMock.mockResolvedValueOnce([
      {
        id: "case-fallback",
        title: "Fallback case",
        customerName: "ACME",
        requirementSummary: "Some summary",
        originalRequestText: "Some request",
        updatedAt: new Date("2026-04-01"),
        revisions: [],
      },
    ]);

    const { results, usedFallback } = await findSimilarCasesV2Safely({
      excludeCaseId: "case-current",
      queryEmbedding: null,
      queryTags: {
        organism: "小麦",
        productLine: "BSA-seq",
        customerName: "ACME",
        application: null,
        keywordTags: [],
        analysisDepth: null,
        sampleTypes: [],
      },
      originalRequestText: "alpha",
      requirementSummary: null,
    });

    expect(usedFallback).toBe(true);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("case-fallback");
  });
});
