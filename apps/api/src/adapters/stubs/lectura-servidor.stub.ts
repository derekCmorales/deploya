import { LecturaServidorPuerto, type ReporteServidor } from "../../modules/administracion/instalacion/puertos/reporte-servidor.puerto";

/** Sin Docker: un servidor de ejemplo, con las mismas formas que el real (LSP). */
export class LecturaServidorStub extends LecturaServidorPuerto {
  async medir(): Promise<Omit<ReporteServidor, "tomado">> {
    return {
      docker: { version: "stub", contenedores: 0 },
      errorDocker: null,
      disco: { usadoGb: 0, totalGb: 0 },
      memoria: { libreMb: 0, totalMb: 0 },
    };
  }
}
