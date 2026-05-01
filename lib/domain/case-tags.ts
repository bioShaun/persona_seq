import { z } from "zod";

export const PRODUCT_LINES = [
  "液相芯片捕获测序",
  "BSA-seq",
  "EMS 突变体分析",
  "WGS 重测序",
  "RAD-seq",
  "GBS",
  "RNA-seq",
  "甲基化",
  "GWAS",
  "QTL 定位",
  "图位克隆",
  "群体遗传",
  "其他",
] as const;

export const ORGANISMS = [
  "小麦",
  "水稻",
  "玉米",
  "大豆",
  "棉花",
  "油菜",
  "蔬菜",
  "果树",
  "牧草",
  "其他作物",
  "微生物",
  "其他",
] as const;

export const APPLICATIONS = [
  "分子育种",
  "基因定位",
  "突变体筛选",
  "群体遗传与进化",
  "表达分析",
  "基础科研",
  "其他",
] as const;

export const ANALYSIS_DEPTHS = [
  "仅下机数据",
  "标准变异检测",
  "高级分析(GWAS/QTL/关联)",
  "个性化定制分析",
] as const;

export const SAMPLE_TYPES = [
  "叶片",
  "种子",
  "根",
  "幼苗",
  "穗",
  "花药",
  "愈伤组织",
  "群体混样(BSA pool)",
  "DNA 抽提物",
  "RNA 抽提物",
  "其他",
] as const;

export const PLATFORMS = [
  "Illumina",
  "MGI",
  "ONT",
  "PacBio HiFi",
  "其他",
] as const;

export const CaseTagsSchema = z.object({
  productLine: z.enum(PRODUCT_LINES).nullable().optional(),
  organism: z.enum(ORGANISMS).nullable().optional(),
  application: z.enum(APPLICATIONS).nullable().optional(),
  analysisDepth: z.enum(ANALYSIS_DEPTHS).nullable().optional(),
  sampleTypes: z.array(z.enum(SAMPLE_TYPES)).nullable().optional(),
  platforms: z.array(z.enum(PLATFORMS)).nullable().optional(),
  keywordTags: z.array(z.string()).nullable().optional(),
});

export type CaseTags = z.infer<typeof CaseTagsSchema>;

export function hasAnyMeaningfulTag(tags: CaseTags): boolean {
  return !!(
    tags.productLine ||
    tags.organism ||
    tags.application ||
    tags.analysisDepth ||
    (tags.sampleTypes && tags.sampleTypes.length > 0) ||
    (tags.platforms && tags.platforms.length > 0) ||
    (tags.keywordTags && tags.keywordTags.length > 0)
  );
}
