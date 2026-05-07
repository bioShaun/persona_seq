import type { RevisionWorkflowState } from "./proposal-types";

function hasText(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function createInitialRevision(input: { aiDraft: string }) {
  if (!hasText(input.aiDraft)) {
    throw new Error("AI draft is required");
  }

  return {
    revisionNumber: 1,
    customerFeedbackText: null,
    aiDraft: input.aiDraft,
    analystConfirmedText: null,
    revisionNotes: null,
  };
}

export function createRevisionFromCustomerFeedback(input: {
  currentRevisionNumber: number;
  customerFeedbackText: string;
  aiDraft: string;
  revisionNotes: string | null;
}) {
  if (!isPositiveInteger(input.currentRevisionNumber)) {
    throw new Error("Current revision number must be a positive integer");
  }

  if (!hasText(input.customerFeedbackText)) {
    throw new Error("Customer feedback text is required");
  }

  if (!hasText(input.aiDraft)) {
    throw new Error("AI draft is required");
  }

  return {
    revisionNumber: input.currentRevisionNumber + 1,
    customerFeedbackText: input.customerFeedbackText,
    aiDraft: input.aiDraft,
    analystConfirmedText: null,
    revisionNotes: input.revisionNotes,
  };
}

export function enterCustomerFeedback(input: {
  currentRevisionNumber: number;
  customerFeedbackText: string;
  revisionNotes: string | null;
}) {
  if (!isPositiveInteger(input.currentRevisionNumber)) {
    throw new Error("Current revision number must be a positive integer");
  }

  if (!hasText(input.customerFeedbackText)) {
    throw new Error("Customer feedback text is required");
  }

  return {
    revisionNumber: input.currentRevisionNumber + 1,
    customerFeedbackText: input.customerFeedbackText,
    aiDraft: null,
    analystConfirmedText: null,
    revisionNotes: input.revisionNotes,
  };
}

export function completeRevisionDraft(input: {
  revisionNumber: number;
  aiDraft: string;
}) {
  if (!isPositiveInteger(input.revisionNumber)) {
    throw new Error("Revision number must be a positive integer");
  }

  if (!hasText(input.aiDraft)) {
    throw new Error("AI draft is required");
  }

  return {
    revisionNumber: input.revisionNumber,
    aiDraft: input.aiDraft,
  };
}

export function markRevisionConfirmed(
  input: RevisionWorkflowState & { analystConfirmedText: string; confirmedAt?: Date },
) {
  if (!hasText(input.analystConfirmedText)) {
    throw new Error("Analyst confirmed text is required");
  }

  const { confirmedAt, ...state } = input;

  return {
    ...state,
    analystConfirmedText: input.analystConfirmedText,
    confirmedByAnalystAt: confirmedAt ?? new Date(),
  };
}

export function markRevisionSent(input: RevisionWorkflowState & { sentAt?: Date }) {
  if (!hasText(input.analystConfirmedText)) {
    throw new Error("Cannot send a revision before analyst confirmation");
  }

  const { sentAt, ...state } = input;

  return {
    ...state,
    sentToCustomerAt: sentAt ?? new Date(),
  };
}
