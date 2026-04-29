import type { ProposalAiProvider } from "@/lib/ai/types";

export type GenerationInput = {
  proposalCaseId: string;
  actorUserId: string;
};

export type InitialGenerationResult =
  | { kind: "running" }
  | { kind: "succeeded" }
  | { kind: "failed"; error: string };

export type RegenerateGenerationResult =
  | { kind: "succeeded" }
  | { kind: "case_not_found" }
  | { kind: "already_completed" }
  | { kind: "state_not_regeneratable"; currentStatus: string }
  | { kind: "state_changed" }
  | { kind: "failed"; error: string };
