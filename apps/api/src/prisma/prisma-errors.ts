import { Prisma } from "@friends/db";

/** True when Postgres rejected an insert/upsert on a unique constraint (TOCTOU race). */
export function isPrismaUniqueConflict(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}
