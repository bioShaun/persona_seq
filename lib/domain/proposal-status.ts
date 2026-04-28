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

export const proposalActions = [
  "generate_initial_draft",
  "copy_confirmed_proposal",
  "mark_sent_to_customer",
  "enter_customer_feedback",
  "mark_customer_accepted",
  "mark_customer_canceled",
  "confirm_current_proposal",
  "request_customer_clarification",
  "save_draft_edits",
  "submit_for_analyst_review",
  "return_to_drafting",
  "send_back_to_analyst_review",
] as const;

export type ProposalAction = (typeof proposalActions)[number];

type WorkflowPolicyEntry = {
  from: ProposalStatus;
  action: ProposalAction;
  roles: readonly UserRole[];
  to?: ProposalStatus;
  visibleInNextActions?: boolean;
};

const workflowTransitions: readonly WorkflowPolicyEntry[] = [
  {
    from: "drafting",
    to: "analyst_review",
    action: "submit_for_analyst_review",
    roles: ["system", "pm"],
  },
  {
    from: "analyst_review",
    to: "ready_to_send",
    action: "confirm_current_proposal",
    roles: ["analyst"],
    visibleInNextActions: true,
  },
  {
    from: "analyst_review",
    to: "revision_needed",
    action: "request_customer_clarification",
    roles: ["analyst"],
    visibleInNextActions: true,
  },
  {
    from: "ready_to_send",
    action: "copy_confirmed_proposal",
    roles: ["pm"],
    visibleInNextActions: true,
  },
  {
    from: "ready_to_send",
    to: "waiting_customer_feedback",
    action: "mark_sent_to_customer",
    roles: ["pm"],
    visibleInNextActions: true,
  },
  {
    from: "waiting_customer_feedback",
    to: "revision_needed",
    action: "enter_customer_feedback",
    roles: ["pm"],
    visibleInNextActions: true,
  },
  {
    from: "waiting_customer_feedback",
    to: "accepted",
    action: "mark_customer_accepted",
    roles: ["pm"],
    visibleInNextActions: true,
  },
  {
    from: "waiting_customer_feedback",
    to: "canceled",
    action: "mark_customer_canceled",
    roles: ["pm"],
    visibleInNextActions: true,
  },
  {
    from: "revision_needed",
    to: "drafting",
    action: "return_to_drafting",
    roles: ["system", "pm"],
  },
  {
    from: "revision_needed",
    to: "analyst_review",
    action: "send_back_to_analyst_review",
    roles: ["system"],
  },
  {
    from: "drafting",
    action: "generate_initial_draft",
    roles: ["pm"],
    visibleInNextActions: true,
  },
  {
    from: "analyst_review",
    action: "save_draft_edits",
    roles: ["analyst"],
    visibleInNextActions: true,
  },
];

export function assertTransitionAllowed(
  from: ProposalStatus,
  to: ProposalStatus,
  role: UserRole,
): void {
  const allowed = workflowTransitions.some(
    (transition) =>
      transition.from === from &&
      transition.to === to &&
      transition.roles.includes(role),
  );

  if (!allowed) {
    throw new Error(
      `Transition ${from} -> ${to} is not allowed for ${role}`,
    );
  }
}

export function getNextActionsForRole(
  status: ProposalStatus,
  role: UserRole,
): ProposalAction[] {
  return workflowTransitions
    .filter(
      (transition) =>
        transition.from === status &&
        transition.visibleInNextActions === true &&
        transition.roles.includes(role),
    )
    .map((transition) => transition.action);
}
