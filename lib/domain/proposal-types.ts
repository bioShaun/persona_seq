import type { ProposalStatus, UserRole } from "./proposal-status";

export type ProposalCaseSummary = {
  id: string;
  title: string;
  customerName: string;
  requirementSummary: string | null;
  status: ProposalStatus;
  pmUserId: string;
  analystUserId: string | null;
  currentRevisionNumber: number;
  updatedAt: Date;
};

export type RevisionDraft = {
  revisionNumber: number;
  customerFeedbackText: string | null;
  aiDraft: string;
  analystConfirmedText: string | null;
  revisionNotes: string | null;
};

export type RevisionWorkflowState = RevisionDraft & {
  confirmedByAnalystAt?: Date;
  sentToCustomerAt?: Date | null;
};

export type AuthenticatedUser = {
  id: string;
  name: string;
  role: Exclude<UserRole, "system">;
};
