import { Injectable } from "@nestjs/common";
import { Prisma, type Usuario as UsuarioFila } from "@prisma/client";
import { PrismaService } from "../../../compartido/prisma/prisma.service";
import type { EstadoCuenta, NuevoUsuario, Usuario } from "../dominio/cuenta";
import { CorreoYaRegistrado } from "../dominio/errores";
import { RepositorioUsuarios } from "../puertos/repositorio-usuarios.puerto";

const VIOLACION_UNICA = "P2002";
/** La única acción del núcleo que escribe M9 en `AccionAdministrativa` (datos-nucleo.md). */
export const ACCION_SUSPENDER_CUENTA = "suspender-cuenta";

/** La fecha de la suspensión vive en la tabla de M9: se lee solo la acción más reciente. */
const ULTIMA_SUSPENSION = {
  accionesRecibidas: {
    where: { accion: ACCION_SUSPENDER_CUENTA },
    orderBy: { creado: "desc" },
    take: 1,
    select: { creado: true },
  },
} satisfies Prisma.UsuarioInclude;

type FilaUsuario = UsuarioFila & { accionesRecibidas?: { creado: Date }[] };

function usuarioDesdePrisma(fila: FilaUsuario): Usuario {
  return {
    id: fila.id,
    correo: fila.correo,
    nombre: fila.nombre,
    hashContrasena: fila.hashContrasena,
    rol: fila.rol,
    estadoCuenta: fila.estadoCuenta,
    motivoSuspension: fila.motivoSuspension,
    suspendidaDesde: fila.accionesRecibidas?.[0]?.creado ?? null,
    creado: fila.creado,
  };
}

/**
 * `Usuario` en PostgreSQL (DB-01). El correo ya llega normalizado desde el dominio. La fecha
 * de suspensión sale de `AccionAdministrativa` (M9, solo lectura): el servicio no sabe de dónde.
 */
@Injectable()
export class RepositorioUsuariosPrisma extends RepositorioUsuarios {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async porCorreo(correo: string): Promise<Usuario | null> {
    const fila = await this.prisma.usuario.findUnique({ where: { correo }, include: ULTIMA_SUSPENSION });
    return fila ? usuarioDesdePrisma(fila) : null;
  }

  async porId(id: string): Promise<Usuario | null> {
    const fila = await this.prisma.usuario.findUnique({ where: { id }, include: ULTIMA_SUSPENSION });
    return fila ? usuarioDesdePrisma(fila) : null;
  }

  /** El índice único de `correo` decide si dos registros simultáneos chocan. */
  async crear(usuario: NuevoUsuario): Promise<Usuario> {
    try {
      return usuarioDesdePrisma(await this.prisma.usuario.create({ data: usuario }));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === VIOLACION_UNICA) {
        throw new CorreoYaRegistrado(usuario.correo);
      }
      throw error;
    }
  }

  async cambiarEstado(id: string, estado: EstadoCuenta): Promise<void> {
    await this.prisma.usuario.update({ where: { id }, data: { estadoCuenta: estado } });
  }

  async cambiarHash(id: string, hashContrasena: string): Promise<void> {
    await this.prisma.usuario.update({ where: { id }, data: { hashContrasena } });
  }
}
