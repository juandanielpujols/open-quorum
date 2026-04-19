# Sistema de Votaciones en Línea — Diseño

**Proyecto:** Club de Gestión de Riesgos
**Fecha:** 2026-04-19
**Estado:** Spec aprobado, pendiente de plan de implementación

---

## 1. Contexto y objetivo

Construir un sistema de votaciones en línea tipo Mentimeter/Slido para el Club de Gestión de Riesgos. Los votantes se conectan desde sus dispositivos, el admin controla el flujo desde un panel y proyecta los resultados en vivo en una segunda pantalla. El sistema soporta tanto sesiones en vivo (tipo asamblea) como campañas asíncronas (ventanas de días).

El voto es confidencial: las respuestas quedan vinculadas al votante en la base de datos (para auditoría y unicidad), pero nunca se muestran individualmente en ninguna UI — solo agregados.

El sistema también soporta voto por representación (poderes), configurable por evento.

## 2. Decisiones clave

| Dimensión | Decisión |
|---|---|
| Alcance | Proyecto standalone nuevo (clubgestionriesgos) |
| Modos | Vivo + Asíncrono |
| Secrecy | Confidencial operacional (linkeado en DB, oculto en UI) |
| Estructura | Pregunta puede ir suelta o dentro de un Evento con varias |
| Tipos de pregunta | 9 tipos completos (MC, Sí/No, Escala, Ranking, Nube palabras, Abierta, Quiz, Q&A, Heatmap) |
| Registro | Solo invitación admin; activación por email + link mágico |
| Escala | 50–300 votantes concurrentes, una sola instancia de Next |
| Visibilidad resultados | Configurable por pregunta (en vivo u oculto hasta cerrar) |
| Proyector | Admin-only, sin URL pública |
| Roles | Admin (CRUD), Reviewer (read-only), Votante (vota en eventos invitados) |
| Voto mutable | Sí, mientras la pregunta esté abierta (upsert) |
| Cierre asíncrono | Cron automático al vencer + admin manual |
| PDF de resumen | Generación on-demand, envío manual del admin |
| Proxy / poder | Global o por evento; grantor trumps proxy; un voto replica a todos los representados; límite configurable por evento |
| Stack | Next.js 16 + Postgres 16 + Prisma + Auth.js v5 + SSE + Tailwind 4 + Recharts + Docker |

## 3. Arquitectura

### Rendering

- **Next.js 16 App Router**, output `standalone` (Docker multi-stage).
- Server Components por defecto. Client Components solo para puntos interactivos (formularios de voto, gráficos, proyector, control admin).
- API HTTP tradicional para votos y para streaming SSE.

### Tiempo real con Server-Sent Events

- Una ruta por evento: `GET /api/eventos/:id/stream` mantiene conexión abierta con `Content-Type: text/event-stream`.
- Emite tres tipos de mensaje:
  - `pregunta:abierta` / `pregunta:cerrada` / `pregunta:revelada` — transiciones de estado
  - `voto:registrado` — solo contador agregado (nunca detalles individuales, consistente con secrecy B)
  - `snapshot` — estado completo al conectar/reconectar
- Un `EventBus` in-memory dentro del proceso Node coordina productores (endpoints que reciben votos) y consumidores (conexiones SSE abiertas). Para 50–300 conexiones en una instancia única, no se requiere Redis.
- Al reconectar, el cliente obtiene estado fresco vía `GET /api/eventos/:id/snapshot`.

### Estructura de directorios

```
src/
  app/
    (publico)/                    # landing, login, activación
    (admin)/
      eventos/                    # lista, CRUD
      eventos/[id]/control        # panel de control (pantalla principal)
      usuarios/                   # invitar, editar roles
      tags/                       # CRUD tags
    (reviewer)/                   # vistas read-only espejadas
    (votante)/
      eventos/                    # lista de eventos invitados
      eventos/[id]/votar          # voter UI
      poderes/                    # gestión de poderes (otorgar/revocar)
    proyectar/[eventoId]          # full-screen, rol ADMIN
    api/
      auth/[...nextauth]/
      eventos/[id]/stream         # SSE
      eventos/[id]/snapshot
      eventos/[id]/resumen-pdf
      votos/                      # POST voto
      poderes/                    # CRUD proxy
  components/
    preguntas/                    # una carpeta por tipo
      opcion-multiple/
        Voter.tsx
        Projector.tsx
        Schema.ts                 # Zod para config y respuesta
        agregar.ts                # función de agregación
      si-no/
      escala/
      ranking/
      nube-palabras/
      respuesta-abierta/
      quiz/
      qa/
      heatmap/
      index.ts                    # registry central
    proyector/                    # layouts full-screen
    charts/                       # wrappers Recharts
    ui/                           # base shadcn-style: Dialog, ConfirmDialog, etc.
  lib/
    auth.ts                       # Auth.js v5 config
    db.ts                         # Prisma client singleton
    eventbus.ts                   # pub/sub in-memory
    sse.ts                        # helper ReadableStream
    permissions.ts                # can(user, action, resource)
    email.ts                      # Resend + React Email
    pdf.ts                        # @react-pdf/renderer
  server/
    votos.ts                      # registrar voto + proxy replicación
    preguntas.ts                  # abrir/cerrar/revelar
    eventos.ts                    # activar, finalizar, cron
    poderes.ts                    # otorgar, revocar, validar
  generated/prisma/               # cliente Prisma generado
docker/
  Dockerfile
  docker-compose.yml
storage/
  imagenes/                       # uploads (heatmap, opciones con foto)
  resumenes/                      # PDFs generados
```

**Principio de módulos:** cada tipo de pregunta es una carpeta auto-contenida (UI voter + UI proyector + schema + agregación). Agregar un tipo nuevo = nueva carpeta + entry en `components/preguntas/index.ts`. No hay lógica de tipo repartida por varios lugares.

## 4. Modelo de datos

```prisma
// prisma/schema.prisma

enum Rol { ADMIN REVIEWER VOTANTE }
enum ModoEvento { VIVO ASINCRONO }
enum EstadoEvento { BORRADOR ACTIVO FINALIZADO }
enum EstadoPregunta { BORRADOR ABIERTA CERRADA REVELADA }
enum Visibilidad { EN_VIVO OCULTO_HASTA_CERRAR }
enum TipoPregunta {
  OPCION_MULTIPLE SI_NO ESCALA RANKING
  NUBE_PALABRAS RESPUESTA_ABIERTA QUIZ QA HEATMAP
}
enum OrigenVoto { DIRECTO PODER }
enum EstadoQA { PENDIENTE RESPONDIDA DESCARTADA }

model User {
  id               String   @id @default(cuid())
  email            String   @unique
  nombre           String
  fotoUrl          String?
  hashedPassword   String?                        // null hasta activar
  rol              Rol
  activado         Boolean  @default(false)
  tokenActivacion  String?  @unique
  tokenRecuperacion String? @unique
  creadoPor        String?                        // admin que invitó
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  votos            Voto[]
  eventosCreados   Evento[] @relation("EventoCreador")
  invitaciones     EventoInvitacion[]
  poderesOtorgados Poder[]  @relation("Grantor")
  poderesRecibidos Poder[]  @relation("Proxy")
}

model Evento {
  id                 String   @id @default(cuid())
  nombre             String
  descripcion        String?
  modo               ModoEvento
  estado             EstadoEvento  @default(BORRADOR)
  inicioAt           DateTime?                      // solo ASINCRONO
  cierreAt           DateTime?                      // solo ASINCRONO
  maxPoderesPorProxy Int?                           // null = sin límite (P4=B)
  creadoPor          String
  creador            User @relation("EventoCreador", fields: [creadoPor], references: [id])
  preguntas          Pregunta[]
  invitados          EventoInvitacion[]
  tags               EventoTag[]
  poderes            Poder[]
  resumenes          ResumenPDF[]
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model EventoInvitacion {
  eventoId String
  userId   String
  evento   Evento @relation(fields: [eventoId], references: [id], onDelete: Cascade)
  user     User   @relation(fields: [userId], references: [id])
  @@id([eventoId, userId])
}

model Tag {
  id        String     @id @default(cuid())
  nombre    String     @unique
  color     String?
  eventos   EventoTag[]
  createdAt DateTime   @default(now())
}

model EventoTag {
  eventoId String
  tagId    String
  evento   Evento @relation(fields: [eventoId], references: [id], onDelete: Cascade)
  tag      Tag    @relation(fields: [tagId], references: [id])
  @@id([eventoId, tagId])
}

model Pregunta {
  id            String    @id @default(cuid())
  eventoId      String
  evento        Evento    @relation(fields: [eventoId], references: [id], onDelete: Cascade)
  orden         Int
  tipo          TipoPregunta
  enunciado     String
  descripcion   String?
  visibilidad   Visibilidad   @default(OCULTO_HASTA_CERRAR)
  estado        EstadoPregunta @default(BORRADOR)
  configuracion Json                                  // polimórfico, validado por Zod
  abiertaAt     DateTime?
  cerradaAt     DateTime?
  opciones      Opcion[]
  votos         Voto[]
  qaItems       QAItem[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@index([eventoId, orden])
}

model Opcion {
  id         String @id @default(cuid())
  preguntaId String
  pregunta   Pregunta @relation(fields: [preguntaId], references: [id], onDelete: Cascade)
  orden      Int
  texto      String
  imagenUrl  String?
  esCorrecta Boolean @default(false)               // solo QUIZ
}

model Voto {
  id             String    @id @default(cuid())
  preguntaId     String
  userId         String                             // NOT NULL (secrecy B)
  respuesta      Json                               // polimórfico
  emitidoVia     OrigenVoto @default(DIRECTO)
  representandoA String?                            // grantorId si emitidoVia=PODER
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  pregunta       Pregunta   @relation(fields: [preguntaId], references: [id], onDelete: Cascade)
  user           User       @relation(fields: [userId], references: [id])
  @@unique([preguntaId, userId, representandoA])   // proxy puede tener voto propio + N por representación
  @@index([preguntaId])
}

model Poder {
  id         String    @id @default(cuid())
  grantorId  String                                   // quien otorga
  proxyId    String                                   // quien representa
  eventoId   String?                                  // null = global
  otorgadoAt DateTime  @default(now())
  revocadoAt DateTime?
  grantor    User    @relation("Grantor", fields: [grantorId], references: [id])
  proxy      User    @relation("Proxy", fields: [proxyId], references: [id])
  evento     Evento? @relation(fields: [eventoId], references: [id])
  @@index([grantorId, revocadoAt])
  @@index([proxyId, revocadoAt])
}

model QAItem {
  id          String    @id @default(cuid())
  preguntaId  String
  autorId     String?                                 // nullable si config.permitirAnonimo=true
  texto       String
  estado      EstadoQA  @default(PENDIENTE)
  createdAt   DateTime  @default(now())
  pregunta    Pregunta  @relation(fields: [preguntaId], references: [id], onDelete: Cascade)
  votos       QAVoto[]
}

model QAVoto {
  qaItemId String
  userId   String
  qaItem   QAItem @relation(fields: [qaItemId], references: [id], onDelete: Cascade)
  @@id([qaItemId, userId])
}

model ResumenPDF {
  id          String   @id @default(cuid())
  eventoId    String
  generadoPor String
  archivoUrl  String
  generadoAt  DateTime @default(now())
  evento      Evento @relation(fields: [eventoId], references: [id], onDelete: Cascade)
}

model EmailLog {
  id        String   @id @default(cuid())
  userId    String
  tipo      String                    // "activacion" | "evento.abierto" | ...
  contexto  Json?
  enviadoAt DateTime @default(now())
  error     String?
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  accion    String                    // "pregunta.abrir", "evento.finalizar", ...
  targetId  String
  metadata  Json?
  createdAt DateTime @default(now())
  @@index([targetId, createdAt])
}
```

### Campos polimórficos (Json + Zod)

**`Pregunta.configuracion`** — un schema Zod por tipo:

- `OPCION_MULTIPLE`: `{ permitirMultiple: bool, maxSelecciones: int }`
- `SI_NO`: `{}` (opciones "Sí"/"No" se siembran automáticamente)
- `ESCALA`: `{ min: int, max: int, etiquetaMin: string, etiquetaMax: string }`
- `RANKING`: `{ maxItems: int }`
- `NUBE_PALABRAS`: `{ maxCaracteres: int, palabrasPorVotante: int }`
- `RESPUESTA_ABIERTA`: `{ maxCaracteres: int }`
- `QUIZ`: `{ tiempoLimiteSegundos: int }`
- `QA`: `{ permitirAnonimo: bool }`
- `HEATMAP`: `{ imagenUrl: string, maxPunticos: int }`

**`Voto.respuesta`** — un schema Zod por tipo:

- `OPCION_MULTIPLE`, `SI_NO`: `{ opcionIds: string[] }`
- `ESCALA`: `{ valor: number }`
- `RANKING`: `{ ordenOpciones: string[] }`
- `NUBE_PALABRAS`: `{ palabras: string[] }`
- `RESPUESTA_ABIERTA`: `{ texto: string }`
- `QUIZ`: `{ opcionId: string, tiempoMs: number }`
- `QA`: (no usa `Voto`; usa `QAItem` + `QAVoto`)
- `HEATMAP`: `{ puntos: { x: number, y: number }[] }` (coords 0-1)

## 5. Flujos clave

### 5.1 Invitación y activación de cuenta

1. Admin crea `User` con email, nombre, rol.
2. Sistema genera `tokenActivacion` (32 bytes random, vence en 7 días) y envía email con link `/activar?t=xxx`.
3. Usuario entra al link, pone contraseña, sistema hashea (bcrypt cost 12), setea `activado=true`, invalida token, redirige a `/login`.

### 5.2 Admin crea evento y preguntas

1. `POST /eventos` → Evento en estado `BORRADOR`.
2. Admin agrega Tags, invita Users (N:M a través de `EventoInvitacion`).
3. Agrega Preguntas con tipo, config (validado por Zod), opciones y visibilidad.
4. `PUT /eventos/:id/activar` → estado pasa a `ACTIVO`. Si `modo=ASINCRONO`, se disparan emails a invitados.

### 5.3 Sesión en vivo

1. Admin abre `/eventos/:id/control` en su laptop y `/proyectar/:eventoId` en monitor extendido.
2. Votantes en sus dispositivos se suscriben al SSE al entrar a `/votar`.
3. Admin pulsa "Abrir Q3":
   - Backend: `Pregunta.estado = ABIERTA`, `abiertaAt = now()`, registra `AuditLog`.
   - `EventBus` emite `pregunta:abierta` → todas las conexiones SSE abiertas la reciben (<100ms).
   - Proyector renderiza Q3. Votantes ven formulario. Dashboard admin habilita controles "Cerrar" y "Revelar".
4. Votante envía voto: `POST /api/votos` con `{ preguntaId, respuesta }`.
   - Backend valida schema Zod, verifica `Pregunta.estado=ABIERTA`, verifica invitación al evento, upsert en `Voto`.
   - Si hay `Poder` vigente donde este user es proxy, **replica el voto** con `emitidoVia=PODER` y `representandoA=grantorId` por cada representación (respetando regla: si grantor ya votó directamente, se skip).
   - Emite `voto:registrado` al EventBus (solo incrementa contador; nada individual).
5. Admin pulsa "Cerrar": `Pregunta.estado=CERRADA`, emite `pregunta:cerrada`. Votantes pierden acceso al formulario.
6. Admin pulsa "Revelar" (si `visibilidad=OCULTO_HASTA_CERRAR`): `Pregunta.estado=REVELADA`, emite `pregunta:revelada`. Proyector y votantes animan la revelación de resultados.

### 5.4 Modo asíncrono

1. Admin activa evento con `inicioAt` y `cierreAt` definidos. Sistema envía email a invitados.
2. Invitados entran cuando pueden, votan dentro de la ventana. Sistema valida `inicioAt <= now <= cierreAt` y `Pregunta.estado=ABIERTA` al recibir voto.
3. Cron (Next scheduled API route, cada 5 min) detecta eventos con `cierreAt < now` y los cierra. Admin también puede cerrar manualmente en cualquier momento.
4. Al cerrar el evento, admin decide cuándo generar y enviar el PDF de resumen.

### 5.5 Generación de PDF de resumen

1. `POST /api/eventos/:id/resumen-pdf`.
2. Backend carga `Evento + Pregunta[] + agregados(Voto)`.
3. Renderiza con `@react-pdf/renderer` a `storage/resumenes/<eventoId>-<timestamp>.pdf`.
4. Registra en `ResumenPDF`.
5. Retorna URL del archivo.
6. Admin puede enviar por email manualmente a invitados (acción separada).

### 5.6 Proxy voting — otorgar poder

1. Votante entra a `/poderes` → "Otorgar poder".
2. Selecciona proxy (de lista de users), elige alcance (global o evento específico), confirma.
3. Sistema valida:
   - Grantor no es ADMIN ni REVIEWER (solo VOTANTE puede otorgar).
   - No existe `Poder` activo con mismo `(grantorId, eventoId)` — si existe, pide revocarlo primero.
   - Si evento específico: verificar límite `Evento.maxPoderesPorProxy` sobre el proxy elegido.
4. Crea `Poder`, envía email al proxy.

### 5.7 Proxy voting — votar representando

1. Proxy entra a votar en una pregunta.
2. UI muestra: "Votas por ti + representando a: Fulano, Mengana" (lista de grantors activos para ese evento/pregunta).
3. Proxy vota una vez. Backend:
   - Registra el voto del proxy (DIRECTO).
   - Por cada grantor vigente: si grantor NO ha votado directamente esa pregunta, crea voto con `emitidoVia=PODER, representandoA=grantorId`. Si grantor SÍ votó directamente, skip (regla "grantor trumps proxy").
4. Si después el grantor vota directamente, el backend ejecuta en una misma transacción Prisma: (a) `DELETE` cualquier `Voto` con `userId=proxyId, representandoA=grantorId, preguntaId=X` (la voz propia supersede al poder); (b) `UPSERT` el voto directo del grantor con `userId=grantorId, representandoA=null, emitidoVia=DIRECTO`.

### 5.8 Principios transversales

- **Idempotencia de estado:** abrir una pregunta ya abierta = no-op. Cerrar una ya cerrada = no-op.
- **Validación en DB, no en SSE:** el SSE es "avance visual", pero al recibir el voto se valida estado contra DB (evita race conditions).
- **Auto-reconexión:** el browser reconecta SSE automáticamente. Al reconectar, el cliente llama `snapshot` y rehidrata.

## 6. Autenticación, roles y permisos

### Auth.js v5

- **Credentials provider** (email + password, bcrypt cost 12).
- **Magic link** para activación inicial y recuperación de contraseña.
- **Sesiones JWT** (stateless, suficiente para una sola instancia).
- Middleware de Next intercepta rutas protegidas y valida rol.

### Matriz de permisos

| Acción | Admin | Reviewer | Votante |
|---|:---:|:---:|:---:|
| CRUD usuarios | ✅ | ❌ | ❌ |
| CRUD eventos y preguntas | ✅ | ❌ | ❌ |
| Abrir/cerrar/revelar preguntas | ✅ | ❌ | ❌ |
| Cerrar evento manualmente | ✅ | ❌ | ❌ |
| Dashboard de sesión en vivo | ✅ | ✅ (read-only) | ❌ |
| Ver agregados históricos | ✅ | ✅ | ❌ |
| Acceso a proyector | ✅ | ❌ | ❌ |
| Generar/enviar PDF | ✅ | ❌ | ❌ |
| Votar (en eventos invitados) | ❌ | ❌ | ✅ |
| Otorgar/revocar poderes | ❌ | ❌ | ✅ |
| Cambiar propia contraseña | ✅ | ✅ | ✅ |

### Enforcement en 3 capas

1. **Middleware Next** — bloquea rutas por rol antes de servidor.
2. **`lib/permissions.ts`** — `can(user, action, resource)` chequeado en cada server action / route handler.
3. **Prisma queries** — queries del votante filtran por `eventoId IN invitaciones del user`. Nada sale por accidente.

### Seguridad de fondo

- Rate limiting en `POST /api/votos` y endpoints de login.
- CSRF incorporado vía Auth.js.
- Tokens de activación con expiración.
- No se loguean pares `(userId, respuesta)` juntos en logs de servidor (aunque DB sí los vincule).

## 7. Los 9 tipos de pregunta

Cada tipo vive en `components/preguntas/<tipo>/` con `Voter.tsx`, `Projector.tsx`, `Schema.ts`, `agregar.ts`.

| Tipo | UI Votante | UI Proyector |
|---|---|---|
| **Opción múltiple** | Botones (con foto opcional). Si `permitirMultiple`, checkboxes. | Barra horizontal apilada + % por opción. Si imágenes → grid de cards con barra sobre cada una. |
| **Sí / No** | Dos botones grandes, verde/rojo. | Donut de 2 segmentos, sí verde `#12C69F`, no terracota `#D6490F`. |
| **Escala 1-5** | Slider o 5 botones en fila con etiquetas min/max. | Histograma vertical + promedio grande al centro. |
| **Ranking** | Lista drag-and-drop (`@dnd-kit`). | Lista ordenada por ranking promedio, flechas indicando cambios si en vivo. |
| **Nube de palabras** | Input corto, Enter envía (hasta `palabrasPorVotante`). | Word cloud animado (tamaño proporcional a frecuencia). |
| **Respuesta abierta** | Textarea + botón enviar. | Grid de cards con respuestas. Auto-scroll al llegar nuevas. |
| **Quiz** | Opciones + timer visible. Primer envío bloquea cambios. | Pre-respuesta: contador. Al cerrar: revela correcta en verde, incorrectas en gris. |
| **Q&A** | Textarea para enviar + lista con upvote. | Columna ordenada por upvotes. Admin marca "respondida" y se tacha. |
| **Heatmap** | Imagen clickeable, tap = punto, hasta `maxPunticos`. | Imagen con heatmap superpuesto (`heatmap.js`), intensidad = densidad. |

## 8. Proxy voting (voto por poder)

### Reglas

1. **Alcance:** global o por evento, el grantor elige al otorgar.
2. **Un grantor, un proxy vigente por alcance.** Otorgar uno nuevo revoca el anterior.
3. **Un proxy puede representar a múltiples grantors**, con límite opcional `Evento.maxPoderesPorProxy`.
4. **Grantor trumps proxy:** si el grantor vota directamente, invalida el voto por poder (para esa pregunta). Si el proxy ya votó por él y luego el grantor vota directo, el directo reemplaza.
5. **Un voto replica a todos los representados:** el proxy vota una sola vez y el sistema replica a cada grantor no-presente.
6. **Solo rol VOTANTE puede otorgar o recibir poder.**

### Auditoría

Cada `Voto` queda marcado con `emitidoVia` (DIRECTO | PODER) y `representandoA` (grantorId). Secrecy B se mantiene: los datos están en DB pero nunca se exponen en UI. En caso de disputa de procedimiento, DBA puede consultar.

## 9. Fases del proyecto

### Fase 0 — Fundamento (~1 semana)

Setup sin funcionalidad visible.

- Next.js 16 + Prisma + Postgres 16 + Docker + Tailwind 4 + Auth.js v5
- Schema Prisma inicial (todas las entidades)
- Flujo de invitación y activación de cuenta
- Layout base + ruteo por rol
- CI: `docker build` + `tsc --noEmit --skipLibCheck`

### Fase 1 — MVP votación en vivo (~2 semanas)

Primer entregable útil: permite una asamblea real end-to-end.

- CRUD Evento + Tags + invitaciones
- CRUD Pregunta (todos los tipos configurables, pero solo 3 renderizados)
- **3 tipos iniciales:** Opción múltiple (con imágenes), Sí/No, Escala 1-5
- SSE + EventBus + auto-reconexión + snapshot
- Voter UI mobile-first con los 3 tipos
- Proyector con los 3 tipos
- Abrir / cerrar / revelar
- Dashboard admin con contador en vivo
- Vista reviewer (read-only espejo de admin)
- Rate limiting + CSRF + bcrypt

### Fase 2 — Asíncrono + más tipos + proxy (~2–3 semanas)

- Modo asíncrono completo (ventana `inicioAt`/`cierreAt`)
- Cron de cierre automático
- **3 tipos más:** Ranking, Nube de palabras, Respuesta abierta
- Email notifications con Resend + React Email (4 triggers)
- PDF de resumen on-demand + bitácora
- Recordatorios manuales desde admin
- **Proxy voting completo** (Sección 8)

### Fase 3 — Features mentimeter-level (~2–3 semanas)

- Quiz con timer + respuesta correcta + score + leaderboard opcional
- Q&A con moderación admin
- Heatmap con upload de imagen + captura + render superpuesto
- Storage local para imágenes

### Fase 4 — Pulido (continuo)

- Micro-animaciones en proyector (Framer Motion)
- Accesibilidad (nav por teclado, ARIA)
- Dark mode (si aplica)
- Pases con skills de Impeccable (`/distill`, `/normalize`, `/polish`)

## 10. Fuera de alcance (v2+)

- Dos-factor auth (TOTP / WebAuthn)
- Integración con calendarios externos
- Multi-tenancy (varias organizaciones en una instancia)
- Apps nativas móviles
- Internacionalización (todo en español)
- Votación ponderada (pesos distintos por votante)
- Replay animado de la sesión tras finalizar

## 11. Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| SSE con muchas conexiones satura file descriptors | Límite de conexiones por cliente + logging; monitoreo de FDs en Docker |
| Bandwagon en modo `EN_VIVO` con votos competitivos | Default sensato: MC con imágenes → `OCULTO_HASTA_CERRAR` |
| Race condition entre voto directo y voto por poder | Transacción Prisma al registrar voto; unicidad `(preguntaId, userId, representandoA)` |
| PDF generation bloqueante en request síncrono | Timeout de 10s; si crece, mover a job queue (no Fase 1) |
| Usuario pierde token de activación | Admin puede regenerar token y reenviar email |
| Falla de email no detectada | `EmailLog.error` registra fallos; admin ve en UI de invitados "Email falló, reenviar" |
