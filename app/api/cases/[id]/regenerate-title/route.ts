import { NextResponse } from "next/server";
import { errorMessage } from "@/lib/ai/generation-errors";
import { getProposalAiProvider } from "@/lib/ai/get-proposal-ai-provider";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const currentUser = await getCurrentUser();

    const proposalCase = await prisma.proposalCase.findUnique({
      where: { id },
      select: {
        id: true,
        originalRequestText: true,
        requirementSummary: true,
      },
    });

    if (!proposalCase) {
      return NextResponse.json({ error: "Proposal case not found" }, { status: 404 });
    }

    const contextText =
      [proposalCase.requirementSummary, proposalCase.originalRequestText]
        .filter(Boolean)
        .join("\n\n");

    const provider = getProposalAiProvider();
    const title = await provider.generateText(
      [
        "你是一个专业的生物信息方案项目标题生成器。",
        "请根据以下客户需求内容，生成一个不超过 10 个字的项目标题。",
        "标题必须简洁、概括客户的核心需求。只输出标题本身，不要输出任何其他内容。",
        "",
        contextText,
      ].join("\n"),
    );

    const cleanTitle = title.trim().slice(0, 50);

    await prisma.proposalCase.update({
      where: { id },
      data: { title: cleanTitle },
    });

    return NextResponse.json({ title: cleanTitle });
  } catch (error) {
    const message = errorMessage(error, "Failed to regenerate title");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
