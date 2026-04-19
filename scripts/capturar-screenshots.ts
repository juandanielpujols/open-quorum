/**
 * Captura screenshots para el README.
 * Pre-requisitos:
 *   - Docker stack corriendo en localhost:3002
 *   - Seed aplicado (admin + voto1 + reviewer + evento demo)
 *
 * Uso: npx tsx scripts/capturar-screenshots.ts
 */
import { chromium, type Page } from "@playwright/test";
import { spawnSync } from "node:child_process";

const BASE = "http://localhost:3002";
const OUT = "docs/images";

// Ejecuta SQL contra el container para dejar el evento en un estado específico.
function sql(q: string) {
  const r = spawnSync(
    "docker",
    ["exec", "-i", "votaciones-postgres", "psql", "-U", "votaciones", "-d", "votaciones", "-c", q],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(`SQL fail: ${r.stderr}`);
}

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([page.waitForURL(/\/admin|\/votante|\/reviewer/), page.click('button[type="submit"]')]);
}

async function capturar(page: Page, nombre: string, full = false) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${nombre}.png`, fullPage: full });
  console.log(`  ✓ ${nombre}.png`);
}

async function main() {
  console.log("Preparando estado inicial…");
  sql(`UPDATE "Evento" SET estado='BORRADOR' WHERE nombre='Demo — Asamblea inicial';`);
  sql(`UPDATE "Pregunta" SET estado='BORRADOR', "abiertaAt"=NULL, "cerradaAt"=NULL WHERE "eventoId" IN (SELECT id FROM "Evento" WHERE nombre='Demo — Asamblea inicial');`);
  sql(`DELETE FROM "Voto" WHERE "preguntaId" IN (SELECT p.id FROM "Pregunta" p JOIN "Evento" e ON e.id=p."eventoId" WHERE e.nombre='Demo — Asamblea inicial');`);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  console.log("Capturando login…");
  await page.goto(`${BASE}/login`);
  await capturar(page, "01-login");

  console.log("Login como admin…");
  await login(page, "admin@example.local", "admin1234");

  console.log("Eventos list…");
  await page.goto(`${BASE}/admin/eventos`);
  await capturar(page, "02-eventos-list");

  console.log("Evento detalle (BORRADOR)…");
  await page.click('a:has-text("Demo — Asamblea inicial")');
  await page.waitForURL(/\/admin\/eventos\/[a-z0-9]+$/);
  await capturar(page, "03-evento-detalle-borrador", true);

  const eventoUrl = page.url();
  const eventoId = eventoUrl.split("/").pop()!;

  console.log("Nueva pregunta dialog…");
  await page.click('button:has-text("Nueva pregunta")');
  await page.waitForSelector('[role="dialog"]');
  await page.waitForTimeout(400);
  await capturar(page, "04-nueva-pregunta-dialog");
  await page.keyboard.press("Escape");

  console.log("Branding config…");
  await page.goto(`${BASE}/admin/configuracion/branding`);
  await capturar(page, "05-branding", true);

  console.log("Tags manager…");
  await page.goto(`${BASE}/admin/tags`);
  await capturar(page, "06-tags");

  console.log("Preparando control + proyector (evento ACTIVO con pregunta abierta)…");
  sql(`UPDATE "Evento" SET estado='ACTIVO' WHERE id='${eventoId}';`);
  const pregSiNoRow = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      "votaciones-postgres",
      "psql",
      "-U",
      "votaciones",
      "-d",
      "votaciones",
      "-tA",
      "-c",
      `SELECT id FROM "Pregunta" WHERE "eventoId"='${eventoId}' AND tipo='SI_NO';`,
    ],
    { encoding: "utf8" },
  );
  const pregId = pregSiNoRow.stdout.trim();
  sql(`UPDATE "Pregunta" SET estado='ABIERTA', "abiertaAt"=NOW() WHERE id='${pregId}';`);

  // Semillar algunos votos para que el conteo luzca
  const opSi = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      "votaciones-postgres",
      "psql",
      "-U",
      "votaciones",
      "-d",
      "votaciones",
      "-tA",
      "-c",
      `SELECT id FROM "Opcion" WHERE "preguntaId"='${pregId}' AND texto='Sí';`,
    ],
    { encoding: "utf8" },
  ).stdout.trim();
  const voto1 = spawnSync(
    "docker",
    ["exec", "-i", "votaciones-postgres", "psql", "-U", "votaciones", "-d", "votaciones", "-tA", "-c", `SELECT id FROM "User" WHERE email='voto1@example.local';`],
    { encoding: "utf8" },
  ).stdout.trim();
  sql(
    `INSERT INTO "Voto" (id, "preguntaId", "userId", respuesta, "emitidoVia", "representandoA", "createdAt", "updatedAt") VALUES ('demo-voto-1', '${pregId}', '${voto1}', '{"opcionIds": ["${opSi}"]}'::jsonb, 'DIRECTO', NULL, NOW(), NOW()) ON CONFLICT DO NOTHING;`,
  );

  console.log("Control panel…");
  await page.goto(`${BASE}/admin/eventos/${eventoId}/control`);
  await capturar(page, "07-control-panel");

  console.log("Proyector (ventana independiente)…");
  const projCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const projPage = await projCtx.newPage();
  // Necesita auth; loguear y navegar
  await projPage.goto(`${BASE}/login`);
  await projPage.fill('input[type="email"]', "admin@example.local");
  await projPage.fill('input[type="password"]', "admin1234");
  await Promise.all([projPage.waitForURL(/\/admin/), projPage.click('button[type="submit"]')]);
  await projPage.goto(`${BASE}/proyectar/${eventoId}`);
  await projPage.waitForTimeout(1000);
  await capturar(projPage, "08-proyector");
  await projCtx.close();

  console.log("Vista votante…");
  const votCtx = await browser.newContext({ viewport: { width: 420, height: 820 }, deviceScaleFactor: 2 });
  const votPage = await votCtx.newPage();
  await votPage.goto(`${BASE}/login`);
  await votPage.fill('input[type="email"]', "voto1@example.local");
  await votPage.fill('input[type="password"]', "voto1234");
  await Promise.all([votPage.waitForURL(/\/votante/), votPage.click('button[type="submit"]')]);
  await votPage.goto(`${BASE}/votante/votar/${eventoId}`);
  await votPage.waitForTimeout(500);
  await capturar(votPage, "09-votante");
  await votCtx.close();

  console.log("Finalizando + histórico…");
  sql(`UPDATE "Pregunta" SET estado='CERRADA', "cerradaAt"=NOW() WHERE id='${pregId}';`);
  sql(`UPDATE "Evento" SET estado='FINALIZADO' WHERE id='${eventoId}';`);
  await page.goto(`${BASE}/admin/eventos/${eventoId}`);
  await page.waitForTimeout(600);
  await capturar(page, "10-evento-finalizado-historico", true);

  await browser.close();

  // Restaurar estado BORRADOR para uso normal
  sql(`UPDATE "Evento" SET estado='BORRADOR' WHERE id='${eventoId}';`);
  sql(`UPDATE "Pregunta" SET estado='BORRADOR', "abiertaAt"=NULL, "cerradaAt"=NULL WHERE "eventoId"='${eventoId}';`);
  sql(`DELETE FROM "Voto" WHERE "preguntaId" IN (SELECT id FROM "Pregunta" WHERE "eventoId"='${eventoId}');`);
  console.log("\n✓ Screenshots capturados en docs/images/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
