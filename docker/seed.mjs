import {
  GenerationStatus,
  PrismaClient,
  ProposalStatus,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { id: "seed-pm-user" },
    update: {},
    create: {
      id: "seed-pm-user",
      email: "pm@example.com",
      name: "PM User",
      role: UserRole.PM,
    },
  });

  await prisma.user.upsert({
    where: { id: "seed-analyst-user" },
    update: {},
    create: {
      id: "seed-analyst-user",
      email: "analyst@example.com",
      name: "Analyst User",
      role: UserRole.ANALYST,
    },
  });

  await prisma.proposalCase.updateMany({
    where: {
      generationStatus: GenerationStatus.PENDING,
      OR: [
        { status: { not: ProposalStatus.DRAFTING } },
        { revisions: { some: {} } },
      ],
    },
    data: {
      generationStatus: GenerationStatus.SUCCEEDED,
      generationError: null,
      generationFinishedAt: new Date(),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
