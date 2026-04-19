-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bloqueadoHasta" TIMESTAMP(3),
ADD COLUMN     "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tokenActivacionExpira" TIMESTAMP(3),
ADD COLUMN     "tokenRecuperacionExpira" TIMESTAMP(3);
