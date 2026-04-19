import { config as loadEnv } from "dotenv";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Carga .env.local primero (dev local con puerto 5433), cae a .env si no existe.
loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL_LOCAL ?? process.env.DATABASE_URL!,
  },
});
