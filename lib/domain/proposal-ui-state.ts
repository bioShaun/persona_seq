import { ProposalStatus } from "@prisma/client";

export function canConfirmCurrentRevision(status: ProposalStatus) {
  return status === ProposalStatus.ANALYST_REVIEW;
}
