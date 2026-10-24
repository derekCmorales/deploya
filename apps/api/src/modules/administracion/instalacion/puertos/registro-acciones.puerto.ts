/** Una fila de `AccionAdministrativa` sobre la instalación: el afectado es el mismo administrador. */
export interface AccionInstalacion {
  adminId: string;
  accion: string;
  detalle: string;
  creado: Date;
}

/** Registro de auditoría de Admin · Instalación (SP-18). */
export abstract class RegistroAccionesPuerto {
  abstract registrar(accion: AccionInstalacion): Promise<void>;
}
