import { NextResponse } from "next/server";
import { errorMessage } from "@/lib/ai/generation-errors";
import { runInitialDraftGeneration } from "@/lib/ai/run-initial-generation";
import { getCurrentUser } from "@/lib/auth/current-user";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const currentUser = await getCurrentUser();

  try {
    const result = await runInitialDraftGeneration({
      proposalCaseId: id,
      actorUserId: currentUser.id,
    });
    if (result.status === "running") {
      return NextResponse.json(result, { status: 202 });
    }
    if (result.status === "failed") {
      return NextResponse.json(result, { status: 500 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = errorMessage(error, "Failed to start");
    if (message === "Proposal case was not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
