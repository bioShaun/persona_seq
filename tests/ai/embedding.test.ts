import { describe, expect, it, vi } from "vitest";
import {
  MockEmbeddingProvider,
  buildEmbeddingInput,
  generateEmbedding,
} from "@/lib/ai/embedding";

describe("MockEmbeddingProvider", () => {
  it("returns a 1536-dimension vector", async () => {
    const provider = new MockEmbeddingProvider();
    const vector = await provider.generateEmbedding("any text");
    expect(vector).toHaveLength(1536);
  });
});

describe("buildEmbeddingInput", () => {
  it("concatenates non-null fields with newlines", () => {
    const result = buildEmbeddingInput("小麦BSA分析", "需求摘要", "确认方案");
    expect(result).toBe("小麦BSA分析\n需求摘要\n确认方案");
  });

  it("omits null fields", () => {
    const result = buildEmbeddingInput("标题", null, "确认方案");
    expect(result).toBe("标题\n确认方案");
  });

  it("handles all null except title", () => {
    const result = buildEmbeddingInput("标题", null, null);
    expect(result).toBe("标题");
  });
});

describe("generateEmbedding", () => {
  it("returns vector on success", async () => {
    const provider = new MockEmbeddingProvider();
    const result = await generateEmbedding(provider, "test");
    expect(result).toHaveLength(1536);
  });

  it("returns null when provider throws", async () => {
    const provider = {
      generateEmbedding: vi.fn().mockRejectedValue(new Error("API error")),
    };
    const result = await generateEmbedding(provider, "test");
    expect(result).toBeNull();
  });
});
