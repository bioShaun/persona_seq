import { describe, expect, it } from "vitest";
import {
  parseConfirmCurrentRevisionInput,
  parseCreateCaseInput,
  parseCreateRevisionFromFeedbackInput,
  parseMarkOutcomeInput,
  parseSendCurrentRevisionInput,
} from "@/app/(app)/cases/action-inputs";

describe("case action input parsing", () => {
  it("parses create-case fields and ignores client-supplied pm user id", () => {
    const formData = new FormData();
    formData.set("title", "Clinical proposal");
    formData.set("customerName", "Acme Biotech");
    formData.set("originalRequestText", "Need analysis pipeline and timeline.");
    formData.set("pmUserId", "client-controlled-pm");
    formData.set("analystUserId", " analyst_1 ");

    expect(parseCreateCaseInput(formData)).toEqual({
      title: "Clinical proposal",
      customerName: "Acme Biotech",
      originalRequestText: "Need analysis pipeline and timeline.",
      analystUserId: "analyst_1",
    });
  });

  it("parses revision confirmation fields and ignores actor user id", () => {
    const formData = new FormData();
    formData.set("proposalCaseId", "case_1");
    formData.set("revisionId", "rev_1");
    formData.set("analystConfirmedText", "Confirmed");
    formData.set("actorUserId", "client-controlled-actor");

    expect(parseConfirmCurrentRevisionInput(formData)).toEqual({
      proposalCaseId: "case_1",
      revisionId: "rev_1",
      analystConfirmedText: "Confirmed",
    });
  });

  it("parses send/mark/revision-feedback payloads without actor fields", () => {
    const sendFormData = new FormData();
    sendFormData.set("proposalCaseId", "case_1");
    sendFormData.set("revisionId", "rev_1");
    sendFormData.set("actorUserId", "client-controlled-actor");
    expect(parseSendCurrentRevisionInput(sendFormData)).toEqual({
      proposalCaseId: "case_1",
      revisionId: "rev_1",
    });

    const outcomeFormData = new FormData();
    outcomeFormData.set("proposalCaseId", "case_1");
    outcomeFormData.set("actorUserId", "client-controlled-actor");
    expect(parseMarkOutcomeInput(outcomeFormData)).toEqual({
      proposalCaseId: "case_1",
    });

    const feedbackFormData = new FormData();
    feedbackFormData.set("proposalCaseId", "case_1");
    feedbackFormData.set("customerFeedbackText", "Please add budget notes.");
    feedbackFormData.set("actorUserId", "client-controlled-actor");
    expect(parseCreateRevisionFromFeedbackInput(feedbackFormData)).toEqual({
      proposalCaseId: "case_1",
      customerFeedbackText: "Please add budget notes.",
    });
  });
});
