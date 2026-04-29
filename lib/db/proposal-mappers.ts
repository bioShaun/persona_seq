import type {
  ProposalCase,
  ProposalStatus as PrismaProposalStatus,
} from "@prisma/client";
import type { ProposalStatus } from "@/lib/domain/proposal-status";
import type { ProposalCaseSummary } from "@/lib/domain/proposal-types";

const statusMap: Record<PrismaProposalStatus, ProposalStatus> = {
  DRAFTING: "DRAFTING",
  ANALYST_REVIEW: "ANALYST_REVIEW",
  READY_TO_SEND: "READY_TO_SEND",
  WAITING_CUSTOMER_FEEDBACK: "WAITING_CUSTOMER_FEEDBACK",
  REVISION_NEEDED: "REVISION_NEEDED",
  ACCEPTED: "ACCEPTED",
  CANCELED: "CANCELED",
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
