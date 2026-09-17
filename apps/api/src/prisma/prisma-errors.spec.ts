import { Prisma } from "@friends/db";
import { describe, expect, it } from "vitest";
import { isPrismaUniqueConflict } from "./prisma-errors";

describe("isPrismaUniqueConflict", () => {
  it("is true for P2002", () => {
    const err = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "test",
    });
    expect(isPrismaUniqueConflict(err)).toBe(true);
  });

  it("is false for other Prisma codes", () => {
    const err = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "test",
    });
    expect(isPrismaUniqueConflict(err)).toBe(false);
  });

  it("is false for non-Prisma errors", () => {
    expect(isPrismaUniqueConflict(new Error("boom"))).toBe(false);
    expect(isPrismaUniqueConflict(null)).toBe(false);
  });
});
