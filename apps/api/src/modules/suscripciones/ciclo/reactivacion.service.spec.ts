import { RelojFijo } from "../../../compartido/reloj";
import { EsperaInstantanea } from "../adaptadores/espera-temporizador";
import { PasarelaSimulada, TARJETA_APRUEBA, TARJETA_RECHAZA } from "../adaptadores/pasarela-simulada";
import { planesDePrueba } from "../adaptadores/planes.fixture";
import { RepositorioPagosMemoria } from "../adaptadores/repositorio-pagos.memoria";
import { RepositorioPlanesMemoria } from "../adaptadores/repositorio-planes.memoria";
import { RepositorioSuscripcionesMemoria } from "../adaptadores/repositorio-suscripciones.memoria";
import { ContratacionService } from "../contratacion.service";
import type { EstadoSuscripcionValor } from "../dominio/suscripcion";
import { ContenedoresClienteFalso } from "./contenedores-cliente.falso";
import { ReactivacionService } from "./reactivacion.service";

const AHORA = new Date("2026-11-06T12:00:00.000Z");

async function armar(estado: EstadoSuscripcionValor) {
  const planes = planesDePrueba();
  const suscripciones = new RepositorioSuscripcionesMemoria(planes);
  await suscripciones.crearSiNoExiste({
    usuarioId: "u1",
    planId: "plan-starter",
    estado,
    vigenciaDias: 30,
    inicio: new Date("2026-09-25T12:00:00.000Z"),
    vence: new Date("2026-10-25T12:00:00.000Z"),
  });
  const contratacion = new ContratacionService(
    new RepositorioPlanesMemoria(planes),
    suscripciones,
    new RepositorioPagosMemoria(),
    new PasarelaSimulada(new EsperaInstantanea()),
    new RelojFijo(AHORA),
  );
  const contenedores = new ContenedoresClienteFalso();
  const servicio = new ReactivacionService(contratacion, contenedores);
  const renovar = (numero = TARJETA_APRUEBA) =>
    servicio.contratar("u1", { plan: "starter", vigenciaDias: 30, tarjeta: { titular: "Ana López", numero, vencimiento: "12/28", cvc: "123" } });
  return { renovar, contenedores, contratacion };
}

describe("M2-05 · ReactivacionService", () => {
  it("Renovar una suscripción suspendida", async () => {
    const { renovar, contenedores, contratacion } = await armar("suspendida");

    const resultado = await renovar();

    expect(resultado).toMatchObject({ resultado: "aprobado", suscripcion: { estado: "activa", diasRestantes: 30 } });
    await expect(contratacion.miSuscripcion("u1")).resolves.toMatchObject({ estado: "activa", vigenciaDias: 30 });
    expect(contenedores.reanudados).toEqual(["u1"]);
  });

  it("renovar una Vencida no pide reanudar: sus contenedores siguen en línea", async () => {
    const { renovar, contenedores } = await armar("vencida");

    await renovar();

    expect(contenedores.reanudados).toEqual([]);
  });

  it("un pago rechazado no reanuda nada", async () => {
    const { renovar, contenedores } = await armar("suspendida");

    const resultado = await renovar(TARJETA_RECHAZA);

    expect(resultado.resultado).toBe("rechazado");
    expect(contenedores.reanudados).toEqual([]);
  });

  it("si M5 falla al reanudar, la renovación queda hecha", async () => {
    const { renovar, contenedores, contratacion } = await armar("suspendida");
    contenedores.fallarCon(new Error("Redis no responde"));

    const resultado = await renovar();

    expect(resultado.resultado).toBe("aprobado");
    await expect(contratacion.miSuscripcion("u1")).resolves.toMatchObject({ estado: "activa" });
  });
});
