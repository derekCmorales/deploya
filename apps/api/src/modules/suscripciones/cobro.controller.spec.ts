import type { ArgumentsHost } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Reloj, RelojFijo } from "../../compartido/reloj";
import { SesionGuard } from "../identidad/sesion.guard";
import { EsperaInstantanea } from "./adaptadores/espera-temporizador";
import { PasarelaSimulada } from "./adaptadores/pasarela-simulada";
import { planesDePrueba } from "./adaptadores/planes.fixture";
import { RepositorioPagosMemoria } from "./adaptadores/repositorio-pagos.memoria";
import { RepositorioPlanesMemoria } from "./adaptadores/repositorio-planes.memoria";
import { RepositorioSuscripcionesMemoria } from "./adaptadores/repositorio-suscripciones.memoria";
import { CobroController } from "./cobro.controller";
import { ContratacionService } from "./contratacion.service";
import {
  CambioEsDescenso,
  DatosPagoInvalidos,
  DescensoNoPermitido,
  ErrorSuscripciones,
  PlanNoEncontrado,
  PlanSinCobro,
  SuscripcionNoEncontrada,
  VigenciaNoDisponible,
} from "./dominio/errores";
import { ErroresSuscripcionesFilter } from "./errores-suscripciones.filter";
import { PasarelaPago } from "./puertos/pasarela-pago.puerto";
import { RepositorioPagos } from "./puertos/repositorio-pagos.puerto";
import { RepositorioPlanes } from "./puertos/repositorio-planes.puerto";
import { RepositorioSuscripciones } from "./puertos/repositorio-suscripciones.puerto";

const TARJETA = { titular: "Derek", numero: "4242 4242 4242 4242", vencimiento: "12 / 28", cvc: "123" };

/** Nest real con el controlador y el servicio; el guard de M1 se sustituye (lo prueba M1). */
async function controlador(): Promise<CobroController> {
  const planes = planesDePrueba();
  const suscripciones = new RepositorioSuscripcionesMemoria(planes);
  await suscripciones.crearSiNoExiste({ usuarioId: "u1", planId: "plan-sandbox", estado: "activa", vigenciaDias: null, inicio: new Date(), vence: null });
  const moduleRef = await Test.createTestingModule({
    controllers: [CobroController],
    providers: [
      ContratacionService,
      { provide: RepositorioPlanes, useValue: new RepositorioPlanesMemoria(planes) },
      { provide: RepositorioSuscripciones, useValue: suscripciones },
      { provide: RepositorioPagos, useValue: new RepositorioPagosMemoria() },
      { provide: PasarelaPago, useValue: new PasarelaSimulada(new EsperaInstantanea()) },
      { provide: Reloj, useValue: new RelojFijo() },
    ],
  })
    .overrideGuard(SesionGuard)
    .useValue({ canActivate: () => true })
    .compile();
  return moduleRef.get(CobroController);
}

function respuestaFalsa() {
  const respuesta = {
    estado: 0,
    cuerpo: {} as unknown,
    status(e: number) {
      this.estado = e;
      return this;
    },
    json(c: unknown) {
      this.cuerpo = c;
    },
  };
  const host = { switchToHttp: () => ({ getResponse: () => respuesta }) } as unknown as ArgumentsHost;
  return { respuesta, host };
}

describe("CobroController", () => {
  it("Sin sesión: todas las rutas del cliente pasan por SesionGuard", () => {
    expect(Reflect.getMetadata("__guards__", CobroController)).toEqual([SesionGuard]);
  });

  it("GET /suscripciones/mia devuelve la del usuario de la sesión", async () => {
    await expect((await controlador()).mia("u1")).resolves.toMatchObject({ plan: { codigo: "sandbox" }, estado: "activa" });
  });

  it("GET /suscripciones/cotizacion valida la consulta y cotiza", async () => {
    const cobro = await controlador();
    await expect(cobro.cotizacion("u1", { plan: "pro", vigenciaDias: "365" })).resolves.toMatchObject({ tipo: "contratacion", monto: 150 });
    expect(() => cobro.cotizacion("u1", { plan: "pro", vigenciaDias: "7" })).toThrow(DatosPagoInvalidos);
  });

  it("POST /suscripciones/contratar cobra y responde el resultado", async () => {
    const cobro = await controlador();
    await expect(cobro.contratar("u1", { plan: "starter", vigenciaDias: 30, tarjeta: TARJETA })).resolves.toMatchObject({
      resultado: "aprobado",
      pago: { numeroComprobante: expect.stringMatching(/^DPY-\d{4}-000001$/) },
    });
    expect(() => cobro.contratar("u1", { plan: "starter" })).toThrow(DatosPagoInvalidos);
  });

  it("POST /suscripciones/descenso programa el plan siguiente", async () => {
    const cobro = await controlador();
    await cobro.contratar("u1", { plan: "pro", tarjeta: TARJETA });
    await expect(cobro.descenso("u1", { plan: "starter" })).resolves.toMatchObject({ planSiguiente: { codigo: "starter" } });
  });

  it.each<[ErrorSuscripciones, number, Record<string, unknown>]>([
    [new DatosPagoInvalidos("x"), 400, { codigo: "datos-invalidos" }],
    [new SuscripcionNoEncontrada("u1"), 404, { codigo: "sin-suscripcion" }],
    [new PlanNoEncontrado("oro"), 404, { codigo: "plan-no-encontrado", plan: "oro" }],
    [new VigenciaNoDisponible("Sandbox", 365), 422, { codigo: "vigencia-no-disponible" }],
    [new PlanSinCobro("Sandbox"), 409, { codigo: "plan-sin-cobro" }],
    [new CambioEsDescenso("Starter"), 409, { codigo: "es-descenso" }],
    [new DescensoNoPermitido("x"), 409, { codigo: "descenso-no-permitido" }],
  ])("el filtro traduce %p a HTTP %i con su código", (error, estado, cuerpo) => {
    const { respuesta, host } = respuestaFalsa();
    new ErroresSuscripcionesFilter().catch(error, host);
    expect(respuesta.estado).toBe(estado);
    expect(respuesta.cuerpo).toMatchObject({ ...cuerpo, mensaje: error.message });
  });
});
