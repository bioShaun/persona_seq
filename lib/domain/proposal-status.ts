export const proposalStatuses = [
  "DRAFTING",
  "ANALYST_REVIEW",
  "READY_TO_SEND",
  "WAITING_CUSTOMER_FEEDBACK",
  "REVISION_NEEDED",
  "ACCEPTED",
  "CANCELED",
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
    from: "DRAFTING",
    to: "ANALYST_REVIEW",
    action: "submit_for_analyst_review",
    roles: ["system", "pm"],
  },
  {
    from: "ANALYST_REVIEW",
    to: "READY_TO_SEND",
    action: "confirm_current_proposal",
    roles: ["analyst"],
    visibleInNextActions: true,
  },
  {
    from: "ANALYST_REVIEW",
    to: "REVISION_NEEDED",
    action: "request_customer_clarification",
    roles: ["analyst"],
    visibleInNextActions: true,
  },
  {
    from: "READY_TO_SEND",
    action: "copy_confirmed_proposal",
    roles: ["pm"],
    visibleInNextActions: true,
  },
  {
    from: "READY_TO_SEND",
    to: "WAITING_CUSTOMER_FEEDBACK",
    action: "mark_sent_to_customer",
    roles: ["pm"],
    visibleInNextActions: true,
  },
  {
    from: "WAITING_CUSTOMER_FEEDBACK",
    to: "REVISION_NEEDED",
    action: "enter_customer_feedback",
    roles: ["pm"],
    visibleInNextActions: true,
  },
  {
    from: "WAITING_CUSTOMER_FEEDBACK",
    to: "ACCEPTED",
    action: "mark_customer_accepted",
    roles: ["pm"],
    visibleInNextActions: true,
  },
  {
    from: "WAITING_CUSTOMER_FEEDBACK",
    to: "CANCELED",
    action: "mark_customer_canceled",
    roles: ["pm"],
    visibleInNextActions: true,
  },
  {
    from: "REVISION_NEEDED",
    to: "DRAFTING",
    action: "return_to_drafting",
    roles: ["system", "pm"],
  },
  {
    from: "REVISION_NEEDED",
    to: "ANALYST_REVIEW",
    action: "send_back_to_analyst_review",
    roles: ["system"],
  },
  {
    from: "DRAFTING",
    action: "generate_initial_draft",
    roles: ["pm"],
    visibleInNextActions: true,
  },
  {
    from: "ANALYST_REVIEW",
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
