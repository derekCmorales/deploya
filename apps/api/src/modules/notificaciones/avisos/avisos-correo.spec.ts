import { Logger } from "@nestjs/common";
import { RelojFijo } from "../../../compartido/reloj";
import { CorreoNoEnviado } from "../dominio/errores";
import type { MensajeCorreo, PlantillaCorreo } from "../dominio/plantilla-correo";
import type { AvisoDespliegue, AvisoSuscripcion } from "../puertos/avisos.puerto";
import { CorreoPuerto } from "../puertos/correo.puerto";
import { DestinatariosPuerto, type Destinatario } from "../puertos/destinatarios.puerto";
import { AvisosCorreo } from "./avisos-correo";

class CorreoEspia extends CorreoPuerto {
  readonly enviados: (MensajeCorreo & { para: string })[] = [];
  falla = false;
  async enviar<D extends { enlace: string }>(destinatario: string, plantilla: PlantillaCorreo<D>, datos: D): Promise<void> {
    if (this.falla) throw new CorreoNoEnviado(destinatario, "535 credenciales inválidas");
    this.enviados.push({ para: destinatario, ...plantilla.componer(datos) });
  }
}

class DestinatariosEnMemoria extends DestinatariosPuerto {
  constructor(private readonly cuentas: Record<string, Destinatario>) {
    super();
  }
  async destinatarioDe(usuarioId: string): Promise<Destinatario | null> {
    return this.cuentas[usuarioId] ?? null;
  }
}

function armar() {
  const correo = new CorreoEspia();
  const destinatarios = new DestinatariosEnMemoria({ "u-1": { correo: "derek@tiendademo.com", nombre: "Derek" } });
  const reloj = new RelojFijo(new Date("2026-10-27T12:00:00.000Z"));
  const avisos = new AvisosCorreo(destinatarios, correo, reloj, { urlWeb: "https://deploya.app" });
  return { avisos, correo };
}

const SALUDABLE: AvisoDespliegue = {
  usuarioId: "u-1",
  proyecto: { id: "p-1", nombre: "api-tienda", subdominio: "api-tienda" },
  despliegue: { numero: 14, commit: "a1b2c3d4e5f6", estado: "saludable", duracionMs: 161_000 },
  url: "https://api-tienda.deploya.app",
};

const FALLIDO: AvisoDespliegue = {
  usuarioId: "u-1",
  proyecto: { id: "p-1", nombre: "api-tienda", subdominio: "api-tienda" },
  despliegue: { numero: 15, commit: "f00ba7", estado: "fallido", duracionMs: 48_000 },
  fallo: {
    etapa: "Construcción",
    versionActiva: 14,
    ultimasLineas: ["12 npm run build", "13 sh: 1: tsc: not found", "14 ERROR: el paso [5/5] terminó con código 127"],
  },
};

describe("M10 · Avisos por correo (SP-02)", () => {
  it("Despliegue saludable: el titular recibe «api-tienda está en línea» con versión, duración y URL", async () => {
    const { avisos, correo } = armar();

    await avisos.despliegueTerminado(SALUDABLE);

    const [mensaje] = correo.enviados;
    expect(mensaje.para).toBe("derek@tiendademo.com");
    expect(mensaje.asunto).toBe("api-tienda está en línea");
    expect(mensaje.texto).toContain("La versión #14 pasó la verificación de salud y ya recibe tráfico.");
    expect(mensaje.texto).toContain("5 / 5 · Saludable");
    expect(mensaje.texto).toContain("Versión: #14 · a1b2c3d");
    expect(mensaje.texto).toContain("Duración: 2 min 41 s");
    expect(mensaje.texto).toContain("URL: api-tienda.deploya.app");
    expect(mensaje.texto).toContain("Abrir api-tienda: https://api-tienda.deploya.app");
  });

  it("Despliegue fallido: «Falló el despliegue #15 de api-tienda» con la etapa, la versión activa y las dos últimas líneas", async () => {
    const { avisos, correo } = armar();

    await avisos.despliegueTerminado(FALLIDO);

    const [mensaje] = correo.enviados;
    expect(mensaje.asunto).toBe("Falló el despliegue #15 de api-tienda");
    expect(mensaje.texto).toContain("Se detuvo en Construcción. La versión #14 sigue activa; tu servicio no se interrumpió.");
    expect(mensaje.texto).toContain("13 sh: 1: tsc: not found");
    expect(mensaje.texto).toContain("14 ERROR: el paso [5/5] terminó con código 127");
    expect(mensaje.texto).not.toContain("12 npm run build");
    expect(mensaje.texto).toContain("Ver bitácora: https://deploya.app/projects/p-1/despliegues/15");
  });

  it("Error del SMTP: el error queda en la bitácora del API y no llega a quien avisa", async () => {
    const { avisos, correo } = armar();
    correo.falla = true;
    const advertencia = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);

    await expect(avisos.despliegueTerminado(SALUDABLE)).resolves.toBeUndefined();
    await expect(avisos.suscripcionCambio({ usuarioId: "u-1", estado: "suspendida", plan: "Starter", contenedoresDetenidos: 3 })).resolves.toBeUndefined();

    expect(advertencia).toHaveBeenCalledWith(expect.stringContaining("535 credenciales inválidas"));
    advertencia.mockRestore();
  });

  it("un fallido sin versión activa no promete que el servicio siguió", async () => {
    const { avisos, correo } = armar();

    await avisos.despliegueTerminado({ ...FALLIDO, fallo: { etapa: "Recepción", versionActiva: null, ultimasLineas: [] } });

    expect(correo.enviados[0].texto).toContain("Se detuvo en Recepción.");
    expect(correo.enviados[0].texto).not.toContain("sigue activa");
  });

  it("si la cuenta ya no existe no envía nada y no falla", async () => {
    const { avisos, correo } = armar();
    const advertencia = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);

    await expect(avisos.despliegueTerminado({ ...SALUDABLE, usuarioId: "borrada" })).resolves.toBeUndefined();

    expect(correo.enviados).toEqual([]);
    advertencia.mockRestore();
  });
});

describe("M10 · Avisos de la suscripción (plantillas para SP-04)", () => {
  const POR_VENCER: AvisoSuscripcion = {
    usuarioId: "u-1",
    estado: "por-vencer",
    plan: "Starter",
    venceEl: "2026-11-03T00:00:00.000Z",
    precio: "USD 5.00",
    vigenciaDias: 30,
  };

  it("Por vencer: «Tu plan Starter vence en 7 días» con la fecha, la vigencia y el precio", async () => {
    const { avisos, correo } = armar();

    await avisos.suscripcionCambio(POR_VENCER);

    const [mensaje] = correo.enviados;
    expect(mensaje.asunto).toBe("Tu plan Starter vence en 7 días");
    expect(mensaje.texto).toContain("La vigencia termina el 03 nov 2026.");
    expect(mensaje.texto).toContain("Plan: Starter · 30 días");
    expect(mensaje.texto).toContain("Renovación: USD 5.00");
    expect(mensaje.texto).toContain("Renovar plan: https://deploya.app/suscripcion");
  });

  it("Suspendida: «Tu suscripción está suspendida» y cuántos contenedores se detuvieron", async () => {
    const { avisos, correo } = armar();

    await avisos.suscripcionCambio({ usuarioId: "u-1", estado: "suspendida", plan: "Starter", contenedoresDetenidos: 3 });

    const [mensaje] = correo.enviados;
    expect(mensaje.asunto).toBe("Tu suscripción está suspendida");
    expect(mensaje.texto).toContain("Terminó el período de gracia y detuvimos los 3 contenedores de tu cuenta.");
    expect(mensaje.texto).toContain("Renovar y reactivar: https://deploya.app/suscripcion");
  });

  it("Por vencer sin fecha no se envía (no hay qué decir)", async () => {
    const { avisos, correo } = armar();
    const advertencia = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);

    await avisos.suscripcionCambio({ ...POR_VENCER, venceEl: undefined });

    expect(correo.enviados).toEqual([]);
    advertencia.mockRestore();
  });
});
