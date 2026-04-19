# Adding auth providers

Open Quorum uses Auth.js v5. Adding a new provider is typically 5–10 lines in
`src/lib/auth.ts` plus environment variables in `.env.local`.

## OIDC (generic)

Works with Azure AD / Entra, Keycloak, Authentik, Okta, Auth0, any OIDC-compliant IdP.

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const providers = [
  Credentials({ /* existing */ }),
];

if (process.env.OIDC_ISSUER) {
  const { default: OIDC } = await import("next-auth/providers/generic-oauth");
  providers.push(
    OIDC({
      id: "oidc",
      name: "SSO",
      clientId: process.env.OIDC_CLIENT_ID!,
      clientSecret: process.env.OIDC_CLIENT_SECRET!,
      issuer: process.env.OIDC_ISSUER!,
      authorization: { params: { scope: "openid email profile" } },
      profile(p) {
        return {
          id: p.sub,
          email: p.email,
          nombre: p.name ?? p.email,
          rol: "VOTANTE", // default rol; admin lo ajusta post-primer-login
        };
      },
    }),
  );
}
```

### Environment variables

```
OIDC_ISSUER=https://login.microsoftonline.com/<tenant>/v2.0
OIDC_CLIENT_ID=...
OIDC_CLIENT_SECRET=...
```

### Provider-specific examples

**Azure AD / Entra:**
```
OIDC_ISSUER=https://login.microsoftonline.com/<tenant-id>/v2.0
```
Register an app in Azure Portal → App registrations → Redirect URI:
`https://<your-domain>/api/auth/callback/oidc`. Enable ID tokens in
authentication settings.

**Google Workspace:**
Use the dedicated provider instead:
```typescript
import Google from "next-auth/providers/google";
providers.push(Google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: { params: { hd: "yourcompany.com" } }, // restrict to your domain
}));
```

**Keycloak (self-hosted):**
```
OIDC_ISSUER=https://keycloak.example.com/realms/open-quorum
```

## Provisioning

Auth.js creates users on first successful OIDC login. The `profile()` callback
above assigns rol=`VOTANTE` by default. Admin promotes users from `/admin/usuarios`.

If you need auto-role-assignment based on IdP groups/claims, extend the
profile callback:

```typescript
profile(p) {
  const groups = (p.groups ?? []) as string[];
  let rol: "ADMIN" | "REVIEWER" | "VOTANTE" = "VOTANTE";
  if (groups.includes("open-quorum-admins")) rol = "ADMIN";
  else if (groups.includes("open-quorum-reviewers")) rol = "REVIEWER";
  return { id: p.sub, email: p.email, nombre: p.name, rol };
}
```

## Passkeys / WebAuthn (pending)

Use `@simplewebauthn/server` and Auth.js WebAuthn provider. Scaffold lives in
`src/lib/totp.ts` — passkeys would follow the same pattern (start/verify flow).
Planned for v1.1.
