import { SetMetadata } from "@nestjs/common";
import type { Rol } from "./dominio/cuenta";

/** Clave de los metadatos que lee `RolGuard`. */
export const ROLES_PERMITIDOS = "identidad:roles-permitidos";

/**
 * Roles que pueden usar una ruta o un controlador: `@Roles("administrador")`.
 * Va junto a `@UseGuards(SesionGuard, RolGuard)`; sin `@Roles` la ruta no exige rol.
 */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_PERMITIDOS, roles);
