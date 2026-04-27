type RevisionState = {
  revisionNumber?: number;
  customerFeedbackText?: string | null;
  aiDraft?: string;
  analystConfirmedText?: string | null;
  revisionNotes?: string | null;
  sentToCustomerAt?: Date | null;
};

function hasText(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

export function createInitialRevision(input: { aiDraft: string }) {
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
  if (!hasText(input.customerFeedbackText)) {
    throw new Error("Customer feedback text is required");
  }

  return {
    revisionNumber: input.currentRevisionNumber + 1,
    customerFeedbackText: input.customerFeedbackText,
    aiDraft: input.aiDraft,
    analystConfirmedText: null,
    revisionNotes: input.revisionNotes,
  };
}

export function markRevisionConfirmed(
  input: RevisionState & { analystConfirmedText: string; confirmedAt?: Date },
) {
  if (!hasText(input.analystConfirmedText)) {
    throw new Error("Analyst confirmed text is required");
  }

  return {
    ...input,
    analystConfirmedText: input.analystConfirmedText,
    confirmedByAnalystAt: input.confirmedAt ?? new Date(),
  };
}

export function markRevisionSent(input: RevisionState & { sentAt?: Date }) {
  if (!hasText(input.analystConfirmedText)) {
    throw new Error("Cannot send a revision before analyst confirmation");
  }

  return {
    ...input,
    sentToCustomerAt: input.sentAt ?? new Date(),
  };
}
