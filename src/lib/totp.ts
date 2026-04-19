/**
 * TOTP (RFC 6238) second factor.
 *
 * Flow:
 * 1. Usuario pide habilitar 2FA → `iniciarInscripcionTotp()` genera secret,
 *    guarda como `totpSecret` (sin habilitar aún), devuelve QR + secret.
 * 2. Usuario escanea con app (Authy/Google/1Password), ingresa código.
 * 3. Si valida → `confirmarInscripcionTotp()` marca `totpHabilitado=true`.
 * 4. Login subsecuente: tras password correcto, pide código TOTP;
 *    `verificarCodigoTotp()` valida.
 *
 * Nota sobre almacenamiento: `totpSecret` se persiste en claro hoy. Para
 * compliance más estricto, envolver con AES-GCM usando `AUTH_SECRET` como
 * KDF antes de persistir — implementar antes de prod crítica.
 */

import { generateSecret, generate, verify, generateURI } from "otplib";
import { toDataURL } from "qrcode";
import { prisma } from "./db";

const OPTIONS = {
  window: 1, // acepta código actual ± 1 paso (~30s de tolerancia de reloj)
  step: 30,
  digits: 6,
} as const;

const EMISOR = "Open Quorum";

export async function iniciarInscripcionTotp(userId: string, email: string) {
  const secret = generateSecret();
  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: secret, totpHabilitado: false },
  });
  const otpauth = generateURI({ label: email, issuer: EMISOR, secret });
  const qrDataUrl = await toDataURL(otpauth, { margin: 1, scale: 6 });
  return { secret, otpauth, qrDataUrl };
}

export async function confirmarInscripcionTotp(
  userId: string,
  codigo: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.totpSecret) return false;
  const result = await verify({ token: codigo, secret: user.totpSecret, ...OPTIONS });
  if (!result.valid) return false;
  await prisma.user.update({
    where: { id: userId },
    data: { totpHabilitado: true },
  });
  return true;
}

export async function desactivarTotp(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: null, totpHabilitado: false },
  });
}

export async function verificarCodigoTotp(
  userId: string,
  codigo: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.totpSecret || !user.totpHabilitado) return false;
  const r = await verify({ token: codigo, secret: user.totpSecret, ...OPTIONS });
  return r.valid;
}

export async function tieneTotpHabilitado(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpHabilitado: true },
  });
  return user?.totpHabilitado ?? false;
}

// Exportado para usar `generate()` en tests o CLI si hace falta
export const _testing = { generate };
