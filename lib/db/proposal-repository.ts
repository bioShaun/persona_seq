import { FinalOutcome, ProposalStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type CreateProposalCaseInput = {
  title: string;
  customerName: string;
  originalRequestText: string;
  pmUserId: string;
  analystUserId?: string | null;
};

type UpdateCaseAfterInitialGenerationInput = {
  proposalCaseId: string;
  requirementSummary: string;
  missingInformation: string;
  aiDraft: string;
};

type ConfirmRevisionInput = {
  proposalCaseId: string;
  revisionId: string;
  analystConfirmedText: string;
};

type MarkSentToCustomerInput = {
  proposalCaseId: string;
  revisionId: string;
};

export async function listProposalCases() {
  return prisma.proposalCase.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      pmUser: true,
      analystUser: true,
    },
  });
}

export async function getProposalCaseDetail(id: string) {
  return prisma.proposalCase.findUnique({
    where: { id },
    include: {
      pmUser: true,
      analystUser: true,
      revisions: {
        orderBy: { revisionNumber: "asc" },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function createProposalCase(input: CreateProposalCaseInput) {
  return prisma.proposalCase.create({
    data: {
      title: input.title,
      customerName: input.customerName,
      originalRequestText: input.originalRequestText,
      pmUserId: input.pmUserId,
      analystUserId: input.analystUserId ?? null,
      status: ProposalStatus.DRAFTING,
    },
  });
}

export async function updateCaseAfterInitialGeneration(
  input: UpdateCaseAfterInitialGenerationInput,
) {
  return prisma.proposalCase.update({
    where: { id: input.proposalCaseId },
    data: {
      requirementSummary: input.requirementSummary,
      missingInformation: input.missingInformation,
      status: ProposalStatus.ANALYST_REVIEW,
      revisions: {
        create: {
          revisionNumber: 1,
          aiDraft: input.aiDraft,
        },
      },
    },
  });
}

export async function confirmRevision(input: ConfirmRevisionInput) {
  return prisma.$transaction([
    prisma.revision.update({
      where: { id: input.revisionId },
      data: {
        analystConfirmedText: input.analystConfirmedText,
        confirmedByAnalystAt: new Date(),
      },
    }),
    prisma.proposalCase.update({
      where: { id: input.proposalCaseId },
      data: {
        status: ProposalStatus.READY_TO_SEND,
      },
    }),
  ]);
}

export async function markSentToCustomer(input: MarkSentToCustomerInput) {
  return prisma.$transaction([
    prisma.revision.update({
      where: { id: input.revisionId },
      data: {
        sentToCustomerAt: new Date(),
      },
    }),
    prisma.proposalCase.update({
      where: { id: input.proposalCaseId },
      data: {
        status: ProposalStatus.WAITING_CUSTOMER_FEEDBACK,
      },
    }),
  ]);
}

export async function markCustomerAccepted(proposalCaseId: string) {
  return prisma.proposalCase.update({
    where: { id: proposalCaseId },
    data: {
      status: ProposalStatus.ACCEPTED,
      finalOutcome: FinalOutcome.ACCEPTED,
    },
  });
}

export async function markCustomerCanceled(proposalCaseId: string) {
  return prisma.proposalCase.update({
    where: { id: proposalCaseId },
    data: {
      status: ProposalStatus.CANCELED,
      finalOutcome: FinalOutcome.CANCELED,
    },
  });
}
