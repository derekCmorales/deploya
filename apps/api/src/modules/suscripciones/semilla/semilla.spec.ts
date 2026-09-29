import { ClaveAdminFaltante, planesSemilla, usuariosSemilla } from "./semilla";

describe("planesSemilla", () => {
  it("trae los 4 planes v4.1 con proyectos, CPU, memoria, construcciones y precio de 30 y 365 días", () => {
    const tabla = planesSemilla().map((p) => [
      p.codigo,
      p.maxProyectos,
      p.cpus,
      p.memoriaMb,
      p.construccionesMes,
      p.precio30,
      p.precio365,
      p.orden,
    ]);
    expect(tabla).toEqual([
      ["sandbox", 1, 0.25, 256, 30, 0, null, 1],
      ["starter", 3, 0.5, 512, 150, 5, 50, 2],
      ["pro", 10, 1, 1024, 500, 15, 150, 3],
      ["business", 25, 2, 2048, 2000, 40, 400, 4],
    ]);
  });

  it("el precio de 365 días de los planes de pago es 10 × el de 30", () => {
    for (const plan of planesSemilla().filter((p) => p.precio30 > 0)) {
      expect(plan.precio365).toBe(plan.precio30 * 10);
    }
  });
});

describe("usuariosSemilla", () => {
  it("sin ADMIN_CLAVE falla con un mensaje claro", () => {
    expect(() => usuariosSemilla({})).toThrow(ClaveAdminFaltante);
    expect(() => usuariosSemilla({})).toThrow(/ADMIN_CLAVE/);
  });

  it("administrador con ADMIN_CORREO normalizado y cliente de demostración", () => {
    const usuarios = usuariosSemilla({ ADMIN_CORREO: " Jefa@Deploya.App ", ADMIN_CLAVE: "Clave-Admin-1" });
    expect(usuarios).toEqual([
      { correo: "jefa@deploya.app", nombre: "Administrador", clave: "Clave-Admin-1", rol: "administrador" },
      { correo: "cliente@deploya.app", nombre: "Cliente de demostración", clave: "Clave-Admin-1", rol: "cliente" },
    ]);
  });

  it("usa admin@deploya.app por defecto y CLIENTE_CLAVE si está definida", () => {
    const [admin, cliente] = usuariosSemilla({ ADMIN_CLAVE: "a", CLIENTE_CLAVE: "c" });
    expect(admin.correo).toBe("admin@deploya.app");
    expect(cliente.clave).toBe("c");
  });
});
