/**
 * Seed de 2 eventos demo con las 6 tipos de pregunta + varios chart types.
 * Uso: npx tsx scripts/seed-demo-events.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_LOCAL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function upsertVotante(email: string, nombre: string) {
  const hash = await bcrypt.hash("voto1234", 12);
  return prisma.user.upsert({
    where: { email },
    update: { activado: true, rol: "VOTANTE", nombre },
    create: { email, nombre, rol: "VOTANTE", hashedPassword: hash, activado: true },
  });
}

async function crearEventoCompleto(opts: {
  nombre: string;
  descripcion: string;
  modo: "VIVO" | "ASINCRONO";
  inicioAt?: Date;
  cierreAt?: Date;
  mostrarResultadosFinales?: boolean;
  adminId: string;
  votanteIds: string[];
}) {
  const e = await prisma.evento.create({
    data: {
      nombre: opts.nombre,
      descripcion: opts.descripcion,
      modo: opts.modo,
      estado: "ACTIVO",
      inicioAt: opts.inicioAt ?? new Date(),
      cierreAt: opts.cierreAt ?? null,
      mostrarResultadosFinales: opts.mostrarResultadosFinales ?? true,
      creadoPor: opts.adminId,
      invitados: { create: opts.votanteIds.map((userId) => ({ userId })) },
    },
  });

  let orden = 0;

  // 1. SI_NO con BARRAS_V
  await prisma.pregunta.create({
    data: {
      eventoId: e.id,
      orden: orden++,
      tipo: "SI_NO",
      enunciado: "¿Aprueba la propuesta del nuevo reglamento?",
      visibilidad: "EN_VIVO",
      estado: "BORRADOR",
      configuracion: { chartTipo: "BARRAS_V" },
      opciones: { create: [{ orden: 0, texto: "Sí" }, { orden: 1, texto: "No" }] },
    },
  });

  // 2. OPCION_MULTIPLE con BARRAS_H (single choice)
  await prisma.pregunta.create({
    data: {
      eventoId: e.id,
      orden: orden++,
      tipo: "OPCION_MULTIPLE",
      enunciado: "¿Qué prioridad debe tener el próximo proyecto?",
      visibilidad: "OCULTO_HASTA_CERRAR",
      estado: "BORRADOR",
      configuracion: {
        permitirMultiple: false,
        maxSelecciones: 1,
        chartTipo: "BARRAS_H",
      },
      opciones: {
        create: [
          { orden: 0, texto: "Renovación de infraestructura" },
          { orden: 1, texto: "Capacitación continua" },
          { orden: 2, texto: "Expansión regional" },
          { orden: 3, texto: "Digitalización de procesos" },
        ],
      },
    },
  });

  // 3. OPCION_MULTIPLE con POSICIONAL_XY (2 opciones)
  await prisma.pregunta.create({
    data: {
      eventoId: e.id,
      orden: orden++,
      tipo: "OPCION_MULTIPLE",
      enunciado: "Entre estos dos ejes, ¿cuál debe predominar?",
      visibilidad: "EN_VIVO",
      estado: "BORRADOR",
      configuracion: {
        permitirMultiple: false,
        maxSelecciones: 1,
        chartTipo: "POSICIONAL_XY",
      },
      opciones: {
        create: [
          { orden: 0, texto: "Costo-eficiencia" },
          { orden: 1, texto: "Calidad premium" },
        ],
      },
    },
  });

  // 4. ESCALA 1-5
  await prisma.pregunta.create({
    data: {
      eventoId: e.id,
      orden: orden++,
      tipo: "ESCALA",
      enunciado: "¿Qué tan satisfecho está con la comunicación del consejo?",
      visibilidad: "OCULTO_HASTA_CERRAR",
      estado: "BORRADOR",
      configuracion: {
        min: 1,
        max: 5,
        etiquetaMin: "Nada satisfecho",
        etiquetaMax: "Muy satisfecho",
      },
      opciones: { create: [] },
    },
  });

  // 5. RANKING
  await prisma.pregunta.create({
    data: {
      eventoId: e.id,
      orden: orden++,
      tipo: "RANKING",
      enunciado: "Ordene estos valores institucionales por importancia",
      visibilidad: "EN_VIVO",
      estado: "BORRADOR",
      configuracion: {},
      opciones: {
        create: [
          { orden: 0, texto: "Transparencia" },
          { orden: 1, texto: "Innovación" },
          { orden: 2, texto: "Sostenibilidad" },
          { orden: 3, texto: "Inclusión" },
          { orden: 4, texto: "Excelencia" },
        ],
      },
    },
  });

  // 6. NUBE_PALABRAS
  await prisma.pregunta.create({
    data: {
      eventoId: e.id,
      orden: orden++,
      tipo: "NUBE_PALABRAS",
      enunciado: "¿Qué palabras describen al consejo hoy?",
      visibilidad: "EN_VIVO",
      estado: "BORRADOR",
      configuracion: { palabrasPorVotante: 3, maxCaracteres: 30 },
      opciones: { create: [] },
    },
  });

  // 7. RESPUESTA_ABIERTA
  await prisma.pregunta.create({
    data: {
      eventoId: e.id,
      orden: orden++,
      tipo: "RESPUESTA_ABIERTA",
      enunciado: "¿Qué sugerencia aporta para mejorar el próximo año?",
      visibilidad: "OCULTO_HASTA_CERRAR",
      estado: "BORRADOR",
      configuracion: { maxCaracteres: 500 },
      opciones: { create: [] },
    },
  });

  // 8. OPCION_MULTIPLE con NUMEROS (multi-choice)
  await prisma.pregunta.create({
    data: {
      eventoId: e.id,
      orden: orden++,
      tipo: "OPCION_MULTIPLE",
      enunciado: "¿En qué comisiones le gustaría participar? (máximo 3)",
      visibilidad: "OCULTO_HASTA_CERRAR",
      estado: "BORRADOR",
      configuracion: {
        permitirMultiple: true,
        maxSelecciones: 3,
        chartTipo: "NUMEROS",
      },
      opciones: {
        create: [
          { orden: 0, texto: "Finanzas" },
          { orden: 1, texto: "Auditoría" },
          { orden: 2, texto: "Tecnología" },
          { orden: 3, texto: "Relaciones públicas" },
          { orden: 4, texto: "Educación" },
          { orden: 5, texto: "Ética" },
        ],
      },
    },
  });

  return e;
}

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: "admin@example.local" } });
  if (!admin) throw new Error("admin no existe — corre `npx prisma db seed` primero");

  const voto1 = await upsertVotante("voto1@example.local", "Votante 1");
  const voto2 = await upsertVotante("voto2@example.local", "Votante 2");
  const voto3 = await upsertVotante("voto3@example.local", "Votante 3");
  const voto4 = await upsertVotante("voto4@example.local", "Votante 4");
  const voto5 = await upsertVotante("voto5@example.local", "Votante 5");
  const votanteIds = [voto1.id, voto2.id, voto3.id, voto4.id, voto5.id];

  const e1 = await crearEventoCompleto({
    nombre: "Demo — Sesión de Consejo (en vivo)",
    descripcion:
      "Evento demo para probar flujo en vivo: admin abre, cierra y revela cada pregunta mientras el proyector muestra resultados.",
    modo: "VIVO",
    adminId: admin.id,
    votanteIds,
    mostrarResultadosFinales: true,
  });

  const enUnaSemana = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const e2 = await crearEventoCompleto({
    nombre: "Demo — Consulta Asíncrona 2026",
    descripcion:
      "Evento demo en modo asíncrono. Los votantes pueden participar durante la ventana; al cierre se muestran resultados.",
    modo: "ASINCRONO",
    inicioAt: new Date(),
    cierreAt: enUnaSemana,
    adminId: admin.id,
    votanteIds,
    mostrarResultadosFinales: true,
  });

  console.log("✓ Evento 1 creado:", e1.id, "—", e1.nombre);
  console.log("✓ Evento 2 creado:", e2.id, "—", e2.nombre);
  console.log("✓ Votantes demo:", votanteIds.length, "(password: voto1234)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
