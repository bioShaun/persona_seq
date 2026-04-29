import type { ProposalStatus } from "@/lib/domain/proposal-status";
import { describe, expect, it } from "vitest";
import { canConfirmCurrentRevision } from "@/lib/domain/proposal-ui-state";

describe("proposal UI state", () => {
  it("only exposes revision confirmation during analyst review", () => {
    expect(canConfirmCurrentRevision("ANALYST_REVIEW" as ProposalStatus)).toBe(true);

    expect(canConfirmCurrentRevision("DRAFTING" as ProposalStatus)).toBe(false);
    expect(canConfirmCurrentRevision("READY_TO_SEND" as ProposalStatus)).toBe(false);
    expect(canConfirmCurrentRevision("WAITING_CUSTOMER_FEEDBACK" as ProposalStatus)).toBe(
      false,
    );
    expect(canConfirmCurrentRevision("REVISION_NEEDED" as ProposalStatus)).toBe(false);
    expect(canConfirmCurrentRevision("ACCEPTED" as ProposalStatus)).toBe(false);
    expect(canConfirmCurrentRevision("CANCELED" as ProposalStatus)).toBe(false);
  });
});
