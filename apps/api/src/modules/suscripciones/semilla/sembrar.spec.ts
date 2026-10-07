import { RelojFijo } from "../../../compartido/reloj";
import { RepositorioPlanesMemoria } from "../adaptadores/repositorio-planes.memoria";
import { RepositorioSuscripcionesMemoria } from "../adaptadores/repositorio-suscripciones.memoria";
import { SuscripcionesService } from "../suscripciones.service";
import { DestinoSemillaMemoria } from "./destino-semilla.memoria";
import { sembrar, type Hashear } from "./sembrar";
import { ClaveAdminFaltante } from "./semilla";

const ENTORNO = { ADMIN_CLAVE: "Clave-Admin-1" };
/** `RelojFijo` arranca en 2026-09-30T12:00:00Z. */
const AHORA = new Date("2026-09-30T12:00:00.000Z");

function armar(hashear?: Hashear) {
  const destino = new DestinoSemillaMemoria();
  const planes = new RepositorioPlanesMemoria(destino.planes);
  const repositorio = new RepositorioSuscripcionesMemoria(destino.planes);
  const reloj = new RelojFijo(AHORA);
  const servicio = new SuscripcionesService(planes, repositorio, reloj);
  let llamadas = 0;
  const hashearPorDefecto: Hashear = async (clave) => `hash-${clave}-${++llamadas}`;
  const demo = { suscripciones: repositorio, planes, reloj };
  const correr = (entorno: NodeJS.ProcessEnv = ENTORNO) =>
    sembrar(destino, servicio, hashear ?? hashearPorDefecto, entorno, demo);
  const foto = () => JSON.parse(JSON.stringify({ planes: destino.planes, usuarios: destino.usuarios, suscripciones: repositorio.guardadas() }));
  const idDe = (correo: string) => destino.usuarios.find((u) => u.correo === correo)?.id ?? "";
  return { destino, repositorio, servicio, correr, foto, idDe };
}

describe("sembrar", () => {
  it("Seed idempotente: dos corridas dejan los mismos registros", async () => {
    const { correr, foto } = armar();
    await correr();
    const primera = foto();
    await correr();
    expect(foto()).toEqual(primera);
    expect(primera.planes).toHaveLength(4);
    expect(primera.usuarios).toHaveLength(4);
    expect(primera.suscripciones).toHaveLength(4);
  });

  it("el administrador y el cliente quedan con Sandbox Activa y contraseña con hash", async () => {
    const { destino, servicio, correr, idDe } = armar();
    await correr();
    for (const correo of ["admin@deploya.app", "cliente@deploya.app"]) {
      expect(destino.usuarios.find((u) => u.correo === correo)?.hashContrasena).not.toBe(ENTORNO.ADMIN_CLAVE);
      await expect(servicio.cuotaDe(idDe(correo))).resolves.toMatchObject({ plan: { codigo: "sandbox" }, estado: "activa", vence: null });
    }
    expect(destino.usuarios.map((u) => u.rol)).toEqual(["administrador", "cliente", "cliente", "cliente"]);
  });

  it("vencida@ queda en Starter con la suscripción Vencida", async () => {
    const { repositorio, servicio, correr, idDe } = armar();
    const actualizar = jest.spyOn(repositorio, "actualizar");

    await correr();

    const vence = new Date("2026-09-28T12:00:00.000Z");
    await expect(servicio.cuotaDe(idDe("vencida@deploya.app"))).resolves.toMatchObject({ plan: { codigo: "starter" }, estado: "vencida", vence });
    const suscripcion = await repositorio.deUsuario(idDe("vencida@deploya.app"));
    expect(actualizar).toHaveBeenCalledWith(suscripcion?.id, {
      planId: "plan-starter",
      estado: "vencida",
      estadoDesde: vence,
      vigenciaDias: 30,
      inicio: new Date("2026-08-29T12:00:00.000Z"),
      vence,
      planSiguienteId: null,
    });
  });

  it("suspendida@ queda en Starter con la suscripción Suspendida", async () => {
    const { repositorio, servicio, correr, idDe } = armar();
    const actualizar = jest.spyOn(repositorio, "actualizar");

    await correr();

    const vence = new Date("2026-09-20T12:00:00.000Z");
    await expect(servicio.cuotaDe(idDe("suspendida@deploya.app"))).resolves.toMatchObject({ plan: { codigo: "starter" }, estado: "suspendida", vence });
    const suscripcion = await repositorio.deUsuario(idDe("suspendida@deploya.app"));
    expect(actualizar).toHaveBeenCalledWith(suscripcion?.id, {
      planId: "plan-starter",
      estado: "suspendida",
      estadoDesde: new Date("2026-09-25T12:00:00.000Z"),
      vigenciaDias: 30,
      inicio: new Date("2026-08-21T12:00:00.000Z"),
      vence,
      planSiguienteId: null,
    });
  });

  it("las cuentas de demo usan la misma contraseña que cliente@", async () => {
    const hashear = jest.fn<Promise<string>, [string]>(async (clave) => `hash-${clave}`);
    const { correr } = armar(hashear);

    await correr({ ADMIN_CLAVE: "Clave-Admin-1", CLIENTE_CLAVE: "Clave-Cliente-1" });

    expect(hashear.mock.calls.map(([clave]) => clave)).toEqual(["Clave-Admin-1", "Clave-Cliente-1", "Clave-Cliente-1", "Clave-Cliente-1"]);
  });

  it("una suscripción que ya no es la Sandbox inicial no se reescribe", async () => {
    const { repositorio, correr, idDe } = armar();
    await correr();
    const movida = await repositorio.deUsuario(idDe("vencida@deploya.app"));
    await repositorio.actualizar(movida?.id ?? "", {
      planId: "plan-pro",
      estado: "activa",
      estadoDesde: AHORA,
      vigenciaDias: 30,
      inicio: AHORA,
      vence: new Date("2026-10-30T12:00:00.000Z"),
      planSiguienteId: null,
    });
    const antes = await repositorio.deUsuario(idDe("vencida@deploya.app"));

    await correr();

    await expect(repositorio.deUsuario(idDe("vencida@deploya.app"))).resolves.toEqual(antes);
  });

  it("sin ADMIN_CLAVE no escribe nada", async () => {
    const { destino, correr } = armar();
    await expect(correr({})).rejects.toBeInstanceOf(ClaveAdminFaltante);
    expect(destino.planes).toHaveLength(0);
    expect(destino.usuarios).toHaveLength(0);
  });
});
