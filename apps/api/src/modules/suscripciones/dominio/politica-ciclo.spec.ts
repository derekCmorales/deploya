import { verificarDespliegue } from "../../orquestacion/dominio/politica-despliegue";
import { SuscripcionNoPermite } from "../../orquestacion/dominio/errores";
import { planesDePrueba } from "../adaptadores/planes.fixture";
import { DIAS_GRACIA, DIAS_HASTA_CANCELAR, DIAS_POR_VENCER, PoliticaCiclo } from "./politica-ciclo";
import type { Suscripcion } from "./suscripcion";

const [SANDBOX, STARTER, PRO] = planesDePrueba();

function starter(cambios: Partial<Suscripcion> = {}): Suscripcion {
  return {
    id: "s1",
    usuarioId: "u1",
    plan: STARTER,
    estado: "activa",
    estadoDesde: new Date("2026-10-01T00:05:00.000Z"),
    vigenciaDias: 30,
    inicio: new Date("2026-10-01T00:05:00.000Z"),
    vence: new Date("2026-10-31T00:05:00.000Z"),
    planSiguiente: null,
    ...cambios,
  };
}

function permiteDesplegar(estado: Suscripcion["estado"]): boolean {
  try {
    verificarDespliegue({ estado, construccionesUsadas: 0, construccionesMes: STARTER.construccionesMes });
    return true;
  } catch (error) {
    if (error instanceof SuscripcionNoPermite) return false;
    throw error;
  }
}

describe("M2-05 · PoliticaCiclo", () => {
  it("las constantes del §4.4", () => {
    expect([DIAS_POR_VENCER, DIAS_GRACIA, DIAS_HASTA_CANCELAR]).toEqual([7, 5, 30]);
  });

  it("Por vencer", () => {
    const suscripcion = starter();

    const salto = PoliticaCiclo.siguiente(suscripcion, new Date("2026-10-24T00:05:00.000Z"));

    expect(salto).toEqual({ estado: "por-vencer", aplicarDescenso: false });
    expect(permiteDesplegar("por-vencer")).toBe(true);
  });

  it("con ocho días restantes sigue Activa", () => {
    expect(PoliticaCiclo.siguiente(starter(), new Date("2026-10-23T00:05:00.000Z"))).toBeNull();
  });

  it("Vencimiento sin renovar", () => {
    const suscripcion = starter({ estado: "por-vencer", estadoDesde: new Date("2026-10-24T00:05:00.000Z") });

    const salto = PoliticaCiclo.siguiente(suscripcion, new Date("2026-10-31T00:05:00.000Z"));

    expect(salto).toEqual({ estado: "vencida", aplicarDescenso: false });
    expect(permiteDesplegar("vencida")).toBe(false);
  });

  it("una Activa que ya venció salta directo a Vencida (un solo salto)", () => {
    const salto = PoliticaCiclo.siguiente(starter(), new Date("2026-11-03T00:05:00.000Z"));

    expect(salto).toEqual({ estado: "vencida", aplicarDescenso: false });
  });

  it("Fin de la gracia", () => {
    const suscripcion = starter({ estado: "vencida", estadoDesde: new Date("2026-10-31T00:05:00.000Z") });

    const salto = PoliticaCiclo.siguiente(suscripcion, new Date("2026-11-05T00:05:00.000Z"));

    expect(salto).toEqual({ estado: "suspendida", aplicarDescenso: false });
  });

  it("al cuarto día de gracia sigue Vencida", () => {
    const suscripcion = starter({ estado: "vencida", estadoDesde: new Date("2026-10-31T00:05:00.000Z") });

    expect(PoliticaCiclo.siguiente(suscripcion, new Date("2026-11-04T00:05:00.000Z"))).toBeNull();
  });

  it("Treinta días suspendida", () => {
    const suscripcion = starter({ estado: "suspendida", estadoDesde: new Date("2026-11-05T00:05:00.000Z") });

    const salto = PoliticaCiclo.siguiente(suscripcion, new Date("2026-12-05T00:05:00.000Z"));

    expect(salto).toEqual({ estado: "cancelada", aplicarDescenso: false });
  });

  it("Cancelada es el final del ciclo", () => {
    const suscripcion = starter({ estado: "cancelada", estadoDesde: new Date("2026-12-05T00:05:00.000Z") });

    expect(PoliticaCiclo.siguiente(suscripcion, new Date("2027-12-05T00:05:00.000Z"))).toBeNull();
  });

  it("Sandbox no vence", () => {
    const sandbox = starter({
      plan: SANDBOX,
      vigenciaDias: null,
      inicio: new Date("2025-10-17T00:00:00.000Z"),
      estadoDesde: new Date("2025-10-17T00:00:00.000Z"),
      vence: null,
    });

    expect(PoliticaCiclo.siguiente(sandbox, new Date("2026-10-17T00:05:00.000Z"))).toBeNull();
  });

  it("Descenso programado al vencer", () => {
    const ahora = new Date("2026-10-31T00:05:00.000Z");
    const pro = starter({ plan: PRO, estado: "por-vencer", planSiguiente: STARTER });

    const salto = PoliticaCiclo.siguiente(pro, ahora);
    const cambio = PoliticaCiclo.cambioPorSalto(pro, salto!, ahora);

    expect(salto).toEqual({ estado: "vencida", aplicarDescenso: true });
    expect(cambio).toMatchObject({ planId: STARTER.id, planSiguienteId: null, estadoDesde: ahora });
  });

  it("un descenso a Sandbox la deja Activa y sin vigencia", () => {
    const ahora = new Date("2026-10-31T00:05:00.000Z");
    const pro = starter({ plan: PRO, planSiguiente: SANDBOX });

    const salto = PoliticaCiclo.siguiente(pro, ahora);
    const cambio = PoliticaCiclo.cambioPorSalto(pro, salto!, ahora);

    expect(salto).toEqual({ estado: "activa", aplicarDescenso: true });
    expect(cambio).toEqual({
      planId: SANDBOX.id,
      estado: "activa",
      estadoDesde: ahora,
      vigenciaDias: null,
      inicio: ahora,
      vence: null,
      planSiguienteId: null,
    });
  });

  it("un salto sin descenso conserva plan, vigencia y el descenso pendiente", () => {
    const ahora = new Date("2026-10-24T00:05:00.000Z");
    const pro = starter({ plan: PRO, planSiguiente: STARTER });

    const cambio = PoliticaCiclo.cambioPorSalto(pro, { estado: "por-vencer", aplicarDescenso: false }, ahora);

    expect(cambio).toEqual({
      planId: PRO.id,
      estado: "por-vencer",
      estadoDesde: ahora,
      vigenciaDias: 30,
      inicio: pro.inicio,
      vence: pro.vence,
      planSiguienteId: STARTER.id,
    });
  });

  it("Dos corridas el mismo día", () => {
    const primera = new Date("2026-10-31T00:05:00.000Z");
    const segunda = new Date("2026-10-31T18:00:00.000Z");
    const original = starter({ estado: "por-vencer" });
    const salto = PoliticaCiclo.siguiente(original, primera)!;
    const trasPrimera = { ...original, ...PoliticaCiclo.cambioPorSalto(original, salto, primera) };

    const otraVez = PoliticaCiclo.siguiente(trasPrimera, segunda);

    expect(trasPrimera.estado).toBe("vencida");
    expect(otraVez).toBeNull();
  });
});
