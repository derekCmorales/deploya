import type { DetalleUsuario, FiltroUsuarios, PaginaUsuarios } from "../dominio/usuarios";

/**
 * Repository de lectura de 25 (CQRS ligero): una vista de cuentas, suscripciones, proyectos y
 * pagos sin pasar por los servicios de cuatro módulos.
 */
export abstract class ConsultaUsuariosPuerto {
  abstract buscar(filtro: FiltroUsuarios): Promise<PaginaUsuarios>;
  abstract detalle(usuarioId: string): Promise<DetalleUsuario | null>;
}
