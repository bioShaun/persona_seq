import { describe, expect, it } from "vitest";
import { buildSimilarCaseSearchText } from "@/lib/search/similar-cases";

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
});
