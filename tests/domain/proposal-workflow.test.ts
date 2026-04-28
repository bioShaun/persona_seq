import { describe, expect, it, vi } from "vitest";
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

  it("rejects empty AI draft for initial revision", () => {
    expect(() =>
      createInitialRevision({
        aiDraft: " ",
      }),
    ).toThrow("AI draft is required");
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

  it("rejects empty customer feedback text", () => {
    expect(() =>
      createRevisionFromCustomerFeedback({
        currentRevisionNumber: 1,
        customerFeedbackText: " ",
        aiDraft: "修订草稿",
        revisionNotes: null,
      }),
    ).toThrow("Customer feedback text is required");
  });

  it("rejects empty AI draft for feedback revision", () => {
    expect(() =>
      createRevisionFromCustomerFeedback({
        currentRevisionNumber: 1,
        customerFeedbackText: "客户反馈",
        aiDraft: " ",
        revisionNotes: null,
      }),
    ).toThrow("AI draft is required");
  });

  it("rejects invalid current revision numbers", () => {
    for (const invalidRevisionNumber of [0, -1, 1.5]) {
      expect(() =>
        createRevisionFromCustomerFeedback({
          currentRevisionNumber: invalidRevisionNumber,
          customerFeedbackText: "客户反馈",
          aiDraft: "修订草稿",
          revisionNotes: null,
        }),
      ).toThrow("Current revision number must be a positive integer");
    }
  });

  it("confirms a revision with analyst text", () => {
    expect(
      markRevisionConfirmed({
        aiDraft: "AI 草稿",
        analystConfirmedText: "分析人员确认版",
      }).analystConfirmedText,
    ).toBe("分析人员确认版");
  });

  it("uses the provided confirmedAt timestamp when confirming a revision", () => {
    const confirmedAt = new Date("2026-04-27T00:00:00.000Z");

    const confirmed = markRevisionConfirmed({
      revisionNumber: 1,
      customerFeedbackText: null,
      aiDraft: "AI 草稿",
      analystConfirmedText: "分析人员确认版",
      revisionNotes: null,
      confirmedAt,
    });

    expect(confirmed.confirmedByAnalystAt?.toISOString()).toBe("2026-04-27T00:00:00.000Z");
  });

  it("defaults confirmedAt to current time when not provided", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-27T10:00:00.000Z"));

    const confirmed = markRevisionConfirmed({
      revisionNumber: 1,
      customerFeedbackText: null,
      aiDraft: "AI 草稿",
      analystConfirmedText: "分析人员确认版",
      revisionNotes: null,
    });

    expect(confirmed.confirmedByAnalystAt?.toISOString()).toBe("2026-04-27T10:00:00.000Z");
    vi.useRealTimers();
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

  it("rejects sending a revision without analyst confirmed text", () => {
    expect(() =>
      markRevisionSent({
        revisionNumber: 1,
        customerFeedbackText: null,
        aiDraft: "AI 草稿",
        analystConfirmedText: " ",
        revisionNotes: null,
      }),
    ).toThrow("Cannot send a revision before analyst confirmation");
  });
});
