/** Uniform integer in `[0, count)` for Prisma `skip` / array index. */
export function pickRandomOffset(count: number, random: () => number = Math.random): number {
  if (!Number.isFinite(count) || count <= 0) {
    throw new RangeError("count must be a positive finite number");
  }
  return Math.floor(random() * count);
}
