import { prisma } from "@/lib/prisma";

/**
 * Returns the set of user IDs whose data the authenticated user can access:
 * - Always includes the user themself.
 * - Includes any owner that shared access with this user (status=ACCEPTED).
 *
 * Use for READ queries (e.g. listing transactions).
 */
export async function getReadableOwnerIds(userId: number): Promise<number[]> {
  const accesses = await prisma.sharedAccess.findMany({
    where: {
      sharedWithUserId: userId,
      status: "ACCEPTED",
    },
    select: { ownerId: true },
  });
  return [userId, ...accesses.map((a) => a.ownerId)];
}

/**
 * Returns the set of user IDs whose data the authenticated user can MUTATE:
 * - Always includes the user themself.
 * - Includes any owner that shared WRITE access with this user (status=ACCEPTED).
 *
 * Use for write operations (CREATE/UPDATE/DELETE).
 */
export async function getWritableOwnerIds(userId: number): Promise<number[]> {
  const accesses = await prisma.sharedAccess.findMany({
    where: {
      sharedWithUserId: userId,
      status: "ACCEPTED",
      permission: "WRITE",
    },
    select: { ownerId: true },
  });
  return [userId, ...accesses.map((a) => a.ownerId)];
}

/**
 * Checks if `userId` is allowed to act on data owned by `targetOwnerId`.
 * Returns true if same user, or if there's an accepted share with the required permission.
 */
export async function canAccess(
  userId: number,
  targetOwnerId: number,
  permission: "READ" | "WRITE",
): Promise<boolean> {
  if (userId === targetOwnerId) return true;
  const access = await prisma.sharedAccess.findFirst({
    where: {
      ownerId: targetOwnerId,
      sharedWithUserId: userId,
      status: "ACCEPTED",
      ...(permission === "WRITE" ? { permission: "WRITE" } : {}),
    },
    select: { id: true },
  });
  return !!access;
}
