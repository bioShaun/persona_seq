import type {
  ProposalCase,
  ProposalStatus as PrismaProposalStatus,
} from "@prisma/client";
import type { ProposalStatus } from "@/lib/domain/proposal-status";
import type { ProposalCaseSummary } from "@/lib/domain/proposal-types";

const statusMap: Record<PrismaProposalStatus, ProposalStatus> = {
  DRAFTING: "drafting",
  ANALYST_REVIEW: "analyst_review",
  READY_TO_SEND: "ready_to_send",
  WAITING_CUSTOMER_FEEDBACK: "waiting_customer_feedback",
  REVISION_NEEDED: "revision_needed",
  ACCEPTED: "accepted",
  CANCELED: "canceled",
};

export function mapProposalCaseSummary(
  caseRecord: ProposalCase,
): ProposalCaseSummary {
  return {
    id: caseRecord.id,
    title: caseRecord.title,
    customerName: caseRecord.customerName,
    requirementSummary: caseRecord.requirementSummary,
    status: statusMap[caseRecord.status],
    pmUserId: caseRecord.pmUserId,
    analystUserId: caseRecord.analystUserId,
    currentRevisionNumber: caseRecord.currentRevisionNumber,
    updatedAt: caseRecord.updatedAt,
  };
}
