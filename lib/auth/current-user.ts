import "server-only";

import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const TEMP_CURRENT_USER_ID = "seed-pm-user";

export type CurrentUser = {
  id: string;
  role: UserRole;
};

export async function getCurrentUser(): Promise<CurrentUser> {
  const seededUser = await prisma.user.findUnique({
    where: { id: TEMP_CURRENT_USER_ID },
    select: {
      id: true,
      role: true,
    },
  });

  if (seededUser) {
    return seededUser;
  }

  const firstPmUser = await prisma.user.findFirst({
    where: { role: UserRole.PM },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
    },
  });

  if (firstPmUser) {
    return firstPmUser;
  }

  // Temporary auth boundary until Auth.js session wiring is available.
  return {
    id: TEMP_CURRENT_USER_ID,
    role: UserRole.PM,
  };
}
