# Open Quorum — Journal

Decisiones, iteraciones y lecciones del proyecto. Entradas por sesión,
orden cronológico inverso (más reciente primero).

---

## 2026-04-19 · Fase 2 — SSO, tipos de pregunta, async, PDF, email, poderes

Ola grande de features post-seguridad. Usuario dio autonomía completa
("haz todo lo que quieras en este folder sin preguntarme"), así que
trabajé en batch y empujé al final.

### Proveedores de identidad (SSO / OIDC)
- Nuevo modelo `AuthProvider` en Prisma: `tipo` (GOOGLE/MICROSOFT/
  GENERIC_OIDC), `issuer`, `clientId`, `clientSecretEnc` (cifrado
  at-rest), `tenantId`, `hostedDomain`, `rolDefault`, `habilitado`.
- `lib/crypto.ts` AES-256-GCM con HKDF-SHA256 derivado de `AUTH_SECRET`.
  Formato `iv:ct+tag` base64. Helper `enmascarar()` para mostrar secrets
  sin revelarlos en UI.
- `auth.ts` ahora es **async factory** — `NextAuth(async () => ({...}))`
  carga providers dinámicamente desde DB en cada startup. Providers
  deshabilitados no se inyectan.
- Callback `signIn`: primera vez que un usuario SSO entra, lo crea con
  `rol = provider.rolDefault`. Password null (no aplica para SSO).
- UI en `/admin/configuracion/providers` con CRUD completo, toggle
  enable/disable, y hint con redirect URI exacta por tipo.
- Login page `/login` detecta providers habilitados y muestra botones
  SSO arriba del form de credenciales. Client component dedicado
  (`providers-buttons.tsx`) para el `signIn(providerId)`.

### 3 tipos de pregunta nuevos (total 6)
- **Ranking**: drag-and-drop con `@dnd-kit`. Agregación por puntaje
  posicional (N-i). Top ítem gana más puntos. Render con barras.
- **Nube de palabras**: tokenización lowercase, stopwords es/en,
  frequency count, top N renderizados con tamaño proporcional al count.
- **Respuesta abierta**: texto libre, cap 500 chars, render como
  quotes tipográficas en proyección.
- Cada tipo sigue el contrato `REGISTRY_PREGUNTAS`: `schemaRespuesta`,
  `schemaConfig`, `Voter`, `Projector`, `agregar`. Sin tocar código
  core para agregar nuevos.

### Modo asíncrono + cron
- Eventos con `modo=ASINCRONO` y `cierreAt` configurable.
- Endpoint `/api/cron/cerrar-vencidos` (POST, protected by
  `CRON_SECRET` header) itera eventos activos con `cierreAt` pasado y
  los cierra transaccionalmente.
- Integrable con cron-job.org, GitHub Actions schedule, o Vercel Cron.

### PDF de resumen
- `lib/pdf/resumen-evento.tsx` usa `@react-pdf/renderer` server-side.
- A4 con masthead, metadata, secciones por pregunta, agregación
  renderizada por tipo (barras, histogramas, quotes, word list con
  counts).
- Endpoint `/api/eventos/[id]/resumen-pdf` stream Node Readable →
  Response. Runtime `nodejs` (no edge, renderToStream no corre ahí).
- Audit log `branding.actualizar` con `op: pdf_resumen_generado`.

### Email (Resend)
- `lib/email.ts` scaffold con lazy import de `resend` (no se carga si
  `RESEND_API_KEY` falta — útil dev/tests).
- Dry-run silencioso cuando sin API key; todo se loggea en `EmailLog`
  para auditar incluso sin envío real.
- 4 templates HTML responsive: `activacion`, `evento.abierto`,
  `evento.recordatorio`, `evento.finalizado`. Wrapper común con
  branding y footer.
- Fallos de envío NO propagan al caller — un email caído no rompe un
  signup.

### Voto por representación (poderes)
- Nuevo modelo `Poder`: `grantorId`, `proxyId`, `eventoId` (nullable =
  global), `otorgadoAt`, `revocadoAt`.
- `server/votos.ts` `registrarVoto` ahora:
  1. Registra el voto directo del usuario (upsert manual por compound
     unique con `representandoA: null`).
  2. **Grantor trumps proxy**: `deleteMany` donde `representandoA=userId`
     — si el grantor vota directo, borra cualquier voto por poder
     emitido antes en su nombre.
  3. **Replicación por poder**: busca grantors activos donde el user es
     proxy (global o específico del evento), y upsert voto con
     `emitidoVia=PODER, representandoA=grantorId` por cada grantor que
     no haya votado directamente.
- UI `/votante/poderes`: form para otorgar (selector de proxy +
  alcance global/evento específico), lista de otorgados con revoke
  inline, lista de poderes recibidos.
- Invariante "el voto directo del grantor siempre prevalece" se
  mantiene aunque el proxy vote primero, porque cualquier voto
  subsecuente del grantor elimina el voto por poder.

### Journal & push
- Todo empujado a `origin/main` vía SSH (usuario revocó el PAT que
  pegó en chat, ahora solo claves).

---

## 2026-04-19 · Security hardening pass

Aplicación sistemática de defensa en profundidad. El usuario es
profesional de infosec: esto no es box-checking, son controles
ordenados por impacto × esfuerzo con threat model explícito.

### Controles preventivos
- **Rate limit IP-based** en `/api/auth/callback/credentials` (10/min) y
  `/api/activar` (10/min) vía `proxy.ts`. Token bucket in-memory con
  `Retry-After` header. `getClientIp()` maneja `X-Forwarded-For` /
  `X-Real-IP` / `CF-Connecting-IP`.
- **SSE connection cap** — 10 conexiones concurrentes por IP, mitiga
  exhaustion de file descriptors.
- **Security headers globales** aplicados a cada response: CSP,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, Permissions-Policy
  restrictiva, `upgrade-insecure-requests`.
- **`logoUrl` validation**: Zod exige `https://` o `http://localhost`, max
  2048 chars. Bloquea `javascript:`, `data:`, `file:`.
- **`<img>` logos** con `referrerPolicy="no-referrer"` — servidor del logo
  nunca ve IPs de usuarios autenticados.
- **Open-redirect hardening** — middleware `next` param solo acepta paths
  relativos (`/...`, no `//`).
- **`robots.txt`** disallow de admin/reviewer/votante/votar/proyectar/api/activar.

### Controles de cuenta
- **Tokens de activación con expiración** (7 días) — antes era solo
  comentario, ahora se aplica en DB con `tokenActivacionExpira`.
- **JWT session 24h** con sliding refresh 1h (antes: default 30 días).
- **Account lockout**: 5 fallidos → 15 min bloqueado vía columnas
  `intentosFallidos` + `bloqueadoHasta`. Reset al success.
- **Password policy** en Zod: 10+ chars, upper + lower + dígito.
- **`authorize()` constante en tiempo**: retorna `null` uniforme para
  email desconocido / no activado / password incorrecto — anti
  enumeration de usuarios.
- Helper `regenerarTokenActivacion` para revoke + reissue.

### Detección / audit
- **`lib/audit.ts` centralizado** con union type `AccionAudit` (20+
  acciones). Best-effort: fallas de log jamás rompen el request path.
  Nunca loguea secrets/tokens/hashes.
- Auth.js `events.signIn` + `events.signOut` → `login.success`, `logout`.
- Auditoría extendida: `usuario.crear`, `branding.actualizar` (además de
  las `pregunta.*` pre-existentes).

### Second factor / SSO
- **TOTP 2FA scaffolding** con `otplib` + `qrcode`. Columns `totpSecret` +
  `totpHabilitado` + migration. `lib/totp.ts`: iniciar / confirmar /
  verificar / desactivar. QR como data-URL server-side (sin servicio
  externo). UI enforcement en login pendiente — scaffolding atómico
  aparte para no mezclar.
- **Guía OIDC completa** en `docs/auth-providers.md`: Azure AD / Entra,
  Google Workspace (con domain-restriction), Keycloak, Okta/Auth0.
  Role-mapping desde IdP group claims.

### Supply chain / CI
- **`.github/workflows/ci.yml`**: Postgres service + migrate + typecheck +
  47 tests + build + `npm audit` (prod-only high+ gate, full tree
  non-blocking).
- **Trivy container scan** (HIGH/CRITICAL) en push a main.
- **`SECURITY.md`** con disclosure policy + threat model (in-scope /
  out-of-scope / residual risk) + roadmap + known dev-only advisories
  documentados.

### Commits
```
b5dcdf8 security: TOTP 2FA scaffolding + OIDC provider guide + docs
adfdc77 security: SECURITY.md disclosure policy + CI pipeline
fd361f3 security: token expiration, session hardening, password policy, account lockout
9047b66 security: rate-limit on login/activar, security headers, logoUrl validation
```

### Residual risk aceptado

- **In-memory rate limiter**: no sirve para ≥2 instancias. Upgrade a
  Redis antes de horizontal scaling.
- **`totpSecret` plaintext** en DB hoy. Envolver con AES-GCM + KDF del
  `AUTH_SECRET` antes de prod crítica.
- **Sin WAF al frente**. Recomendado Cloudflare/AWS WAF en deploy.
- **Sin SBOM/SLSA provenance** — en el roadmap.
- **Sin pen-test externo** — pre-1.0.

---

## 2026-04-19 · Rebrand a Open Quorum + UX refinements

### Cambios de marca
- El proyecto deja de referenciar "Club de Gestión de Riesgos" en código
  — la instancia consumidora se inyecta vía `APP_NAME` /
  `NEXT_PUBLIC_APP_NAME` y `AppBranding.nombre` en DB.
- Nuevos componentes `BrandWordmark` + `BrandMonogram` (HTML+CSS, no SVG
  — garantiza que Crimson Pro de `next/font` renderice correctamente).
- Wordmark: `open • quorum` con dot crimson separador. Monogram: `OQ •`.
- Default `APP_NAME = "Open Quorum"` en todos los fallbacks.

### UX refinements que se acumularon en el día
- **Finalizar evento** con `AlertDialog` de confirmación (destructivo,
  irreversible). Estado ACTIVO → botón junto a Control en vivo.
- **Nueva pregunta** como modal (`Dialog`). Form type-aware: campos
  cambian según tipo, sin `<details>` accordion. Autofocus, Cancelar,
  loading state.
- **Tag manager**: inline color picker por tag (click swatch → color
  picker nativo → guarda). Paleta de 10 colores curados. Los usados
  aparecen atenuados con dot crimson. Default auto-avanza al primer
  color libre.
- **Histórico de votaciones**: al finalizar evento, cada pregunta
  muestra un bloque "Resultados" con aggregate permanente. Componente
  `ResultadoInline` reusa los Projector de cada tipo.
- **Invitar a todos** — botón que invita en bulk todos los VOTANTE
  activados aún no invitados. Separador "o" con multi-select.
- **Crear evento**: form rebuilt con shadcn Card + Button (antes era
  `<button>` pelado con texto).
- **Logout** migrado a client-side via `next-auth/react` — sobrevive
  rebuilds (server action hash embebido caducaba en cada build).

### Commits
```
e69799c feat(brand): rename to Open Quorum + tag form alignment + logout fix
3b0d02a docs: rich README with screenshots + MIT license + logout fix
84d7941 feat+polish: Crear como Button, dedup empty state, Invitar a todos, tag colors inline, historical results on finalized events
a396bb5 feat(eventos): Finalizar confirmation + Nueva pregunta as modal
58bbb18 feat: branding UI (3 themes + logo/name) + live participation counter
a485294 fix+polish: sidebar overlap + impeccable pass on /admin/eventos
```

---

## 2026-04-19 · shadcn/ui + sidebar + polish

Integración de shadcn como sistema de componentes estándar going
forward. Rebuild del chrome de la app con sidebar en lugar de top bar.

- `npx shadcn@latest init` con custom theme variables mapeadas a la
  paleta brand (navy-deep sidebar, crimson activo, cream foreground).
- Install: button, input, label, card, separator, tooltip, sidebar,
  sheet, skeleton, dialog, alert-dialog.
- `components/app-shell.tsx` — único chrome para admin/reviewer/votante.
  Nav por rol: Administración (Eventos, Tags) + Configuración
  (Usuarios, Branding) para admin; read-only para reviewer; mínimo
  para votante.
- **Impeccable polish** aplicado a login primero (Eye toggle, Caps
  Lock detect, Loader inline, focus-visible, skeleton fallback,
  `role="alert"`/`aria-live`), después a `/admin/eventos` list +
  detail (stats cards, pills de estado, inline edit con bloqueos
  por estado, badge mono para orden).

### Lecciones duras del día
- **Tailwind 4 NO wrapea `w-[--sidebar-width]` en `var()`** como
  Tailwind 3 hacía. Resulta en CSS inválido `width: --sidebar-width` y
  el gap colapsa → sidebar se monta encima del contenido. Fix: usar
  `w-[var(--sidebar-width)]` explícito en `sidebar.tsx`.
- **Next 16 `middleware.ts` deprecado → `proxy.ts`**. El rename no es
  solo cosmético: `proxy.ts` corre en Node.js runtime por default
  (mientras middleware era Edge por default). Eso soluciona el crash
  `edge runtime does not support crypto` que venía de next-auth +
  prisma + bcryptjs.
- **Next 16 + `useSearchParams()`** requiere envolver el componente en
  `<Suspense>` o el build estático falla.
- **Docker container naming conflict**: heredé `stsi-postgres` del otro
  proyecto. Renombrado a `votaciones-postgres` + puertos 5433 / 3002
  para no chocar con otros stacks locales.

---

## 2026-04-19 · MVP Fase 0 + Fase 1 shipped

Del directorio vacío al MVP funcional en una sesión. **32 tasks**
ejecutadas directamente (sin subagentes después de la primera
iteración — usuario prefirió ejecución directa por velocidad).

### Fase 0 — Fundamento (13 tasks)
- Bootstrap Next.js 16 + TypeScript + Tailwind 4
- Docker Compose (Postgres 16 + app standalone)
- Prisma v7 con `@prisma/adapter-pg` + schema inicial (14 modelos
  incluyendo Poder, QAItem, EmailLog, AuditLog — listos para fases
  siguientes)
- Auth.js v5 con Credentials + bcrypt cost 12 + module augmentation
- Flujo invitación + activación + login
- Middleware role-based (admin/reviewer/votante/proyectar)
- `lib/permissions.ts` con catálogo de acciones
- Layouts base + home redirect por rol

### Fase 1 — MVP votación en vivo (19 tasks)
- `lib/eventbus.ts` — in-memory pub/sub (sin Redis, suficiente para
  50–300 conexiones SSE en 1 instancia)
- `lib/sse.ts` — ReadableStream helper con heartbeat
- CRUD Eventos + Tags + Invitaciones
- 3 módulos de pregunta auto-contenidos (OPCION_MULTIPLE, SI_NO,
  ESCALA): Schema (Zod) + Voter + Projector + agregar, todos en una
  carpeta, registrados en `REGISTRY_PREGUNTAS`
- CRUD Preguntas type-aware
- `POST /api/votos` con upsert + validación de ventana + emit al
  EventBus + replicación por proxy (pendiente UI)
- Transiciones pregunta (abrir/cerrar/revelar) + AuditLog
- SSE endpoint + snapshot endpoint (snapshot oculta agregados a
  votantes si `OCULTO_HASTA_CERRAR` y no revelada)
- Control panel + Proyector + Vista votante sincronizadas por SSE
- Reviewer read-only espejo del control
- Rate limit in-memory en `/api/votos`
- Playwright smoke E2E (scaffold)

### Stack congelado
- Next.js 16 (App Router, standalone Docker output)
- Postgres 16 + Prisma v7 + `@prisma/adapter-pg`
- Auth.js v5 (Credentials + bcrypt cost 12, más factores/providers
  después)
- Tailwind 4 + `next/font` (Crimson Pro display + Atkinson Hyperlegible
  sans) + shadcn/ui
- SSE (no WebSockets) — innecesariamente complejo para este scope
- Vitest + Testing Library + happy-dom (47 tests unit)
- Playwright (E2E smoke)

### Decisiones de dominio
- **Secrecy B**: `Voto.userId` NOT NULL — linkeado en DB para auditoría,
  jamás expuesto en UI. La alternativa A (voto anónimo criptográfico)
  complica mucho el schema sin beneficio real para el caso de uso
  (consejos, juntas, no elecciones nacionales).
- **Grouping C**: pregunta puede ir suelta o dentro de Evento. Átomo
  es pregunta, container opcional.
- **Visibilidad configurable** por pregunta (en vivo u oculto hasta
  cerrar). Default `OCULTO_HASTA_CERRAR` para evitar bandwagon.
- **Proyector admin-only**: para eventos híbridos grandes sería fácil
  agregar una URL pública read-only más adelante.

### Commits (representativos)
```
b9020ed feat(final): rate limit + E2E scaffold + updated seed + CLAUDE.md (1.17-1.19)
646788a feat(ui): control panel + proyector + votante + reviewer (1.13-1.16)
92dd907 feat(sse+snapshot): stream + snapshot endpoints (1.11+1.12)
525488a feat(votos+preguntas): CRUD + POST /api/votos + AuditLog (1.8-1.10)
836d957 feat(preguntas): 3 tipos — OpcionMultiple + SiNo + Escala (1.5-1.7)
1cf0776 feat(admin): Tags + Eventos CRUD (1.3+1.4)
54edd2d feat(sse): in-memory EventBus + ReadableStream helper (1.1+1.2)
27cee03 chore: seed + Suspense boundaries for login/activar (task 0.13)
adc3577 feat(ui+auth): middleware + permissions + layouts per role (0.10-0.12)
dc7df55 feat(auth): invitation + activation + login flows (tasks 0.7-0.9)
d78b265 feat(auth): Auth.js v5 Credentials + pure authorize() for testability
da9aff3 feat(db): initial Prisma schema with all 14 entities
```

---

## Lecciones transversales (running list)

Appendear acá cuando se aprenda algo que sirva para futuras sesiones.

1. **`authorize()` separado de `auth.ts`** — Vitest no resuelve
   `next/server` que importa `next-auth`. Extraer la lógica pura
   de credenciales a un módulo aparte (`authorize.ts`) hace que
   sea testeable sin cargar next-auth entero.

2. **Prisma v7 mueve `datasource.url` fuera del schema** → a
   `prisma.config.ts`. Usar `loadEnv({ path: ".env.local" })`
   explícitamente ahí — dotenv no lo carga por default.

3. **Tailwind 4**: arbitrary values con CSS custom props necesitan
   `var()` explícito. `w-[--x]` ≠ `w-[var(--x)]`.

4. **Next 16 `middleware.ts` → `proxy.ts`**. proxy default es Node
   runtime, middleware era Edge. Rename + no más crypto errors.

5. **Server actions + rebuilds**: los hashes de server actions
   embebidos en HTML caducan en cada build. Para acciones que pueden
   correr en pestañas viejas (logout, long-lived sessions), usar
   handlers client-side vía `next-auth/react` o endpoints API con
   rutas estables.

6. **Prisma v7 compound unique con nullable field** no permite `null`
   en la where clause tipada. Usar `findFirst` + `create`/`update`
   manual en lugar de `upsert`.

7. **`vi.mock` es hoisted al tope del archivo** — definir dependencies
   dentro del factory o usar `vi.hoisted()`.

8. **Palette theming dinámico con Tailwind 4**: definir tokens en
   `:root` como CSS custom props, override con `[data-theme="..."]`.
   Los tokens de Tailwind 4 en `@theme` apuntan a las custom props
   (`--color-brand-navy: var(--brand-navy)`) para que el data-attribute
   los sobreescriba runtime.

9. **SVG `font-family` + `next/font`** no se lleva bien: next/font
   renombra la fuente internamente y el attribute de SVG no lo
   resuelve. Preferir HTML+CSS con `font-display` class (Tailwind).

10. **Macos artifacts `"filename 2.ext"`** aparecen tras checkouts o
    copies, rompen type-check Next porque duplican declarations. Purgar
    con `find . -type f -name "* 2.*" -delete` antes de build.

11. **otplib v13 cambió API**: no más `authenticator` object. Usar
    named exports `generateSecret`, `generate`, `verify`, `generateURI`.
    `verify()` ahora retorna `Promise<{ valid: boolean }>` — hay que
    await y leer `.valid`.

12. **NextAuth async config + Next 16 proxy.ts**: si `NextAuth()` recibe
    un factory async, exportar `proxy.ts` como plain `async function
    proxy(req)` (no `auth((req) => ...)` wrapper, porque el handler del
    wrapper se resuelve a Promise que proxy no acepta como default
    export). Llamar `await auth()` adentro cuando necesites la sesión.

13. **@react-pdf/renderer requiere runtime `nodejs`** — no Edge. En
    route handlers agregar `export const runtime = "nodejs"` explícito.
    Stream es Node Readable; castear como `BodyInit` para el Response
    de Next.

14. **Proxy voting — invariante grantor-trumps**: en cada voto directo
    de un grantor, `deleteMany` votos con `representandoA=grantorId`
    ANTES de continuar. Así si el proxy votó primero y luego el
    grantor vota, el voto del grantor pisa. Sin esto, el orden de
    escritura define el resultado y rompe la intuición legal.
