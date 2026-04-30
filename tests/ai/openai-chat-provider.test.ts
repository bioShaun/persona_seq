import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AIGenerationError } from "@/lib/ai/generation-errors";
import { OpenAiChatProposalAiProvider } from "@/lib/ai/openai-chat-provider";

const ProposalSchema = z.object({
  title: z.string(),
  count: z.number(),
});

function createProvider(jsonMode?: "json_schema" | "json_object") {
  return new OpenAiChatProposalAiProvider({
    apiKey: "test-key",
    baseUrl: "https://example.test/v1",
    model: "test-model",
    timeoutMs: 1000,
    maxTokens: 5000,
    temperature: 0.2,
    jsonMode,
  });
}

function createResponse(content: string, init?: ResponseInit) {
  return new Response(
    JSON.stringify({
      choices: [
        {
          finish_reason: "stop",
          message: { content },
        },
      ],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
      ...init,
    },
  );
}

function getRequestBody() {
  const mock = vi.mocked(globalThis.fetch);
  const [, init] = mock.mock.calls.at(-1) ?? [];
  return JSON.parse(String(init?.body)) as {
    messages: Array<{ role: string; content: string }>;
    response_format?: unknown;
  };
}

describe("OpenAiChatProposalAiProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects truncated model output instead of saving a partial proposal", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: "length",
              message: { content: "partial proposal" },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const provider = createProvider();

    await expect(provider.generateText("prompt")).rejects.toThrow(
      "AI 返回内容被截断",
    );
  });

  it("returns parsed JSON that passes schema validation", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      createResponse('{ "title": "valid", "count": 2 }'),
    );

    const provider = createProvider();

    await expect(
      provider.generateJson("prompt", ProposalSchema, "ProposalSchema"),
    ).resolves.toEqual({
      title: "valid",
      count: 2,
    });

    expect(getRequestBody().response_format).toMatchObject({
      type: "json_schema",
      json_schema: {
        name: "ProposalSchema",
        strict: true,
      },
    });
  });

  it("retries once when the first response is not valid JSON", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce(createResponse("not-json"))
      .mockResolvedValueOnce(createResponse('{ "title": "valid", "count": 2 }'));

    const provider = createProvider();

    await expect(
      provider.generateJson("prompt", ProposalSchema, "ProposalSchema"),
    ).resolves.toEqual({
      title: "valid",
      count: 2,
    });

    const [, secondInit] = fetchMock.mock.calls[1] ?? [];
    const secondBody = JSON.parse(String(secondInit?.body)) as {
      messages: Array<{ role: string; content: string }>;
    };
    expect(secondBody.messages[0]?.content).toContain(
      "上次输出不是合法 JSON，请只返回符合 schema 的 JSON 对象",
    );
  });

  it("retries once when the first response fails zod validation", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(createResponse('{ "title": "valid", "count": "2" }'))
      .mockResolvedValueOnce(createResponse('{ "title": "valid", "count": 2 }'));

    const provider = createProvider();

    await expect(
      provider.generateJson("prompt", ProposalSchema, "ProposalSchema"),
    ).resolves.toEqual({
      title: "valid",
      count: 2,
    });
  });

  it("throws AIGenerationError after two schema-related failures", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(createResponse("not-json"))
      .mockResolvedValueOnce(createResponse('{ "title": "still wrong", "count": "2" }'));

    const provider = createProvider();
    const result = provider.generateJson("prompt", ProposalSchema, "ProposalSchema");

    await expect(result).rejects.toBeInstanceOf(AIGenerationError);
    await expect(result).rejects.toThrow("schema 校验失败");
  });

  it("uses json_object mode and appends schema guidance to the prompt", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      createResponse('{ "title": "valid", "count": 2 }'),
    );

    const provider = createProvider("json_object");

    await expect(
      provider.generateJson("prompt", ProposalSchema, "ProposalSchema"),
    ).resolves.toEqual({
      title: "valid",
      count: 2,
    });

    const requestBody = getRequestBody();
    expect(requestBody.response_format).toEqual({ type: "json_object" });
    expect(requestBody.messages[0]?.content).toContain(
      "请返回 JSON 对象，字段要求如下：",
    );
    expect(requestBody.messages[0]?.content).toContain('"title"');
    expect(requestBody.messages[0]?.content).toContain('"count"');
  });
});
