import { describe, expect, it } from "vitest";
import {
  assertTransitionAllowed,
  getNextActionsForRole,
} from "@/lib/domain/proposal-status";

describe("proposal status transitions", () => {
  it("allows the first proposal round to move from drafting to analyst review", () => {
    expect(() =>
      assertTransitionAllowed("DRAFTING", "ANALYST_REVIEW", "system"),
    ).not.toThrow();
  });

  it("allows analyst confirmation to move a case to ready to send", () => {
    expect(() =>
      assertTransitionAllowed("ANALYST_REVIEW", "READY_TO_SEND", "analyst"),
    ).not.toThrow();
  });

  it("allows PM to mark sent proposal as waiting for customer feedback", () => {
    expect(() =>
      assertTransitionAllowed("READY_TO_SEND", "WAITING_CUSTOMER_FEEDBACK", "pm"),
    ).not.toThrow();
  });

  it("allows customer requested changes to create a revision_needed state", () => {
    expect(() =>
      assertTransitionAllowed("WAITING_CUSTOMER_FEEDBACK", "REVISION_NEEDED", "pm"),
    ).not.toThrow();
  });

  it("blocks analysts from marking a case accepted", () => {
    expect(() =>
      assertTransitionAllowed("WAITING_CUSTOMER_FEEDBACK", "ACCEPTED", "analyst"),
    ).toThrow(
      "Transition WAITING_CUSTOMER_FEEDBACK -> ACCEPTED is not allowed for analyst",
    );
  });

  it("returns PM next actions for waiting customer feedback", () => {
    expect(getNextActionsForRole("WAITING_CUSTOMER_FEEDBACK", "pm")).toEqual([
      "enter_customer_feedback",
      "mark_customer_accepted",
      "mark_customer_canceled",
    ]);
  });

  it("returns analyst next actions for analyst review", () => {
    expect(getNextActionsForRole("ANALYST_REVIEW", "analyst")).toEqual([
      "confirm_current_proposal",
      "request_customer_clarification",
      "save_draft_edits",
    ]);
  });

  it("returns no PM or analyst actions for accepted", () => {
    expect(getNextActionsForRole("ACCEPTED", "pm")).toEqual([]);
    expect(getNextActionsForRole("ACCEPTED", "analyst")).toEqual([]);
  });

  it("returns no PM or analyst actions for canceled", () => {
    expect(getNextActionsForRole("CANCELED", "pm")).toEqual([]);
    expect(getNextActionsForRole("CANCELED", "analyst")).toEqual([]);
  });

  it("blocks PM from moving analyst_review to ready_to_send", () => {
    expect(() =>
      assertTransitionAllowed("ANALYST_REVIEW", "READY_TO_SEND", "pm"),
    ).toThrow("Transition ANALYST_REVIEW -> READY_TO_SEND is not allowed for pm");
  });

  it("allows system to move revision_needed back to analyst_review", () => {
    expect(() =>
      assertTransitionAllowed("REVISION_NEEDED", "ANALYST_REVIEW", "system"),
    ).not.toThrow();
  });

  it("does not grant admin implicit workflow permissions", () => {
    expect(() =>
      assertTransitionAllowed("DRAFTING", "ANALYST_REVIEW", "admin"),
    ).toThrow("Transition DRAFTING -> ANALYST_REVIEW is not allowed for admin");
    expect(getNextActionsForRole("DRAFTING", "admin")).toEqual([]);
  });
});
