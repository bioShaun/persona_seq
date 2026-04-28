import { z } from "zod";

const requiredString = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

const createCaseSchema = z.object({
  title: requiredString("title"),
  customerName: requiredString("customerName"),
  originalRequestText: requiredString("originalRequestText"),
  analystUserId: z.string().trim().optional(),
});

const confirmCurrentRevisionSchema = z.object({
  proposalCaseId: requiredString("proposalCaseId"),
  revisionId: requiredString("revisionId"),
  analystConfirmedText: requiredString("analystConfirmedText"),
});

const sendCurrentRevisionSchema = z.object({
  proposalCaseId: requiredString("proposalCaseId"),
  revisionId: requiredString("revisionId"),
});

const markOutcomeSchema = z.object({
  proposalCaseId: requiredString("proposalCaseId"),
});

const createRevisionFromFeedbackSchema = z.object({
  proposalCaseId: requiredString("proposalCaseId"),
  customerFeedbackText: requiredString("customerFeedbackText"),
});

function readString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function parseFormData<T>(
  schema: z.ZodType<T>,
  rawValues: Record<string, string | undefined>,
): T {
  const parsed = schema.safeParse(rawValues);
  if (parsed.success) {
    return parsed.data;
  }

  throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
}

export function parseCreateCaseInput(formData: FormData) {
  const input = parseFormData(createCaseSchema, {
    title: readString(formData, "title"),
    customerName: readString(formData, "customerName"),
    originalRequestText: readString(formData, "originalRequestText"),
    analystUserId: readString(formData, "analystUserId")?.trim() || undefined,
  });

  return input;
}

export function parseConfirmCurrentRevisionInput(formData: FormData) {
  return parseFormData(confirmCurrentRevisionSchema, {
    proposalCaseId: readString(formData, "proposalCaseId"),
    revisionId: readString(formData, "revisionId"),
    analystConfirmedText: readString(formData, "analystConfirmedText"),
  });
}

export function parseSendCurrentRevisionInput(formData: FormData) {
  return parseFormData(sendCurrentRevisionSchema, {
    proposalCaseId: readString(formData, "proposalCaseId"),
    revisionId: readString(formData, "revisionId"),
  });
}

export function parseMarkOutcomeInput(formData: FormData) {
  return parseFormData(markOutcomeSchema, {
    proposalCaseId: readString(formData, "proposalCaseId"),
  });
}

export function parseCreateRevisionFromFeedbackInput(formData: FormData) {
  return parseFormData(createRevisionFromFeedbackSchema, {
    proposalCaseId: readString(formData, "proposalCaseId"),
    customerFeedbackText: readString(formData, "customerFeedbackText"),
  });
}
