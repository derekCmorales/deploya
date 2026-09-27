export interface RutaPublica {
  subdominio: string;
  host: string;
  puerto: number;
}

/** Puerto DIP — subdominio, TLS y conmutación en el enrutador de borde. Sin prefijo I. */
export abstract class EnrutamientoPuerto {
  abstract publicar(ruta: RutaPublica): Promise<{ url: string }>;
  abstract retirar(subdominio: string): Promise<void>;
}
