export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
}

export class MockEmbeddingProvider implements EmbeddingProvider {
  async generateEmbedding(_text: string): Promise<number[]> {
    return Array.from({ length: 1536 }, (_, i) => (i % 100) / 100);
  }
}

export function buildEmbeddingInput(
  title: string,
  requirementSummary: string | null,
  analystConfirmedText: string | null,
): string {
  return [title, requirementSummary, analystConfirmedText]
    .filter(Boolean)
    .join("\n");
}

export async function generateEmbedding(
  provider: EmbeddingProvider,
  text: string,
): Promise<number[] | null> {
  try {
    return await provider.generateEmbedding(text);
  } catch (error) {
    console.error("Embedding generation failed:", error);
    return null;
  }
}

export function getEmbeddingProvider(): EmbeddingProvider {
  const mode = (process.env.AI_PROVIDER ?? "mock").trim().toLowerCase();

  if (mode === "mock" || mode === "") {
    return new MockEmbeddingProvider();
  }

  if (mode === "openai") {
    // OpenAI embedding uses the same API key, different endpoint
    // For now, fallback to mock until text-embedding-3-small integration
    return new MockEmbeddingProvider();
  }

  return new MockEmbeddingProvider();
}
