-- CreateTable
CREATE TABLE "AppBranding" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "nombre" TEXT NOT NULL DEFAULT 'Votaciones',
    "logoUrl" TEXT,
    "tema" TEXT NOT NULL DEFAULT 'institucional',
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppBranding_pkey" PRIMARY KEY ("id")
);
