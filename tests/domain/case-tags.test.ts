import { describe, expect, it } from "vitest";
import { CaseTagsSchema, hasAnyMeaningfulTag } from "@/lib/domain/case-tags";

describe("CaseTagsSchema", () => {
  it("accepts a fully valid tag object", () => {
    const validTags = {
      productLine: "液相芯片捕获测序",
      organism: "小麦",
      application: "分子育种",
      analysisDepth: "标准变异检测",
      sampleTypes: ["叶片", "种子"],
      platforms: ["Illumina", "MGI"],
      keywordTags: ["春化", "抗寒", "VRN1"],
    };

    const result = CaseTagsSchema.parse(validTags);
    expect(result).toEqual(validTags);
  });

  it("accepts an empty object (all fields are optional)", () => {
    expect(() => CaseTagsSchema.parse({})).not.toThrow();
  });

  it("rejects an invalid productLine value", () => {
    expect(() => CaseTagsSchema.parse({ productLine: "火箭制造" })).toThrow();
  });

  it("rejects an invalid organism value", () => {
    expect(() => CaseTagsSchema.parse({ organism: "外星生物" })).toThrow();
  });

  it("accepts valid multi-select sampleTypes", () => {
    const result = CaseTagsSchema.parse({ sampleTypes: ["叶片", "种子"] });
    expect(result.sampleTypes).toEqual(["叶片", "种子"]);
  });

  it("rejects sampleTypes containing an invalid value", () => {
    expect(() =>
      CaseTagsSchema.parse({ sampleTypes: ["叶片", "岩石"] }),
    ).toThrow();
  });

  it("accepts arbitrary strings in keywordTags (open vocabulary)", () => {
    const result = CaseTagsSchema.parse({ keywordTags: ["#VRN1", "春化", "抗赤霉病"] });
    expect(result.keywordTags).toEqual(["#VRN1", "春化", "抗赤霉病"]);
  });

  it("accepts null for single-select fields", () => {
    expect(() =>
      CaseTagsSchema.parse({ productLine: null, organism: null }),
    ).not.toThrow();
  });
});

describe("hasAnyMeaningfulTag", () => {
  it("returns false for an empty object", () => {
    expect(hasAnyMeaningfulTag({})).toBe(false);
  });

  it("returns false when all fields are null/undefined/empty", () => {
    expect(
      hasAnyMeaningfulTag({
        productLine: null,
        organism: null,
        application: null,
        analysisDepth: null,
        sampleTypes: [],
        platforms: [],
        keywordTags: [],
      }),
    ).toBe(false);
  });

  it("returns true when a single-select field is set", () => {
    expect(hasAnyMeaningfulTag({ productLine: "BSA-seq" })).toBe(true);
  });

  it("returns true when a multi-select field has items", () => {
    expect(hasAnyMeaningfulTag({ sampleTypes: ["叶片"] })).toBe(true);
  });

  it("returns true when keywordTags has items", () => {
    expect(hasAnyMeaningfulTag({ keywordTags: ["VRN1"] })).toBe(true);
  });
});
