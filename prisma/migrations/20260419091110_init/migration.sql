-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'REVIEWER', 'VOTANTE');

-- CreateEnum
CREATE TYPE "ModoEvento" AS ENUM ('VIVO', 'ASINCRONO');

-- CreateEnum
CREATE TYPE "EstadoEvento" AS ENUM ('BORRADOR', 'ACTIVO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "EstadoPregunta" AS ENUM ('BORRADOR', 'ABIERTA', 'CERRADA', 'REVELADA');

-- CreateEnum
CREATE TYPE "Visibilidad" AS ENUM ('EN_VIVO', 'OCULTO_HASTA_CERRAR');

-- CreateEnum
CREATE TYPE "TipoPregunta" AS ENUM ('OPCION_MULTIPLE', 'SI_NO', 'ESCALA', 'RANKING', 'NUBE_PALABRAS', 'RESPUESTA_ABIERTA', 'QUIZ', 'QA', 'HEATMAP');

-- CreateEnum
CREATE TYPE "OrigenVoto" AS ENUM ('DIRECTO', 'PODER');

-- CreateEnum
CREATE TYPE "EstadoQA" AS ENUM ('PENDIENTE', 'RESPONDIDA', 'DESCARTADA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "hashedPassword" TEXT,
    "rol" "Rol" NOT NULL,
    "activado" BOOLEAN NOT NULL DEFAULT false,
    "tokenActivacion" TEXT,
    "tokenRecuperacion" TEXT,
    "creadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "modo" "ModoEvento" NOT NULL,
    "estado" "EstadoEvento" NOT NULL DEFAULT 'BORRADOR',
    "inicioAt" TIMESTAMP(3),
    "cierreAt" TIMESTAMP(3),
    "maxPoderesPorProxy" INTEGER,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoInvitacion" (
    "eventoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "EventoInvitacion_pkey" PRIMARY KEY ("eventoId","userId")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoTag" (
    "eventoId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "EventoTag_pkey" PRIMARY KEY ("eventoId","tagId")
);

-- CreateTable
CREATE TABLE "Pregunta" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "tipo" "TipoPregunta" NOT NULL,
    "enunciado" TEXT NOT NULL,
    "descripcion" TEXT,
    "visibilidad" "Visibilidad" NOT NULL DEFAULT 'OCULTO_HASTA_CERRAR',
    "estado" "EstadoPregunta" NOT NULL DEFAULT 'BORRADOR',
    "configuracion" JSONB NOT NULL,
    "abiertaAt" TIMESTAMP(3),
    "cerradaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pregunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opcion" (
    "id" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "imagenUrl" TEXT,
    "esCorrecta" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Opcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voto" (
    "id" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "respuesta" JSONB NOT NULL,
    "emitidoVia" "OrigenVoto" NOT NULL DEFAULT 'DIRECTO',
    "representandoA" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poder" (
    "id" TEXT NOT NULL,
    "grantorId" TEXT NOT NULL,
    "proxyId" TEXT NOT NULL,
    "eventoId" TEXT,
    "otorgadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revocadoAt" TIMESTAMP(3),

    CONSTRAINT "Poder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QAItem" (
    "id" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "autorId" TEXT,
    "texto" TEXT NOT NULL,
    "estado" "EstadoQA" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QAItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QAVoto" (
    "qaItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "QAVoto_pkey" PRIMARY KEY ("qaItemId","userId")
);

-- CreateTable
CREATE TABLE "ResumenPDF" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "generadoPor" TEXT NOT NULL,
    "archivoUrl" TEXT NOT NULL,
    "generadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumenPDF_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "contexto" JSONB,
    "enviadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error" TEXT,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_tokenActivacion_key" ON "User"("tokenActivacion");

-- CreateIndex
CREATE UNIQUE INDEX "User_tokenRecuperacion_key" ON "User"("tokenRecuperacion");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_nombre_key" ON "Tag"("nombre");

-- CreateIndex
CREATE INDEX "Pregunta_eventoId_orden_idx" ON "Pregunta"("eventoId", "orden");

-- CreateIndex
CREATE INDEX "Voto_preguntaId_idx" ON "Voto"("preguntaId");

-- CreateIndex
CREATE UNIQUE INDEX "Voto_preguntaId_userId_representandoA_key" ON "Voto"("preguntaId", "userId", "representandoA");

-- CreateIndex
CREATE INDEX "Poder_grantorId_revocadoAt_idx" ON "Poder"("grantorId", "revocadoAt");

-- CreateIndex
CREATE INDEX "Poder_proxyId_revocadoAt_idx" ON "Poder"("proxyId", "revocadoAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetId_createdAt_idx" ON "AuditLog"("targetId", "createdAt");

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoInvitacion" ADD CONSTRAINT "EventoInvitacion_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoInvitacion" ADD CONSTRAINT "EventoInvitacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoTag" ADD CONSTRAINT "EventoTag_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoTag" ADD CONSTRAINT "EventoTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pregunta" ADD CONSTRAINT "Pregunta_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opcion" ADD CONSTRAINT "Opcion_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "Pregunta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voto" ADD CONSTRAINT "Voto_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "Pregunta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voto" ADD CONSTRAINT "Voto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poder" ADD CONSTRAINT "Poder_grantorId_fkey" FOREIGN KEY ("grantorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poder" ADD CONSTRAINT "Poder_proxyId_fkey" FOREIGN KEY ("proxyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poder" ADD CONSTRAINT "Poder_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QAItem" ADD CONSTRAINT "QAItem_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "Pregunta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QAVoto" ADD CONSTRAINT "QAVoto_qaItemId_fkey" FOREIGN KEY ("qaItemId") REFERENCES "QAItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumenPDF" ADD CONSTRAINT "ResumenPDF_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
