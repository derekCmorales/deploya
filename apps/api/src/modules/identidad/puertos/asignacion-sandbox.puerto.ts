/**
 * Puerto estrecho hacia M2 (`SuscripcionesService.asignarSandbox`, Javier). Hasta que M2
 * lo publique, un stub cumple el contrato y se cambia el binding sin tocar el servicio.
 */
export abstract class AsignacionSandboxPuerto {
  abstract asignarSandbox(usuarioId: string): Promise<void>;
}
