# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sistema de votaciones en línea, open-source, para consejos, juntas directivas
y asambleas. El nombre de la organización consumidora se inyecta vía
`APP_NAME` / `NEXT_PUBLIC_APP_NAME` — nunca hardcodeado en código fuente.

Mentimeter/Slido-like: admin controla desde un panel, proyecta resultados
en vivo en una segunda pantalla, votantes responden desde sus dispositivos.
Modos vivo + asíncrono. Secrecy "B" (confidencial operacional): votos
linkeados a usuario en DB (auditoría) pero nunca expuestos individualmente
en UI — solo agregados.

## Commands

- `npm run dev` — dev server (Next 16 en localhost:3002 si usas el port mapping Docker; puerto 3000 si corres sin Docker)
- `npm run build` — production build (Turbopack)
- `npm test` — unit tests con Vitest
- `npm run test:watch` — watch mode
- `npm run type-check` — `tsc --noEmit --skipLibCheck`
- `npm run e2e` — Playwright smoke tests (requiere seed + app corriendo)
- `docker compose up -d` — stack completo (Postgres + app)
- `docker compose build app` — rebuild imagen
- `npx prisma generate` — regenera cliente en `src/generated/prisma`
- `npx prisma migrate dev --name <nombre>` — crea migración dev (contra Postgres local port 5433)
- `npx prisma db seed` — siembra admin / votante / reviewer

## Infraestructura local

- Postgres: container `votaciones-postgres`, puerto host **5433** (interno 5432). No choca con otros Postgres locales en 5432.
- App Docker: container `votaciones-app`, puerto host **3002** (interno 3000).
- `.env.local` carga con `dotenv` en dev; Docker compose lee `.env.local` via `env_file`.
- `prisma.config.ts` (Prisma v7) reemplaza la vieja sección `datasource.url` en schema. Carga `.env.local` explícitamente.

## Architecture

Ver spec completo: `docs/superpowers/specs/2026-04-19-sistema-votaciones-design.md`.

Plan de implementación (Fase 0 + 1): `docs/superpowers/plans/2026-04-19-mvp-votaciones-fase-0-y-1.md`.

### Módulos clave
- `src/lib/db.ts` — PrismaClient singleton con `@prisma/adapter-pg`.
- `src/lib/auth.ts` + `authorize.ts` — Auth.js v5 (Credentials). `authorize` vive separado para testabilidad (Vitest no resuelve `next/server` dentro de `next-auth`).
- `src/lib/eventbus.ts` — pub/sub in-memory. Un canal por evento (`evento:<id>`). Para 50-300 conexiones SSE concurrentes, suficiente sin Redis.
- `src/lib/sse.ts` — `crearStreamEvento()` devuelve un `ReadableStream` que publica al cliente cada `BusEvent` del canal + heartbeat de 25s.
- `src/lib/permissions.ts` — `can(user, action)` + `assertCan`. Catálogo centralizado de acciones por rol.
- `src/lib/rate-limit.ts` — token bucket in-memory. Aplicado a `POST /api/votos`.
- `src/components/preguntas/<tipo>/` — cada tipo de pregunta es auto-contenido: `Schema.ts` (Zod), `Voter.tsx`, `Projector.tsx`, `agregar.ts`. Registry central en `components/preguntas/index.ts`.
- `src/server/` — lógica de dominio pura (usuarios, activacion, eventos, preguntas, votos, tags, snapshot).
- `src/middleware.ts` — enforce de rutas por rol (`/admin/*`, `/reviewer/*`, `/votante/*`, `/proyectar/*`).

### Flujo realtime
1. Admin pulsa "Abrir pregunta" → `POST /api/admin/preguntas/:id/abrir` → `abrirPregunta()` actualiza DB + emite `pregunta:abierta` al `EventBus`.
2. Todas las conexiones SSE abiertas al evento (`/api/eventos/:id/stream`) reciben el evento.
3. Clientes (control / proyector / votante) escuchan y refrescan via `GET /api/eventos/:id/snapshot`.
4. Votante envía voto → `POST /api/votos` → `registrarVoto()` → emite `voto:registrado` (solo contador agregado) al bus.
5. Proyector + dashboard admin se actualizan en vivo.

## Rules

- **Domain-agnostic:** no hardcodear nombre de organización, cliente o industria en código, commits, comentarios ni strings. Usar `NEXT_PUBLIC_APP_NAME`.
- **Secrecy B:** `Voto.userId` es NOT NULL pero jamás se expone el par `(userId, respuesta)` en ninguna UI. Solo agregados.
- **Nuevo tipo de pregunta:** nueva carpeta en `src/components/preguntas/<tipo>/` + entry en `REGISTRY_PREGUNTAS`. Luego actualiza `crearPregunta` (src/server/preguntas.ts) para incluir el tipo en su enum Zod, y los tres clients UI (ControlClient, ProjectorClient, VotarClient) para rutear al nuevo componente.
- **Tests:** Vitest para unit, Playwright para E2E. Cada cambio → `npm test` + `npm run type-check` antes de commit.
- **vi.mock + factory:** usa `vi.hoisted()` si necesitas definir mocks que referencian variables — Vitest hoistea `vi.mock` al tope del archivo.
- **Pages con `useSearchParams()`:** envolver el componente interno en `<Suspense>` (Next 16 lo requiere para build).
- **Compound unique con nullable field (Prisma v7):** `prisma.voto` con unique `(preguntaId, userId, representandoA)` no permite `null` en la where-clause tipada. Usa `findFirst` + `create`/`update` manual en lugar de `upsert`.
- **Middleware:** Next 16 renombró `middleware` a `proxy`. Por ahora funciona (warning); migrar cuando sea bloqueante.

## Stack

- Next.js 16 (App Router, standalone output)
- Postgres 16 + Prisma v7 + `@prisma/adapter-pg`
- Auth.js v5 (Credentials + bcrypt cost 12)
- Tailwind CSS 4 + paleta SB (azul `#0d3048`, verde `#12C69F`, terracota `#D6490F`, petróleo `#47738C`, gris `#5c7f91`)
- Vitest + @testing-library/react + happy-dom
- Playwright (E2E)
- Server-Sent Events (no WebSockets) para realtime
- Docker Compose (Postgres + app)

## Roles y permisos

| Acción | Admin | Reviewer | Votante |
|---|:---:|:---:|:---:|
| CRUD usuarios | ✅ | ❌ | ❌ |
| CRUD eventos / preguntas | ✅ | ❌ | ❌ |
| Abrir/cerrar/revelar preguntas | ✅ | ❌ | ❌ |
| Leer agregados históricos | ✅ | ✅ (read-only) | ❌ |
| Proyector | ✅ | ❌ | ❌ |
| Votar (en eventos invitados) | ❌ | ❌ | ✅ |

## Próximas fases (no implementadas aún)

Ver spec §9. En orden: modo asíncrono + cron + emails Resend + PDF resumen + proxy voting (Fase 2), luego Quiz + Q&A + Heatmap (Fase 3), luego pulido con Framer Motion y accesibilidad (Fase 4).
