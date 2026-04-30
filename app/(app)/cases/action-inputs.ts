import { z } from "zod";
import { CaseTagsSchema } from "@/lib/domain/case-tags";

const requiredString = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

const createCaseSchema = z.object({
  title: z.string().trim().optional().default(""),
  customerName: requiredString("customerName"),
  originalRequestText: requiredString("originalRequestText"),
  analystUserId: z.string().trim().optional(),
});

const confirmCurrentRevisionSchema = z.object({
  proposalCaseId: requiredString("proposalCaseId"),
  revisionId: requiredString("revisionId"),
  analystConfirmedText: requiredString("analystConfirmedText"),
});

const updateCaseTitleSchema = z.object({
  proposalCaseId: requiredString("proposalCaseId"),
  title: requiredString("title"),
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

export function parseUpdateCaseTitleInput(formData: FormData) {
  return parseFormData(updateCaseTitleSchema, {
    proposalCaseId: readString(formData, "proposalCaseId"),
    title: readString(formData, "title"),
  });
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

const updateCaseTagsSchema = z.object({
  proposalCaseId: requiredString("proposalCaseId"),
});

export function parseUpdateCaseTagsInput(formData: FormData) {
  const { proposalCaseId } = parseFormData(updateCaseTagsSchema, {
    proposalCaseId: readString(formData, "proposalCaseId"),
  });

  const tagsRaw: Record<string, unknown> = {};
  for (const key of [
    "productLine",
    "organism",
    "application",
    "analysisDepth",
  ]) {
    const val = readString(formData, key);
    if (val !== undefined) tagsRaw[key] = val || null;
  }
  for (const key of ["sampleTypes", "platforms", "keywordTags"]) {
    const val = readString(formData, key);
    if (val !== undefined) tagsRaw[key] = val ? val.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }

  const tags = CaseTagsSchema.parse(tagsRaw);
  return { proposalCaseId, tags };
}
