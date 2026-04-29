import { ProposalStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { canConfirmCurrentRevision } from "@/lib/domain/proposal-ui-state";

describe("proposal UI state", () => {
  it("only exposes revision confirmation during analyst review", () => {
    expect(canConfirmCurrentRevision(ProposalStatus.ANALYST_REVIEW)).toBe(true);

    expect(canConfirmCurrentRevision(ProposalStatus.DRAFTING)).toBe(false);
    expect(canConfirmCurrentRevision(ProposalStatus.READY_TO_SEND)).toBe(false);
    expect(canConfirmCurrentRevision(ProposalStatus.WAITING_CUSTOMER_FEEDBACK)).toBe(
      false,
    );
    expect(canConfirmCurrentRevision(ProposalStatus.REVISION_NEEDED)).toBe(false);
    expect(canConfirmCurrentRevision(ProposalStatus.ACCEPTED)).toBe(false);
    expect(canConfirmCurrentRevision(ProposalStatus.CANCELED)).toBe(false);
  });
});
