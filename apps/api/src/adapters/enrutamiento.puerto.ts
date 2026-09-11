/** Puerto DIP — subdominio, TLS, conmutación. Sin prefijo I. */
export abstract class EnrutamientoPuerto {
  abstract publicar(opts: {
    contenedorId: string;
    fqdn: string;
  }): Promise<{ certificado: boolean }>;
}
