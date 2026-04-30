import { describe, expect, it } from "vitest";
import { ProposalStatus, type ProposalCase } from "@prisma/client";
import { mapProposalCaseSummary } from "@/lib/db/proposal-mappers";

function createCase(
  status: ProposalStatus,
  overrides: Partial<ProposalCase> = {},
): ProposalCase {
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
    productLine: null,
    organism: null,
    application: null,
    analysisDepth: null,
    sampleTypes: [],
    platforms: [],
    keywordTags: [],
    tagsGeneratedAt: null,
    tagsModel: null,
    generationStatus: "SUCCEEDED" as const,
    generationError: null,
    generationAttemptCount: 1,
    generationStartedAt: now,
    generationFinishedAt: now,
    createdAt: now,
    updatedAt: now,
    pmUserId: "pm_1",
    analystUserId: "analyst_1",
    ...overrides,
  };
}

describe("mapProposalCaseSummary", () => {
  it.each([
    [ProposalStatus.DRAFTING, "DRAFTING"],
    [ProposalStatus.ANALYST_REVIEW, "ANALYST_REVIEW"],
    [ProposalStatus.READY_TO_SEND, "READY_TO_SEND"],
    [ProposalStatus.WAITING_CUSTOMER_FEEDBACK, "WAITING_CUSTOMER_FEEDBACK"],
    [ProposalStatus.REVISION_NEEDED, "REVISION_NEEDED"],
    [ProposalStatus.ACCEPTED, "ACCEPTED"],
    [ProposalStatus.CANCELED, "CANCELED"],
  ] as const)(
    "maps prisma status %s to domain status %s",
    (prismaStatus, domainStatus) => {
      const mapped = mapProposalCaseSummary(createCase(prismaStatus));

      expect(mapped.status).toBe(domainStatus);
      expect(mapped.id).toBe("case_1");
      expect(mapped.currentRevisionNumber).toBe(2);
    },
  );

  it("preserves nullable summary and analyst assignment fields", () => {
    const mapped = mapProposalCaseSummary(
      createCase(ProposalStatus.DRAFTING, {
        requirementSummary: null,
        analystUserId: null,
      }),
    );

    expect(mapped.requirementSummary).toBeNull();
    expect(mapped.analystUserId).toBeNull();
  });
});
