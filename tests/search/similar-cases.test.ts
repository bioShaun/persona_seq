import { describe, expect, it } from "vitest";
import {
  buildSimilarCaseSearchText,
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

  it("extracts cjk 2-char ngrams from contiguous text", () => {
    const terms = extractSimilarCaseSearchTerms("水稻转录组分析");

    expect(terms).toContain("水稻");
    expect(terms).toContain("转录");
    expect(terms).toContain("录组");
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
});
