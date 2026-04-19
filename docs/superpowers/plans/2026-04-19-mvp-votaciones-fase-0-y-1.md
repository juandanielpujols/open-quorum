# MVP Sistema de Votaciones — Fase 0 + Fase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Llegar desde directorio vacío hasta un MVP de votación en vivo corriendo en Docker con 3 tipos de pregunta (Opción Múltiple con fotos, Sí/No, Escala 1-5), roles funcionales (Admin / Reviewer / Votante), y flujo completo de invitación → login → sesión en vivo → proyección. **Sistema open-source**, domain-agnostic: ninguna referencia a organización específica en código, solo en configuración (`APP_NAME`, etc.).

**Architecture:** Next.js 16 App Router (standalone Docker output) + Postgres 16 + Prisma v7 + Auth.js v5 (Credentials). Tiempo real por Server-Sent Events con `EventBus` in-memory. Tests con Vitest + Testing Library; smoke E2E con Playwright. Cada tipo de pregunta vive en `components/preguntas/<tipo>/` con Voter, Projector, Schema (Zod) y función de agregación.

**Tech Stack:** Next.js 16, TypeScript 5, Tailwind 4, Prisma v7 + @prisma/adapter-pg, Auth.js v5, bcryptjs, Zod, Vitest, @testing-library/react, happy-dom, Playwright, Recharts, lucide-react, @dnd-kit (Fase 2), Docker Compose.

**Spec de referencia:** `docs/superpowers/specs/2026-04-19-sistema-votaciones-design.md`

---

## File Structure (al final de este plan)

```
clubgestionriesgos/
├── .gitignore                                    (ya existe)
├── .env.example                                  (Task 0.2)
├── CLAUDE.md                                     (se mantiene)
├── Dockerfile                                    (Task 0.2)
├── docker-compose.yml                            (Task 0.2)
├── next.config.ts                                (Task 0.1)
├── package.json                                  (Task 0.1)
├── playwright.config.ts                          (Task 1.18)
├── postcss.config.mjs                            (Task 0.1)
├── prisma/
│   ├── schema.prisma                             (Task 0.3)
│   └── migrations/                               (Task 0.3)
├── tailwind.config.ts                            (Task 0.1)
├── tsconfig.json                                 (Task 0.1)
├── vitest.config.ts                              (Task 0.5)
├── e2e/
│   └── sesion-vivo.spec.ts                       (Task 1.18)
├── src/
│   ├── app/
│   │   ├── globals.css                           (Task 0.1)
│   │   ├── layout.tsx                            (Task 0.12)
│   │   ├── page.tsx                              (Task 0.12)
│   │   ├── login/page.tsx                        (Task 0.9)
│   │   ├── activar/page.tsx                      (Task 0.8)
│   │   ├── (admin)/layout.tsx                    (Task 0.12)
│   │   ├── (admin)/usuarios/page.tsx             (Task 0.7)
│   │   ├── (admin)/eventos/page.tsx              (Task 1.4)
│   │   ├── (admin)/eventos/nuevo/page.tsx        (Task 1.4)
│   │   ├── (admin)/eventos/[id]/page.tsx         (Task 1.8)
│   │   ├── (admin)/eventos/[id]/control/page.tsx (Task 1.13)
│   │   ├── (admin)/tags/page.tsx                 (Task 1.3)
│   │   ├── (reviewer)/layout.tsx                 (Task 1.16)
│   │   ├── (reviewer)/eventos/page.tsx           (Task 1.16)
│   │   ├── (votante)/layout.tsx                  (Task 0.12)
│   │   ├── (votante)/eventos/page.tsx            (Task 1.15)
│   │   ├── (votante)/votar/[eventoId]/page.tsx   (Task 1.15)
│   │   ├── proyectar/[eventoId]/page.tsx         (Task 1.14)
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts       (Task 0.6)
│   │       ├── invitaciones/route.ts             (Task 0.7)
│   │       ├── activar/route.ts                  (Task 0.8)
│   │       ├── eventos/[id]/stream/route.ts      (Task 1.11)
│   │       ├── eventos/[id]/snapshot/route.ts    (Task 1.12)
│   │       └── votos/route.ts                    (Task 1.9)
│   ├── components/
│   │   ├── preguntas/
│   │   │   ├── index.ts                          (Task 1.5)
│   │   │   ├── opcion-multiple/                  (Task 1.5)
│   │   │   ├── si-no/                            (Task 1.6)
│   │   │   └── escala/                           (Task 1.7)
│   │   ├── proyector/Frame.tsx                   (Task 1.14)
│   │   └── ui/ (shadcn-style)                    (various)
│   ├── lib/
│   │   ├── db.ts                                 (Task 0.4)
│   │   ├── auth.ts                               (Task 0.6)
│   │   ├── eventbus.ts                           (Task 1.1)
│   │   ├── sse.ts                                (Task 1.2)
│   │   ├── permissions.ts                        (Task 0.11)
│   │   ├── rate-limit.ts                         (Task 1.17)
│   │   └── utils.ts                              (various)
│   ├── server/
│   │   ├── eventos.ts                            (Task 1.4)
│   │   ├── preguntas.ts                          (Task 1.10)
│   │   ├── votos.ts                              (Task 1.9)
│   │   ├── tags.ts                               (Task 1.3)
│   │   └── usuarios.ts                           (Task 0.7)
│   ├── middleware.ts                             (Task 0.10)
│   └── types/auth.d.ts                           (Task 0.6)
└── tests/
    └── unit/ (distributed near code: foo.test.ts junto a foo.ts)
```

---

## FASE 0 — Fundamento

### Task 0.1: Bootstrap proyecto Next.js + TypeScript + Tailwind

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `src/app/globals.css`

- [ ] **Step 1: Escribir `package.json` con dependencias base**

```json
{
  "name": "sistema-votaciones",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "type-check": "tsc --noEmit --skipLibCheck",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate deploy"
  },
  "dependencies": {
    "@prisma/adapter-pg": "^7.0.0",
    "@prisma/client": "^7.0.0",
    "bcryptjs": "^2.4.3",
    "next": "^16.0.0",
    "next-auth": "5.0.0-beta.25",
    "pg": "^8.12.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.15.0",
    "lucide-react": "^0.470.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.50.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.0.0",
    "@types/pg": "^8.11.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "happy-dom": "^15.11.0",
    "prisma": "^7.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Escribir `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "src/generated"]
}
```

- [ ] **Step 3: Escribir `next.config.ts`**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
```

- [ ] **Step 4: Escribir `postcss.config.mjs` y `tailwind.config.ts`**

`postcss.config.mjs`:
```javascript
export default {
  plugins: { "@tailwindcss/postcss": {} },
};
```

`tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sb: {
          azul: "#0d3048",
          gris: "#5c7f91",
          verde: "#12C69F",
          terracota: "#D6490F",
          rojo: "#C13410",
          petroleo: "#47738C",
          claro: "#5A97B3",
          grisFondo: "#e1e7eb",
          fondoClaro: "#f0f3f5",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 5: Escribir `src/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-sb-azul: #0d3048;
  --color-sb-gris: #5c7f91;
  --color-sb-verde: #12C69F;
  --color-sb-terracota: #D6490F;
  --color-sb-rojo: #C13410;
  --color-sb-petroleo: #47738C;
  --color-sb-claro: #5A97B3;
  --color-sb-gris-fondo: #e1e7eb;
  --color-sb-fondo-claro: #f0f3f5;
}

body {
  background: var(--color-sb-fondo-claro);
  color: var(--color-sb-azul);
}
```

- [ ] **Step 6: Instalar dependencias**

Run: `npm install`
Expected: install sin errores, `node_modules/` creado.

- [ ] **Step 7: Verificar type-check vacío pasa**

Run: `npm run type-check`
Expected: sin output (pasa). Puede que falle por no haber archivos TS aún — es OK, lo verificamos en Task 0.12.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs tailwind.config.ts src/app/globals.css
git commit -m "chore: bootstrap Next.js 16 + TypeScript + Tailwind 4"
```

---

### Task 0.2: Infraestructura Docker + variables de entorno

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `.env.local` (no commit)

- [ ] **Step 1: Escribir `Dockerfile` (multi-stage)**

```dockerfile
FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

- [ ] **Step 2: Escribir `docker-compose.yml`**

```yaml
services:
  votaciones-postgres:
    image: postgres:16-alpine
    container_name: votaciones-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-votaciones}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-votaciones_dev}
      POSTGRES_DB: ${POSTGRES_DB:-votaciones}
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 10

  app:
    build: .
    container_name: votaciones-app
    depends_on:
      votaciones-postgres:
        condition: service_healthy
    env_file: .env.local
    ports:
      - "3002:3000"

volumes:
  postgres_data:
```

- [ ] **Step 3: Escribir `.env.example`**

```
# Branding — cada instalación sobreescribe estos valores
APP_NAME=Votaciones
APP_LOGO_URL=
NEXT_PUBLIC_APP_NAME=Votaciones

# Infraestructura
DATABASE_URL=postgres://votaciones:votaciones_dev@votaciones-postgres:5432/votaciones
DATABASE_URL_LOCAL=postgres://votaciones:votaciones_dev@localhost:5433/votaciones
AUTH_SECRET=change-me-with-openssl-rand-base64-32
AUTH_URL=http://localhost:3002
POSTGRES_USER=votaciones
POSTGRES_PASSWORD=votaciones_dev
POSTGRES_DB=votaciones
```

Nota: `APP_NAME` es la única cadena "de marca". El código nunca hardcodea nombre de organización — toda referencia textual en UI lee `process.env.NEXT_PUBLIC_APP_NAME` (default: "Votaciones").

- [ ] **Step 4: Crear `.env.local` copiándolo y generando un AUTH_SECRET real**

Run: `cp .env.example .env.local && openssl rand -base64 32`
Expected: imprime un secret. Pégalo en `.env.local` reemplazando `change-me-...`.

- [ ] **Step 5: Verificar Postgres arranca**

Run: `docker compose up -d votaciones-postgres && sleep 3 && docker compose ps`
Expected: `votaciones-postgres` en estado `healthy`.

- [ ] **Step 6: Commit**

```bash
git add Dockerfile docker-compose.yml .env.example
git commit -m "chore: add Docker infra + Postgres service"
```

---

### Task 0.3: Schema Prisma inicial

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Escribir `prisma/schema.prisma` completo**

Copiar literalmente desde la Sección 4 del spec (`docs/superpowers/specs/2026-04-19-sistema-votaciones-design.md`), con este header al inicio:

```prisma
generator client {
  provider        = "prisma-client-js"
  output          = "../src/generated/prisma"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Luego incluir **todos los modelos y enums del spec** (User, Evento, EventoInvitacion, Tag, EventoTag, Pregunta, Opcion, Voto, Poder, QAItem, QAVoto, ResumenPDF, EmailLog, AuditLog + enums Rol, ModoEvento, EstadoEvento, EstadoPregunta, Visibilidad, TipoPregunta, OrigenVoto, EstadoQA).

⚠️ Incluir los 14 modelos aunque en Fase 0+1 solo usemos User, Evento, EventoInvitacion, Tag, EventoTag, Pregunta, Opcion, Voto, AuditLog — el resto queda listo para Fases 2+.

- [ ] **Step 2: Generar cliente Prisma**

Run: `npx prisma generate`
Expected: `✔ Generated Prisma Client ... to ./src/generated/prisma`.

- [ ] **Step 3: Aplicar migración inicial a Postgres local**

Run: `DATABASE_URL=$(grep DATABASE_URL_LOCAL .env.local | cut -d= -f2-) npx prisma migrate dev --name init --skip-seed`
Expected: crea `prisma/migrations/<ts>_init/migration.sql` + aplica a DB. Si falla conectividad, re-verificar Task 0.2 Step 5.

- [ ] **Step 4: Verificar schema con Prisma Studio (opcional)**

Run: `DATABASE_URL=$(grep DATABASE_URL_LOCAL .env.local | cut -d= -f2-) npx prisma studio &`
Expected: abre browser en localhost:5555, todas las tablas visibles y vacías. Cerrar.

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat(db): initial Prisma schema with all entities"
```

---

### Task 0.4: Prisma client singleton (`lib/db.ts`)

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/lib/db.test.ts`

- [ ] **Step 1: Escribir test**

```typescript
// src/lib/db.test.ts
import { describe, it, expect } from "vitest";
import { prisma } from "./db";

describe("prisma client singleton", () => {
  it("exports a usable PrismaClient instance", () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe("function");
  });
});
```

- [ ] **Step 2: Escribir `lib/db.ts`**

```typescript
// src/lib/db.ts
import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter, log: ["error", "warn"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 3: Ejecutar test (fallará hasta Task 0.5 por falta de Vitest config, es OK — saltará a Step 4)**

- [ ] **Step 4: Commit**

```bash
git add src/lib/db.ts src/lib/db.test.ts
git commit -m "feat(db): prisma client singleton"
```

---

### Task 0.5: Infraestructura de tests (Vitest)

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

- [ ] **Step 1: Escribir `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/e2e/**"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 2: Escribir `vitest.setup.ts`**

```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Ejecutar tests existentes**

Run: `npm test`
Expected: `db.test.ts` pasa (1 test, 1 pass).

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts vitest.setup.ts
git commit -m "chore(test): vitest + testing-library setup"
```

---

### Task 0.6: Auth.js v5 Credentials + type augmentation

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/types/auth.d.ts`
- Create: `src/lib/auth.test.ts`

- [ ] **Step 1: Escribir test para `authorize`**

```typescript
// src/lib/auth.test.ts
import { describe, it, expect, vi } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("./db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "./db";
import { authorize } from "./auth";

describe("authorize", () => {
  it("returns null for unknown email", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await authorize({ email: "x@y.com", password: "pw" });
    expect(result).toBeNull();
  });

  it("returns null for unactivated user", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1", email: "x@y.com", nombre: "X", rol: "VOTANTE",
      hashedPassword: await bcrypt.hash("pw", 12), activado: false,
    });
    const result = await authorize({ email: "x@y.com", password: "pw" });
    expect(result).toBeNull();
  });

  it("returns null for wrong password", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1", email: "x@y.com", nombre: "X", rol: "VOTANTE",
      hashedPassword: await bcrypt.hash("correcta", 12), activado: true,
    });
    const result = await authorize({ email: "x@y.com", password: "otra" });
    expect(result).toBeNull();
  });

  it("returns user data for valid credentials", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1", email: "x@y.com", nombre: "X", rol: "ADMIN",
      hashedPassword: await bcrypt.hash("pw", 12), activado: true,
    });
    const result = await authorize({ email: "x@y.com", password: "pw" });
    expect(result).toEqual({ id: "u1", email: "x@y.com", nombre: "X", rol: "ADMIN" });
  });
});
```

- [ ] **Step 2: Run test (falla porque no existe `auth.ts`)**

Run: `npm test -- auth.test.ts`
Expected: FAIL — `authorize` no existe.

- [ ] **Step 3: Escribir `src/lib/auth.ts`**

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authorize(raw: unknown) {
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.hashedPassword || !user.activado) return null;

  const ok = await bcrypt.compare(password, user.hashedPassword);
  if (!ok) return null;

  return { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize,
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as { rol: string }).rol;
        token.nombre = (user as { nombre: string }).nombre;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as "ADMIN" | "REVIEWER" | "VOTANTE";
        session.user.nombre = token.nombre as string;
      }
      return session;
    },
  },
});
```

- [ ] **Step 4: Escribir `src/types/auth.d.ts` (module augmentation)**

```typescript
// src/types/auth.d.ts
import type { Rol } from "@/generated/prisma";

declare module "next-auth" {
  interface User {
    id: string;
    rol: Rol;
    nombre: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      nombre: string;
      rol: Rol;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    rol?: Rol;
    nombre?: string;
  }
}
```

- [ ] **Step 5: Escribir `src/app/api/auth/[...nextauth]/route.ts`**

```typescript
// src/app/api/auth/[...nextauth]/route.ts
export { GET, POST } from "@/lib/auth";
```

Nota: `handlers` se exporta como `{ GET, POST }` en Auth.js v5, lo re-exportamos.

Corrección: el export correcto es:

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 6: Run tests**

Run: `npm test -- auth.test.ts`
Expected: 4 tests pass.

- [ ] **Step 7: Verificar type-check**

Run: `npm run type-check`
Expected: sin errores.

- [ ] **Step 8: Commit**

```bash
git add src/lib/auth.ts src/lib/auth.test.ts src/app/api/auth src/types/auth.d.ts
git commit -m "feat(auth): Auth.js v5 with credentials provider"
```

---

### Task 0.7: Flujo de invitación (admin crea usuario)

**Files:**
- Create: `src/server/usuarios.ts`
- Create: `src/server/usuarios.test.ts`
- Create: `src/app/api/invitaciones/route.ts`
- Create: `src/app/(admin)/usuarios/page.tsx` (placeholder)

- [ ] **Step 1: Escribir test para `crearUsuarioInvitado`**

```typescript
// src/server/usuarios.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { create: vi.fn(), findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import { crearUsuarioInvitado } from "./usuarios";

describe("crearUsuarioInvitado", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("genera tokenActivacion de 64 hex chars", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.user.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => ({ id: "u1", ...data }));
    const result = await crearUsuarioInvitado({
      email: "nuevo@ejemplo.com", nombre: "Nuevo", rol: "VOTANTE", creadoPor: "admin1",
    });
    expect(result.tokenActivacion).toMatch(/^[0-9a-f]{64}$/);
    expect(result.activado).toBe(false);
  });

  it("falla si email ya existe", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u1" });
    await expect(
      crearUsuarioInvitado({ email: "existente@x.com", nombre: "X", rol: "VOTANTE", creadoPor: "admin1" }),
    ).rejects.toThrow(/ya existe/i);
  });
});
```

- [ ] **Step 2: Run test (falla)**

Run: `npm test -- usuarios.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Escribir `src/server/usuarios.ts`**

```typescript
// src/server/usuarios.ts
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Rol } from "@/generated/prisma";

const inputSchema = z.object({
  email: z.string().email(),
  nombre: z.string().min(1).max(120),
  rol: z.enum(["ADMIN", "REVIEWER", "VOTANTE"]),
  creadoPor: z.string(),
});

export async function crearUsuarioInvitado(raw: z.infer<typeof inputSchema>) {
  const { email, nombre, rol, creadoPor } = inputSchema.parse(raw);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Usuario con ese email ya existe");

  const tokenActivacion = randomBytes(32).toString("hex");
  return prisma.user.create({
    data: { email, nombre, rol: rol as Rol, tokenActivacion, creadoPor, activado: false },
  });
}
```

- [ ] **Step 4: Run test**

Run: `npm test -- usuarios.test.ts`
Expected: 2 tests pass.

- [ ] **Step 5: Escribir `src/app/api/invitaciones/route.ts`**

```typescript
// src/app/api/invitaciones/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { crearUsuarioInvitado } from "@/server/usuarios";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "no autorizado" }, { status: 403 });
  }
  const body = await req.json();
  try {
    const user = await crearUsuarioInvitado({ ...body, creadoPor: session.user.id });
    // TODO Fase 2: enviar email. Por ahora devolvemos el tokenActivacion.
    return NextResponse.json({
      id: user.id,
      email: user.email,
      linkActivacion: `/activar?t=${user.tokenActivacion}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
```

- [ ] **Step 6: Escribir placeholder `src/app/(admin)/usuarios/page.tsx`**

```tsx
// src/app/(admin)/usuarios/page.tsx
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Usuarios</h1>
      <table className="w-full text-sm border-collapse">
        <thead className="text-left text-sb-gris">
          <tr><th className="p-2">Email</th><th>Nombre</th><th>Rol</th><th>Activado</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-t border-gray-100">
              <td className="p-2">{u.email}</td>
              <td>{u.nombre}</td>
              <td>{u.rol}</td>
              <td>{u.activado ? "✓" : `/activar?t=${u.tokenActivacion}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/server/usuarios.ts src/server/usuarios.test.ts src/app/api/invitaciones src/app/\(admin\)/usuarios
git commit -m "feat(usuarios): admin invitation flow with activation token"
```

---

### Task 0.8: Flujo de activación de cuenta

**Files:**
- Create: `src/app/api/activar/route.ts`
- Create: `src/app/activar/page.tsx`
- Create: `src/server/activacion.ts`
- Create: `src/server/activacion.test.ts`

- [ ] **Step 1: Escribir test**

```typescript
// src/server/activacion.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn() } },
}));

import { prisma } from "@/lib/db";
import { activarCuenta } from "./activacion";

describe("activarCuenta", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("falla si token no existe", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(activarCuenta({ token: "xxx", password: "pass1234" })).rejects.toThrow(/token/i);
  });

  it("falla si token es de usuario ya activado", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1", tokenActivacion: "xxx", activado: true,
    });
    await expect(activarCuenta({ token: "xxx", password: "pass1234" })).rejects.toThrow(/activada/i);
  });

  it("hashea password y activa", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1", tokenActivacion: "xxx", activado: false,
    });
    (prisma.user.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => ({ id: "u1", ...data }));

    const result = await activarCuenta({ token: "xxx", password: "pass1234" });
    expect(result.activado).toBe(true);
    expect(result.tokenActivacion).toBeNull();
    expect(await bcrypt.compare("pass1234", result.hashedPassword)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test (falla)**

Run: `npm test -- activacion.test.ts`
Expected: FAIL.

- [ ] **Step 3: Escribir `src/server/activacion.ts`**

```typescript
// src/server/activacion.ts
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const inputSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});

export async function activarCuenta(raw: z.infer<typeof inputSchema>) {
  const { token, password } = inputSchema.parse(raw);
  const user = await prisma.user.findUnique({ where: { tokenActivacion: token } });
  if (!user) throw new Error("Token de activación inválido");
  if (user.activado) throw new Error("Cuenta ya activada");

  const hashedPassword = await bcrypt.hash(password, 12);
  return prisma.user.update({
    where: { id: user.id },
    data: { hashedPassword, activado: true, tokenActivacion: null },
  });
}
```

- [ ] **Step 4: Run test**

Run: `npm test -- activacion.test.ts`
Expected: 3 tests pass.

- [ ] **Step 5: Escribir `src/app/api/activar/route.ts`**

```typescript
// src/app/api/activar/route.ts
import { NextResponse } from "next/server";
import { activarCuenta } from "@/server/activacion";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    await activarCuenta(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
```

- [ ] **Step 6: Escribir `src/app/activar/page.tsx`**

```tsx
// src/app/activar/page.tsx
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ActivarPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("t") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError("Las contraseñas no coinciden");
    if (password.length < 8) return setError("Mínimo 8 caracteres");
    setLoading(true);
    const res = await fetch("/api/activar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json();
      return setError(j.error ?? "Error");
    }
    router.push("/login?activada=1");
  }

  return (
    <main className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Activa tu cuenta</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input type="password" placeholder="Contraseña"
          value={password} onChange={e => setPassword(e.target.value)}
          className="w-full border border-gray-200 rounded-lg p-2" />
        <input type="password" placeholder="Confirmar contraseña"
          value={confirm} onChange={e => setConfirm(e.target.value)}
          className="w-full border border-gray-200 rounded-lg p-2" />
        {error && <p className="text-sb-rojo text-sm">{error}</p>}
        <button disabled={loading} type="submit"
          className="w-full bg-sb-azul text-white rounded-lg p-2 disabled:opacity-50">
          {loading ? "Activando..." : "Activar"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/server/activacion.ts src/server/activacion.test.ts src/app/api/activar src/app/activar
git commit -m "feat(auth): account activation flow"
```

---

### Task 0.9: Página de login

**Files:**
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Escribir `src/app/login/page.tsx`**

```tsx
// src/app/login/page.tsx
"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) return setError("Credenciales inválidas");
    router.push("/");
  }

  return (
    <main className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Ingresar</h1>
      {params.get("activada") === "1" && (
        <p className="text-sb-verde text-sm mb-3">Cuenta activada. Inicia sesión.</p>
      )}
      <form onSubmit={onSubmit} className="space-y-3">
        <input type="email" placeholder="Email" required
          value={email} onChange={e => setEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-lg p-2" />
        <input type="password" placeholder="Contraseña" required
          value={password} onChange={e => setPassword(e.target.value)}
          className="w-full border border-gray-200 rounded-lg p-2" />
        {error && <p className="text-sb-rojo text-sm">{error}</p>}
        <button disabled={loading} type="submit"
          className="w-full bg-sb-azul text-white rounded-lg p-2 disabled:opacity-50">
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Verificar type-check**

Run: `npm run type-check`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/app/login
git commit -m "feat(auth): login page"
```

---

### Task 0.10: Middleware — rutas protegidas por rol

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Escribir middleware**

```typescript
// src/middleware.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const RUTAS_ADMIN = ["/admin", "/usuarios", "/tags"];
const RUTAS_REVIEWER = ["/reviewer"];
const RUTAS_VOTANTE = ["/votante", "/votar"];
const RUTAS_PROYECTAR = ["/proyectar"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Rutas públicas
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/activar") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/activar") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const rol = session.user.rol;

  const enAdmin = RUTAS_ADMIN.some(p => pathname.startsWith(p)) ||
                  pathname.startsWith("/eventos") && rol === "ADMIN";
  const enReviewer = RUTAS_REVIEWER.some(p => pathname.startsWith(p));
  const enVotante = RUTAS_VOTANTE.some(p => pathname.startsWith(p));
  const enProyectar = RUTAS_PROYECTAR.some(p => pathname.startsWith(p));

  if (enAdmin && rol !== "ADMIN") return NextResponse.redirect(new URL("/", req.url));
  if (enReviewer && rol !== "REVIEWER") return NextResponse.redirect(new URL("/", req.url));
  if (enVotante && rol !== "VOTANTE") return NextResponse.redirect(new URL("/", req.url));
  if (enProyectar && rol !== "ADMIN") return NextResponse.redirect(new URL("/", req.url));

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 2: Verificar type-check**

Run: `npm run type-check`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(auth): role-based route middleware"
```

---

### Task 0.11: `lib/permissions.ts` — autorización en capa de dominio

**Files:**
- Create: `src/lib/permissions.ts`
- Create: `src/lib/permissions.test.ts`

- [ ] **Step 1: Escribir test**

```typescript
// src/lib/permissions.test.ts
import { describe, it, expect } from "vitest";
import { can } from "./permissions";
import type { Rol } from "@/generated/prisma";

function user(rol: Rol) {
  return { id: "u1", email: "u@x.com", nombre: "U", rol };
}

describe("can()", () => {
  it("admin puede crear evento", () => {
    expect(can(user("ADMIN"), "evento.crear")).toBe(true);
  });
  it("reviewer no puede crear evento", () => {
    expect(can(user("REVIEWER"), "evento.crear")).toBe(false);
  });
  it("votante puede votar", () => {
    expect(can(user("VOTANTE"), "voto.emitir")).toBe(true);
  });
  it("reviewer puede leer agregados", () => {
    expect(can(user("REVIEWER"), "agregado.leer")).toBe(true);
  });
  it("votante no accede a proyector", () => {
    expect(can(user("VOTANTE"), "proyector.ver")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test (falla)**

Run: `npm test -- permissions.test.ts`
Expected: FAIL.

- [ ] **Step 3: Escribir `src/lib/permissions.ts`**

```typescript
// src/lib/permissions.ts
import type { Rol } from "@/generated/prisma";

type SessionUser = { id: string; email: string; nombre: string; rol: Rol };

type Action =
  | "usuario.crear" | "usuario.editar"
  | "evento.crear" | "evento.editar" | "evento.cerrar"
  | "pregunta.crear" | "pregunta.editar" | "pregunta.abrir" | "pregunta.cerrar" | "pregunta.revelar"
  | "voto.emitir"
  | "agregado.leer"
  | "proyector.ver"
  | "pdf.generar" | "pdf.enviar"
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
```

- [ ] **Step 4: Run test**

Run: `npm test -- permissions.test.ts`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/permissions.ts src/lib/permissions.test.ts
git commit -m "feat(auth): permissions helper with action catalog"
```

---

### Task 0.12: Layouts base por rol + home

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/(admin)/layout.tsx`
- Create: `src/app/(votante)/layout.tsx`

- [ ] **Step 1: Escribir `src/app/layout.tsx` (root)**

```tsx
// src/app/layout.tsx
import "./globals.css";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Votaciones";

export const metadata = {
  title: APP_NAME,
  description: "Sistema de votaciones en línea",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
```

⚠️ Todo layout header o heading que muestre el nombre de la organización debe leer `process.env.NEXT_PUBLIC_APP_NAME`. Ningún literal hardcodeado.

- [ ] **Step 2: Escribir `src/app/page.tsx` (redirige por rol)**

```tsx
// src/app/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");
  switch (session.user.rol) {
    case "ADMIN": redirect("/eventos");
    case "REVIEWER": redirect("/reviewer/eventos");
    case "VOTANTE": redirect("/votante/eventos");
  }
}
```

- [ ] **Step 3: Escribir `src/app/(admin)/layout.tsx`**

```tsx
// src/app/(admin)/layout.tsx
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="min-h-screen">
      <header className="bg-sb-azul text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold">Admin</span>
          <nav className="flex gap-4 text-sm">
            <Link href="/eventos">Eventos</Link>
            <Link href="/usuarios">Usuarios</Link>
            <Link href="/tags">Tags</Link>
          </nav>
        </div>
        <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
          <button className="text-sm opacity-80 hover:opacity-100">
            {session?.user.nombre} · Salir
          </button>
        </form>
      </header>
      <main>{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Escribir `src/app/(votante)/layout.tsx`**

```tsx
// src/app/(votante)/layout.tsx
import { auth, signOut } from "@/lib/auth";

export default async function VotanteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="min-h-screen">
      <header className="bg-sb-azul text-white px-6 py-3 flex items-center justify-between">
        <span className="font-semibold">Votaciones</span>
        <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
          <button className="text-sm">{session?.user.nombre} · Salir</button>
        </form>
      </header>
      <main>{children}</main>
    </div>
  );
}
```

- [ ] **Step 5: Type-check + smoke run**

Run: `npm run type-check`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx "src/app/(admin)/layout.tsx" "src/app/(votante)/layout.tsx"
git commit -m "feat(ui): base layouts per role"
```

---

### Task 0.13: Verificación Fase 0 end-to-end

- [ ] **Step 1: Build imagen Docker**

Run: `docker compose build app`
Expected: build sin errores. Puede tardar ~3 min la primera vez.

- [ ] **Step 2: Arrancar stack completo**

Run: `docker compose up -d`
Expected: ambos servicios en estado `running`. `docker compose ps` muestra health OK.

- [ ] **Step 3: Smoke manual — crear admin seed**

Crear `prisma/seed.ts`:
```typescript
// prisma/seed.ts
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("admin1234", 12);
  await prisma.user.upsert({
    where: { email: "admin@example.local" },
    update: {},
    create: {
      email: "admin@example.local",
      nombre: "Admin",
      rol: "ADMIN",
      hashedPassword,
      activado: true,
    },
  });
  console.log("Seed OK: admin@example.local / admin1234");
}

main().finally(() => prisma.$disconnect());
```

Agregar a `package.json`:
```json
"prisma": { "seed": "tsx prisma/seed.ts" }
```

Instalar `tsx`: `npm install -D tsx`

Run: `DATABASE_URL=$(grep DATABASE_URL_LOCAL .env.local | cut -d= -f2-) npx prisma db seed`
Expected: `Seed OK: admin@example.local / admin1234`.

- [ ] **Step 4: Smoke manual — login**

Abrir `http://localhost:3002/login`, ingresar `admin@example.local / admin1234`.
Expected: redirige a `/eventos` (404 por ahora es OK — lo creamos en Task 1.4).

- [ ] **Step 5: Smoke manual — crear usuario vía API**

```bash
curl -c cookies.txt -b cookies.txt -X POST http://localhost:3002/api/auth/callback/credentials \
  -d "email=admin@example.local&password=admin1234&csrfToken=$(curl -s -c cookies.txt http://localhost:3002/api/auth/csrf | python3 -c 'import sys,json;print(json.load(sys.stdin)[\"csrfToken\"])')"

curl -b cookies.txt -X POST http://localhost:3002/api/invitaciones \
  -H "content-type: application/json" \
  -d '{"email":"votante1@example.local","nombre":"Votante Uno","rol":"VOTANTE"}'
```
Expected: responde con `linkActivacion`. Abrir ese link → activar → login funciona.

- [ ] **Step 6: Commit Fase 0 complete**

```bash
git add prisma/seed.ts package.json package-lock.json
git commit -m "chore: prisma seed + fase 0 verification"
```

---

## FASE 1 — MVP votación en vivo

### Task 1.1: `lib/eventbus.ts` — pub/sub in-memory

**Files:**
- Create: `src/lib/eventbus.ts`
- Create: `src/lib/eventbus.test.ts`

- [ ] **Step 1: Escribir test**

```typescript
// src/lib/eventbus.test.ts
import { describe, it, expect, vi } from "vitest";
import { EventBus } from "./eventbus";

describe("EventBus", () => {
  it("delivers events to subscribers of a channel", () => {
    const bus = new EventBus();
    const cb = vi.fn();
    bus.subscribe("canal-a", cb);
    bus.publish("canal-a", { tipo: "test", payload: 1 });
    expect(cb).toHaveBeenCalledWith({ tipo: "test", payload: 1 });
  });

  it("does not deliver to other channels", () => {
    const bus = new EventBus();
    const cb = vi.fn();
    bus.subscribe("canal-a", cb);
    bus.publish("canal-b", { tipo: "test" });
    expect(cb).not.toHaveBeenCalled();
  });

  it("unsubscribe stops delivery", () => {
    const bus = new EventBus();
    const cb = vi.fn();
    const unsub = bus.subscribe("canal-a", cb);
    unsub();
    bus.publish("canal-a", { tipo: "test" });
    expect(cb).not.toHaveBeenCalled();
  });

  it("supports multiple subscribers on same channel", () => {
    const bus = new EventBus();
    const a = vi.fn(), b = vi.fn();
    bus.subscribe("canal", a);
    bus.subscribe("canal", b);
    bus.publish("canal", { tipo: "x" });
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test (falla)**

Run: `npm test -- eventbus.test.ts`
Expected: FAIL.

- [ ] **Step 3: Escribir `src/lib/eventbus.ts`**

```typescript
// src/lib/eventbus.ts
export type BusEvent =
  | { tipo: "pregunta:abierta"; preguntaId: string; eventoId: string }
  | { tipo: "pregunta:cerrada"; preguntaId: string; eventoId: string }
  | { tipo: "pregunta:revelada"; preguntaId: string; eventoId: string }
  | { tipo: "voto:registrado"; preguntaId: string; eventoId: string; total: number }
  | { tipo: "snapshot"; payload: unknown };

type Subscriber = (e: BusEvent) => void;

export class EventBus {
  private subs = new Map<string, Set<Subscriber>>();

  subscribe(canal: string, cb: Subscriber): () => void {
    if (!this.subs.has(canal)) this.subs.set(canal, new Set());
    this.subs.get(canal)!.add(cb);
    return () => { this.subs.get(canal)?.delete(cb); };
  }

  publish(canal: string, event: BusEvent): void {
    this.subs.get(canal)?.forEach(cb => cb(event));
  }

  contarSuscriptores(canal: string): number {
    return this.subs.get(canal)?.size ?? 0;
  }
}

const globalForBus = globalThis as unknown as { eventBus?: EventBus };
export const eventBus = globalForBus.eventBus ?? new EventBus();
if (process.env.NODE_ENV !== "production") globalForBus.eventBus = eventBus;

export function canalEvento(eventoId: string): string {
  return `evento:${eventoId}`;
}
```

- [ ] **Step 4: Run test**

Run: `npm test -- eventbus.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/eventbus.ts src/lib/eventbus.test.ts
git commit -m "feat(sse): in-memory EventBus for pub/sub"
```

---

### Task 1.2: `lib/sse.ts` — ReadableStream helper

**Files:**
- Create: `src/lib/sse.ts`
- Create: `src/lib/sse.test.ts`

- [ ] **Step 1: Escribir test**

```typescript
// src/lib/sse.test.ts
import { describe, it, expect } from "vitest";
import { formatoSSE } from "./sse";

describe("formatoSSE", () => {
  it("formatea evento simple", () => {
    const out = formatoSSE({ tipo: "voto:registrado", preguntaId: "p1", eventoId: "e1", total: 3 });
    expect(out).toMatch(/^data: /);
    expect(out).toMatch(/\n\n$/);
    const json = JSON.parse(out.replace(/^data: /, "").replace(/\n\n$/, ""));
    expect(json).toEqual({ tipo: "voto:registrado", preguntaId: "p1", eventoId: "e1", total: 3 });
  });
});
```

- [ ] **Step 2: Run (falla)**

Run: `npm test -- sse.test.ts`
Expected: FAIL.

- [ ] **Step 3: Escribir `src/lib/sse.ts`**

```typescript
// src/lib/sse.ts
import type { BusEvent } from "./eventbus";
import { eventBus, canalEvento } from "./eventbus";

export function formatoSSE(event: BusEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function crearStreamEvento(eventoId: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));
      unsubscribe = eventBus.subscribe(canalEvento(eventoId), (event) => {
        try { controller.enqueue(encoder.encode(formatoSSE(event))); }
        catch { /* cliente cerró */ }
      });
      heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(": ping\n\n")); }
        catch { /* ignore */ }
      }, 25_000);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });
}
```

- [ ] **Step 4: Run test**

Run: `npm test -- sse.test.ts`
Expected: 1 test pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sse.ts src/lib/sse.test.ts
git commit -m "feat(sse): ReadableStream helper for event streams"
```

---

### Task 1.3: CRUD de Tags

**Files:**
- Create: `src/server/tags.ts`
- Create: `src/server/tags.test.ts`
- Create: `src/app/(admin)/tags/page.tsx`

- [ ] **Step 1: Escribir test**

```typescript
// src/server/tags.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: { tag: { create: vi.fn(), findMany: vi.fn(), delete: vi.fn() } },
}));

import { prisma } from "@/lib/db";
import { crearTag, listarTags, eliminarTag } from "./tags";

describe("tags", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crea tag normalizando nombre", async () => {
    (prisma.tag.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "t1", nombre: "Elecciones 2026" });
    const t = await crearTag({ nombre: "  Elecciones 2026  ", color: "#0d3048" });
    expect(prisma.tag.create).toHaveBeenCalledWith({
      data: { nombre: "Elecciones 2026", color: "#0d3048" },
    });
    expect(t.nombre).toBe("Elecciones 2026");
  });

  it("valida color hex", async () => {
    await expect(crearTag({ nombre: "x", color: "nothex" })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run (falla)**

Run: `npm test -- tags.test.ts`
Expected: FAIL.

- [ ] **Step 3: Escribir `src/server/tags.ts`**

```typescript
// src/server/tags.ts
import { z } from "zod";
import { prisma } from "@/lib/db";

const crearSchema = z.object({
  nombre: z.string().trim().min(1).max(80).transform(s => s.trim()),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function crearTag(input: z.input<typeof crearSchema>) {
  const data = crearSchema.parse(input);
  return prisma.tag.create({ data });
}

export async function listarTags() {
  return prisma.tag.findMany({ orderBy: { nombre: "asc" } });
}

export async function eliminarTag(id: string) {
  return prisma.tag.delete({ where: { id } });
}
```

- [ ] **Step 4: Run test**

Run: `npm test -- tags.test.ts`
Expected: 2 tests pass.

- [ ] **Step 5: Escribir página admin**

```tsx
// src/app/(admin)/tags/page.tsx
import { listarTags, crearTag, eliminarTag } from "@/server/tags";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = await listarTags();

  async function onCrear(fd: FormData) {
    "use server";
    await crearTag({
      nombre: String(fd.get("nombre") ?? ""),
      color: String(fd.get("color") ?? "#0d3048"),
    });
    revalidatePath("/tags");
  }

  async function onEliminar(fd: FormData) {
    "use server";
    await eliminarTag(String(fd.get("id")));
    revalidatePath("/tags");
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Tags</h1>
      <form action={onCrear} className="flex gap-2 mb-6">
        <input name="nombre" placeholder="Nombre" className="border border-gray-200 rounded-lg p-2 flex-1" required />
        <input name="color" type="color" defaultValue="#0d3048" className="border border-gray-200 rounded-lg" />
        <button className="bg-sb-azul text-white px-4 rounded-lg">Crear</button>
      </form>
      <ul className="space-y-2">
        {tags.map(t => (
          <li key={t.id} className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 p-3">
            <span className="w-4 h-4 rounded-full" style={{ background: t.color ?? "#5c7f91" }} />
            <span className="flex-1">{t.nombre}</span>
            <form action={onEliminar}>
              <input type="hidden" name="id" value={t.id} />
              <button className="text-sb-rojo text-sm">Eliminar</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/server/tags.ts src/server/tags.test.ts "src/app/(admin)/tags"
git commit -m "feat(tags): CRUD de tags de evento"
```

---

### Task 1.4: CRUD de Eventos + invitaciones

**Files:**
- Create: `src/server/eventos.ts`
- Create: `src/server/eventos.test.ts`
- Create: `src/app/(admin)/eventos/page.tsx`
- Create: `src/app/(admin)/eventos/nuevo/page.tsx`

- [ ] **Step 1: Escribir test**

```typescript
// src/server/eventos.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  evento: { create: vi.fn(), findMany: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  eventoInvitacion: { createMany: vi.fn(), deleteMany: vi.fn() },
};
vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));

import { crearEvento, activarEvento } from "./eventos";

describe("eventos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crea evento en estado BORRADOR con modo VIVO", async () => {
    mockPrisma.evento.create.mockResolvedValue({ id: "e1", estado: "BORRADOR", modo: "VIVO" });
    await crearEvento({ nombre: "Asamblea", modo: "VIVO", creadoPor: "admin1" });
    expect(mockPrisma.evento.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ nombre: "Asamblea", modo: "VIVO", estado: "BORRADOR" }),
    }));
  });

  it("VIVO no requiere inicioAt/cierreAt", async () => {
    mockPrisma.evento.create.mockResolvedValue({});
    await expect(crearEvento({ nombre: "X", modo: "VIVO", creadoPor: "a1" })).resolves.not.toThrow();
  });

  it("ASINCRONO requiere inicioAt y cierreAt", async () => {
    await expect(crearEvento({ nombre: "X", modo: "ASINCRONO", creadoPor: "a1" })).rejects.toThrow();
  });

  it("activar transiciona BORRADOR -> ACTIVO", async () => {
    mockPrisma.evento.findUnique.mockResolvedValue({ id: "e1", estado: "BORRADOR" });
    mockPrisma.evento.update.mockResolvedValue({ id: "e1", estado: "ACTIVO" });
    const r = await activarEvento("e1");
    expect(r.estado).toBe("ACTIVO");
  });

  it("activar falla si no está en BORRADOR", async () => {
    mockPrisma.evento.findUnique.mockResolvedValue({ id: "e1", estado: "ACTIVO" });
    await expect(activarEvento("e1")).rejects.toThrow(/estado/);
  });
});
```

- [ ] **Step 2: Run (falla)**

Run: `npm test -- eventos.test.ts`
Expected: FAIL.

- [ ] **Step 3: Escribir `src/server/eventos.ts`**

```typescript
// src/server/eventos.ts
import { z } from "zod";
import { prisma } from "@/lib/db";

const crearSchema = z.object({
  nombre: z.string().trim().min(1).max(200),
  descripcion: z.string().optional(),
  modo: z.enum(["VIVO", "ASINCRONO"]),
  inicioAt: z.coerce.date().optional(),
  cierreAt: z.coerce.date().optional(),
  maxPoderesPorProxy: z.number().int().positive().optional(),
  creadoPor: z.string(),
  tagIds: z.array(z.string()).optional(),
}).refine(d => d.modo === "VIVO" || (d.inicioAt && d.cierreAt && d.cierreAt > d.inicioAt), {
  message: "ASINCRONO requiere inicioAt y cierreAt con cierreAt > inicioAt",
});

export async function crearEvento(input: z.input<typeof crearSchema>) {
  const data = crearSchema.parse(input);
  const { tagIds, ...rest } = data;
  return prisma.evento.create({
    data: {
      ...rest,
      estado: "BORRADOR",
      ...(tagIds ? { tags: { create: tagIds.map(tagId => ({ tagId })) } } : {}),
    },
  });
}

export async function listarEventos() {
  return prisma.evento.findMany({
    include: { tags: { include: { tag: true } }, _count: { select: { preguntas: true, invitados: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function obtenerEvento(id: string) {
  return prisma.evento.findUnique({
    where: { id },
    include: {
      preguntas: { orderBy: { orden: "asc" }, include: { opciones: { orderBy: { orden: "asc" } } } },
      invitados: { include: { user: true } },
      tags: { include: { tag: true } },
    },
  });
}

export async function activarEvento(id: string) {
  const e = await prisma.evento.findUnique({ where: { id } });
  if (!e) throw new Error("evento no existe");
  if (e.estado !== "BORRADOR") throw new Error(`estado inválido: ${e.estado}`);
  return prisma.evento.update({ where: { id }, data: { estado: "ACTIVO" } });
}

export async function finalizarEvento(id: string) {
  return prisma.evento.update({ where: { id }, data: { estado: "FINALIZADO" } });
}

export async function invitarUsuarios(eventoId: string, userIds: string[]) {
  await prisma.eventoInvitacion.createMany({
    data: userIds.map(userId => ({ eventoId, userId })),
    skipDuplicates: true,
  });
}

export async function removerInvitacion(eventoId: string, userId: string) {
  await prisma.eventoInvitacion.deleteMany({ where: { eventoId, userId } });
}
```

- [ ] **Step 4: Run test**

Run: `npm test -- eventos.test.ts`
Expected: 5 tests pass.

- [ ] **Step 5: Escribir páginas de eventos**

`src/app/(admin)/eventos/page.tsx`:
```tsx
import Link from "next/link";
import { listarEventos } from "@/server/eventos";

export const dynamic = "force-dynamic";

export default async function EventosPage() {
  const eventos = await listarEventos();
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Eventos</h1>
        <Link href="/eventos/nuevo" className="bg-sb-azul text-white px-4 py-2 rounded-lg">Nuevo evento</Link>
      </div>
      <ul className="space-y-2">
        {eventos.map(e => (
          <li key={e.id} className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <Link href={`/eventos/${e.id}`} className="font-medium text-sb-azul">{e.nombre}</Link>
              <span className="text-xs text-sb-gris">
                {e.modo} · {e.estado} · {e._count.preguntas} preguntas · {e._count.invitados} invitados
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

`src/app/(admin)/eventos/nuevo/page.tsx`:
```tsx
import { auth } from "@/lib/auth";
import { crearEvento } from "@/server/eventos";
import { redirect } from "next/navigation";

export default async function NuevoEventoPage() {
  async function onCrear(fd: FormData) {
    "use server";
    const session = await auth();
    if (!session) throw new Error("auth");
    const modo = String(fd.get("modo")) as "VIVO" | "ASINCRONO";
    const evento = await crearEvento({
      nombre: String(fd.get("nombre")),
      descripcion: String(fd.get("descripcion") ?? "") || undefined,
      modo,
      inicioAt: modo === "ASINCRONO" ? new Date(String(fd.get("inicioAt"))) : undefined,
      cierreAt: modo === "ASINCRONO" ? new Date(String(fd.get("cierreAt"))) : undefined,
      maxPoderesPorProxy: Number(fd.get("maxPoderes")) || undefined,
      creadoPor: session.user.id,
    });
    redirect(`/eventos/${evento.id}`);
  }
  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Nuevo evento</h1>
      <form action={onCrear} className="space-y-3">
        <input name="nombre" placeholder="Nombre" required className="w-full border border-gray-200 rounded-lg p-2" />
        <textarea name="descripcion" placeholder="Descripción (opcional)" className="w-full border border-gray-200 rounded-lg p-2" />
        <select name="modo" className="w-full border border-gray-200 rounded-lg p-2">
          <option value="VIVO">Vivo</option>
          <option value="ASINCRONO">Asíncrono</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input type="datetime-local" name="inicioAt" className="border border-gray-200 rounded-lg p-2" />
          <input type="datetime-local" name="cierreAt" className="border border-gray-200 rounded-lg p-2" />
        </div>
        <input type="number" name="maxPoderes" placeholder="Máx. poderes por proxy (opcional)" className="w-full border border-gray-200 rounded-lg p-2" />
        <button className="bg-sb-azul text-white px-4 py-2 rounded-lg">Crear</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/server/eventos.ts src/server/eventos.test.ts "src/app/(admin)/eventos"
git commit -m "feat(eventos): CRUD + lifecycle (BORRADOR/ACTIVO/FINALIZADO)"
```

---

### Task 1.5: Registry de tipos + módulo OPCION_MULTIPLE

**Files:**
- Create: `src/components/preguntas/index.ts`
- Create: `src/components/preguntas/opcion-multiple/Schema.ts`
- Create: `src/components/preguntas/opcion-multiple/Voter.tsx`
- Create: `src/components/preguntas/opcion-multiple/Projector.tsx`
- Create: `src/components/preguntas/opcion-multiple/agregar.ts`
- Create: `src/components/preguntas/opcion-multiple/Schema.test.ts`
- Create: `src/components/preguntas/opcion-multiple/agregar.test.ts`

- [ ] **Step 1: Escribir `Schema.ts`**

```typescript
// src/components/preguntas/opcion-multiple/Schema.ts
import { z } from "zod";

export const ConfigOpcionMultiple = z.object({
  permitirMultiple: z.boolean().default(false),
  maxSelecciones: z.number().int().positive().default(1),
});
export type ConfigOpcionMultiple = z.infer<typeof ConfigOpcionMultiple>;

export const RespuestaOpcionMultiple = z.object({
  opcionIds: z.array(z.string()).min(1),
});
export type RespuestaOpcionMultiple = z.infer<typeof RespuestaOpcionMultiple>;
```

- [ ] **Step 2: Escribir test de schema**

```typescript
// src/components/preguntas/opcion-multiple/Schema.test.ts
import { describe, it, expect } from "vitest";
import { ConfigOpcionMultiple, RespuestaOpcionMultiple } from "./Schema";

describe("OpcionMultiple schemas", () => {
  it("config default: single choice", () => {
    const parsed = ConfigOpcionMultiple.parse({});
    expect(parsed).toEqual({ permitirMultiple: false, maxSelecciones: 1 });
  });
  it("respuesta requiere al menos 1 opcionId", () => {
    expect(() => RespuestaOpcionMultiple.parse({ opcionIds: [] })).toThrow();
  });
  it("respuesta válida pasa", () => {
    expect(RespuestaOpcionMultiple.parse({ opcionIds: ["o1"] })).toEqual({ opcionIds: ["o1"] });
  });
});
```

- [ ] **Step 3: Run test**

Run: `npm test -- opcion-multiple/Schema.test.ts`
Expected: 3 pass.

- [ ] **Step 4: Escribir `agregar.ts`**

```typescript
// src/components/preguntas/opcion-multiple/agregar.ts
import type { Voto, Opcion } from "@/generated/prisma";
import { RespuestaOpcionMultiple } from "./Schema";

export type AgregadoOpcionMultiple = {
  total: number;
  porOpcion: Record<string, { opcionId: string; texto: string; imagenUrl: string | null; votos: number; pct: number }>;
};

export function agregarOpcionMultiple(votos: Voto[], opciones: Opcion[]): AgregadoOpcionMultiple {
  const total = votos.length;
  const contador: Record<string, number> = {};
  for (const v of votos) {
    const r = RespuestaOpcionMultiple.safeParse(v.respuesta);
    if (!r.success) continue;
    for (const oid of r.data.opcionIds) contador[oid] = (contador[oid] ?? 0) + 1;
  }
  const porOpcion: AgregadoOpcionMultiple["porOpcion"] = {};
  for (const op of opciones) {
    const n = contador[op.id] ?? 0;
    porOpcion[op.id] = { opcionId: op.id, texto: op.texto, imagenUrl: op.imagenUrl, votos: n, pct: total ? n / total : 0 };
  }
  return { total, porOpcion };
}
```

- [ ] **Step 5: Test de agregar**

```typescript
// src/components/preguntas/opcion-multiple/agregar.test.ts
import { describe, it, expect } from "vitest";
import { agregarOpcionMultiple } from "./agregar";

describe("agregarOpcionMultiple", () => {
  it("cuenta votos por opción", () => {
    const opciones = [
      { id: "a", preguntaId: "p1", orden: 0, texto: "A", imagenUrl: null, esCorrecta: false },
      { id: "b", preguntaId: "p1", orden: 1, texto: "B", imagenUrl: null, esCorrecta: false },
    ] as never;
    const votos = [
      { respuesta: { opcionIds: ["a"] } },
      { respuesta: { opcionIds: ["a"] } },
      { respuesta: { opcionIds: ["b"] } },
    ] as never;
    const r = agregarOpcionMultiple(votos, opciones);
    expect(r.total).toBe(3);
    expect(r.porOpcion["a"].votos).toBe(2);
    expect(r.porOpcion["b"].votos).toBe(1);
    expect(r.porOpcion["a"].pct).toBeCloseTo(2/3);
  });

  it("multi-select suma cada opción escogida", () => {
    const opciones = [
      { id: "a", preguntaId: "p1", orden: 0, texto: "A", imagenUrl: null, esCorrecta: false },
      { id: "b", preguntaId: "p1", orden: 1, texto: "B", imagenUrl: null, esCorrecta: false },
    ] as never;
    const votos = [{ respuesta: { opcionIds: ["a", "b"] } }] as never;
    const r = agregarOpcionMultiple(votos, opciones);
    expect(r.total).toBe(1);
    expect(r.porOpcion["a"].votos).toBe(1);
    expect(r.porOpcion["b"].votos).toBe(1);
  });
});
```

Run: `npm test -- opcion-multiple/agregar.test.ts`
Expected: 2 pass.

- [ ] **Step 6: Escribir `Voter.tsx`**

```tsx
// src/components/preguntas/opcion-multiple/Voter.tsx
"use client";
import { useState } from "react";
import type { Opcion } from "@/generated/prisma";
import type { ConfigOpcionMultiple } from "./Schema";

type Props = {
  preguntaId: string;
  config: ConfigOpcionMultiple;
  opciones: Opcion[];
  onSubmit: (opcionIds: string[]) => Promise<void>;
};

export function VoterOpcionMultiple({ config, opciones, onSubmit }: Props) {
  const [sel, setSel] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  function toggle(id: string) {
    if (!config.permitirMultiple) return setSel([id]);
    setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id].slice(0, config.maxSelecciones));
  }

  async function submit() {
    if (!sel.length) return;
    setSending(true);
    await onSubmit(sel);
    setSending(false);
    setDone(true);
  }

  if (done) return <p className="text-center py-8 text-sb-verde">✓ Tu voto fue registrado</p>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {opciones.map(op => {
          const active = sel.includes(op.id);
          return (
            <button key={op.id} onClick={() => toggle(op.id)}
              className={`border rounded-xl p-3 text-left transition-all ${active ? "border-sb-azul bg-sb-azul/5" : "border-gray-200 bg-white"}`}>
              {op.imagenUrl && <img src={op.imagenUrl} alt={op.texto} className="w-full h-32 object-cover rounded-lg mb-2" />}
              <span className="font-medium">{op.texto}</span>
            </button>
          );
        })}
      </div>
      <button onClick={submit} disabled={!sel.length || sending}
        className="w-full bg-sb-azul text-white rounded-lg p-3 disabled:opacity-50">
        {sending ? "Enviando..." : "Enviar voto"}
      </button>
    </div>
  );
}
```

- [ ] **Step 7: Escribir `Projector.tsx`**

```tsx
// src/components/preguntas/opcion-multiple/Projector.tsx
"use client";
import type { AgregadoOpcionMultiple } from "./agregar";

export function ProjectorOpcionMultiple({ agregado, oculto }: { agregado: AgregadoOpcionMultiple; oculto: boolean }) {
  if (oculto) return (
    <div className="text-center">
      <p className="text-6xl font-bold text-sb-azul mb-4">{agregado.total}</p>
      <p className="text-xl text-sb-gris">votos recibidos</p>
    </div>
  );
  const entries = Object.values(agregado.porOpcion).sort((a, b) => b.votos - a.votos);
  const max = entries[0]?.votos ?? 1;
  return (
    <div className="space-y-3">
      {entries.map(e => (
        <div key={e.opcionId} className="flex items-center gap-3">
          {e.imagenUrl && <img src={e.imagenUrl} alt={e.texto} className="w-20 h-20 object-cover rounded-lg" />}
          <div className="flex-1">
            <div className="flex items-center justify-between text-lg mb-1">
              <span className="font-medium">{e.texto}</span>
              <span>{e.votos} · {(e.pct * 100).toFixed(0)}%</span>
            </div>
            <div className="h-8 bg-sb-grisFondo rounded-lg overflow-hidden">
              <div className="h-full bg-sb-azul transition-all duration-500 ease-out"
                style={{ width: `${(e.votos / max) * 100}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 8: Escribir registry `src/components/preguntas/index.ts`**

```typescript
// src/components/preguntas/index.ts
import type { TipoPregunta } from "@/generated/prisma";
import { ConfigOpcionMultiple, RespuestaOpcionMultiple } from "./opcion-multiple/Schema";
import { VoterOpcionMultiple } from "./opcion-multiple/Voter";
import { ProjectorOpcionMultiple } from "./opcion-multiple/Projector";
import { agregarOpcionMultiple } from "./opcion-multiple/agregar";

export const REGISTRY_PREGUNTAS = {
  OPCION_MULTIPLE: {
    schemaConfig: ConfigOpcionMultiple,
    schemaRespuesta: RespuestaOpcionMultiple,
    Voter: VoterOpcionMultiple,
    Projector: ProjectorOpcionMultiple,
    agregar: agregarOpcionMultiple,
  },
} as const satisfies Partial<Record<TipoPregunta, unknown>>;

export type TipoImplementado = keyof typeof REGISTRY_PREGUNTAS;
```

- [ ] **Step 9: Commit**

```bash
git add src/components/preguntas/
git commit -m "feat(preguntas): OPCION_MULTIPLE module (schema/voter/projector/agregar)"
```

---

### Task 1.6: Módulo SI_NO

**Files:**
- Create: `src/components/preguntas/si-no/{Schema.ts,Voter.tsx,Projector.tsx,agregar.ts,Schema.test.ts,agregar.test.ts}`

- [ ] **Step 1: Escribir `Schema.ts`**

```typescript
// src/components/preguntas/si-no/Schema.ts
import { z } from "zod";
export const ConfigSiNo = z.object({});
export type ConfigSiNo = z.infer<typeof ConfigSiNo>;
export const RespuestaSiNo = z.object({ opcionIds: z.array(z.string()).length(1) });
export type RespuestaSiNo = z.infer<typeof RespuestaSiNo>;
```

- [ ] **Step 2: Escribir `agregar.ts`**

```typescript
// src/components/preguntas/si-no/agregar.ts
import type { Voto, Opcion } from "@/generated/prisma";
import { RespuestaSiNo } from "./Schema";

export function agregarSiNo(votos: Voto[], opciones: Opcion[]) {
  const total = votos.length;
  const conteo: Record<string, number> = {};
  for (const v of votos) {
    const r = RespuestaSiNo.safeParse(v.respuesta);
    if (!r.success) continue;
    const id = r.data.opcionIds[0];
    conteo[id] = (conteo[id] ?? 0) + 1;
  }
  const sí = opciones.find(o => /^s[íi]$/i.test(o.texto));
  const no = opciones.find(o => /^no$/i.test(o.texto));
  return {
    total,
    si: sí ? (conteo[sí.id] ?? 0) : 0,
    no: no ? (conteo[no.id] ?? 0) : 0,
  };
}
export type AgregadoSiNo = ReturnType<typeof agregarSiNo>;
```

- [ ] **Step 3: Escribir tests `Schema.test.ts` y `agregar.test.ts`**

```typescript
// src/components/preguntas/si-no/Schema.test.ts
import { describe, it, expect } from "vitest";
import { RespuestaSiNo } from "./Schema";
describe("RespuestaSiNo", () => {
  it("requiere exactamente 1 opcionId", () => {
    expect(() => RespuestaSiNo.parse({ opcionIds: [] })).toThrow();
    expect(() => RespuestaSiNo.parse({ opcionIds: ["a","b"] })).toThrow();
    expect(RespuestaSiNo.parse({ opcionIds: ["a"] })).toEqual({ opcionIds: ["a"] });
  });
});
```

```typescript
// src/components/preguntas/si-no/agregar.test.ts
import { describe, it, expect } from "vitest";
import { agregarSiNo } from "./agregar";
describe("agregarSiNo", () => {
  it("cuenta sí/no", () => {
    const opciones = [
      { id: "s", texto: "Sí" }, { id: "n", texto: "No" },
    ] as never;
    const votos = [
      { respuesta: { opcionIds: ["s"] } },
      { respuesta: { opcionIds: ["s"] } },
      { respuesta: { opcionIds: ["n"] } },
    ] as never;
    const r = agregarSiNo(votos, opciones);
    expect(r).toEqual({ total: 3, si: 2, no: 1 });
  });
});
```

Run: `npm test -- si-no`
Expected: 2 tests pass.

- [ ] **Step 4: Escribir `Voter.tsx`**

```tsx
// src/components/preguntas/si-no/Voter.tsx
"use client";
import { useState } from "react";
import type { Opcion } from "@/generated/prisma";

type Props = { opciones: Opcion[]; onSubmit: (opcionIds: string[]) => Promise<void>; };
export function VoterSiNo({ opciones, onSubmit }: Props) {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const sí = opciones.find(o => /^s[íi]$/i.test(o.texto));
  const no = opciones.find(o => /^no$/i.test(o.texto));
  async function vota(opcionId: string) {
    setSending(true); await onSubmit([opcionId]); setSending(false); setDone(true);
  }
  if (done) return <p className="text-center py-8 text-sb-verde">✓ Tu voto fue registrado</p>;
  return (
    <div className="grid grid-cols-2 gap-3">
      <button disabled={sending || !sí} onClick={() => vota(sí!.id)}
        className="bg-sb-verde text-white rounded-xl p-6 text-xl font-semibold disabled:opacity-50">Sí</button>
      <button disabled={sending || !no} onClick={() => vota(no!.id)}
        className="bg-sb-terracota text-white rounded-xl p-6 text-xl font-semibold disabled:opacity-50">No</button>
    </div>
  );
}
```

- [ ] **Step 5: Escribir `Projector.tsx`**

```tsx
// src/components/preguntas/si-no/Projector.tsx
"use client";
import type { AgregadoSiNo } from "./agregar";
export function ProjectorSiNo({ agregado, oculto }: { agregado: AgregadoSiNo; oculto: boolean }) {
  if (oculto) return (
    <div className="text-center"><p className="text-6xl font-bold text-sb-azul">{agregado.total}</p><p className="text-xl text-sb-gris">votos</p></div>
  );
  const pctSi = agregado.total ? agregado.si / agregado.total : 0;
  return (
    <div className="flex items-center justify-center gap-16">
      <div className="text-center"><p className="text-7xl font-bold text-sb-verde">{agregado.si}</p><p className="text-2xl text-sb-verde">Sí ({(pctSi*100).toFixed(0)}%)</p></div>
      <div className="text-center"><p className="text-7xl font-bold text-sb-terracota">{agregado.no}</p><p className="text-2xl text-sb-terracota">No ({((1-pctSi)*100).toFixed(0)}%)</p></div>
    </div>
  );
}
```

- [ ] **Step 6: Actualizar registry para incluir SI_NO**

```typescript
// src/components/preguntas/index.ts (actualizar)
// ... imports previos ...
import { ConfigSiNo, RespuestaSiNo } from "./si-no/Schema";
import { VoterSiNo } from "./si-no/Voter";
import { ProjectorSiNo } from "./si-no/Projector";
import { agregarSiNo } from "./si-no/agregar";

export const REGISTRY_PREGUNTAS = {
  OPCION_MULTIPLE: { /* ... */ },
  SI_NO: {
    schemaConfig: ConfigSiNo,
    schemaRespuesta: RespuestaSiNo,
    Voter: VoterSiNo,
    Projector: ProjectorSiNo,
    agregar: agregarSiNo,
  },
} as const satisfies Partial<Record<TipoPregunta, unknown>>;
```

- [ ] **Step 7: Commit**

```bash
git add src/components/preguntas/si-no src/components/preguntas/index.ts
git commit -m "feat(preguntas): SI_NO module"
```

---

### Task 1.7: Módulo ESCALA (1-5)

**Files:**
- Create: `src/components/preguntas/escala/{Schema.ts,Voter.tsx,Projector.tsx,agregar.ts,agregar.test.ts}`

- [ ] **Step 1: Escribir `Schema.ts`**

```typescript
// src/components/preguntas/escala/Schema.ts
import { z } from "zod";
export const ConfigEscala = z.object({
  min: z.number().int().default(1),
  max: z.number().int().default(5),
  etiquetaMin: z.string().default(""),
  etiquetaMax: z.string().default(""),
}).refine(d => d.max > d.min);
export type ConfigEscala = z.infer<typeof ConfigEscala>;
export const RespuestaEscala = z.object({ valor: z.number().int() });
export type RespuestaEscala = z.infer<typeof RespuestaEscala>;
```

- [ ] **Step 2: Escribir `agregar.ts`**

```typescript
// src/components/preguntas/escala/agregar.ts
import type { Voto } from "@/generated/prisma";
import type { ConfigEscala } from "./Schema";
import { RespuestaEscala } from "./Schema";

export function agregarEscala(votos: Voto[], config: ConfigEscala) {
  const histograma: Record<number, number> = {};
  let suma = 0, n = 0;
  for (let v = config.min; v <= config.max; v++) histograma[v] = 0;
  for (const v of votos) {
    const r = RespuestaEscala.safeParse(v.respuesta);
    if (!r.success) continue;
    const val = r.data.valor;
    if (val < config.min || val > config.max) continue;
    histograma[val] = (histograma[val] ?? 0) + 1;
    suma += val; n++;
  }
  return { total: n, promedio: n ? suma / n : 0, histograma };
}
export type AgregadoEscala = ReturnType<typeof agregarEscala>;
```

- [ ] **Step 3: Test de agregar**

```typescript
// src/components/preguntas/escala/agregar.test.ts
import { describe, it, expect } from "vitest";
import { agregarEscala } from "./agregar";
describe("agregarEscala", () => {
  it("calcula promedio e histograma", () => {
    const votos = [
      { respuesta: { valor: 3 } },
      { respuesta: { valor: 5 } },
      { respuesta: { valor: 4 } },
    ] as never;
    const r = agregarEscala(votos, { min: 1, max: 5, etiquetaMin: "", etiquetaMax: "" });
    expect(r.total).toBe(3);
    expect(r.promedio).toBeCloseTo(4);
    expect(r.histograma[3]).toBe(1);
    expect(r.histograma[5]).toBe(1);
  });
  it("descarta valores fuera de rango", () => {
    const votos = [{ respuesta: { valor: 99 } }] as never;
    const r = agregarEscala(votos, { min: 1, max: 5, etiquetaMin: "", etiquetaMax: "" });
    expect(r.total).toBe(0);
  });
});
```

Run: `npm test -- escala`
Expected: 2 pass.

- [ ] **Step 4: Escribir `Voter.tsx`**

```tsx
// src/components/preguntas/escala/Voter.tsx
"use client";
import { useState } from "react";
import type { ConfigEscala } from "./Schema";
type Props = { config: ConfigEscala; onSubmit: (valor: number) => Promise<void>; };
export function VoterEscala({ config, onSubmit }: Props) {
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const valores = Array.from({ length: config.max - config.min + 1 }, (_, i) => config.min + i);
  async function submit() {
    if (sel === null) return;
    setSending(true); await onSubmit(sel); setSending(false); setDone(true);
  }
  if (done) return <p className="text-center py-8 text-sb-verde">✓ Tu voto fue registrado</p>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-sb-gris">
        <span>{config.etiquetaMin}</span><span>{config.etiquetaMax}</span>
      </div>
      <div className="grid grid-flow-col auto-cols-fr gap-2">
        {valores.map(v => (
          <button key={v} onClick={() => setSel(v)}
            className={`rounded-xl p-4 text-xl font-semibold border ${sel === v ? "border-sb-azul bg-sb-azul text-white" : "border-gray-200 bg-white"}`}>
            {v}
          </button>
        ))}
      </div>
      <button disabled={sel === null || sending} onClick={submit}
        className="w-full bg-sb-azul text-white rounded-lg p-3 disabled:opacity-50">
        {sending ? "Enviando..." : "Enviar voto"}
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Escribir `Projector.tsx`**

```tsx
// src/components/preguntas/escala/Projector.tsx
"use client";
import type { AgregadoEscala } from "./agregar";
export function ProjectorEscala({ agregado, oculto }: { agregado: AgregadoEscala; oculto: boolean }) {
  if (oculto) return <div className="text-center"><p className="text-6xl font-bold">{agregado.total}</p><p className="text-xl text-sb-gris">respuestas</p></div>;
  const max = Math.max(...Object.values(agregado.histograma), 1);
  return (
    <div className="flex items-end justify-center gap-4 h-80">
      {Object.entries(agregado.histograma).map(([v, n]) => (
        <div key={v} className="flex flex-col items-center gap-2 flex-1">
          <span className="font-semibold text-lg">{n}</span>
          <div className="w-full bg-sb-azul rounded-t-lg transition-all duration-500 ease-out"
            style={{ height: `${(n / max) * 100}%` }} />
          <span className="text-xl font-medium">{v}</span>
        </div>
      ))}
      <div className="ml-4 text-center">
        <p className="text-sm text-sb-gris">Promedio</p>
        <p className="text-5xl font-bold text-sb-azul">{agregado.promedio.toFixed(1)}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Actualizar registry**

Agregar en `src/components/preguntas/index.ts`:
```typescript
import { ConfigEscala, RespuestaEscala } from "./escala/Schema";
import { VoterEscala } from "./escala/Voter";
import { ProjectorEscala } from "./escala/Projector";
import { agregarEscala } from "./escala/agregar";
// ... dentro del objeto REGISTRY_PREGUNTAS:
ESCALA: {
  schemaConfig: ConfigEscala,
  schemaRespuesta: RespuestaEscala,
  Voter: VoterEscala,
  Projector: ProjectorEscala,
  agregar: agregarEscala,
},
```

- [ ] **Step 7: Commit**

```bash
git add src/components/preguntas/escala src/components/preguntas/index.ts
git commit -m "feat(preguntas): ESCALA module"
```

---

### Task 1.8: CRUD de Pregunta (con config type-aware)

**Files:**
- Create: `src/server/preguntas.ts`
- Create: `src/server/preguntas.test.ts`
- Create: `src/app/(admin)/eventos/[id]/page.tsx`

- [ ] **Step 1: Escribir test**

```typescript
// src/server/preguntas.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
const mockPrisma = {
  pregunta: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
  opcion: { createMany: vi.fn() },
};
vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/eventbus", () => ({ eventBus: { publish: vi.fn() }, canalEvento: (id: string) => `evento:${id}` }));

import { crearPregunta } from "./preguntas";

describe("preguntas", () => {
  beforeEach(() => vi.clearAllMocks());
  it("valida config según tipo", async () => {
    mockPrisma.pregunta.count.mockResolvedValue(0);
    mockPrisma.pregunta.create.mockResolvedValue({ id: "p1" });
    await crearPregunta({
      eventoId: "e1", tipo: "ESCALA", enunciado: "?",
      configuracion: { min: 1, max: 5, etiquetaMin: "", etiquetaMax: "" },
      visibilidad: "EN_VIVO", opciones: [],
    });
    expect(mockPrisma.pregunta.create).toHaveBeenCalled();
  });
  it("rechaza config inválida", async () => {
    mockPrisma.pregunta.count.mockResolvedValue(0);
    await expect(crearPregunta({
      eventoId: "e1", tipo: "ESCALA", enunciado: "?",
      configuracion: { min: 5, max: 1 }, // inválido: max<min
      visibilidad: "EN_VIVO", opciones: [],
    })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run (falla)**

Run: `npm test -- preguntas.test.ts`
Expected: FAIL.

- [ ] **Step 3: Escribir `src/server/preguntas.ts`**

```typescript
// src/server/preguntas.ts
import { z } from "zod";
import { prisma } from "@/lib/db";
import { eventBus, canalEvento } from "@/lib/eventbus";
import type { Prisma, TipoPregunta, Visibilidad } from "@/generated/prisma";
import { REGISTRY_PREGUNTAS } from "@/components/preguntas";

const crearSchema = z.object({
  eventoId: z.string(),
  tipo: z.enum(["OPCION_MULTIPLE", "SI_NO", "ESCALA"]),
  enunciado: z.string().min(1).max(500),
  descripcion: z.string().optional(),
  visibilidad: z.enum(["EN_VIVO", "OCULTO_HASTA_CERRAR"]).default("OCULTO_HASTA_CERRAR"),
  configuracion: z.unknown(),
  opciones: z.array(z.object({
    texto: z.string().min(1),
    imagenUrl: z.string().url().optional(),
    esCorrecta: z.boolean().optional(),
  })).default([]),
});

export async function crearPregunta(raw: z.input<typeof crearSchema>) {
  const data = crearSchema.parse(raw);
  const impl = REGISTRY_PREGUNTAS[data.tipo as keyof typeof REGISTRY_PREGUNTAS];
  const configuracion = impl.schemaConfig.parse(data.configuracion);

  const opciones = data.tipo === "SI_NO"
    ? [{ texto: "Sí" }, { texto: "No" }]
    : data.opciones;

  const orden = await prisma.pregunta.count({ where: { eventoId: data.eventoId } });

  return prisma.pregunta.create({
    data: {
      eventoId: data.eventoId, tipo: data.tipo as TipoPregunta,
      enunciado: data.enunciado, descripcion: data.descripcion,
      visibilidad: data.visibilidad as Visibilidad,
      estado: "BORRADOR", configuracion: configuracion as Prisma.InputJsonValue,
      orden,
      opciones: { create: opciones.map((o, i) => ({ orden: i, texto: o.texto, imagenUrl: o.imagenUrl, esCorrecta: !!o.esCorrecta })) },
    },
    include: { opciones: true },
  });
}

export async function abrirPregunta(preguntaId: string) {
  const p = await prisma.pregunta.update({
    where: { id: preguntaId },
    data: { estado: "ABIERTA", abiertaAt: new Date() },
  });
  eventBus.publish(canalEvento(p.eventoId), {
    tipo: "pregunta:abierta", preguntaId, eventoId: p.eventoId,
  });
  return p;
}

export async function cerrarPregunta(preguntaId: string) {
  const p = await prisma.pregunta.update({
    where: { id: preguntaId },
    data: { estado: "CERRADA", cerradaAt: new Date() },
  });
  eventBus.publish(canalEvento(p.eventoId), {
    tipo: "pregunta:cerrada", preguntaId, eventoId: p.eventoId,
  });
  return p;
}

export async function revelarPregunta(preguntaId: string) {
  const p = await prisma.pregunta.update({
    where: { id: preguntaId },
    data: { estado: "REVELADA" },
  });
  eventBus.publish(canalEvento(p.eventoId), {
    tipo: "pregunta:revelada", preguntaId, eventoId: p.eventoId,
  });
  return p;
}

export async function eliminarPregunta(preguntaId: string) {
  return prisma.pregunta.delete({ where: { id: preguntaId } });
}
```

- [ ] **Step 4: Run test**

Run: `npm test -- preguntas.test.ts`
Expected: 2 tests pass.

- [ ] **Step 5: Escribir página de edición de evento**

```tsx
// src/app/(admin)/eventos/[id]/page.tsx
import Link from "next/link";
import { obtenerEvento, activarEvento } from "@/server/eventos";
import { crearPregunta, eliminarPregunta } from "@/server/preguntas";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EventoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await obtenerEvento(id);
  if (!e) return notFound();

  async function onActivar() {
    "use server";
    await activarEvento(id);
    revalidatePath(`/eventos/${id}`);
  }

  async function onCrearPregunta(fd: FormData) {
    "use server";
    const tipo = String(fd.get("tipo")) as "OPCION_MULTIPLE" | "SI_NO" | "ESCALA";
    const configRaw: Record<string, unknown> = {};
    if (tipo === "ESCALA") {
      configRaw.min = Number(fd.get("escalaMin") ?? 1);
      configRaw.max = Number(fd.get("escalaMax") ?? 5);
      configRaw.etiquetaMin = String(fd.get("escalaEtiMin") ?? "");
      configRaw.etiquetaMax = String(fd.get("escalaEtiMax") ?? "");
    } else if (tipo === "OPCION_MULTIPLE") {
      configRaw.permitirMultiple = fd.get("permitirMultiple") === "on";
      configRaw.maxSelecciones = Number(fd.get("maxSelecciones") ?? 1);
    }
    const opcionesRaw = String(fd.get("opciones") ?? "").split("\n").filter(Boolean);
    await crearPregunta({
      eventoId: id, tipo, enunciado: String(fd.get("enunciado")),
      visibilidad: String(fd.get("visibilidad")) as "EN_VIVO" | "OCULTO_HASTA_CERRAR",
      configuracion: configRaw,
      opciones: opcionesRaw.map(t => ({ texto: t })),
    });
    revalidatePath(`/eventos/${id}`);
  }

  async function onEliminarPregunta(fd: FormData) {
    "use server";
    await eliminarPregunta(String(fd.get("pid")));
    revalidatePath(`/eventos/${id}`);
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">{e.nombre}</h1>
          <p className="text-sm text-sb-gris">{e.modo} · {e.estado} · {e.preguntas.length} preguntas</p>
        </div>
        <div className="flex gap-2">
          {e.estado === "BORRADOR" && <form action={onActivar}><button className="bg-sb-verde text-white px-4 py-2 rounded-lg">Activar</button></form>}
          {e.estado === "ACTIVO" && <Link href={`/eventos/${e.id}/control`} className="bg-sb-azul text-white px-4 py-2 rounded-lg">Control en vivo →</Link>}
        </div>
      </div>

      <section className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <h2 className="font-semibold mb-3">Nueva pregunta</h2>
        <form action={onCrearPregunta} className="space-y-3">
          <input name="enunciado" placeholder="Enunciado" required className="w-full border border-gray-200 rounded-lg p-2" />
          <div className="grid grid-cols-2 gap-3">
            <select name="tipo" className="border border-gray-200 rounded-lg p-2">
              <option value="OPCION_MULTIPLE">Opción múltiple</option>
              <option value="SI_NO">Sí / No</option>
              <option value="ESCALA">Escala 1-5</option>
            </select>
            <select name="visibilidad" className="border border-gray-200 rounded-lg p-2">
              <option value="OCULTO_HASTA_CERRAR">Oculto hasta cerrar</option>
              <option value="EN_VIVO">En vivo</option>
            </select>
          </div>
          <textarea name="opciones" placeholder="Opciones (una por línea, ignorado para Sí/No y Escala)" className="w-full border border-gray-200 rounded-lg p-2 font-mono text-sm" rows={4} />
          <details className="text-sm">
            <summary className="cursor-pointer">Opciones de tipo</summary>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <label className="flex items-center gap-2"><input type="checkbox" name="permitirMultiple" /> Permitir múltiples (MC)</label>
              <input name="maxSelecciones" type="number" defaultValue="1" className="border border-gray-200 rounded-lg p-2" />
              <input name="escalaMin" type="number" defaultValue="1" className="border border-gray-200 rounded-lg p-2" />
              <input name="escalaMax" type="number" defaultValue="5" className="border border-gray-200 rounded-lg p-2" />
              <input name="escalaEtiMin" placeholder="Etiqueta min (Escala)" className="border border-gray-200 rounded-lg p-2" />
              <input name="escalaEtiMax" placeholder="Etiqueta max (Escala)" className="border border-gray-200 rounded-lg p-2" />
            </div>
          </details>
          <button className="bg-sb-azul text-white px-4 py-2 rounded-lg">Agregar pregunta</button>
        </form>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Preguntas ({e.preguntas.length})</h2>
        <ul className="space-y-2">
          {e.preguntas.map(p => (
            <li key={p.id} className="bg-white rounded-lg border border-gray-100 p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.orden + 1}. {p.enunciado}</p>
                <p className="text-xs text-sb-gris">{p.tipo} · {p.estado} · {p.opciones.length} opciones</p>
              </div>
              <form action={onEliminarPregunta}>
                <input type="hidden" name="pid" value={p.id} />
                <button className="text-sb-rojo text-sm">Eliminar</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/server/preguntas.ts src/server/preguntas.test.ts "src/app/(admin)/eventos/[id]/page.tsx"
git commit -m "feat(preguntas): CRUD + lifecycle (BORRADOR/ABIERTA/CERRADA/REVELADA) + EventBus"
```

---

### Task 1.9: `POST /api/votos` + lógica de dominio

**Files:**
- Create: `src/server/votos.ts`
- Create: `src/server/votos.test.ts`
- Create: `src/app/api/votos/route.ts`

- [ ] **Step 1: Escribir test**

```typescript
// src/server/votos.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
const mockPrisma = {
  pregunta: { findUnique: vi.fn() },
  eventoInvitacion: { findUnique: vi.fn() },
  voto: { upsert: vi.fn(), count: vi.fn() },
  $transaction: vi.fn(async (fn) => fn(mockPrisma)),
};
vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/eventbus", () => ({ eventBus: { publish: vi.fn() }, canalEvento: (id: string) => `evento:${id}` }));
import { eventBus } from "@/lib/eventbus";
import { registrarVoto } from "./votos";

describe("registrarVoto", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rechaza si pregunta no está abierta", async () => {
    mockPrisma.pregunta.findUnique.mockResolvedValue({ id: "p1", estado: "CERRADA", tipo: "SI_NO", eventoId: "e1", configuracion: {} });
    mockPrisma.eventoInvitacion.findUnique.mockResolvedValue({ eventoId: "e1", userId: "u1" });
    await expect(registrarVoto({ preguntaId: "p1", userId: "u1", respuesta: { opcionIds: ["a"] } })).rejects.toThrow(/abierta/i);
  });

  it("rechaza si usuario no está invitado", async () => {
    mockPrisma.pregunta.findUnique.mockResolvedValue({ id: "p1", estado: "ABIERTA", tipo: "SI_NO", eventoId: "e1", configuracion: {} });
    mockPrisma.eventoInvitacion.findUnique.mockResolvedValue(null);
    await expect(registrarVoto({ preguntaId: "p1", userId: "u1", respuesta: { opcionIds: ["a"] } })).rejects.toThrow(/invitado/i);
  });

  it("valida schema de respuesta", async () => {
    mockPrisma.pregunta.findUnique.mockResolvedValue({ id: "p1", estado: "ABIERTA", tipo: "SI_NO", eventoId: "e1", configuracion: {} });
    mockPrisma.eventoInvitacion.findUnique.mockResolvedValue({ eventoId: "e1", userId: "u1" });
    await expect(registrarVoto({ preguntaId: "p1", userId: "u1", respuesta: { valor: 3 } as never })).rejects.toThrow();
  });

  it("upsert + emite voto:registrado", async () => {
    mockPrisma.pregunta.findUnique.mockResolvedValue({ id: "p1", estado: "ABIERTA", tipo: "SI_NO", eventoId: "e1", configuracion: {} });
    mockPrisma.eventoInvitacion.findUnique.mockResolvedValue({ eventoId: "e1", userId: "u1" });
    mockPrisma.voto.upsert.mockResolvedValue({ id: "v1" });
    mockPrisma.voto.count.mockResolvedValue(5);
    await registrarVoto({ preguntaId: "p1", userId: "u1", respuesta: { opcionIds: ["a"] } });
    expect(mockPrisma.voto.upsert).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledWith("evento:e1", expect.objectContaining({ tipo: "voto:registrado", total: 5 }));
  });
});
```

- [ ] **Step 2: Run (falla)**

Run: `npm test -- votos.test.ts`
Expected: FAIL.

- [ ] **Step 3: Escribir `src/server/votos.ts`**

```typescript
// src/server/votos.ts
import { z } from "zod";
import { prisma } from "@/lib/db";
import { eventBus, canalEvento } from "@/lib/eventbus";
import { REGISTRY_PREGUNTAS } from "@/components/preguntas";
import type { Prisma } from "@/generated/prisma";

const inputSchema = z.object({
  preguntaId: z.string(),
  userId: z.string(),
  respuesta: z.unknown(),
});

export async function registrarVoto(raw: z.input<typeof inputSchema>) {
  const { preguntaId, userId, respuesta } = inputSchema.parse(raw);

  return prisma.$transaction(async (tx) => {
    const pregunta = await tx.pregunta.findUnique({ where: { id: preguntaId } });
    if (!pregunta) throw new Error("Pregunta no existe");
    if (pregunta.estado !== "ABIERTA") throw new Error(`Pregunta no está abierta (estado: ${pregunta.estado})`);

    const invitacion = await tx.eventoInvitacion.findUnique({
      where: { eventoId_userId: { eventoId: pregunta.eventoId, userId } },
    });
    if (!invitacion) throw new Error("Usuario no invitado al evento");

    const impl = REGISTRY_PREGUNTAS[pregunta.tipo as keyof typeof REGISTRY_PREGUNTAS];
    if (!impl) throw new Error(`Tipo ${pregunta.tipo} no implementado`);
    const respuestaValidada = impl.schemaRespuesta.parse(respuesta);

    await tx.voto.upsert({
      where: { preguntaId_userId_representandoA: { preguntaId, userId, representandoA: null } },
      create: {
        preguntaId, userId, representandoA: null,
        emitidoVia: "DIRECTO",
        respuesta: respuestaValidada as Prisma.InputJsonValue,
      },
      update: { respuesta: respuestaValidada as Prisma.InputJsonValue, updatedAt: new Date() },
    });

    const total = await tx.voto.count({ where: { preguntaId } });
    eventBus.publish(canalEvento(pregunta.eventoId), {
      tipo: "voto:registrado", preguntaId, eventoId: pregunta.eventoId, total,
    });
    return { total };
  });
}
```

⚠️ El `@@unique([preguntaId, userId, representandoA])` en Prisma genera el compound key `preguntaId_userId_representandoA`. Verifica nombre exacto en `src/generated/prisma`.

- [ ] **Step 4: Run test**

Run: `npm test -- votos.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Escribir endpoint**

```typescript
// src/app/api/votos/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { registrarVoto } from "@/server/votos";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.rol !== "VOTANTE") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const result = await registrarVoto({ ...body, userId: session.user.id });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/server/votos.ts src/server/votos.test.ts src/app/api/votos
git commit -m "feat(votos): POST /api/votos with upsert + EventBus emit"
```

---

### Task 1.10: AuditLog en acciones admin

**Files:**
- Modify: `src/server/preguntas.ts` (abrir/cerrar/revelar escriben AuditLog)

- [ ] **Step 1: Modificar `abrirPregunta`/`cerrarPregunta`/`revelarPregunta`**

Envolver cada una en una transacción que también inserta en `AuditLog`:

```typescript
// src/server/preguntas.ts — reemplazar funciones abrir/cerrar/revelar

async function transicion(preguntaId: string, nuevoEstado: "ABIERTA" | "CERRADA" | "REVELADA", adminId: string, tipoEvento: "pregunta:abierta" | "pregunta:cerrada" | "pregunta:revelada") {
  const p = await prisma.$transaction(async (tx) => {
    const extra: Record<string, Date> = {};
    if (nuevoEstado === "ABIERTA") extra.abiertaAt = new Date();
    if (nuevoEstado === "CERRADA") extra.cerradaAt = new Date();
    const pregunta = await tx.pregunta.update({
      where: { id: preguntaId },
      data: { estado: nuevoEstado, ...extra },
    });
    await tx.auditLog.create({
      data: { userId: adminId, accion: `pregunta.${nuevoEstado.toLowerCase()}`, targetId: preguntaId, metadata: { eventoId: pregunta.eventoId } },
    });
    return pregunta;
  });
  eventBus.publish(canalEvento(p.eventoId), { tipo: tipoEvento, preguntaId, eventoId: p.eventoId });
  return p;
}

export const abrirPregunta = (id: string, adminId: string) => transicion(id, "ABIERTA", adminId, "pregunta:abierta");
export const cerrarPregunta = (id: string, adminId: string) => transicion(id, "CERRADA", adminId, "pregunta:cerrada");
export const revelarPregunta = (id: string, adminId: string) => transicion(id, "REVELADA", adminId, "pregunta:revelada");
```

- [ ] **Step 2: Actualizar tests** (agregar `adminId` en llamadas existentes y agregar mock de `prisma.auditLog.create`)

- [ ] **Step 3: Run tests**

Run: `npm test -- preguntas.test.ts`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add src/server/preguntas.ts src/server/preguntas.test.ts
git commit -m "feat(audit): log pregunta state transitions"
```

---

### Task 1.11: SSE endpoint

**Files:**
- Create: `src/app/api/eventos/[id]/stream/route.ts`

- [ ] **Step 1: Escribir ruta**

```typescript
// src/app/api/eventos/[id]/stream/route.ts
import { auth } from "@/lib/auth";
import { crearStreamEvento } from "@/lib/sse";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return new Response("unauthorized", { status: 401 });

  // Autorización por rol:
  if (session.user.rol === "VOTANTE") {
    const inv = await prisma.eventoInvitacion.findUnique({
      where: { eventoId_userId: { eventoId: id, userId: session.user.id } },
    });
    if (!inv) return new Response("forbidden", { status: 403 });
  }

  const stream = crearStreamEvento(id);
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/eventos
git commit -m "feat(sse): GET /api/eventos/:id/stream endpoint"
```

---

### Task 1.12: Snapshot endpoint

**Files:**
- Create: `src/app/api/eventos/[id]/snapshot/route.ts`
- Create: `src/server/snapshot.ts`

- [ ] **Step 1: Escribir `src/server/snapshot.ts`**

```typescript
// src/server/snapshot.ts
import { prisma } from "@/lib/db";
import { REGISTRY_PREGUNTAS } from "@/components/preguntas";

export async function obtenerSnapshotEvento(eventoId: string) {
  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    include: {
      preguntas: {
        orderBy: { orden: "asc" },
        include: { opciones: { orderBy: { orden: "asc" } }, votos: true },
      },
    },
  });
  if (!evento) return null;

  const preguntas = evento.preguntas.map(p => {
    const impl = REGISTRY_PREGUNTAS[p.tipo as keyof typeof REGISTRY_PREGUNTAS];
    const agregado = impl
      ? (p.tipo === "ESCALA"
          ? impl.agregar(p.votos, impl.schemaConfig.parse(p.configuracion) as never)
          : (impl.agregar as (v: unknown, o: unknown) => unknown)(p.votos, p.opciones))
      : null;
    return {
      id: p.id, orden: p.orden, tipo: p.tipo, enunciado: p.enunciado,
      estado: p.estado, visibilidad: p.visibilidad,
      configuracion: p.configuracion, opciones: p.opciones,
      totalVotos: p.votos.length, agregado,
    };
  });

  return {
    id: evento.id, nombre: evento.nombre, estado: evento.estado, modo: evento.modo,
    preguntas,
  };
}
```

- [ ] **Step 2: Escribir ruta**

```typescript
// src/app/api/eventos/[id]/snapshot/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { obtenerSnapshotEvento } from "@/server/snapshot";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.user.rol === "VOTANTE") {
    const inv = await prisma.eventoInvitacion.findUnique({
      where: { eventoId_userId: { eventoId: id, userId: session.user.id } },
    });
    if (!inv) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const snap = await obtenerSnapshotEvento(id);
  if (!snap) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Votante no debe ver agregado de pregunta con visibilidad=OCULTO_HASTA_CERRAR si aún no REVELADA
  if (session.user.rol === "VOTANTE") {
    snap.preguntas = snap.preguntas.map(p =>
      p.visibilidad === "OCULTO_HASTA_CERRAR" && p.estado !== "REVELADA"
        ? { ...p, agregado: null }
        : p,
    );
  }
  return NextResponse.json(snap);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/server/snapshot.ts src/app/api/eventos
git commit -m "feat(sse): GET /api/eventos/:id/snapshot"
```

---

### Task 1.13: Control panel admin (pantalla 1)

**Files:**
- Create: `src/app/(admin)/eventos/[id]/control/page.tsx`
- Create: `src/app/(admin)/eventos/[id]/control/ControlClient.tsx`

- [ ] **Step 1: Escribir el page (server) que pasa el snapshot inicial**

```tsx
// src/app/(admin)/eventos/[id]/control/page.tsx
import { obtenerSnapshotEvento } from "@/server/snapshot";
import { notFound } from "next/navigation";
import { ControlClient } from "./ControlClient";

export const dynamic = "force-dynamic";

export default async function ControlPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snap = await obtenerSnapshotEvento(id);
  if (!snap) return notFound();
  return <ControlClient initial={snap} eventoId={id} />;
}
```

- [ ] **Step 2: Escribir el client**

```tsx
// src/app/(admin)/eventos/[id]/control/ControlClient.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Pregunta = { id: string; orden: number; enunciado: string; tipo: string; estado: string; visibilidad: string; totalVotos: number; };
type Snapshot = { id: string; nombre: string; preguntas: Pregunta[]; };

export function ControlClient({ initial, eventoId }: { initial: Snapshot; eventoId: string }) {
  const [snap, setSnap] = useState<Snapshot>(initial);

  useEffect(() => {
    const es = new EventSource(`/api/eventos/${eventoId}/stream`);
    es.onmessage = async () => {
      const r = await fetch(`/api/eventos/${eventoId}/snapshot`);
      if (r.ok) setSnap(await r.json());
    };
    return () => es.close();
  }, [eventoId]);

  async function accion(preguntaId: string, tipo: "abrir" | "cerrar" | "revelar") {
    await fetch(`/api/admin/preguntas/${preguntaId}/${tipo}`, { method: "POST" });
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{snap.nombre} — Control</h1>
        <Link href={`/proyectar/${eventoId}`} target="_blank"
          className="bg-sb-azul text-white px-4 py-2 rounded-lg">Abrir proyector ↗</Link>
      </div>
      <ul className="space-y-3">
        {snap.preguntas.map(p => (
          <li key={p.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium">{p.orden + 1}. {p.enunciado}</p>
                <p className="text-xs text-sb-gris">{p.tipo} · {p.visibilidad} · {p.totalVotos} votos</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                p.estado === "ABIERTA" ? "bg-sb-verde/20 text-sb-verde" :
                p.estado === "CERRADA" ? "bg-sb-gris/20 text-sb-gris" :
                p.estado === "REVELADA" ? "bg-sb-azul/20 text-sb-azul" :
                "bg-gray-100 text-gray-500"
              }`}>{p.estado}</span>
            </div>
            <div className="flex gap-2">
              {p.estado === "BORRADOR" && <button onClick={() => accion(p.id, "abrir")} className="bg-sb-verde text-white px-3 py-1 rounded-lg text-sm">Abrir</button>}
              {p.estado === "ABIERTA" && <button onClick={() => accion(p.id, "cerrar")} className="bg-sb-terracota text-white px-3 py-1 rounded-lg text-sm">Cerrar</button>}
              {p.estado === "CERRADA" && p.visibilidad === "OCULTO_HASTA_CERRAR" && <button onClick={() => accion(p.id, "revelar")} className="bg-sb-azul text-white px-3 py-1 rounded-lg text-sm">Revelar</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Crear endpoints de acción**

```typescript
// src/app/api/admin/preguntas/[id]/[accion]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { abrirPregunta, cerrarPregunta, revelarPregunta } from "@/server/preguntas";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string; accion: string }> }) {
  const { id, accion } = await params;
  const session = await auth();
  if (!session || session.user.rol !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    if (accion === "abrir") await abrirPregunta(id, session.user.id);
    else if (accion === "cerrar") await cerrarPregunta(id, session.user.id);
    else if (accion === "revelar") await revelarPregunta(id, session.user.id);
    else return NextResponse.json({ error: "acción inválida" }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(admin)/eventos/[id]/control" src/app/api/admin
git commit -m "feat(admin): control panel page with SSE-driven refresh"
```

---

### Task 1.14: Proyector (pantalla 2)

**Files:**
- Create: `src/app/proyectar/[eventoId]/page.tsx`
- Create: `src/app/proyectar/[eventoId]/ProjectorClient.tsx`
- Create: `src/components/proyector/Frame.tsx`

- [ ] **Step 1: Escribir Frame**

```tsx
// src/components/proyector/Frame.tsx
export function ProjectorFrame({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="p-6 border-b border-gray-100">
        <h1 className="text-3xl font-semibold text-sb-azul">{nombre}</h1>
      </header>
      <main className="flex-1 flex items-center justify-center p-12">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Escribir page + client**

```tsx
// src/app/proyectar/[eventoId]/page.tsx
import { obtenerSnapshotEvento } from "@/server/snapshot";
import { ProjectorClient } from "./ProjectorClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProyectarPage({ params }: { params: Promise<{ eventoId: string }> }) {
  const { eventoId } = await params;
  const snap = await obtenerSnapshotEvento(eventoId);
  if (!snap) return notFound();
  return <ProjectorClient initial={snap} eventoId={eventoId} />;
}
```

```tsx
// src/app/proyectar/[eventoId]/ProjectorClient.tsx
"use client";
import { useEffect, useState } from "react";
import { ProjectorFrame } from "@/components/proyector/Frame";
import { ProjectorOpcionMultiple } from "@/components/preguntas/opcion-multiple/Projector";
import { ProjectorSiNo } from "@/components/preguntas/si-no/Projector";
import { ProjectorEscala } from "@/components/preguntas/escala/Projector";

export function ProjectorClient({ initial, eventoId }: { initial: any; eventoId: string }) {
  const [snap, setSnap] = useState(initial);

  useEffect(() => {
    const es = new EventSource(`/api/eventos/${eventoId}/stream`);
    es.onmessage = async () => {
      const r = await fetch(`/api/eventos/${eventoId}/snapshot`);
      if (r.ok) setSnap(await r.json());
    };
    return () => es.close();
  }, [eventoId]);

  const actual = snap.preguntas.find((p: any) => p.estado === "ABIERTA" || p.estado === "CERRADA" || p.estado === "REVELADA");

  if (!actual) return (
    <ProjectorFrame nombre={snap.nombre}>
      <p className="text-3xl text-sb-gris">Esperando primera pregunta...</p>
    </ProjectorFrame>
  );

  const oculto = actual.visibilidad === "OCULTO_HASTA_CERRAR" && actual.estado !== "REVELADA";

  return (
    <ProjectorFrame nombre={snap.nombre}>
      <div className="w-full max-w-5xl">
        <h2 className="text-4xl font-semibold mb-8 text-center">{actual.enunciado}</h2>
        {actual.tipo === "OPCION_MULTIPLE" && <ProjectorOpcionMultiple agregado={actual.agregado} oculto={oculto} />}
        {actual.tipo === "SI_NO" && <ProjectorSiNo agregado={actual.agregado} oculto={oculto} />}
        {actual.tipo === "ESCALA" && <ProjectorEscala agregado={actual.agregado} oculto={oculto} />}
      </div>
    </ProjectorFrame>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/proyectar src/components/proyector
git commit -m "feat(proyector): full-screen projector view with SSE updates"
```

---

### Task 1.15: Vista votante

**Files:**
- Create: `src/app/(votante)/eventos/page.tsx`
- Create: `src/app/(votante)/votar/[eventoId]/page.tsx`
- Create: `src/app/(votante)/votar/[eventoId]/VotarClient.tsx`

- [ ] **Step 1: Escribir lista de eventos del votante**

```tsx
// src/app/(votante)/eventos/page.tsx
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EventosVotante() {
  const session = await auth();
  if (!session) redirect("/login");
  const invitaciones = await prisma.eventoInvitacion.findMany({
    where: { userId: session.user.id },
    include: { evento: true },
  });
  const activos = invitaciones.filter(i => i.evento.estado === "ACTIVO");
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Mis votaciones</h1>
      {activos.length === 0 && <p className="text-sb-gris">No tienes votaciones activas.</p>}
      <ul className="space-y-2">
        {activos.map(i => (
          <li key={i.eventoId}>
            <Link href={`/votar/${i.eventoId}`} className="block bg-white rounded-xl border border-gray-100 p-4 hover:bg-sb-fondoClaro">
              <p className="font-medium text-sb-azul">{i.evento.nombre}</p>
              <p className="text-xs text-sb-gris">{i.evento.modo}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Escribir page + client del votar**

```tsx
// src/app/(votante)/votar/[eventoId]/page.tsx
import { obtenerSnapshotEvento } from "@/server/snapshot";
import { VotarClient } from "./VotarClient";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function VotarPage({ params }: { params: Promise<{ eventoId: string }> }) {
  const { eventoId } = await params;
  const session = await auth();
  if (!session) redirect("/login");
  const inv = await prisma.eventoInvitacion.findUnique({
    where: { eventoId_userId: { eventoId, userId: session.user.id } },
  });
  if (!inv) redirect("/votante/eventos");
  const snap = await obtenerSnapshotEvento(eventoId);
  if (!snap) return notFound();
  return <VotarClient initial={snap} eventoId={eventoId} />;
}
```

```tsx
// src/app/(votante)/votar/[eventoId]/VotarClient.tsx
"use client";
import { useEffect, useState } from "react";
import { VoterOpcionMultiple } from "@/components/preguntas/opcion-multiple/Voter";
import { VoterSiNo } from "@/components/preguntas/si-no/Voter";
import { VoterEscala } from "@/components/preguntas/escala/Voter";

export function VotarClient({ initial, eventoId }: { initial: any; eventoId: string }) {
  const [snap, setSnap] = useState(initial);

  useEffect(() => {
    const es = new EventSource(`/api/eventos/${eventoId}/stream`);
    es.onmessage = async () => {
      const r = await fetch(`/api/eventos/${eventoId}/snapshot`);
      if (r.ok) setSnap(await r.json());
    };
    return () => es.close();
  }, [eventoId]);

  const actual = snap.preguntas.find((p: any) => p.estado === "ABIERTA");

  async function enviarVoto(respuesta: any) {
    const r = await fetch("/api/votos", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ preguntaId: actual.id, respuesta }),
    });
    if (!r.ok) throw new Error((await r.json()).error ?? "error");
  }

  if (!actual) return (
    <div className="p-6 max-w-xl mx-auto text-center">
      <h1 className="text-xl font-semibold mb-2">{snap.nombre}</h1>
      <p className="text-sb-gris">Esperando próxima pregunta...</p>
    </div>
  );

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-6 text-sb-azul">{actual.enunciado}</h2>
      {actual.tipo === "OPCION_MULTIPLE" &&
        <VoterOpcionMultiple preguntaId={actual.id} config={actual.configuracion} opciones={actual.opciones}
          onSubmit={async (opcionIds) => enviarVoto({ opcionIds })} />}
      {actual.tipo === "SI_NO" &&
        <VoterSiNo opciones={actual.opciones}
          onSubmit={async (opcionIds) => enviarVoto({ opcionIds })} />}
      {actual.tipo === "ESCALA" &&
        <VoterEscala config={actual.configuracion}
          onSubmit={async (valor) => enviarVoto({ valor })} />}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(votante)"
git commit -m "feat(votante): voter page with SSE-driven question follow"
```

---

### Task 1.16: Vista Reviewer (read-only)

**Files:**
- Create: `src/app/(reviewer)/layout.tsx`
- Create: `src/app/(reviewer)/eventos/page.tsx`
- Create: `src/app/(reviewer)/eventos/[id]/page.tsx`

- [ ] **Step 1: Layout similar a admin**

```tsx
// src/app/(reviewer)/layout.tsx
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function ReviewerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="min-h-screen">
      <header className="bg-sb-petroleo text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold">Reviewer (read-only)</span>
          <Link href="/reviewer/eventos" className="text-sm">Eventos</Link>
        </div>
        <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
          <button className="text-sm">{session?.user.nombre} · Salir</button>
        </form>
      </header>
      <main>{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Listar eventos (read-only, reutiliza `listarEventos`)**

```tsx
// src/app/(reviewer)/eventos/page.tsx
import Link from "next/link";
import { listarEventos } from "@/server/eventos";

export const dynamic = "force-dynamic";

export default async function ReviewerEventos() {
  const eventos = await listarEventos();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Eventos (read-only)</h1>
      <ul className="space-y-2">
        {eventos.map(e => (
          <li key={e.id} className="bg-white rounded-lg border border-gray-100 p-4">
            <Link href={`/reviewer/eventos/${e.id}`} className="font-medium text-sb-azul">{e.nombre}</Link>
            <p className="text-xs text-sb-gris">{e.modo} · {e.estado}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Detalle read-only (snapshot pero sin botones)**

```tsx
// src/app/(reviewer)/eventos/[id]/page.tsx
import { obtenerSnapshotEvento } from "@/server/snapshot";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReviewerEventoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snap = await obtenerSnapshotEvento(id);
  if (!snap) return notFound();
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-4">{snap.nombre}</h1>
      <ul className="space-y-3">
        {snap.preguntas.map(p => (
          <li key={p.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">{p.orden + 1}. {p.enunciado}</p>
              <span className="text-xs text-sb-gris">{p.tipo} · {p.estado} · {p.totalVotos} votos</span>
            </div>
            {p.agregado && <pre className="text-xs bg-sb-grisFondo rounded p-2 overflow-auto">{JSON.stringify(p.agregado, null, 2)}</pre>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(reviewer)"
git commit -m "feat(reviewer): read-only view of events and aggregates"
```

---

### Task 1.17: Rate limiting en `/api/votos` y auth

**Files:**
- Create: `src/lib/rate-limit.ts`
- Create: `src/lib/rate-limit.test.ts`
- Modify: `src/app/api/votos/route.ts`

- [ ] **Step 1: Escribir test**

```typescript
// src/lib/rate-limit.test.ts
import { describe, it, expect, vi } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  it("permite hasta N requests en la ventana", () => {
    const key = "test:" + Math.random();
    for (let i = 0; i < 5; i++) expect(checkRateLimit(key, 5, 1000).ok).toBe(true);
    expect(checkRateLimit(key, 5, 1000).ok).toBe(false);
  });

  it("se resetea tras la ventana", async () => {
    const key = "test:" + Math.random();
    vi.useFakeTimers();
    checkRateLimit(key, 2, 1000); checkRateLimit(key, 2, 1000);
    expect(checkRateLimit(key, 2, 1000).ok).toBe(false);
    vi.advanceTimersByTime(1100);
    expect(checkRateLimit(key, 2, 1000).ok).toBe(true);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run (falla)**

Run: `npm test -- rate-limit`
Expected: FAIL.

- [ ] **Step 3: Escribir `rate-limit.ts`**

```typescript
// src/lib/rate-limit.ts
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (b.count >= max) return { ok: false, retryAfterMs: b.resetAt - now };
  b.count++;
  return { ok: true };
}
```

- [ ] **Step 4: Run test**

Run: `npm test -- rate-limit`
Expected: 2 pass.

- [ ] **Step 5: Aplicar en `/api/votos`**

```typescript
// src/app/api/votos/route.ts (modificar)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { registrarVoto } from "@/server/votos";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.rol !== "VOTANTE") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const rl = checkRateLimit(`voto:${session.user.id}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "rate limit" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 1000) / 1000)) } });
  try {
    const body = await req.json();
    const result = await registrarVoto({ ...body, userId: session.user.id });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/rate-limit.ts src/lib/rate-limit.test.ts src/app/api/votos
git commit -m "feat(security): per-user rate limiting on voto endpoint"
```

---

### Task 1.18: Smoke E2E con Playwright

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/sesion-vivo.spec.ts`
- Modify: `package.json` (agregar script `e2e:install`)

- [ ] **Step 1: Escribir `playwright.config.ts`**

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3002",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
```

- [ ] **Step 2: Escribir spec E2E**

```typescript
// e2e/sesion-vivo.spec.ts
import { test, expect } from "@playwright/test";

test("flujo vivo admin + votante + proyector", async ({ browser }) => {
  // Requiere: seed de admin@example.local y un votante invitado con password "voto1234"
  const adminCtx = await browser.newContext();
  const votanteCtx = await browser.newContext();
  const proyectorCtx = await browser.newContext();

  const admin = await adminCtx.newPage();
  const votante = await votanteCtx.newPage();
  const proyector = await proyectorCtx.newPage();

  // 1. Admin login
  await admin.goto("/login");
  await admin.fill('input[type="email"]', "admin@example.local");
  await admin.fill('input[type="password"]', "admin1234");
  await admin.click('button[type="submit"]');
  await admin.waitForURL("**/eventos");

  // 2. Crear evento
  await admin.goto("/eventos/nuevo");
  await admin.fill('input[name="nombre"]', "E2E Test");
  await admin.selectOption('select[name="modo"]', "VIVO");
  await admin.click('button:has-text("Crear")');
  const eventoUrl = admin.url(); // /eventos/:id
  const eventoId = eventoUrl.split("/").pop()!;

  // 3. Agregar pregunta SI_NO
  await admin.fill('input[name="enunciado"]', "¿Aprobamos el plan?");
  await admin.selectOption('select[name="tipo"]', "SI_NO");
  await admin.click('button:has-text("Agregar pregunta")');

  // 4. Invitar votante: asume existe voto1@example.local — crear vía seed o UI
  // (Paso asumido para test de smoke; en CI añadir seed completo)

  // 5. Activar evento
  await admin.click('button:has-text("Activar")');

  // 6. Abrir proyector y votante en paralelo
  await proyector.goto(`/proyectar/${eventoId}`);
  await votante.goto("/login");
  await votante.fill('input[type="email"]', "voto1@example.local");
  await votante.fill('input[type="password"]', "voto1234");
  await votante.click('button[type="submit"]');

  // 7. Admin abre pregunta
  await admin.goto(`/eventos/${eventoId}/control`);
  await admin.click('button:has-text("Abrir")');

  // 8. Proyector muestra pregunta
  await expect(proyector.getByText("¿Aprobamos el plan?")).toBeVisible({ timeout: 5000 });

  // 9. Votante ve la pregunta y vota
  await votante.goto(`/votar/${eventoId}`);
  await expect(votante.getByText("¿Aprobamos el plan?")).toBeVisible();
  await votante.click('button:has-text("Sí")');
  await expect(votante.getByText("Tu voto fue registrado")).toBeVisible();

  // 10. Admin ve contador subir
  await expect(admin.getByText("1 votos")).toBeVisible({ timeout: 5000 });

  // 11. Admin cierra + revela
  await admin.click('button:has-text("Cerrar")');
  await admin.click('button:has-text("Revelar")');

  // 12. Proyector muestra el 1 / 0
  await expect(proyector.getByText("1", { exact: true })).toBeVisible();
});
```

- [ ] **Step 3: Instalar Playwright browsers**

Run: `npx playwright install chromium`
Expected: download browser binary.

- [ ] **Step 4: Documentar en package.json**

```json
"scripts": {
  // ... existentes ...
  "e2e:install": "playwright install chromium",
  "e2e": "playwright test"
}
```

- [ ] **Step 5: Commit (sin ejecutar el E2E aún — requiere seed completo que viene en Task 1.19)**

```bash
git add playwright.config.ts e2e package.json
git commit -m "test(e2e): smoke test for live session flow"
```

---

### Task 1.19: Verificación Fase 1 end-to-end

- [ ] **Step 1: Extender `prisma/seed.ts` con votante + evento**

```typescript
// prisma/seed.ts (extender)
// ... código previo ...

const votanteHash = await bcrypt.hash("voto1234", 12);
const votante = await prisma.user.upsert({
  where: { email: "voto1@example.local" },
  update: {},
  create: { email: "voto1@example.local", nombre: "Votante 1", rol: "VOTANTE", hashedPassword: votanteHash, activado: true },
});

const reviewerHash = await bcrypt.hash("review1234", 12);
await prisma.user.upsert({
  where: { email: "reviewer@example.local" },
  update: {},
  create: { email: "reviewer@example.local", nombre: "Reviewer", rol: "REVIEWER", hashedPassword: reviewerHash, activado: true },
});

console.log("Seed extra OK: voto1@example.local / voto1234, reviewer@example.local / review1234");
```

Run: `DATABASE_URL=$(grep DATABASE_URL_LOCAL .env.local | cut -d= -f2-) npx prisma db seed`

- [ ] **Step 2: Rebuild imagen Docker**

Run: `docker compose build app`
Expected: build OK.

- [ ] **Step 3: Levantar stack completo**

Run: `docker compose up -d && docker compose logs -f app`
Expected: app logs "Ready on port 3000". Ctrl+C después de confirmar.

- [ ] **Step 4: Ejecutar todos los tests**

Run: `npm test`
Expected: all pass. Number depende del total de tests creados.

- [ ] **Step 5: Ejecutar type-check**

Run: `npm run type-check`
Expected: sin errores.

- [ ] **Step 6: Ejecutar smoke E2E (manual — falta invitar al votante en el test)**

Invitar al votante al evento desde la UI (ingresar como admin, ir a `/eventos/:id`, agregar invitación). Repetir E2E:

Run: `npm run e2e`
Expected: test pasa.

- [ ] **Step 7: Verificación manual del flujo completo**

1. Login admin → crear evento → crear 3 preguntas (una por tipo) → invitar votante → activar.
2. Abrir proyector en otra pestaña (F11 full-screen).
3. Login como votante en otro browser (o ventana incógnito).
4. Admin abre Q1 → proyector y votante lo reflejan <1s.
5. Votante vota → admin ve contador subir.
6. Repetir para Q2 y Q3. Cerrar y revelar cada una.

- [ ] **Step 8: Commit final de Fase 1**

```bash
git add prisma/seed.ts
git commit -m "chore: extend seed for fase 1 e2e + verification"
```

- [ ] **Step 9: Actualizar CLAUDE.md con comandos del proyecto**

Reemplazar el CLAUDE.md heredado del otro proyecto con uno adaptado a este. Mínimo:

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sistema de votaciones en línea, open-source, para consejos, juntas directivas
y asambleas. El nombre de la organización consumidora se inyecta vía
`APP_NAME` / `NEXT_PUBLIC_APP_NAME` — nunca hardcodeado en código fuente.

## Commands

- `npm run dev` — dev server (Next 16)
- `npm run build` — production build
- `npm test` — unit tests (Vitest)
- `npm run type-check` — `tsc --noEmit --skipLibCheck`
- `npm run e2e` — Playwright smoke tests
- `docker compose up -d` — full stack (Postgres + app)
- `npx prisma migrate dev` — dev migrations (contra postgres en localhost)
- `npx prisma generate` — regenera client en `src/generated/prisma`
- `npx prisma db seed` — seed admin/votante/reviewer iniciales

## Architecture

Detalle completo en `docs/superpowers/specs/2026-04-19-sistema-votaciones-design.md`.

Realtime por Server-Sent Events (no WebSockets). Pub/sub in-memory
en `src/lib/eventbus.ts`. Cada tipo de pregunta es una carpeta en
`src/components/preguntas/<tipo>/` con Voter/Projector/Schema/agregar.

## Rules

- **Domain-agnostic:** no hardcodear nombre de organización, cliente o industria
  en código, commits, comentarios ni strings. Usar `NEXT_PUBLIC_APP_NAME`.
- **Secrecy B:** `Voto.userId` es NOT NULL pero jamás se expone el par
  `(userId, respuesta)` en ninguna UI.
- Cada tipo nuevo de pregunta = nueva carpeta + entry en `REGISTRY_PREGUNTAS`.
- Tests con Vitest, componentes con @testing-library/react, E2E con Playwright.
- Cada cambio: `npm test` + `npm run type-check` antes de commit.
```

```bash
git add CLAUDE.md
git commit -m "docs: replace inherited CLAUDE.md with project-specific guide"
```

---

## Self-Review

**Spec coverage (cross-check contra `2026-04-19-sistema-votaciones-design.md`):**

| Spec section | Plan task(s) |
|---|---|
| §3 arquitectura | 0.1, 0.2, 0.3, 0.4 |
| §3 directorio | structure + tasks específicas |
| §3 SSE | 1.1, 1.2, 1.11, 1.12 |
| §4 modelo de datos | 0.3 (schema completo) |
| §5.1 invitación | 0.7, 0.8 |
| §5.2 evento CRUD | 1.3, 1.4 |
| §5.3 sesión en vivo | 1.8, 1.9, 1.10, 1.13, 1.14, 1.15 |
| §5.4 asíncrono | Fase 2 (no en este plan) |
| §5.5 PDF | Fase 2 |
| §5.6 proxy grant | Fase 2 |
| §5.7 proxy voting | Fase 2 |
| §5.8 principios | implícitos en tests y lógica |
| §6 auth + roles | 0.6, 0.10, 0.11, 1.17 |
| §7 tipos de pregunta | 1.5 (MC), 1.6 (SI_NO), 1.7 (ESCALA); otros en Fase 3 |
| §8 proxy | Fase 2 |
| §9 Fase 0 + 1 | cubiertas; Fases 2/3/4 fuera |
| §11 riesgos | rate limiting (1.17) + bandwagon (default OCULTO) |

Tipos no implementados en este plan (RANKING, NUBE_PALABRAS, RESPUESTA_ABIERTA, QUIZ, QA, HEATMAP) irán en planes siguientes. Proxy voting queda para Fase 2.

**Placeholder scan:** hice una lectura final — no veo "TODO" ni placeholders de engineering. Sí hay un `// TODO Fase 2: enviar email` en Task 0.7 que documenta deliberadamente trabajo futuro, no ambigüedad del plan.

**Type consistency:** `REGISTRY_PREGUNTAS`, `canalEvento()`, `eventBus`, `registrarVoto`, `abrirPregunta`/`cerrarPregunta`/`revelarPregunta` se usan consistentemente entre tasks. El unique constraint Prisma (`preguntaId_userId_representandoA`) aparece en Task 1.9 con warning de verificar el nombre exacto generado.

---

## Notas para el ejecutor

- **Orden:** Fase 0 completa antes de Fase 1. Dentro de cada fase, tasks en orden. Algunas tests intermedias pueden fallar hasta que tasks posteriores creen sus deps — está marcado explícitamente.
- **Ejecutar `npm test` + `npm run type-check` después de cada task.** Si fallan, NO avanzar.
- **El unique name de Prisma para el compound unique** depende del nombre que Prisma v7 genere. Verificar después de `npx prisma generate` en `src/generated/prisma/index.d.ts`. Si difiere de `preguntaId_userId_representandoA`, ajustar Task 1.9.
- **Orden "registry dentro de index.ts" requiere el objeto real con 3 entradas al final de Fase 1** — las tasks 1.5/1.6/1.7 muestran el patrón cada una; la última mezcla las tres. Revisar que index.ts tenga OPCION_MULTIPLE, SI_NO y ESCALA juntas antes de cerrar Fase 1.

**Al terminar Fase 1:** el sistema permite una asamblea real end-to-end con 3 tipos de pregunta y proyector en vivo. Fase 2 (plan separado) añadirá asíncrono, ranking/nube/abierta, PDF, email y proxy voting.
