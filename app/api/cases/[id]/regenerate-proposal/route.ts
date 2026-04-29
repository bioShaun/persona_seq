import { NextResponse } from "next/server";
import { getProposalAiProvider } from "@/lib/ai/get-proposal-ai-provider";
import { getCurrentUser } from "@/lib/auth/current-user";
import { regenerateProposalDraft } from "@/lib/generation/regenerate";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const currentUser = await getCurrentUser();
  const provider = getProposalAiProvider();

  const result = await regenerateProposalDraft(
    { proposalCaseId: id, actorUserId: currentUser.id },
    provider,
  );

  switch (result.kind) {
    case "succeeded":
      return NextResponse.json({ status: "succeeded" });
    case "case_not_found":
      return NextResponse.json({ error: "Proposal case not found" }, { status: 404 });
    case "already_completed":
      return NextResponse.json(
        { error: "Cannot regenerate a case with a final outcome" },
        { status: 409 },
      );
    case "state_not_regeneratable":
      return NextResponse.json(
        { error: `Cannot regenerate in status "${result.currentStatus}"` },
        { status: 409 },
      );
    case "state_changed":
      return NextResponse.json(
        { error: "Proposal case state changed during regeneration" },
        { status: 409 },
      );
    case "failed":
      return NextResponse.json({ error: result.error }, { status: 500 });
  }
}
