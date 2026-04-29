import "server-only";

import { MockProposalAiProvider } from "@/lib/ai/mock-provider";
import { OpenAiChatProposalAiProvider } from "@/lib/ai/openai-chat-provider";
import type { ProposalAiProvider } from "@/lib/ai/types";

const DEFAULT_BASE = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_TOKENS = 5000;
const DEFAULT_TEMPERATURE = 0.35;

function parseIntegerOrDefault(raw: string | undefined, defaultValue: number) {
  if (!raw) return defaultValue;
  const normalized = raw.trim();
  if (!/^\d+$/.test(normalized)) return defaultValue;

  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function parseTemperatureOrDefault(raw: string | undefined, defaultValue: number) {
  if (!raw) return defaultValue;
  const normalized = raw.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) return defaultValue;

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.min(Math.max(parsed, 0), 1);
}

function normalizeBaseUrl(raw: string | undefined): string {
  const trimmed = (raw ?? DEFAULT_BASE).trim().replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : DEFAULT_BASE;
}

/**
 * 根据环境变量选择 AI 实现。
 *
 * - `AI_PROVIDER=mock`：本地占位文案，不调外部接口。
 * - `AI_PROVIDER=openai`：调用 OpenAI 兼容的 `POST {base}/chat/completions`（Bearer）。
 */
export function getProposalAiProvider(): ProposalAiProvider {
  const mode = (process.env.AI_PROVIDER ?? "mock").trim().toLowerCase();

  if (mode === "mock" || mode === "") {
    return new MockProposalAiProvider();
  }

  if (mode === "openai") {
    const apiKey = (process.env.AI_API_KEY ?? "").trim();
    if (!apiKey) {
      throw new Error(
        'AI_PROVIDER=openai 时必须设置 AI_API_KEY（或改用 AI_PROVIDER=mock）',
      );
    }

    const baseUrl = normalizeBaseUrl(process.env.AI_BASE_URL);
    const model = (process.env.AI_MODEL ?? DEFAULT_MODEL).trim() || DEFAULT_MODEL;
    const timeoutMs = parseIntegerOrDefault(
      process.env.AI_TIMEOUT_MS,
      DEFAULT_TIMEOUT_MS,
    );
    const maxTokens = parseIntegerOrDefault(
      process.env.AI_MAX_TOKENS,
      DEFAULT_MAX_TOKENS,
    );
    const temperature = parseTemperatureOrDefault(
      process.env.AI_TEMPERATURE,
      DEFAULT_TEMPERATURE,
    );

    return new OpenAiChatProposalAiProvider({
      apiKey,
      baseUrl,
      model,
      timeoutMs,
      maxTokens,
      temperature,
    });
  }

  throw new Error(
    `未知的 AI_PROVIDER="${process.env.AI_PROVIDER}"，请使用 mock 或 openai`,
  );
}
