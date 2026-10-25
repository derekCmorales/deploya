import { RelojFijo } from "../../../compartido/reloj";
import { RegistroEnviosMemoria, ReporteServidorMemoria } from "../../../adapters/stubs/estado-compartido.memoria";
import type { PlanSemilla } from "../../suscripciones/semilla/semilla";
import { LimitesDeInstalacion } from "../../suscripciones/modo/cuotas";
import { RepositorioConfiguracionInstalacionMemoria } from "../../suscripciones/modo/repositorio-configuracion-instalacion.memoria";
import { AjusteInvalido, InstalacionSoloAutoalojada, InvitacionNoEncontrada, InvitacionNoValida, InvitacionRequerida, RegistroCerrado } from "../dominio/errores";
import { ESTADO_HTTP_POR_CODIGO } from "../errores-administracion.filter";
import { RepositorioInvitacionesMemoria } from "./adaptadores/repositorio-invitaciones.memoria";
import { InstalacionService } from "./instalacion.service";
import { InvitacionesService } from "./invitaciones.service";
import type { EstadoScriptsPuerto } from "./puertos/estado-scripts.puerto";
import { RegistroAccionesPuerto, type AccionInstalacion } from "./puertos/registro-acciones.puerto";
import { TokensInvitacion } from "./puertos/tokens-invitacion.puerto";
import { RegistroAbierto, RegistroDeInstalacion } from "./registro-instalacion";
import { SaludInstalacion } from "./salud/comprobacion";
import { ComprobacionCorreo } from "./salud/comprobaciones";
import { SoloAutoalojadaGuard } from "./solo-autoalojada.guard";

const AHORA = new Date("2026-10-24T12:00:00.000Z");
const DIA_MS = 24 * 60 * 60 * 1000;

class TokensFijos extends TokensInvitacion {
  private n = 0;

  generar(): string {
    return `token-${++this.n}`;
  }

  huella(token: string): string {
    return `huella:${token}`;
  }
}

class AccionesEnMemoria extends RegistroAccionesPuerto {
  readonly guardadas: AccionInstalacion[] = [];

  async registrar(accion: AccionInstalacion): Promise<void> {
    this.guardadas.push(accion);
  }
}

const SCRIPTS: EstadoScriptsPuerto = {
  respaldo: async () => ({ ultimo: null, tamanoMb: null, ruta: "/var/backups/deploya", programa: "diario", hora: "03:00", conserva: 7 }),
  version: async () => ({ instalada: "v1.0.0", disponible: null }),
};

function armar() {
  const reloj = new RelojFijo(AHORA);
  const configuracion = new RepositorioConfiguracionInstalacionMemoria();
  const invitaciones = new RepositorioInvitacionesMemoria();
  const tokens = new TokensFijos();
  const acciones = new AccionesEnMemoria();
  const reportes = new ReporteServidorMemoria();
  const envios = new RegistroEnviosMemoria();
  const servicioInvitaciones = new InvitacionesService(invitaciones, tokens, acciones, reloj, "https://apps.miempresa.com");
  const salud = new SaludInstalacion([new ComprobacionCorreo(configuracion, envios, reloj)]);
  const instalacion = new InstalacionService(configuracion, servicioInvitaciones, SCRIPTS, reportes, acciones, reloj, salud, "apps.miempresa.com");
  const registro = new RegistroDeInstalacion(configuracion, invitaciones, tokens, reloj);
  return { reloj, configuracion, invitaciones, acciones, reportes, envios, servicioInvitaciones, instalacion, registro };
}

const tokenDe = (enlace: string) => new URL(enlace).searchParams.get("invitacion") ?? "";

describe("SP-18 · Ajustes de la instalación", () => {
  it("Registro con invitación", async () => {
    const { servicioInvitaciones, registro, invitaciones } = armar();
    const { enlace, vence } = await servicioInvitaciones.crear("u-admin", { correo: " Ana@MiEmpresa.com " });

    await registro.exigirPermitido("ana@miempresa.com", tokenDe(enlace));
    await registro.consumir("ana@miempresa.com", tokenDe(enlace));

    expect(enlace).toBe("https://apps.miempresa.com/registro?invitacion=token-1");
    expect(vence).toEqual(new Date(AHORA.getTime() + 7 * DIA_MS));
    expect(invitaciones.guardadas[0]).toMatchObject({ correo: "ana@miempresa.com", hashToken: "huella:token-1", usada: AHORA });
    await expect(servicioInvitaciones.activas()).resolves.toEqual([]);
  });

  it("Invitación vencida o reusada", async () => {
    const { servicioInvitaciones, registro, reloj } = armar();
    const usada = tokenDe((await servicioInvitaciones.crear("u-admin", { correo: "ana@miempresa.com" })).enlace);
    const vieja = tokenDe((await servicioInvitaciones.crear("u-admin", { correo: "luis@miempresa.com" })).enlace);
    await registro.consumir("ana@miempresa.com", usada);
    reloj.avanzar(8 * DIA_MS);

    await expect(registro.exigirPermitido("luis@miempresa.com", vieja)).rejects.toEqual(new InvitacionNoValida("vencida"));
    await expect(registro.exigirPermitido("ana@miempresa.com", usada)).rejects.toEqual(new InvitacionNoValida("usada"));
    expect(ESTADO_HTTP_POR_CODIGO.InvitacionNoValida).toBe(410);
  });

  it("una invitación es del correo al que se mandó, y revocada ya no sirve", async () => {
    const { servicioInvitaciones, registro } = armar();
    const { id, enlace } = await servicioInvitaciones.crear("u-admin", { correo: "ana@miempresa.com" });

    await expect(registro.exigirPermitido("otro@miempresa.com", tokenDe(enlace))).rejects.toBeInstanceOf(InvitacionNoValida);
    await servicioInvitaciones.revocar("u-admin", id);

    await expect(registro.exigirPermitido("ana@miempresa.com", tokenDe(enlace))).rejects.toEqual(new InvitacionNoValida("revocada"));
    await expect(servicioInvitaciones.revocar("u-admin", id)).rejects.toBeInstanceOf(InvitacionNoEncontrada);
  });

  it("con invitación, registrarse sin enlace → 403", async () => {
    const { registro } = armar();

    await expect(registro.exigirPermitido("ana@miempresa.com")).rejects.toBeInstanceOf(InvitacionRequerida);
    expect(ESTADO_HTTP_POR_CODIGO.InvitacionRequerida).toBe(403);
  });

  it("Registro cerrado", async () => {
    const { instalacion, registro, configuracion } = armar();
    await instalacion.cambiarRegistro("u-admin", { politica: "cerrado" });

    await expect(registro.exigirPermitido("ana@miempresa.com", "token-1")).rejects.toBeInstanceOf(RegistroCerrado);

    expect(ESTADO_HTTP_POR_CODIGO.RegistroCerrado).toBe(403);
    // Solo el registro pregunta la política: iniciar sesión (M1-03) no pasa por aquí.
    await expect(configuracion.politicaRegistro()).resolves.toBe("cerrado");
  });

  it("registro abierto en autoalojado y siempre en la nube", async () => {
    const { instalacion, registro } = armar();
    await instalacion.cambiarRegistro("u-admin", { politica: "abierto" });

    await expect(registro.exigirPermitido("ana@miempresa.com")).resolves.toBeUndefined();
    await expect(registro.consumir("ana@miempresa.com")).resolves.toBeUndefined();
    await expect(new RegistroAbierto().exigirPermitido()).resolves.toBeUndefined();
  });

  it("Límites en el próximo despliegue", async () => {
    const { instalacion, configuracion, acciones } = armar();
    const cuotas = new LimitesDeInstalacion(configuracion);
    const plan = { codigo: "autoalojado", nombre: "Autoalojado" } as PlanSemilla;
    const suscripcion = { plan, estado: "activa" } as Parameters<LimitesDeInstalacion["cuotaDe"]>[0];
    const enCurso = await cuotas.cuotaDe(suscripcion);

    await instalacion.cambiarLimites("u-admin", { cpu: 1, memoriaMb: 512, proyectosPorUsuario: null });
    const siguiente = await cuotas.cuotaDe(suscripcion);

    expect([enCurso.memoriaMb, siguiente.memoriaMb]).toEqual([1024, 512]);
    expect(acciones.guardadas).toEqual([{ adminId: "u-admin", accion: "cambiar-limites", detalle: "1 vCPU · 512 MB · sin límite de proyectos", creado: AHORA }]);
  });

  it("límites fuera de las opciones de la 32 → 400", async () => {
    const { instalacion } = armar();

    await expect(instalacion.cambiarLimites("u-admin", { cpu: 3, memoriaMb: 512, proyectosPorUsuario: null })).rejects.toBeInstanceOf(AjusteInvalido);
    await expect(instalacion.cambiarRegistro("u-admin", { politica: "a-veces" })).rejects.toBeInstanceOf(AjusteInvalido);
    expect(ESTADO_HTTP_POR_CODIGO.AjusteInvalido).toBe(400);
  });

  it("Estado con aviso", async () => {
    const { instalacion, envios } = armar();
    await envios.registrar({ en: new Date(AHORA.getTime() - 2 * 60 * 60 * 1000), entregado: false, error: "535 usuario rechazado" });

    const estado = await instalacion.estado();

    expect(estado.salud).toEqual([{ id: "correo", estado: "aviso", detalle: "El último envío falló hace 2 h: 535 usuario rechazado" }]);
  });

  it("el estado junta versión, registro, límites con la capacidad del servidor y respaldos", async () => {
    const { instalacion, servicioInvitaciones, reportes } = armar();
    await servicioInvitaciones.crear("u-admin", { correo: "ana@miempresa.com" });
    await reportes.publicar({ tomado: AHORA, docker: null, errorDocker: null, disco: { usadoGb: 31, totalGb: 80 }, memoria: { libreMb: 4096, totalMb: 8192 } });

    const estado = await instalacion.estado();

    expect(estado).toMatchObject({
      dominio: "apps.miempresa.com",
      version: { instalada: "v1.0.0", disponible: null },
      registro: { politica: "invitacion", invitaciones: [{ correo: "ana@miempresa.com" }] },
      limites: { cpu: 1, memoriaMb: 1024, proyectosPorUsuario: null, capacidad: 3, memoriaLibreMb: 4096 },
      respaldo: { ruta: "/var/backups/deploya", conserva: 7 },
    });
  });

  it("Solo en autoalojado", () => {
    expect(() => new SoloAutoalojadaGuard("nube").canActivate()).toThrow(InstalacionSoloAutoalojada);
    expect(new SoloAutoalojadaGuard("autoalojado").canActivate()).toBe(true);
    expect(ESTADO_HTTP_POR_CODIGO.InstalacionSoloAutoalojada).toBe(404);
  });

  it("crear una invitación exige un correo válido y deja la acción", async () => {
    const { servicioInvitaciones, acciones } = armar();

    await expect(servicioInvitaciones.crear("u-admin", { correo: "no-es-correo" })).rejects.toBeInstanceOf(AjusteInvalido);
    await servicioInvitaciones.crear("u-admin", { correo: "ana@miempresa.com" });

    expect(acciones.guardadas.map((a) => a.accion)).toEqual(["crear-invitacion"]);
  });
});
