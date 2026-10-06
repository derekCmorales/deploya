import type { ArgumentsHost } from "@nestjs/common";
import { motorDePrueba } from "../../pruebas/motor";
import { RechazosOrquestacionFilter } from "./rechazos-orquestacion.filter";
import { CuotaConstruccionesAgotada, SuscripcionNoPermite } from "./dominio/errores";

const SANDBOX = 30;

async function crearConstrucciones(motor: ReturnType<typeof motorDePrueba>, cantidad: number) {
  for (let i = 0; i < cantidad; i++) await motor.servicio.crearDespliegue("proyecto-1");
}

function respuestaFalsa() {
  const respuesta = { estado: 0, cuerpo: {} as unknown, status(e: number) { this.estado = e; return this; }, json(c: unknown) { this.cuerpo = c; } };
  const host = { switchToHttp: () => ({ getResponse: () => respuesta }) } as unknown as ArgumentsHost;
  return { respuesta, host };
}

describe("Bloqueos por suscripción y cuota (M5-03)", () => {
  it("Suscripción vencida bloquea el despliegue", async () => {
    const motor = motorDePrueba();
    motor.cuota.permiso = { estado: "vencida", construccionesMes: SANDBOX };

    await expect(motor.servicio.desplegarComoDueno("proyecto-1", "usuario-1")).rejects.toThrow(SuscripcionNoPermite);
    expect(await motor.despliegues.ultimosDe(["proyecto-1"])).toHaveLength(0);
    expect(motor.cola.trabajos).toHaveLength(0);
  });

  it("Suscripción suspendida bloquea el despliegue", async () => {
    const motor = motorDePrueba();
    motor.cuota.permiso = { estado: "suspendida", construccionesMes: SANDBOX };

    await expect(motor.servicio.crearDespliegue("proyecto-1", "alta")).rejects.toThrow(SuscripcionNoPermite);
    expect(await motor.despliegues.ultimosDe(["proyecto-1"])).toHaveLength(0);
  });

  it("Cuota de construcciones agotada", async () => {
    const motor = motorDePrueba();
    await crearConstrucciones(motor, SANDBOX);

    await expect(motor.servicio.crearDespliegue("proyecto-1", "variables")).rejects.toThrow(CuotaConstruccionesAgotada);
    expect((await motor.despliegues.ultimosDe(["proyecto-1"]))[0].numero).toBe(SANDBOX);
  });

  it("Dentro de la cuota", async () => {
    const motor = motorDePrueba();
    await crearConstrucciones(motor, SANDBOX - 1);

    const creado = await motor.servicio.desplegarComoDueno("proyecto-1", "usuario-1");

    expect(creado.estado).toBe("encolado");
  });

  it("Mes nuevo, cuota nueva", async () => {
    const motor = motorDePrueba();
    expect(motor.reloj.ahora().toISOString()).toBe("2026-09-30T12:00:00.000Z");
    await crearConstrucciones(motor, SANDBOX);
    await expect(motor.servicio.crearDespliegue("proyecto-1")).rejects.toThrow(CuotaConstruccionesAgotada);

    motor.reloj.avanzar(12 * 60 * 60 * 1000);
    const creado = await motor.servicio.crearDespliegue("proyecto-1");

    expect(motor.reloj.ahora().toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(creado.estado).toBe("encolado");
  });

  it("La reversión no cuenta", async () => {
    const motor = motorDePrueba();
    const desde = new Date("2026-09-01T00:00:00Z");
    await crearConstrucciones(motor, 2);
    await motor.despliegues.crear({ proyectoId: "proyecto-1", disparador: "reversion", rama: "main", estado: "revirtiendo", creado: motor.reloj.ahora() });

    expect(await motor.despliegues.contarConstruccionesDesde("usuario-1", desde)).toBe(2);
  });

  it("solo cuenta las construcciones del dueño", async () => {
    const motor = motorDePrueba();
    await crearConstrucciones(motor, 3);

    expect(await motor.despliegues.contarConstruccionesDesde("otro-usuario", new Date(0))).toBe(0);
  });

  it.each([
    [new SuscripcionNoPermite("vencida"), "suscripcion-no-permite"],
    [new CuotaConstruccionesAgotada(SANDBOX), "cuota-construcciones-agotada"],
  ])("el filtro responde 409 con el código del contrato (%#)", (error, codigo) => {
    const { respuesta, host } = respuestaFalsa();

    new RechazosOrquestacionFilter().catch(error, host);

    expect(respuesta.estado).toBe(409);
    expect(respuesta.cuerpo).toEqual({ codigo, mensaje: error.message });
  });
});
