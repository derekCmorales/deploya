import { CancelacionesMemoria } from "../../../adapters/stubs/cancelaciones.memoria";
import { INTERVALO_VIGIA_MS } from "../dominio/motor.constantes";
import { VigiaCancelacion } from "./vigia-cancelacion";

describe("VigiaCancelacion (M4-02)", () => {
  afterEach(() => jest.useRealTimers());

  it("aborta cuando el cliente pidió cancelar y no antes", async () => {
    const cancelaciones = new CancelacionesMemoria();
    const vigia = new VigiaCancelacion(cancelaciones, 0);
    const controlador = new AbortController();

    await vigia.revisar("d1", controlador);
    expect(controlador.signal.aborted).toBe(false);

    await cancelaciones.pedir("d1");
    await vigia.revisar("d1", controlador);
    expect(controlador.signal.aborted).toBe(true);
  });

  it("no mira las cancelaciones de otro despliegue", async () => {
    const cancelaciones = new CancelacionesMemoria();
    await cancelaciones.pedir("otro");
    const controlador = new AbortController();

    await new VigiaCancelacion(cancelaciones, 0).revisar("d1", controlador);

    expect(controlador.signal.aborted).toBe(false);
  });

  it("pregunta cada INTERVALO_VIGIA_MS hasta que se detiene", async () => {
    jest.useFakeTimers();
    const cancelaciones = new CancelacionesMemoria();
    const consultas = jest.spyOn(cancelaciones, "pedida");
    const controlador = new AbortController();

    const detener = new VigiaCancelacion(cancelaciones).vigilar("d1", controlador);
    await jest.advanceTimersByTimeAsync(INTERVALO_VIGIA_MS * 3);
    detener();
    await jest.advanceTimersByTimeAsync(INTERVALO_VIGIA_MS * 3);

    expect(INTERVALO_VIGIA_MS).toBe(1000);
    expect(consultas).toHaveBeenCalledTimes(3);
  });

  it("aborta en el primer sondeo después de pedir cancelar", async () => {
    jest.useFakeTimers();
    const cancelaciones = new CancelacionesMemoria();
    const controlador = new AbortController();
    const detener = new VigiaCancelacion(cancelaciones).vigilar("d1", controlador);

    await jest.advanceTimersByTimeAsync(INTERVALO_VIGIA_MS);
    expect(controlador.signal.aborted).toBe(false);
    await cancelaciones.pedir("d1");
    await jest.advanceTimersByTimeAsync(INTERVALO_VIGIA_MS);
    detener();

    expect(controlador.signal.aborted).toBe(true);
  });

  it("con intervalo 0 no crea temporizador", () => {
    jest.useFakeTimers();

    new VigiaCancelacion(new CancelacionesMemoria(), 0).vigilar("d1", new AbortController())();

    expect(jest.getTimerCount()).toBe(0);
  });
});
