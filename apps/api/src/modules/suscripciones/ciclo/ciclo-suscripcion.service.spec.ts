import { RelojFijo } from "../../../compartido/reloj";
import { planesDePrueba } from "../adaptadores/planes.fixture";
import { RepositorioSuscripcionesMemoria } from "../adaptadores/repositorio-suscripciones.memoria";
import type { NuevaSuscripcion } from "../dominio/suscripcion";
import { CicloSuscripcionService } from "./ciclo-suscripcion.service";
import { AvisosFalso } from "./avisos.falso";
import { ContenedoresClienteFalso } from "./contenedores-cliente.falso";

const planes = planesDePrueba();

function starter(usuarioId: string, cambios: Partial<NuevaSuscripcion> = {}): NuevaSuscripcion {
  return {
    usuarioId,
    planId: "plan-starter",
    estado: "activa",
    vigenciaDias: 30,
    inicio: new Date("2026-10-01T00:05:00.000Z"),
    vence: new Date("2026-10-31T00:05:00.000Z"),
    ...cambios,
  };
}

async function armar(ahora: string, ...iniciales: NuevaSuscripcion[]) {
  const suscripciones = new RepositorioSuscripcionesMemoria(planes);
  for (const inicial of iniciales) await suscripciones.crearSiNoExiste(inicial);
  const contenedores = new ContenedoresClienteFalso();
  const avisos = new AvisosFalso();
  const reloj = new RelojFijo(new Date(ahora));
  const servicio = new CicloSuscripcionService(suscripciones, contenedores, avisos, reloj);
  return { servicio, suscripciones, contenedores, avisos, reloj };
}

describe("M2-05 · CicloSuscripcionService", () => {
  it("Fin de la gracia", async () => {
    const { servicio, suscripciones, contenedores } = await armar(
      "2026-11-05T00:05:00.000Z",
      starter("u-suspendida", { estado: "vencida", inicio: new Date("2026-10-31T00:05:00.000Z") }),
    );

    const resultado = await servicio.ejecutar();

    expect(resultado).toEqual({ cambios: [{ usuarioId: "u-suspendida", de: "vencida", a: "suspendida" }] });
    await expect(suscripciones.deUsuario("u-suspendida")).resolves.toMatchObject({
      estado: "suspendida",
      estadoDesde: new Date("2026-11-05T00:05:00.000Z"),
    });
    expect(contenedores.detenidos).toEqual(["u-suspendida"]);
  });

  it("solo pide detener al pasar a Suspendida", async () => {
    const { servicio, contenedores } = await armar("2026-10-31T00:05:00.000Z", starter("u-vence"));

    const resultado = await servicio.ejecutar();

    expect(resultado.cambios).toEqual([{ usuarioId: "u-vence", de: "activa", a: "vencida" }]);
    expect(contenedores.detenidos).toEqual([]);
  });

  it("Sandbox y las que no cambian no aparecen en los cambios", async () => {
    const { servicio } = await armar(
      "2026-10-17T00:05:00.000Z",
      starter("u-sandbox", { planId: "plan-sandbox", vigenciaDias: null, vence: null }),
      starter("u-al-dia"),
    );

    await expect(servicio.ejecutar()).resolves.toEqual({ cambios: [] });
  });

  it("Dos corridas el mismo día", async () => {
    const { servicio, contenedores } = await armar(
      "2026-11-05T00:05:00.000Z",
      starter("u-suspendida", { estado: "vencida", inicio: new Date("2026-10-31T00:05:00.000Z") }),
    );
    await servicio.ejecutar();

    const segunda = await servicio.ejecutar();

    expect(segunda).toEqual({ cambios: [] });
    expect(contenedores.detenidos).toEqual(["u-suspendida"]);
  });

  it("Descenso programado al vencer", async () => {
    const { servicio, suscripciones } = await armar("2026-10-31T00:05:00.000Z", starter("u-pro", { planId: "plan-pro" }));
    const [pro] = suscripciones.guardadas();
    await suscripciones.programarDescenso(pro.id, "plan-starter");

    await servicio.ejecutar();

    await expect(suscripciones.deUsuario("u-pro")).resolves.toMatchObject({ plan: { codigo: "starter" }, planSiguiente: null });
  });

  it("si M5 falla al detener, la suscripción queda Suspendida y las demás siguen", async () => {
    const { servicio, suscripciones, contenedores } = await armar(
      "2026-11-05T00:05:00.000Z",
      starter("u-a", { estado: "vencida", inicio: new Date("2026-10-31T00:05:00.000Z") }),
      starter("u-b", { estado: "vencida", inicio: new Date("2026-10-31T00:05:00.000Z") }),
    );
    contenedores.fallarCon(new Error("Redis no responde"));

    const resultado = await servicio.ejecutar();

    expect(resultado.cambios.map((c) => c.a)).toEqual(["suspendida", "suspendida"]);
    await expect(suscripciones.deUsuario("u-b")).resolves.toMatchObject({ estado: "suspendida" });
  });
});

describe("SP-04 · El ciclo avisa Por vencer y Suspendida", () => {
  const vencida = { estado: "vencida", inicio: new Date("2026-10-31T00:05:00.000Z") } as const;

  it("Por vencer avisa una vez", async () => {
    const { servicio, avisos } = await armar("2026-10-24T00:05:00.000Z", starter("u-por-vencer"));
    await servicio.ejecutar();

    await servicio.ejecutar();

    expect(avisos.suscripciones).toEqual([
      {
        usuarioId: "u-por-vencer",
        estado: "por-vencer",
        plan: "Starter",
        venceEl: "2026-10-31T00:05:00.000Z",
        vigenciaDias: 30,
        precio: "USD 5.00",
      },
    ]);
  });

  it("Suspendida avisa una vez", async () => {
    const { servicio, contenedores, avisos } = await armar("2026-11-05T00:05:00.000Z", starter("u-suspendida", vencida));
    contenedores.conEncolados(3);
    await servicio.ejecutar();

    await servicio.ejecutar();

    expect(avisos.suscripciones).toEqual([{ usuarioId: "u-suspendida", estado: "suspendida", plan: "Starter", contenedoresDetenidos: 3 }]);
  });

  it("no avisa al pasar a Vencida", async () => {
    const { servicio, avisos } = await armar("2026-10-31T00:05:00.000Z", starter("u-vence"));

    await servicio.ejecutar();

    expect(avisos.suscripciones).toEqual([]);
  });

  it("si M5 falla al detener, avisa la suspensión con 0 contenedores detenidos", async () => {
    const { servicio, contenedores, avisos } = await armar("2026-11-05T00:05:00.000Z", starter("u-suspendida", vencida));
    contenedores.fallarCon(new Error("Redis no responde"));

    await servicio.ejecutar();

    expect(avisos.suscripciones).toEqual([{ usuarioId: "u-suspendida", estado: "suspendida", plan: "Starter", contenedoresDetenidos: 0 }]);
  });

  it("un aviso que falla no deshace el salto ni frena a las demás", async () => {
    const { servicio, suscripciones, avisos } = await armar(
      "2026-11-05T00:05:00.000Z",
      starter("u-a", vencida),
      starter("u-b", vencida),
    );
    avisos.fallarCon(new Error("SMTP caído"));

    const resultado = await servicio.ejecutar();

    expect(resultado.cambios.map((c) => c.usuarioId)).toEqual(["u-a", "u-b"]);
    await expect(suscripciones.deUsuario("u-b")).resolves.toMatchObject({ estado: "suspendida" });
  });
});
