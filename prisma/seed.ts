import { config as loadEnv } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

loadEnv({ path: ".env.local" });
loadEnv();

const connectionString = process.env.DATABASE_URL_LOCAL ?? process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminHash = await bcrypt.hash("admin1234", 12);
  await prisma.user.upsert({
    where: { email: "admin@example.local" },
    update: {},
    create: {
      email: "admin@example.local",
      nombre: "Admin",
      rol: "ADMIN",
      hashedPassword: adminHash,
      activado: true,
    },
  });

  const votanteHash = await bcrypt.hash("voto1234", 12);
  await prisma.user.upsert({
    where: { email: "voto1@example.local" },
    update: {},
    create: {
      email: "voto1@example.local",
      nombre: "Votante 1",
      rol: "VOTANTE",
      hashedPassword: votanteHash,
      activado: true,
    },
  });

  const reviewerHash = await bcrypt.hash("review1234", 12);
  await prisma.user.upsert({
    where: { email: "reviewer@example.local" },
    update: {},
    create: {
      email: "reviewer@example.local",
      nombre: "Reviewer",
      rol: "REVIEWER",
      hashedPassword: reviewerHash,
      activado: true,
    },
  });

  console.log(
    "Seed OK:\n" +
      "  admin@example.local / admin1234\n" +
      "  voto1@example.local / voto1234\n" +
      "  reviewer@example.local / review1234",
  );
}

main().finally(() => prisma.$disconnect());
