import { test, expect } from "@playwright/test";

// Smoke E2E: admin login → crea evento → crea pregunta SI_NO → activa → invita votante
// → abre pregunta → votante vota → admin ve contador → cierra → revela.
// Requiere seed con admin@example.local / admin1234 y voto1@example.local / voto1234.

test("flujo vivo admin + votante + proyector", async ({ browser }) => {
  const adminCtx = await browser.newContext();
  const votanteCtx = await browser.newContext();

  const admin = await adminCtx.newPage();
  const votante = await votanteCtx.newPage();

  await admin.goto("/login");
  await admin.fill('input[type="email"]', "admin@example.local");
  await admin.fill('input[type="password"]', "admin1234");
  await admin.click('button[type="submit"]');
  await admin.waitForURL("**/admin/eventos");

  await admin.goto("/admin/eventos/nuevo");
  await admin.fill('input[name="nombre"]', "E2E Test");
  await admin.selectOption('select[name="modo"]', "VIVO");
  await admin.click('button:has-text("Crear")');
  await admin.waitForURL(/\/admin\/eventos\/[a-z0-9]+$/);
  const eventoId = admin.url().split("/").pop()!;

  await admin.fill('input[name="enunciado"]', "¿Aprobamos el plan?");
  await admin.selectOption('select[name="tipo"]', "SI_NO");
  await admin.click('button:has-text("Agregar pregunta")');

  // TODO: invitar votante vía UI cuando haya editor; por ahora falta seed de invitación.
  // Este test asume que existe invitación pre-creada por otro medio (seed o API).

  await admin.click('button:has-text("Activar")');
  await admin.waitForURL(/\/admin\/eventos\/[a-z0-9]+$/);

  await votante.goto("/login");
  await votante.fill('input[type="email"]', "voto1@example.local");
  await votante.fill('input[type="password"]', "voto1234");
  await votante.click('button[type="submit"]');

  await admin.goto(`/admin/eventos/${eventoId}/control`);
  await admin.click('button:has-text("Abrir")');

  await votante.goto(`/votante/votar/${eventoId}`);
  await expect(votante.getByText("¿Aprobamos el plan?")).toBeVisible({ timeout: 5000 });
  await votante.click('button:has-text("Sí")');
  await expect(votante.getByText("Tu voto fue registrado")).toBeVisible();

  await expect(admin.getByText(/1 votos/)).toBeVisible({ timeout: 5000 });

  await admin.click('button:has-text("Cerrar")');
  await admin.click('button:has-text("Revelar")');
});
