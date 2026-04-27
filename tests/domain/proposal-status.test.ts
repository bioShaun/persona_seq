import { describe, expect, it } from "vitest";
import {
  assertTransitionAllowed,
  getNextActionsForRole,
} from "../../lib/domain/proposal-status";

describe("proposal status transitions", () => {
  it("allows the first proposal round to move from drafting to analyst review", () => {
    expect(() =>
      assertTransitionAllowed("drafting", "analyst_review", "system"),
    ).not.toThrow();
  });

  it("allows analyst confirmation to move a case to ready to send", () => {
    expect(() =>
      assertTransitionAllowed("analyst_review", "ready_to_send", "analyst"),
    ).not.toThrow();
  });

  it("allows PM to mark sent proposal as waiting for customer feedback", () => {
    expect(() =>
      assertTransitionAllowed("ready_to_send", "waiting_customer_feedback", "pm"),
    ).not.toThrow();
  });

  it("allows customer requested changes to create a revision_needed state", () => {
    expect(() =>
      assertTransitionAllowed("waiting_customer_feedback", "revision_needed", "pm"),
    ).not.toThrow();
  });

  it("blocks analysts from marking a case accepted", () => {
    expect(() =>
      assertTransitionAllowed("waiting_customer_feedback", "accepted", "analyst"),
    ).toThrow(
      "Transition waiting_customer_feedback -> accepted is not allowed for analyst",
    );
  });

  it("returns PM next actions for waiting customer feedback", () => {
    expect(getNextActionsForRole("waiting_customer_feedback", "pm")).toEqual([
      "enter_customer_feedback",
      "mark_customer_accepted",
      "mark_customer_canceled",
    ]);
  });

  it("returns analyst next actions for analyst review", () => {
    expect(getNextActionsForRole("analyst_review", "analyst")).toEqual([
      "confirm_current_proposal",
      "request_customer_clarification",
      "save_draft_edits",
    ]);
  });
});
