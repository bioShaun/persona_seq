import { UserRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

import { getCurrentUser } from "@/lib/auth/current-user";

describe("getCurrentUser", () => {
  it("returns the seeded user when present", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "seed-pm-user",
      role: UserRole.PM,
    });

    await expect(getCurrentUser()).resolves.toEqual({
      id: "seed-pm-user",
      role: UserRole.PM,
    });

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: "seed-pm-user" },
      select: { id: true, role: true },
    });
  });

  it("throws a setup error when current user is missing", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    await expect(getCurrentUser()).rejects.toThrow(
      "Current user is not configured. Run prisma seed or configure authentication.",
    );
  });
});
