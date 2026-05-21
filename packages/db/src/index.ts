import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

let databaseReadyCache: boolean | null = null;

export async function isDatabaseReady(): Promise<boolean> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    databaseReadyCache = false;
    return false;
  }
  if (databaseReadyCache !== null) return databaseReadyCache;

  const probe = new PrismaClient({ log: [] });
  try {
    await probe.$queryRaw`SELECT 1`;
    databaseReadyCache = true;
  } catch {
    databaseReadyCache = false;
  } finally {
    await probe.$disconnect().catch(() => undefined);
  }
  return databaseReadyCache;
}

/** Call after migrations so the next check re-probes the database. */
export function resetDatabaseReadyCache(): void {
  databaseReadyCache = null;
}
