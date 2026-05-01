import { zodToJsonSchema } from "zod-to-json-schema";
import type { ZodType } from "zod";
import { AIGenerationError } from "./generation-errors";
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
  jsonMode?: "json_schema" | "json_object";
};

type ChatCompletionsResponse = {
  choices?: Array<{
    finish_reason?: string | null;
    message?: { content?: string | null };
  }>;
  error?: { message?: string };
};

type ChatCompletionsRequestBody = {
  model: string;
  messages: Array<{ role: "user"; content: string }>;
  max_tokens: number;
  temperature: number;
  response_format?:
    | {
        type: "json_schema";
        json_schema: {
          name: string;
          strict: true;
          schema: Record<string, unknown>;
        };
      }
    | { type: "json_object" };
};

const INVALID_JSON_RETRY_HINT =
  "上次输出不是合法 JSON，请只返回符合 schema 的 JSON 对象";

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

  async generateJson<T>(
    prompt: string,
    schema: ZodType<T>,
    schemaName: string,
  ): Promise<T> {
    const jsonSchema = zodToJsonSchema(schema, {
      name: schemaName,
      target: "openAi",
    }) as Record<string, unknown>;

    const responseFormat =
      this.options.jsonMode === "json_object"
        ? { type: "json_object" as const }
        : {
            type: "json_schema" as const,
            json_schema: {
              name: schemaName,
              strict: true as const,
              schema: jsonSchema,
            },
          };

    let retryPrompt = this.buildJsonPrompt(prompt, jsonSchema);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const text = await this.requestContent(retryPrompt, responseFormat);

      try {
        const parsedJson = JSON.parse(text) as unknown;
        return schema.parse(parsedJson);
      } catch (error) {
        if (attempt === 1) {
          const detail = error instanceof Error ? `: ${error.message}` : "";
          throw new AIGenerationError(`schema 校验失败${detail}`);
        }

        retryPrompt = `${this.buildJsonPrompt(prompt, jsonSchema)}\n\n${INVALID_JSON_RETRY_HINT}`;
      }
    }

    throw new AIGenerationError("schema 校验失败");
  }

  private buildJsonPrompt(
    prompt: string,
    jsonSchema: Record<string, unknown>,
  ): string {
    if (this.options.jsonMode !== "json_object") {
      return prompt;
    }

    return `${prompt}\n\n请返回 JSON 对象，字段要求如下：${JSON.stringify(jsonSchema)}`;
  }

  private async requestContent(
    prompt: string,
    response_format?: ChatCompletionsRequestBody["response_format"],
  ): Promise<string> {
    const url = `${this.options.baseUrl}/chat/completions`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const requestBody: ChatCompletionsRequestBody = {
        model: this.options.model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: this.options.maxTokens,
        temperature: this.options.temperature,
      };

      if (response_format) {
        requestBody.response_format = response_format;
      }

      const res = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify(requestBody),
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
