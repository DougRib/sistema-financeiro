import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function makePrisma() {
  const connectionString = process.env.DIRECT_DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DIRECT_DATABASE_URL não está definido. Configure a variável de ambiente no arquivo .env (ex.: postgresql://user:pass@host:5432/db).",
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    log: ["warn", "error"],
    adapter,
  });
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
