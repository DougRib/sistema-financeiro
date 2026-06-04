import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function makePrisma() {
  const adapter = new PrismaPg({
    connectionString: process.env.DIRECT_DATABASE_URL!,
  });
  return new PrismaClient({
    log: ["warn", "error"],
    adapter,
  });
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
