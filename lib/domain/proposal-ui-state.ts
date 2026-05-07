import type { ProposalStatus } from "./proposal-status";

export function canConfirmCurrentRevision(status: ProposalStatus) {
  return status === "ANALYST_REVIEW";
}

export function canSendCurrentRevision(status: ProposalStatus) {
  return status === "READY_TO_SEND";
}

export function canProcessCustomerFeedback(status: ProposalStatus) {
  return status === "WAITING_CUSTOMER_FEEDBACK";
}

export function isRevisionNeeded(status: ProposalStatus) {
  return status === "REVISION_NEEDED";
}

export function isEditableCase(status: ProposalStatus) {
  return status !== "ACCEPTED" && status !== "CANCELED";
}
