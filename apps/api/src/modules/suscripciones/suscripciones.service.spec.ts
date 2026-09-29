import { RelojFijo } from "../../compartido/reloj";
import { planesDePrueba } from "./adaptadores/planes.fixture";
import { RepositorioPlanesMemoria } from "./adaptadores/repositorio-planes.memoria";
import { RepositorioSuscripcionesMemoria } from "./adaptadores/repositorio-suscripciones.memoria";
import { PlanNoEncontrado, SuscripcionNoEncontrada } from "./dominio/errores";
import type { Plan } from "./dominio/plan";
import { SuscripcionesService } from "./suscripciones.service";

const AHORA = new Date("2026-09-30T12:00:00.000Z");

function armar(planes: Plan[] = planesDePrueba()) {
  const suscripciones = new RepositorioSuscripcionesMemoria(planes);
  const servicio = new SuscripcionesService(new RepositorioPlanesMemoria(planes), suscripciones, new RelojFijo(AHORA));
  return { servicio, suscripciones };
}

describe("SuscripcionesService", () => {
  describe("Sandbox inicial", () => {
    it("Cuenta nueva", async () => {
      const { servicio, suscripciones } = armar();
      await servicio.asignarSandbox("u1");
      expect(suscripciones.guardadas()).toEqual([
        expect.objectContaining({ usuarioId: "u1", estado: "activa", vence: null, vigenciaDias: null, inicio: AHORA }),
      ]);
      expect(suscripciones.guardadas()[0].plan.codigo).toBe("sandbox");
    });

    it("asignarSandbox es idempotente: una segunda llamada no crea otra", async () => {
      const { servicio, suscripciones } = armar();
      await servicio.asignarSandbox("u1");
      await servicio.asignarSandbox("u1");
      expect(suscripciones.guardadas()).toHaveLength(1);
    });

    it("sin el plan sandbox en la base lanza PlanNoEncontrado", async () => {
      const { servicio } = armar(planesDePrueba().filter((p) => p.codigo !== "sandbox"));
      await expect(servicio.asignarSandbox("u1")).rejects.toBeInstanceOf(PlanNoEncontrado);
    });
  });

  describe("cuotaDe", () => {
    it.each([
      ["sandbox", 1, 0.25, 256, 30],
      ["starter", 3, 0.5, 512, 150],
      ["pro", 10, 1, 1024, 500],
      ["business", 25, 2, 2048, 2000],
    ])("devuelve los límites de %s", async (codigo, maxProyectos, cpus, memoriaMb, construccionesMes) => {
      const planes = planesDePrueba();
      const suscripciones = new RepositorioSuscripcionesMemoria(planes);
      await suscripciones.crearSiNoExiste({
        usuarioId: "u1",
        planId: `plan-${codigo}`,
        estado: "activa",
        vigenciaDias: 30,
        inicio: AHORA,
        vence: null,
      });
      const servicio = new SuscripcionesService(new RepositorioPlanesMemoria(planes), suscripciones, new RelojFijo(AHORA));
      await expect(servicio.cuotaDe("u1")).resolves.toMatchObject({
        plan: { codigo },
        estado: "activa",
        maxProyectos,
        cpus,
        memoriaMb,
        construccionesMes,
      });
    });

    it("usuario sin suscripción lanza SuscripcionNoEncontrada", async () => {
      const { servicio } = armar();
      await expect(servicio.cuotaDe("nadie")).rejects.toBeInstanceOf(SuscripcionNoEncontrada);
    });

    it("una cuenta recién registrada queda en los límites de Sandbox", async () => {
      const { servicio } = armar();
      await servicio.asignarSandbox("u1");
      await expect(servicio.cuotaDe("u1")).resolves.toEqual({
        plan: { codigo: "sandbox", nombre: "Sandbox" },
        estado: "activa",
        vence: null,
        maxProyectos: 1,
        cpus: 0.25,
        memoriaMb: 256,
        construccionesMes: 30,
      });
    });
  });

  describe("Catálogo", () => {
    it("Listar planes", async () => {
      const planes = planesDePrueba();
      planes[3] = { ...planes[3], activo: false };
      const { servicio } = armar(planes.reverse());
      const catalogo = await servicio.catalogo();
      expect(catalogo.map((p) => p.codigo)).toEqual(["sandbox", "starter", "pro"]);
      expect(catalogo[1]).toMatchObject({ precio30: 5, precio365: 50, maxProyectos: 3, cpus: 0.5, memoriaMb: 512 });
    });
  });
});
