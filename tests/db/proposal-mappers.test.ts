import { describe, expect, it } from "vitest";
import { ProposalStatus, type ProposalCase } from "@prisma/client";
import { mapProposalCaseSummary } from "@/lib/db/proposal-mappers";

function createCase(status: ProposalStatus): ProposalCase {
  const now = new Date("2026-04-27T00:00:00.000Z");

  return {
    id: "case_1",
    title: "Rice transcriptome proposal",
    customerName: "Acme Bio",
    originalRequestText: "Need differential expression analysis",
    requirementSummary: "Analyze treatment vs control",
    missingInformation: null,
    status,
    currentRevisionNumber: 2,
    finalOutcome: null,
    createdAt: now,
    updatedAt: now,
    pmUserId: "pm_1",
    analystUserId: "analyst_1",
  };
}

describe("mapProposalCaseSummary", () => {
  it("maps uppercase prisma status enums to lowercase domain status", () => {
    const mapped = mapProposalCaseSummary(createCase(ProposalStatus.ANALYST_REVIEW));

    expect(mapped.status).toBe("analyst_review");
    expect(mapped.id).toBe("case_1");
    expect(mapped.currentRevisionNumber).toBe(2);
  });
});
