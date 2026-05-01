import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { TagExtractionSchema } from "../lib/ai/proposal-schema";
import { OpenAiChatProposalAiProvider } from "../lib/ai/openai-chat-provider";
import { MockProposalAiProvider } from "../lib/ai/mock-provider";
import type { ProposalAiProvider } from "../lib/ai/types";
import { PRODUCT_LINES, ORGANISMS, APPLICATIONS, ANALYSIS_DEPTHS, SAMPLE_TYPES, PLATFORMS } from "../lib/domain/case-tags";

dotenv.config();

const DRY_RUN = process.argv.includes("--dry-run");

const provider = getProvider();
const prisma = new PrismaClient();

async function main() {
  const cases = await prisma.proposalCase.findMany({
    where: { productLine: null },
    select: { id: true, title: true, originalRequestText: true, requirementSummary: true },
  });

  if (cases.length === 0) {
    console.log("All cases already have tags. Nothing to do.");
    return;
  }

  console.log(`Found ${cases.length} case(s) without tags.\n`);

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i]!;
    console.log(`[${i + 1}/${cases.length}] ${c.title} (${c.id})`);

    try {
      const text = buildTagExtractionText(c.originalRequestText, c.requirementSummary);
      const { tags } = await provider.generateJson(
        text,
        TagExtractionSchema,
        "TagExtraction",
      );

      if (!tags) {
        console.log("  ⚠️  Failed to parse tags from AI response, skipping.");
        continue;
      }

      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would write: productLine=${tags.productLine}, organism=${tags.organism}, application=${tags.application}`);
      } else {
        await prisma.proposalCase.update({
          where: { id: c.id },
          data: {
            productLine: tags.productLine ?? null,
            organism: tags.organism ?? null,
            application: tags.application ?? null,
            analysisDepth: tags.analysisDepth ?? null,
            sampleTypes: tags.sampleTypes ?? [],
            platforms: tags.platforms ?? [],
            keywordTags: tags.keywordTags ?? [],
            tagsGeneratedAt: new Date(),
            tagsModel: process.env.AI_MODEL ?? null,
          },
        });
        console.log(`  ✅ Tags written: productLine=${tags.productLine}, organism=${tags.organism}, application=${tags.application}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`  ❌ Error: ${message}`);
    }
  }

  console.log(DRY_RUN ? "\nDry run complete." : "\nBackfill complete.");
}

function buildTagExtractionText(originalText: string, summary: string | null): string {
  const enumLines = [
    `productLine: ${PRODUCT_LINES.join(" / ")}`,
    `organism: ${ORGANISMS.join(" / ")}`,
    `application: ${APPLICATIONS.join(" / ")}`,
    `analysisDepth: ${ANALYSIS_DEPTHS.join(" / ")}`,
    `sampleTypes (multi): ${SAMPLE_TYPES.join(" / ")}`,
    `platforms (multi): ${PLATFORMS.join(" / ")}`,
    `keywordTags (multi): 从需求中提取 2-5 个关键术语`,
  ];

  return [
    "你是生物信息分析专家。请根据以下案例内容提取结构化标签。",
    "",
    "案例内容:",
    originalText,
    summary ? `\n需求摘要: ${summary}` : "",
    "",
    "请返回一个对象，其中 `tags` 字段必须包含以下标签字段，并只能使用这些枚举值：",
    ...enumLines,
    "",
    "只填写能从案例内容中明确推断的字段，不确定的字段设为 null 或空数组。",
  ].join("\n");
}

function getProvider(): ProposalAiProvider {
  const mode = (process.env.AI_PROVIDER ?? "mock").trim().toLowerCase();

  if (mode === "mock" || mode === "") {
    console.log("Using mock AI provider (AI_PROVIDER=mock). Tags will be placeholder values.");
    return new MockProposalAiProvider();
  }

  if (mode === "openai") {
    const apiKey = (process.env.AI_API_KEY ?? "").trim();
    if (!apiKey) throw new Error("AI_PROVIDER=openai requires AI_API_KEY");

    return new OpenAiChatProposalAiProvider({
      apiKey,
      baseUrl: (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").trim().replace(/\/+$/, ""),
      model: (process.env.AI_MODEL ?? "gpt-4o-mini").trim() || "gpt-4o-mini",
      timeoutMs: parseIntSafe(process.env.AI_TIMEOUT_MS, 120_000),
      maxTokens: parseIntSafe(process.env.AI_MAX_TOKENS, 5000),
      temperature: parseFloatSafe(process.env.AI_TEMPERATURE, 0.35),
    });
  }

  throw new Error(`Unknown AI_PROVIDER="${process.env.AI_PROVIDER}"`);
}

function parseIntSafe(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseFloatSafe(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseFloat(raw.trim());
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 1) : fallback;
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
