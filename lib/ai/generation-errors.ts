export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function sanitizeGenerationError(error: unknown) {
  const rawMessage =
    error instanceof Error ? error.message : "Initial generation failed";
  const compactMessage = rawMessage.replace(/\s+/g, " ").trim();

  if (compactMessage.startsWith("AI 请求失败")) {
    return compactMessage.slice(0, 300);
  }
  return "AI 生成失败，请稍后重试。";
}
