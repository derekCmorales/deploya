import { RelojFijo } from "../../compartido/reloj";
import { EsperaInstantanea } from "./adaptadores/espera-temporizador";
import { PasarelaSimulada, TARJETA_APRUEBA, TARJETA_RECHAZA } from "./adaptadores/pasarela-simulada";
import { planesDePrueba } from "./adaptadores/planes.fixture";
import { RepositorioPagosMemoria } from "./adaptadores/repositorio-pagos.memoria";
import { RepositorioPlanesMemoria } from "./adaptadores/repositorio-planes.memoria";
import { RepositorioSuscripcionesMemoria } from "./adaptadores/repositorio-suscripciones.memoria";
import { ContratacionService } from "./contratacion.service";
import { CambioEsDescenso, DescensoNoPermitido, PlanNoEncontrado, SuscripcionNoEncontrada } from "./dominio/errores";
import type { Plan } from "./dominio/plan";
import type { Tarjeta, VigenciaDias } from "./dominio/tarjeta";

const AHORA = new Date("2026-09-24T12:00:00.000Z");
const DIA_MS = 24 * 60 * 60 * 1000;

function tarjeta(numero = TARJETA_APRUEBA): Tarjeta {
  return { titular: "Derek Calderón", numero, vencimiento: "12/28", cvc: "123" };
}

async function armar(codigoInicial = "sandbox", planes: Plan[] = planesDePrueba()) {
  const reloj = new RelojFijo(AHORA);
  const suscripciones = new RepositorioSuscripcionesMemoria(planes);
  const pagos = new RepositorioPagosMemoria();
  const pagado = codigoInicial !== "sandbox";
  await suscripciones.crearSiNoExiste({
    usuarioId: "u1",
    planId: `plan-${codigoInicial}`,
    estado: "activa",
    vigenciaDias: pagado ? 30 : null,
    inicio: new Date("2026-09-03T12:00:00.000Z"),
    vence: pagado ? new Date("2026-10-03T12:00:00.000Z") : null,
  });
  const servicio = new ContratacionService(
    new RepositorioPlanesMemoria(planes),
    suscripciones,
    pagos,
    new PasarelaSimulada(new EsperaInstantanea()),
    reloj,
  );
  const contratar = (plan: string, numero?: string, vigenciaDias: VigenciaDias = 30) =>
    servicio.contratar("u1", { plan, vigenciaDias, tarjeta: tarjeta(numero) });
  return { servicio, suscripciones, pagos, reloj, contratar };
}

describe("ContratacionService", () => {
  describe("Contratación con pago simulado", () => {
    it("Contratación aprobada", async () => {
      const { contratar, pagos, servicio } = await armar();
      const resultado = await contratar("starter");

      expect(resultado).toMatchObject({
        resultado: "aprobado",
        pago: { estado: "aprobado", monto: 5, moneda: "USD", concepto: "contratacion", tarjetaUltimos4: "4242", numeroComprobante: "DPY-2026-000001" },
        suscripcion: { plan: { codigo: "starter" }, estado: "activa", inicio: AHORA, diasRestantes: 30, precio: 5 },
      });
      expect(pagos.guardados()).toHaveLength(1);
      await expect(servicio.miSuscripcion("u1")).resolves.toMatchObject({ plan: { codigo: "starter", maxProyectos: 3 } });
    });

    it("Contratación rechazada", async () => {
      const { contratar, pagos, servicio } = await armar();
      const resultado = await contratar("starter", TARJETA_RECHAZA);

      expect(resultado).toEqual({
        resultado: "rechazado",
        codigo: "card_declined",
        motivo: "Fondos insuficientes (simulado).",
        pago: expect.objectContaining({ estado: "rechazado", tarjetaUltimos4: "0002", numeroComprobante: null }),
      });
      expect(pagos.guardados()[0]).toMatchObject({ estado: "rechazado", motivoRechazo: "Fondos insuficientes (simulado)." });
      await expect(servicio.miSuscripcion("u1")).resolves.toMatchObject({ plan: { codigo: "sandbox" } });
    });

    it("Comprobante consecutivo: solo los aprobados llevan número", async () => {
      const { contratar } = await armar();
      await contratar("starter");
      await contratar("pro", TARJETA_RECHAZA);
      const segundo = await contratar("pro");
      expect(segundo.pago.numeroComprobante).toBe("DPY-2026-000002");
    });

    it("un plan inexistente o inactivo no se contrata", async () => {
      const planes = planesDePrueba().map((p) => (p.codigo === "business" ? { ...p, activo: false } : p));
      const { contratar } = await armar("sandbox", planes);
      await expect(contratar("oro")).rejects.toBeInstanceOf(PlanNoEncontrado);
      await expect(contratar("business")).rejects.toBeInstanceOf(PlanNoEncontrado);
    });

    it("sin suscripción lanza SuscripcionNoEncontrada", async () => {
      const { servicio } = await armar();
      await expect(servicio.miSuscripcion("nadie")).rejects.toBeInstanceOf(SuscripcionNoEncontrada);
    });
  });

  describe("Renovación y cambio de plan", () => {
    it("Ascenso", async () => {
      const { contratar } = await armar("starter");
      const resultado = await contratar("pro");
      expect(resultado).toMatchObject({
        resultado: "aprobado",
        pago: { monto: 15, concepto: "cambio-plan" },
        suscripcion: { plan: { codigo: "pro", maxProyectos: 10 }, inicio: AHORA, vence: new Date(AHORA.getTime() + 30 * DIA_MS) },
      });
    });

    it("Renovar ahora", async () => {
      const { contratar } = await armar("starter");
      const resultado = await contratar("starter");
      expect(resultado).toMatchObject({
        resultado: "aprobado",
        pago: { monto: 5, concepto: "renovacion" },
        suscripcion: { plan: { codigo: "starter" }, vence: new Date("2026-11-02T12:00:00.000Z"), diasRestantes: 39 },
      });
    });

    it("Bajar de plan no se cobra", async () => {
      const { contratar, pagos } = await armar("pro");
      await expect(contratar("starter")).rejects.toBeInstanceOf(CambioEsDescenso);
      expect(pagos.guardados()).toHaveLength(0);
    });

    it("Descenso", async () => {
      const { servicio, contratar } = await armar("pro");
      const vista = await servicio.programarDescenso("u1", "sandbox");
      expect(vista).toMatchObject({ plan: { codigo: "pro" }, vence: new Date("2026-10-03T12:00:00.000Z"), planSiguiente: { codigo: "sandbox" } });

      const renovada = await contratar("pro");
      expect(renovada).toMatchObject({ suscripcion: { planSiguiente: null } });
    });

    it("Sandbox no puede programar un descenso", async () => {
      const { servicio } = await armar();
      await expect(servicio.programarDescenso("u1", "sandbox")).rejects.toBeInstanceOf(DescensoNoPermitido);
    });
  });

  describe("Mi suscripción", () => {
    it("Ver mi suscripción", async () => {
      const { servicio } = await armar("starter");
      await expect(servicio.miSuscripcion("u1")).resolves.toEqual({
        plan: expect.objectContaining({ codigo: "starter", nombre: "Starter", maxProyectos: 3, construccionesMes: 150 }),
        estado: "activa",
        vigenciaDias: 30,
        inicio: new Date("2026-09-03T12:00:00.000Z"),
        vence: new Date("2026-10-03T12:00:00.000Z"),
        diasRestantes: 9,
        precio: 5,
        planSiguiente: null,
      });
    });

    it("Sandbox no vence ni cuesta", async () => {
      const { servicio } = await armar();
      await expect(servicio.miSuscripcion("u1")).resolves.toMatchObject({ vence: null, diasRestantes: null, precio: 0 });
    });

    it("Cotizar antes de pagar", async () => {
      const { servicio, pagos } = await armar();
      await expect(servicio.cotizar("u1", { plan: "starter", vigenciaDias: 30 })).resolves.toEqual({
        tipo: "contratacion",
        desde: { codigo: "sandbox", nombre: "Sandbox" },
        plan: { codigo: "starter", nombre: "Starter" },
        vigenciaDias: 30,
        monto: 5,
        moneda: "USD",
        inicio: AHORA,
        vence: new Date("2026-10-24T12:00:00.000Z"),
      });
      expect(pagos.guardados()).toHaveLength(0);
    });
  });
});
