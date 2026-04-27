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

  throw new Error(
    "Current user is not configured. Run prisma seed or configure authentication.",
  );
}
