-- AlterTable
ALTER TABLE "User" ADD COLUMN     "totpHabilitado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totpSecret" TEXT;
