import { describe, expect, it } from "vitest";
import { FinalOutcome, ProposalStatus } from "@prisma/client";
import {
  assertCaseAwaitingAnalystReview,
  assertCaseReadyForInitialGeneration,
  assertCaseReadyToSend,
  assertCaseWaitingCustomerFeedback,
  assertRevisionBelongsToCase,
  assertRevisionConfirmedBeforeSending,
  assertRevisionNotAlreadyConfirmed,
  assertRevisionNotAlreadySent,
  type ProposalCaseInvariantSnapshot,
  type RevisionInvariantSnapshot,
} from "@/lib/db/proposal-repository";

function createCase(
  overrides: Partial<ProposalCaseInvariantSnapshot> = {},
): ProposalCaseInvariantSnapshot {
  return {
    id: "case_1",
    status: ProposalStatus.DRAFTING,
    currentRevisionNumber: 1,
    finalOutcome: null,
    ...overrides,
  };
}

function createRevision(
  overrides: Partial<RevisionInvariantSnapshot> = {},
): RevisionInvariantSnapshot {
  return {
    id: "rev_1",
    proposalCaseId: "case_1",
    revisionNumber: 1,
    analystConfirmedText: "confirmed text",
    sentToCustomerAt: null,
    ...overrides,
  };
}

describe("proposal repository invariants", () => {
  it("rejects initial generation when case is not in drafting revision 1 state", () => {
    expect(() =>
      assertCaseReadyForInitialGeneration(
        createCase({ status: ProposalStatus.ANALYST_REVIEW }),
      ),
    ).toThrowError("Proposal case is not ready for initial generation");

    expect(() =>
      assertCaseReadyForInitialGeneration(createCase({ currentRevisionNumber: 2 })),
    ).toThrowError("Proposal case is not ready for initial generation");

    expect(() =>
      assertCaseReadyForInitialGeneration(
        createCase({ finalOutcome: FinalOutcome.ACCEPTED }),
      ),
    ).toThrowError("Proposal case is not ready for initial generation");
  });

  it("rejects revision and case mismatches", () => {
    expect(() =>
      assertRevisionBelongsToCase(createRevision(), "case_2", 1),
    ).toThrowError("Revision does not belong to proposal case");

    expect(() =>
      assertRevisionBelongsToCase(createRevision(), "case_1", 2),
    ).toThrowError("Revision does not belong to proposal case");
  });

  it("requires analyst review state and disallows reconfirming a revision", () => {
    expect(() =>
      assertCaseAwaitingAnalystReview(
        createCase({ status: ProposalStatus.READY_TO_SEND }),
      ),
    ).toThrowError("Proposal case is not awaiting analyst review");

    expect(() =>
      assertRevisionNotAlreadyConfirmed(
        createRevision({ analystConfirmedText: "already confirmed" }),
      ),
    ).toThrowError("Revision has already been confirmed");
  });

  it("blocks sending unconfirmed or already sent revisions", () => {
    expect(() =>
      assertCaseReadyToSend(createCase({ status: ProposalStatus.ANALYST_REVIEW })),
    ).toThrowError("Proposal case is not ready to send");

    expect(() =>
      assertRevisionConfirmedBeforeSending(
        createRevision({ analystConfirmedText: null }),
      ),
    ).toThrowError("Revision must be confirmed before sending");

    expect(() =>
      assertRevisionNotAlreadySent(
        createRevision({ sentToCustomerAt: new Date("2026-04-27T00:00:00.000Z") }),
      ),
    ).toThrowError("Revision has already been sent to customer");
  });

  it("only allows accepted and canceled outcomes from waiting customer feedback", () => {
    expect(() =>
      assertCaseWaitingCustomerFeedback(
        createCase({ status: ProposalStatus.READY_TO_SEND }),
      ),
    ).toThrowError("Proposal case is not waiting for customer feedback");

    expect(() =>
      assertCaseWaitingCustomerFeedback(
        createCase({ finalOutcome: FinalOutcome.CANCELED }),
      ),
    ).toThrowError("Proposal case is not waiting for customer feedback");
  });
});
