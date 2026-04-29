import type { ProposalAiProvider } from "./types";

type OpenAiChatProviderOptions = {
  apiKey: string;
  /** 不含尾斜杠，例如 https://api.openai.com/v1 或兼容服务的 /v1 根路径 */
  baseUrl: string;
  model: string;
  /** 毫秒 */
  timeoutMs: number;
  maxTokens: number;
  temperature: number;
};

type ChatCompletionsResponse = {
  choices?: Array<{
    finish_reason?: string | null;
    message?: { content?: string | null };
  }>;
  error?: { message?: string };
};

export class OpenAiChatProposalAiProvider implements ProposalAiProvider {
  private readonly options: OpenAiChatProviderOptions;

  constructor(options: OpenAiChatProviderOptions) {
    this.options = options;
  }

  async generateText(prompt: string): Promise<string> {
    const url = `${this.options.baseUrl}/chat/completions`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify({
          model: this.options.model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: this.options.maxTokens,
          temperature: this.options.temperature,
        }),
      });

      const body = (await res.json()) as ChatCompletionsResponse;

      if (!res.ok) {
        const msg = body.error?.message ?? res.statusText;
        throw new Error(`AI 请求失败 (${res.status}): ${msg}`);
      }

      const choice = body.choices?.[0];
      if (choice?.finish_reason === "length") {
        throw new Error(
          "AI 返回内容被截断，请提高 AI_MAX_TOKENS 后重新生成。",
        );
      }

      const text = choice?.message?.content;
      if (typeof text !== "string" || !text.trim()) {
        throw new Error("AI 返回内容为空");
      }

      return text;
    } finally {
      clearTimeout(timeout);
    }
  }
}
