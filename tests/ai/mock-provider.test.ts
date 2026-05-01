import { describe, expect, it } from "vitest";
import { MockProposalAiProvider } from "@/lib/ai/mock-provider";
import {
  InitialProposalJsonSchema,
  RevisionProposalJsonSchema,
  TagExtractionSchema,
} from "@/lib/ai/proposal-schema";
import { CaseTagsSchema } from "@/lib/domain/case-tags";

describe("MockProposalAiProvider.generateJson", () => {
  it("returns a complete object that parses with InitialProposalJsonSchema", async () => {
    const provider = new MockProposalAiProvider();

    const result = await provider.generateJson(
      "prompt",
      InitialProposalJsonSchema,
      "InitialProposalJson",
    );

    expect(InitialProposalJsonSchema.parse(result)).toEqual(result);
    expect(result).toMatchObject({
      requirementSummary: expect.any(String),
      missingInformation: expect.any(String),
      proposalDraft: expect.any(String),
      suggestedTitle: expect.any(String),
      tags: expect.any(Object),
    });
  });

  it("returns tags that satisfy CaseTagsSchema", async () => {
    const provider = new MockProposalAiProvider();

    const result = await provider.generateJson(
      "prompt",
      InitialProposalJsonSchema,
      "InitialProposalJson",
    );

    expect(CaseTagsSchema.parse(result.tags)).toEqual(result.tags);
  });

  it("returns the same fixed output for different prompts", async () => {
    const provider = new MockProposalAiProvider();

    const first = await provider.generateJson(
      "short prompt",
      InitialProposalJsonSchema,
      "InitialProposalJson",
    );
    const second = await provider.generateJson(
      "a very different and much longer prompt for the mock provider",
      InitialProposalJsonSchema,
      "InitialProposalJson",
    );

    expect(second).toEqual(first);
  });

  it("returns revision-shaped data when called with RevisionProposalJsonSchema", async () => {
    const provider = new MockProposalAiProvider();

    const result = await provider.generateJson(
      "prompt",
      RevisionProposalJsonSchema,
      "RevisionProposal",
    );

    expect(RevisionProposalJsonSchema.parse(result)).toEqual(result);
    expect(result).toMatchObject({
      revisionNotes: expect.any(String),
      missingInformation: expect.any(String),
      proposalDraft: expect.any(String),
      suggestedTitle: expect.any(String),
      tags: expect.any(Object),
    });
    expect(result).not.toHaveProperty("requirementSummary");
  });

  it("returns tag extraction data when called with TagExtractionSchema", async () => {
    const provider = new MockProposalAiProvider();

    const result = await provider.generateJson(
      "prompt",
      TagExtractionSchema,
      "TagExtraction",
    );

    expect(TagExtractionSchema.parse(result)).toEqual(result);
    expect(result).toHaveProperty("tags");
    expect(CaseTagsSchema.parse(result.tags)).toEqual(result.tags);
  });
});
