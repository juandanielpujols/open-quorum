# Security Policy

## Reporting a Vulnerability

Email `juandanielpujols@gmail.com` with `[SECURITY][open-quorum]` in the subject.

**Please do NOT open public issues for security reports.**

- Include: reproduction steps, affected version/commit SHA, impact assessment, any PoC.
- We'll acknowledge within **72 hours** and aim for a fix in **14 days** for critical issues.
- Coordinated disclosure: we credit reporters in release notes unless anonymity is requested.

PGP key: not published yet — use GitHub's private vulnerability reporting via
https://github.com/juandanielpujols/open-quorum/security/advisories as an alternative.

## Current Security Posture

### Authentication

- **Credentials provider** (email + password)
- **bcrypt cost 12** — OWASP 2024 recommendation for new deployments
- **Account lockout**: 5 failed attempts → 15 min temporary ban per user
- **Token activation expiration**: 7 days from invitation, non-extensible without admin reissue
- **Session**: JWT, `maxAge=24h` + sliding `updateAge=1h`. Cookies `HttpOnly`, `SameSite=Lax`, `Secure` in prod
- **No username enumeration**: `authorize()` returns `null` uniformly for unknown email / unactivated user / wrong password
- **Password policy**: min 10 chars + upper + lower + digit

### Authorization (3 layers)

1. `src/proxy.ts` middleware — role-based route gating at the edge
2. `src/lib/permissions.ts` — `can(user, action)` checked in server actions
3. Prisma queries — scoped by session userId / rol; votante queries filter by `EventoInvitacion`

### Input Validation

- **Zod schemas** at every server action and API route boundary — payload shape strictly validated before DB or domain logic
- **Polymorphic fields** (Pregunta.configuracion, Voto.respuesta) validated per type via a registry (`src/components/preguntas/<tipo>/Schema.ts`)
- **URL fields** (logoUrl) require `https://` or `http://localhost`, max 2048 chars — blocks `javascript:`, `data:`, `file:`

### Injection Classes

- **SQL**: Prisma parameterized queries exclusively. **Zero `$queryRaw` / `$executeRawUnsafe`** with interpolated user input (verified by grep)
- **XSS reflected**: React auto-escapes; untrusted URLs render through validated `<img src>` with `referrerPolicy="no-referrer"`
- **Command injection**: no `exec`/`spawn` on user-controlled strings in runtime code
- **SSRF**: no server-side fetch of user-supplied URLs; logos render client-side
- **Open redirect**: middleware `next` param restricted to paths that start with `/` and not `//`
- **Prototype pollution**: JSON bodies validated by Zod before merging

### Rate Limiting (in-memory, per-IP or per-user)

| Endpoint | Limit | Scope |
|---|---|---|
| `POST /api/auth/callback/credentials` | 10 / min | per IP |
| `POST /api/activar` | 10 / min | per IP |
| `POST /api/votos` | 30 / min | per user |
| `GET /api/eventos/:id/stream` (SSE) | 10 concurrent | per IP |

**Limitation**: in-memory store doesn't work across multiple instances. For horizontal scaling, replace with Redis (`@upstash/ratelimit` is a drop-in pattern).

### Transport & Headers

- CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy applied by `src/proxy.ts` to all responses
- HSTS: **intentionally NOT set in app code** — should be applied at the reverse proxy (nginx/caddy) in production. Setting HSTS from Next causes browser pinning that breaks localhost dev
- Cookies: Auth.js defaults (`HttpOnly`, `Secure` in prod, `SameSite=Lax`)
- CSRF: Auth.js + Next Server Actions built-in origin check

### Secrets

- `AUTH_SECRET` in `.env.local` (git-ignored) — 32 bytes random. For production use a secret manager (AWS SM, Doppler, Vault).
- Docker secrets/env not logged.
- No secrets or PII in structured logs or audit events.

### Audit Trail

Events written to `AuditLog` table via `src/lib/audit.ts`:

- Auth: `login.success`, `login.fail`, `logout`
- Admin actions: usuario.crear, evento.activar/finalizar, pregunta.*, branding.actualizar, tag.*
- Query-friendly: `userId + accion + targetId + metadata(JSON) + createdAt`
- No secrets, passwords, tokens, hashes, or individual vote content are ever recorded

### Dependency Hygiene

- Locked via `package-lock.json`, committed
- `npm audit` runs in CI. Current known findings (moderate, dev-only):
  - `@prisma/dev` (via `prisma` CLI) — Hono middleware slash bypass. Not used in Docker production build. Fixable with Prisma 6.20 (breaking change — deferred).
  - `esbuild/vite/vitest` — dev server request leak. Dev-only. Fix is Vitest 4 (breaking — deferred).

## Threat Model Summary

**In scope**
- Credential stuffing / brute force
- Session hijacking (short-lived JWT mitigates)
- IDOR (3-layer authz)
- Injection (SQL/XSS/command/template — all covered)
- CSRF (Auth.js + Server Actions)
- Clickjacking (X-Frame-Options, CSP frame-ancestors)
- Open redirect (whitelisted `next` param)
- Ballot-box stuffing (rate limit + unique constraint per pregunta/user)

**Out of scope (v1.0)**
- Physical security of the host
- DDoS (requires WAF / CDN in front)
- Malicious insider with DB-level access (votes linked to users by design for auditability — "secrecy B", see design doc)
- Compromise of the OIDC provider (when SSO is added in v1.1)
- Advanced persistent threats with 0-day on Postgres/Node

**Known residual risk**
- In-memory rate limiter resets on pod restart (mitigation: upgrade to Redis for prod)
- bcrypt-based session tokens without refresh-token rotation
- No 2FA yet — planned for v1.1 (TOTP + WebAuthn)
- No WAF at edge — recommended Cloudflare/AWS WAF in production deploy
- No SBOM / SLSA provenance — pending CI work

## Security Roadmap

- [ ] TOTP 2FA for admins (otplib)
- [ ] WebAuthn / Passkeys (simplewebauthn)
- [ ] OIDC provider (Azure AD / Google Workspace / Keycloak via Auth.js)
- [ ] Redis-backed rate limiter for multi-instance
- [ ] CSP nonces (eliminate `unsafe-inline` for scripts)
- [ ] Row-level security in Postgres (additional depth)
- [ ] SBOM (syft) + SLSA provenance in release artifacts
- [ ] External penetration test pre-1.0

## Version Support

Only the latest `main` is supported during pre-1.0. Once 1.0 ships, we'll commit to security fixes for the most recent minor.
