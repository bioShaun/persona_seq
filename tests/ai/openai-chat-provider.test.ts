import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAiChatProposalAiProvider } from "@/lib/ai/openai-chat-provider";

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

    const provider = new OpenAiChatProposalAiProvider({
      apiKey: "test-key",
      baseUrl: "https://example.test/v1",
      model: "test-model",
      timeoutMs: 1000,
      maxTokens: 5000,
      temperature: 0.2,
    });

    await expect(provider.generateText("prompt")).rejects.toThrow(
      "AI 返回内容被截断",
    );
  });
});
