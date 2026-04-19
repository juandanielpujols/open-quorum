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
