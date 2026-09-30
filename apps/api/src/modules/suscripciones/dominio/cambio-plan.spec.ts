import { planesDePrueba } from "../adaptadores/planes.fixture";
import { cambioTrasCobro, diasRestantes, operacionDeCobro, sumarDias, validarDescenso } from "./cambio-plan";
import { CambioEsDescenso, DescensoNoPermitido, PlanSinCobro, VigenciaNoDisponible } from "./errores";
import type { Plan } from "./plan";
import type { Suscripcion } from "./suscripcion";

const AHORA = new Date("2026-09-24T12:00:00.000Z");
const [SANDBOX, STARTER, PRO, BUSINESS] = planesDePrueba();

function suscripcion(plan: Plan, cambios: Partial<Suscripcion> = {}): Suscripcion {
  const pagada = plan.precio30 > 0;
  return {
    id: "s1",
    usuarioId: "u1",
    plan,
    estado: "activa",
    vigenciaDias: pagada ? 30 : null,
    inicio: new Date("2026-09-03T12:00:00.000Z"),
    vence: pagada ? new Date("2026-10-03T12:00:00.000Z") : null,
    planSiguiente: null,
    ...cambios,
  };
}

describe("política de cambio de plan", () => {
  it("Contratación desde Sandbox: cobra el plan y la vigencia arranca hoy", () => {
    const operacion = operacionDeCobro(suscripcion(SANDBOX), STARTER, 30, AHORA);
    expect(operacion).toMatchObject({ tipo: "contratacion", concepto: "contratacion", monto: 5, inicio: AHORA });
    expect(operacion.vence).toEqual(new Date("2026-10-24T12:00:00.000Z"));
  });

  it("Ascenso", () => {
    const operacion = operacionDeCobro(suscripcion(STARTER), PRO, 30, AHORA);
    expect(operacion).toMatchObject({ tipo: "ascenso", concepto: "cambio-plan", monto: 15, inicio: AHORA, desde: STARTER, destino: PRO });
    expect(operacion.vence).toEqual(sumarDias(AHORA, 30));
  });

  it("Ascenso anual cobra el precio de 365 días", () => {
    expect(operacionDeCobro(suscripcion(STARTER), BUSINESS, 365, AHORA)).toMatchObject({ monto: 400, vigenciaDias: 365 });
  });

  it("Renovar ahora: la vigencia nueva se suma al final de la actual", () => {
    const actual = suscripcion(STARTER);
    const operacion = operacionDeCobro(actual, STARTER, 30, AHORA);
    expect(operacion).toMatchObject({ tipo: "renovacion", concepto: "renovacion", monto: 5, inicio: actual.inicio });
    expect(operacion.vence).toEqual(new Date("2026-11-02T12:00:00.000Z"));
  });

  it("renovar con la vigencia terminada arranca hoy", () => {
    const vencida = suscripcion(STARTER, { estado: "vencida", vence: new Date("2026-09-20T12:00:00.000Z") });
    expect(operacionDeCobro(vencida, STARTER, 30, AHORA)).toMatchObject({ tipo: "renovacion", inicio: AHORA, vence: sumarDias(AHORA, 30) });
  });

  it("con la vigencia terminada, un plan menor se contrata desde hoy", () => {
    const vencida = suscripcion(PRO, { estado: "vencida", vence: new Date("2026-09-20T12:00:00.000Z") });
    expect(operacionDeCobro(vencida, STARTER, 30, AHORA)).toMatchObject({ tipo: "contratacion", monto: 5, inicio: AHORA });
  });

  it("Bajar de plan no se cobra", () => {
    expect(() => operacionDeCobro(suscripcion(BUSINESS), PRO, 30, AHORA)).toThrow(CambioEsDescenso);
  });

  it("Sandbox no se paga", () => {
    expect(() => operacionDeCobro(suscripcion(PRO), SANDBOX, 30, AHORA)).toThrow(PlanSinCobro);
  });

  it("un plan sin precio anual no se vende por 365 días", () => {
    const sinAnual = { ...STARTER, precio365: null };
    expect(() => operacionDeCobro(suscripcion(SANDBOX), sinAnual, 365, AHORA)).toThrow(VigenciaNoDisponible);
  });

  it("tras el cobro queda Activa, con la vigencia nueva y sin descenso pendiente", () => {
    const operacion = operacionDeCobro(suscripcion(STARTER, { planSiguiente: SANDBOX }), PRO, 30, AHORA);
    expect(cambioTrasCobro(operacion, AHORA)).toEqual({
      planId: PRO.id,
      estado: "activa",
      estadoDesde: AHORA,
      vigenciaDias: 30,
      inicio: AHORA,
      vence: sumarDias(AHORA, 30),
      planSiguienteId: null,
    });
  });
});

describe("Descenso", () => {
  it("de Pro a Sandbox se puede programar mientras la vigencia sigue", () => {
    expect(() => validarDescenso(suscripcion(PRO), SANDBOX, AHORA)).not.toThrow();
  });

  it("a un plan igual o mayor no es un descenso", () => {
    expect(() => validarDescenso(suscripcion(STARTER), PRO, AHORA)).toThrow(DescensoNoPermitido);
    expect(() => validarDescenso(suscripcion(STARTER), STARTER, AHORA)).toThrow(DescensoNoPermitido);
  });

  it("sin vigencia vigente no se programa", () => {
    const vencida = suscripcion(PRO, { vence: new Date("2026-09-20T12:00:00.000Z") });
    expect(() => validarDescenso(vencida, SANDBOX, AHORA)).toThrow(DescensoNoPermitido);
  });
});

describe("diasRestantes", () => {
  it("redondea hacia arriba, nunca es negativo y es null sin vencimiento", () => {
    expect(diasRestantes(new Date("2026-10-03T12:00:00.000Z"), AHORA)).toBe(9);
    expect(diasRestantes(new Date("2026-09-24T13:00:00.000Z"), AHORA)).toBe(1);
    expect(diasRestantes(new Date("2026-09-01T00:00:00.000Z"), AHORA)).toBe(0);
    expect(diasRestantes(null, AHORA)).toBeNull();
  });
});
