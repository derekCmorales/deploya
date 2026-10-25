import { RelojFijo } from "../../../compartido/reloj";
import { RegistroEnviosMemoria } from "../../../adapters/stubs/estado-compartido.memoria";
import { CorreoNoEnviado } from "../dominio/errores";
import { PLANTILLA_VERIFICACION } from "../dominio/plantilla-verificacion";
import { CorreoPuerto } from "../puertos/correo.puerto";
import { RegistroEnviosCorreo } from "../puertos/registro-envios.puerto";
import { CorreoConRegistro } from "./correo-con-registro";

const AHORA = new Date("2026-10-24T12:00:00.000Z");
const DATOS = { nombre: "Ana", enlace: "https://deploya.app/verificar?token=t" } as Parameters<typeof PLANTILLA_VERIFICACION.componer>[0];

class CorreoQue extends CorreoPuerto {
  constructor(private readonly fallo: Error | null) {
    super();
  }

  async enviar(): Promise<void> {
    if (this.fallo) throw this.fallo;
  }
}

describe("SP-18 · CorreoConRegistro", () => {
  it("anota el envío que llegó", async () => {
    const registro = new RegistroEnviosMemoria();

    await new CorreoConRegistro(new CorreoQue(null), registro, new RelojFijo(AHORA)).enviar("ana@miempresa.com", PLANTILLA_VERIFICACION, DATOS);

    await expect(registro.ultimo()).resolves.toEqual({ en: AHORA, entregado: true, error: null });
  });

  it("anota lo que respondió el servidor y vuelve a lanzar el mismo error", async () => {
    const registro = new RegistroEnviosMemoria();
    const error = new CorreoNoEnviado("ana@miempresa.com", "535 usuario rechazado");

    await expect(new CorreoConRegistro(new CorreoQue(error), registro, new RelojFijo(AHORA)).enviar("ana@miempresa.com", PLANTILLA_VERIFICACION, DATOS)).rejects.toBe(error);

    await expect(registro.ultimo()).resolves.toEqual({ en: AHORA, entregado: false, error: "535 usuario rechazado" });
  });

  it("si anotar falla, el envío sigue igual", async () => {
    class RegistroRoto extends RegistroEnviosCorreo {
      async registrar(): Promise<void> {
        throw new Error("Redis no responde");
      }

      async ultimo(): Promise<null> {
        return null;
      }
    }

    await expect(new CorreoConRegistro(new CorreoQue(null), new RegistroRoto(), new RelojFijo(AHORA)).enviar("ana@miempresa.com", PLANTILLA_VERIFICACION, DATOS)).resolves.toBeUndefined();
  });
});
