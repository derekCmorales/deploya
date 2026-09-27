import { RelojFijo } from "../compartido/reloj";
import { ContenedorPuerto } from "../modules/orquestacion/puertos/contenedor.puerto";
import { puerto } from "./adapters.module";
import { configuracionDesde } from "./configuracion-motor";
import { ContenedorStub } from "./stubs/contenedor.stub";

class ContenedorReal extends ContenedorStub {}

function elegir(modo: string | undefined) {
  const proveedor = puerto(ContenedorPuerto, { docker: () => new ContenedorReal(), stub: () => new ContenedorStub() }) as {
    useFactory: (c: ReturnType<typeof configuracionDesde>, r: RelojFijo) => ContenedorPuerto;
  };
  return proveedor.useFactory(configuracionDesde({ MOTOR_ADAPTADORES: modo }), new RelojFijo());
}

describe("AdaptersModule", () => {
  it("con MOTOR_ADAPTADORES=docker elige el adaptador real", () => {
    expect(elegir("docker")).toBeInstanceOf(ContenedorReal);
  });

  it("sin la variable (pruebas, CI) elige el stub", () => {
    expect(elegir(undefined)).not.toBeInstanceOf(ContenedorReal);
  });

  it("la configuración trae valores por defecto de desarrollo", () => {
    expect(configuracionDesde({})).toEqual(expect.objectContaining({
      modo: "stub", dominioApps: "localhost", esquemaApps: "http", trabajadorConcurrencia: 1,
    }));
  });
});
