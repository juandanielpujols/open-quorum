import type { Rol } from "@/generated/prisma";

export type SessionUser = { id: string; email: string; nombre: string; rol: Rol };

export type Action =
  | "usuario.crear"
  | "usuario.editar"
  | "evento.crear"
  | "evento.editar"
  | "evento.cerrar"
  | "pregunta.crear"
  | "pregunta.editar"
  | "pregunta.abrir"
  | "pregunta.cerrar"
  | "pregunta.revelar"
  | "voto.emitir"
  | "agregado.leer"
  | "proyector.ver"
  | "pdf.generar"
  | "pdf.enviar"
  | "tag.crear"
  | "contrasena.cambiarPropia";

const PERMISOS: Record<Action, Rol[]> = {
  "usuario.crear": ["ADMIN"],
  "usuario.editar": ["ADMIN"],
  "evento.crear": ["ADMIN"],
  "evento.editar": ["ADMIN"],
  "evento.cerrar": ["ADMIN"],
  "pregunta.crear": ["ADMIN"],
  "pregunta.editar": ["ADMIN"],
  "pregunta.abrir": ["ADMIN"],
  "pregunta.cerrar": ["ADMIN"],
  "pregunta.revelar": ["ADMIN"],
  "voto.emitir": ["VOTANTE"],
  "agregado.leer": ["ADMIN", "REVIEWER"],
  "proyector.ver": ["ADMIN"],
  "pdf.generar": ["ADMIN"],
  "pdf.enviar": ["ADMIN"],
  "tag.crear": ["ADMIN"],
  "contrasena.cambiarPropia": ["ADMIN", "REVIEWER", "VOTANTE"],
};

export function can(user: SessionUser, action: Action): boolean {
  return PERMISOS[action].includes(user.rol);
}

export function assertCan(user: SessionUser, action: Action): void {
  if (!can(user, action)) {
    throw new Error(`forbidden: ${action} requiere otro rol`);
  }
}
