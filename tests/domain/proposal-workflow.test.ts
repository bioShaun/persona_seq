import { describe, expect, it } from "vitest";
import {
  createInitialRevision,
  createRevisionFromCustomerFeedback,
  markRevisionConfirmed,
  markRevisionSent,
} from "@/lib/domain/proposal-workflow";

describe("proposal workflow helpers", () => {
  it("creates the first revision with revision number 1", () => {
    expect(
      createInitialRevision({
        aiDraft: "首轮 AI 草稿",
      }),
    ).toEqual({
      revisionNumber: 1,
      customerFeedbackText: null,
      aiDraft: "首轮 AI 草稿",
      analystConfirmedText: null,
      revisionNotes: null,
    });
  });

  it("creates a customer feedback revision using the next revision number", () => {
    expect(
      createRevisionFromCustomerFeedback({
        currentRevisionNumber: 2,
        customerFeedbackText: "客户希望增加 WGCNA。",
        aiDraft: "修订草稿",
        revisionNotes: "增加 WGCNA 模块。",
      }),
    ).toMatchObject({
      revisionNumber: 3,
      customerFeedbackText: "客户希望增加 WGCNA。",
      aiDraft: "修订草稿",
      revisionNotes: "增加 WGCNA 模块。",
    });
  });

  it("confirms a revision with analyst text", () => {
    expect(
      markRevisionConfirmed({
        aiDraft: "AI 草稿",
        analystConfirmedText: "分析人员确认版",
      }).analystConfirmedText,
    ).toBe("分析人员确认版");
  });

  it("rejects empty analyst confirmed text", () => {
    expect(() =>
      markRevisionConfirmed({
        aiDraft: "AI 草稿",
        analystConfirmedText: " ",
      }),
    ).toThrow("Analyst confirmed text is required");
  });

  it("sets sent timestamp when PM sends a confirmed proposal", () => {
    const sent = markRevisionSent({
      analystConfirmedText: "确认方案",
      sentAt: new Date("2026-04-27T00:00:00.000Z"),
    });

    expect(sent.sentToCustomerAt?.toISOString()).toBe("2026-04-27T00:00:00.000Z");
  });
});
