import { describe, expect, it } from "vitest";
import { computeRerankScore, type RerankCandidate } from "@/lib/search/ranking-weights";

const baseCandidate: RerankCandidate = {
  semanticScore: 0.8,
  organism: "小麦",
  productLine: "BSA-seq",
  customerName: "ACME",
  application: "基因定位",
  keywordTags: ["抗病", "QTL"],
  analysisDepth: "标准变异检测",
  sampleTypes: ["叶片"],
  status: "ACCEPTED",
  updatedAt: new Date("2026-04-01"),
};

const baseQuery = {
  organism: "小麦",
  productLine: "BSA-seq",
  customerName: "ACME",
  application: "基因定位",
  keywordTags: ["抗病", "QTL"],
  analysisDepth: "标准变异检测",
  sampleTypes: ["叶片"],
};

describe("computeRerankScore", () => {
  it("scores maximum when all dimensions match", () => {
    const result = computeRerankScore(baseCandidate, baseQuery, new Date("2026-04-01"));
    expect(result.totalScore).toBeGreaterThan(1.5);
    expect(result.matchedDimensions).toContain("同物种");
    expect(result.matchedDimensions).toContain("同业务类型");
    expect(result.matchedDimensions).toContain("同客户");
  });

  it("returns semanticScore in result", () => {
    const result = computeRerankScore(baseCandidate, baseQuery);
    expect(result.semanticScore).toBe(0.8);
  });

  it("handles null tags gracefully", () => {
    const candidate: RerankCandidate = {
      ...baseCandidate,
      organism: null,
      productLine: null,
      application: null,
      analysisDepth: null,
    };
    const result = computeRerankScore(candidate, baseQuery);
    expect(result.totalScore).toBeLessThan(
      computeRerankScore(baseCandidate, baseQuery).totalScore,
    );
    expect(result.matchedDimensions).not.toContain("同物种");
  });

  it("applies recency decay for older cases", () => {
    const recent = computeRerankScore(
      { ...baseCandidate, updatedAt: new Date("2026-04-01") },
      baseQuery,
      new Date("2026-04-01"),
    );
    const old = computeRerankScore(
      { ...baseCandidate, updatedAt: new Date("2025-01-01") },
      baseQuery,
      new Date("2026-04-01"),
    );
    expect(recent.totalScore).toBeGreaterThan(old.totalScore);
  });

  it("applies status penalty for non-ACCEPTED cases", () => {
    const accepted = computeRerankScore(
      { ...baseCandidate, status: "ACCEPTED" },
      baseQuery,
    );
    const ready = computeRerankScore(
      { ...baseCandidate, status: "READY_TO_SEND" },
      baseQuery,
    );
    expect(accepted.totalScore).toBeGreaterThan(ready.totalScore);
  });

  it("computes jaccard similarity for keywordTags", () => {
    const partial = computeRerankScore(
      { ...baseCandidate, keywordTags: ["抗病"] },
      baseQuery,
    );
    const full = computeRerankScore(
      { ...baseCandidate, keywordTags: ["抗病", "QTL"] },
      baseQuery,
    );
    expect(full.totalScore).toBeGreaterThan(partial.totalScore);
  });

  it("returns empty matchedDimensions when nothing matches", () => {
    const candidate: RerankCandidate = {
      semanticScore: 0.3,
      organism: "水稻",
      productLine: "RNA-seq",
      customerName: "Other",
      application: "表达分析",
      keywordTags: ["差异表达"],
      analysisDepth: "高级分析(GWAS/QTL/关联)",
      sampleTypes: ["根"],
      status: "ACCEPTED",
      updatedAt: new Date("2026-04-01"),
    };
    const result = computeRerankScore(candidate, baseQuery);
    expect(result.matchedDimensions).toEqual([]);
  });
});
