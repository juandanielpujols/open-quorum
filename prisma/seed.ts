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

  // Evento de demo para que la UI se vea con data
  const admin = await prisma.user.findUnique({ where: { email: "admin@example.local" } });
  const voto1 = await prisma.user.findUnique({ where: { email: "voto1@example.local" } });
  if (admin && voto1) {
    const existing = await prisma.evento.findFirst({ where: { nombre: "Demo — Asamblea inicial" } });
    if (!existing) {
      const evento = await prisma.evento.create({
        data: {
          nombre: "Demo — Asamblea inicial",
          descripcion: "Evento sembrado para probar el flujo vivo",
          modo: "VIVO",
          estado: "BORRADOR",
          creadoPor: admin.id,
          invitados: { create: [{ userId: voto1.id }] },
          preguntas: {
            create: [
              {
                orden: 0,
                tipo: "SI_NO",
                enunciado: "¿Aprobamos la agenda propuesta?",
                visibilidad: "OCULTO_HASTA_CERRAR",
                configuracion: {},
                estado: "BORRADOR",
                opciones: {
                  create: [
                    { orden: 0, texto: "Sí" },
                    { orden: 1, texto: "No" },
                  ],
                },
              },
              {
                orden: 1,
                tipo: "ESCALA",
                enunciado: "¿Qué tan preparados te sentís para la siguiente fase?",
                visibilidad: "EN_VIVO",
                configuracion: { min: 1, max: 5, etiquetaMin: "Nada", etiquetaMax: "Muy preparado" },
                estado: "BORRADOR",
              },
            ],
          },
        },
      });
      console.log(`Demo event seeded: ${evento.id}`);
    }
  }

  console.log(
    "Seed OK:\n" +
      "  admin@example.local / admin1234\n" +
      "  voto1@example.local / voto1234\n" +
      "  reviewer@example.local / review1234",
  );
}

main().finally(() => prisma.$disconnect());
