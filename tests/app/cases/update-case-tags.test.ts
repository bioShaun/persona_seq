import { describe, expect, it, vi, beforeEach } from "vitest";
import { ProposalStatus } from "@prisma/client";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    proposalCase: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { updateCaseTags, assertCaseTagsEditable } from "@/lib/db/proposal-repository";
import { prisma } from "@/lib/db/prisma";

const mockedPrisma = vi.mocked(prisma);

describe("updateCaseTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates tag fields with valid input", async () => {
    vi.mocked(prisma.proposalCase.update).mockResolvedValue({} as never);

    await updateCaseTags("case-1", {
      organism: "小麦",
      productLine: "BSA-seq",
    });

    expect(mockedPrisma.proposalCase.update).toHaveBeenCalledWith({
      where: { id: "case-1" },
      data: expect.objectContaining({
        organism: "小麦",
        productLine: "BSA-seq",
      }),
    });
  });

  it("sets updatedAt on tag update", async () => {
    vi.mocked(prisma.proposalCase.update).mockResolvedValue({} as never);

    await updateCaseTags("case-1", { organism: "水稻" });

    expect(mockedPrisma.proposalCase.update).toHaveBeenCalledWith({
      where: { id: "case-1" },
      data: expect.objectContaining({
        updatedAt: expect.any(Date),
      }),
    });
  });
});

describe("assertCaseTagsEditable", () => {
  it("throws when case status is ACCEPTED", () => {
    expect(() =>
      assertCaseTagsEditable(ProposalStatus.ACCEPTED),
    ).toThrow("标签不可编辑");
  });

  it("throws when case status is CANCELED", () => {
    expect(() =>
      assertCaseTagsEditable(ProposalStatus.CANCELED),
    ).toThrow("标签不可编辑");
  });

  it("does not throw for editable statuses", () => {
    expect(() =>
      assertCaseTagsEditable(ProposalStatus.ANALYST_REVIEW),
    ).not.toThrow();
    expect(() =>
      assertCaseTagsEditable(ProposalStatus.DRAFTING),
    ).not.toThrow();
  });
});

describe("reExtractCaseTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls AI provider with case text and saves extracted tags", async () => {
    const { reExtractCaseTags } = await import("@/lib/db/proposal-repository");

    vi.mocked(prisma.proposalCase.findUnique).mockResolvedValue({
      id: "case-1",
      originalRequestText: "需要小麦BSA-seq分析",
      requirementSummary: "小麦抗病基因定位",
      revisions: [{ analystConfirmedText: "确认方案内容" }],
    } as never);

    const mockProvider = {
      generateText: vi.fn().mockResolvedValue(
        `E.\n${JSON.stringify({ organism: "小麦", productLine: "BSA-seq" })}`,
      ),
    };

    vi.mocked(prisma.proposalCase.update).mockResolvedValue({} as never);

    await reExtractCaseTags("case-1", mockProvider);

    expect(mockProvider.generateText).toHaveBeenCalled();
    expect(mockedPrisma.proposalCase.update).toHaveBeenCalledWith({
      where: { id: "case-1" },
      data: expect.objectContaining({
        organism: "小麦",
        productLine: "BSA-seq",
        tagsGeneratedAt: expect.any(Date),
      }),
    });
  });

  it("saves with null tags when AI returns unparseable text", async () => {
    const { reExtractCaseTags } = await import("@/lib/db/proposal-repository");

    vi.mocked(prisma.proposalCase.findUnique).mockResolvedValue({
      id: "case-1",
      originalRequestText: "需求文本",
      requirementSummary: null,
      revisions: [],
    } as never);

    const mockProvider = {
      generateText: vi.fn().mockResolvedValue("这不是JSON"),
    };

    vi.mocked(prisma.proposalCase.update).mockResolvedValue({} as never);

    await reExtractCaseTags("case-1", mockProvider);

    expect(mockedPrisma.proposalCase.update).toHaveBeenCalledWith({
      where: { id: "case-1" },
      data: expect.objectContaining({
        tagsGeneratedAt: expect.any(Date),
      }),
    });
  });
});
