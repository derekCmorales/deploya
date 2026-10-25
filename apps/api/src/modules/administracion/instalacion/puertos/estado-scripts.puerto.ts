/** `ultimo.json` + `programa.json` de `respaldar.sh` (contrato instalacion.md, Derek SP-19). */
export interface EstadoRespaldo {
  ultimo: Date | null;
  tamanoMb: number | null;
  ruta: string;
  programa: string;
  hora: string;
  conserva: number;
}

/** `version.json` de `actualizar.sh`. */
export interface EstadoVersion {
  instalada: string | null;
  disponible: string | null;
}

/** Lee lo que dejan los scripts en el directorio de respaldos; sin archivos, valores vacíos. */
export abstract class EstadoScriptsPuerto {
  abstract respaldo(): Promise<EstadoRespaldo>;
  abstract version(): Promise<EstadoVersion>;
}
