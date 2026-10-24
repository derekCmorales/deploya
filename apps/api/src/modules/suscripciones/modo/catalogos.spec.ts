import { planesDePrueba } from "../adaptadores/planes.fixture";
import { RepositorioPlanesMemoria } from "../adaptadores/repositorio-planes.memoria";
import { SinCobroEnAutoalojado } from "../dominio/errores";
import type { Plan } from "../dominio/plan";
import { ESTADO_HTTP_POR_CODIGO } from "../errores-suscripciones.filter";
import { planesSemilla } from "../semilla/semilla";
import { CatalogoAutoalojado, CatalogoNube } from "./catalogos";
import { CobroDisponibleGuard } from "./cobro-disponible.guard";

const PLAN_AUTOALOJADO: Plan = { ...planesSemilla({ MODO_INSTALACION: "autoalojado" })[0], id: "plan-autoalojado", activo: true };

describe("SP-06 · CatalogoPlanes", () => {
  it("Nube por defecto: los cuatro planes en venta, Sandbox inicial y cobro disponible", async () => {
    const catalogo = new CatalogoNube(new RepositorioPlanesMemoria(planesDePrueba()));

    const planes = await catalogo.enVenta();

    expect(planes.map((p) => p.codigo)).toEqual(["sandbox", "starter", "pro", "business"]);
    await expect(catalogo.planInicial()).resolves.toMatchObject({ codigo: "sandbox" });
    expect(new CobroDisponibleGuard(catalogo).canActivate()).toBe(true);
  });

  it("Sin cobro en autoalojado", async () => {
    const catalogo = new CatalogoAutoalojado(new RepositorioPlanesMemoria([PLAN_AUTOALOJADO]));

    await expect(catalogo.enVenta()).rejects.toBeInstanceOf(SinCobroEnAutoalojado);
    expect(() => new CobroDisponibleGuard(catalogo).canActivate()).toThrow(SinCobroEnAutoalojado);
    expect(ESTADO_HTTP_POR_CODIGO[new SinCobroEnAutoalojado().codigo]).toBe(404);
  });

  it("en autoalojado toda cuenta nueva arranca en el plan «Autoalojado», sin precio ni vencimiento", async () => {
    const catalogo = new CatalogoAutoalojado(new RepositorioPlanesMemoria([PLAN_AUTOALOJADO]));

    await expect(catalogo.planInicial()).resolves.toMatchObject({ codigo: "autoalojado", precio30: 0, precio365: null });
  });
});
