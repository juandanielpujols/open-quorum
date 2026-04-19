/**
 * Symmetric encryption helpers for at-rest secrets in the DB.
 *
 * Algo: AES-256-GCM con key derivado del `AUTH_SECRET` vía HKDF-SHA256.
 * Output format: `base64(iv):base64(ciphertext+tag)`.
 *
 * Residual risk: si alguien compromete AUTH_SECRET + la DB a la vez,
 * descifra. Pero separa claramente: un dump accidental de DB ya no
 * contiene plaintext. Para compliance de más nivel, usar KMS/HSM externo.
 */

import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  hkdfSync,
} from "node:crypto";

const IV_BYTES = 12; // GCM estándar
const KEY_BYTES = 32; // AES-256
const INFO = Buffer.from("open-quorum:db-secret:v1");

function obtenerKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET no configurado — no se puede cifrar");
  }
  // HKDF sin salt estable (con salt hacerlo no aporta vs un secret ya entrópico)
  const derived = hkdfSync("sha256", secret, Buffer.alloc(0), INFO, KEY_BYTES);
  return Buffer.from(derived);
}

export function cifrar(plaintext: string): string {
  const key = obtenerKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${Buffer.concat([ct, tag]).toString("base64")}`;
}

export function descifrar(payload: string): string {
  const [ivB64, ctTagB64] = payload.split(":");
  if (!ivB64 || !ctTagB64) throw new Error("Payload cifrado malformado");
  const key = obtenerKey();
  const iv = Buffer.from(ivB64, "base64");
  const ctTag = Buffer.from(ctTagB64, "base64");
  const tag = ctTag.subarray(ctTag.length - 16);
  const ct = ctTag.subarray(0, ctTag.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

/** Enmascara un secret para logs / UI (ej "ab**…**ef"). */
export function enmascarar(s: string, visibles = 4): string {
  if (s.length <= visibles * 2) return "•".repeat(Math.max(4, s.length));
  return `${s.slice(0, visibles)}${"•".repeat(8)}${s.slice(-visibles)}`;
}
