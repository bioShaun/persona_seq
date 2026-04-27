export const proposalStatuses = [
  "drafting",
  "analyst_review",
  "ready_to_send",
  "waiting_customer_feedback",
  "revision_needed",
  "accepted",
  "canceled",
] as const;

export type ProposalStatus = (typeof proposalStatuses)[number];

export const userRoles = ["pm", "analyst", "admin", "system"] as const;

export type UserRole = (typeof userRoles)[number];

const allowedTransitions: Record<
  ProposalStatus,
  Partial<Record<ProposalStatus, UserRole[]>>
> = {
  drafting: {
    analyst_review: ["system", "pm"],
  },
  analyst_review: {
    ready_to_send: ["analyst"],
    revision_needed: ["analyst"],
  },
  ready_to_send: {
    waiting_customer_feedback: ["pm"],
  },
  waiting_customer_feedback: {
    revision_needed: ["pm"],
    accepted: ["pm"],
    canceled: ["pm"],
  },
  revision_needed: {
    drafting: ["system", "pm"],
    analyst_review: ["system"],
  },
  accepted: {},
  canceled: {},
};

export function assertTransitionAllowed(
  from: ProposalStatus,
  to: ProposalStatus,
  role: UserRole,
): void {
  const allowedRoles = allowedTransitions[from][to] ?? [];
  if (!allowedRoles.includes(role)) {
    throw new Error(
      `Transition ${from} -> ${to} is not allowed for ${role}`,
    );
  }
}

export function getNextActionsForRole(
  status: ProposalStatus,
  role: UserRole,
): string[] {
  if (role === "pm" && status === "drafting") {
    return ["generate_initial_draft"];
  }

  if (role === "pm" && status === "ready_to_send") {
    return ["copy_confirmed_proposal", "mark_sent_to_customer"];
  }

  if (role === "pm" && status === "waiting_customer_feedback") {
    return [
      "enter_customer_feedback",
      "mark_customer_accepted",
      "mark_customer_canceled",
    ];
  }

  if (role === "analyst" && status === "analyst_review") {
    return [
      "confirm_current_proposal",
      "request_customer_clarification",
      "save_draft_edits",
    ];
  }

  return [];
}
