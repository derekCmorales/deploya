import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../compartido/prisma/prisma.service";
import { estadoAPrisma, estadoDesdePrisma } from "../../suscripciones/adaptadores/traduccion-prisma";
import { ACCION_SUSPENDER_CUENTA } from "../dominio/suspension";
import {
  contenedoresDetenidos,
  PAGOS_EN_DETALLE,
  USUARIOS_POR_PAGINA,
  type DetalleUsuario,
  type FilaUsuario,
  type FiltroUsuarios,
  type PaginaUsuarios,
} from "../dominio/usuarios";
import { ConsultaUsuariosPuerto } from "../puertos/consulta-usuarios.puerto";

const FILA = { suscripcion: { include: { plan: { select: { nombre: true } } } } } satisfies Prisma.UsuarioInclude;

/** Todo el panel de detalle en una sola consulta con `include`. */
const DETALLE = {
  ...FILA,
  proyectos: { orderBy: { creado: "asc" }, include: { despliegueActivo: { select: { estado: true } } } },
  pagos: { orderBy: { creado: "desc" }, take: PAGOS_EN_DETALLE, include: { plan: { select: { nombre: true } } } },
  sesiones: { orderBy: { ultimaActividad: "desc" }, take: 1, select: { ultimaActividad: true } },
  accionesRecibidas: { where: { accion: ACCION_SUSPENDER_CUENTA }, orderBy: { creado: "desc" }, take: 1, select: { creado: true } },
} satisfies Prisma.UsuarioInclude;

type FilaPrisma = Prisma.UsuarioGetPayload<{ include: typeof FILA }>;
type DetallePrisma = Prisma.UsuarioGetPayload<{ include: typeof DETALLE }>;

function filaDesdePrisma(fila: FilaPrisma): FilaUsuario {
  return {
    id: fila.id,
    correo: fila.correo,
    nombre: fila.nombre,
    rol: fila.rol,
    estadoCuenta: fila.estadoCuenta,
    plan: fila.suscripcion?.plan.nombre ?? null,
    suscripcion: fila.suscripcion ? estadoDesdePrisma(fila.suscripcion.estado) : null,
    creado: fila.creado,
  };
}

function detalleDesdePrisma(fila: DetallePrisma): DetalleUsuario {
  const proyectos = fila.proyectos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    subdominio: p.subdominio,
    despliegue: p.despliegueActivo?.estado ?? null,
  }));
  return {
    ...filaDesdePrisma(fila),
    ultimoAcceso: fila.sesiones[0]?.ultimaActividad ?? null,
    vence: fila.suscripcion?.vence ?? null,
    suspension:
      fila.estadoCuenta === "suspendida"
        ? { desde: fila.accionesRecibidas[0]?.creado ?? null, motivo: fila.motivoSuspension, contenedoresDetenidos: contenedoresDetenidos(proyectos) }
        : null,
    proyectos,
    pagos: fila.pagos.map((p) => ({
      id: p.id,
      fecha: p.creado,
      plan: p.plan.nombre,
      vigenciaDias: p.vigenciaDias,
      monto: p.monto.toNumber(),
      moneda: p.moneda,
      estado: p.estado,
    })),
  };
}

export function condicionDe(filtro: FiltroUsuarios): Prisma.UsuarioWhereInput {
  return {
    ...(filtro.correo ? { correo: { contains: filtro.correo, mode: "insensitive" } } : {}),
    ...(filtro.suscripcion ? { suscripcion: { is: { estado: estadoAPrisma(filtro.suscripcion) } } } : {}),
  };
}

/** Lectura de 25 en PostgreSQL: la lista cuenta el total aparte (índice único por correo). */
@Injectable()
export class ConsultaUsuariosPrisma extends ConsultaUsuariosPuerto {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async buscar(filtro: FiltroUsuarios): Promise<PaginaUsuarios> {
    const where = condicionDe(filtro);
    const [total, filas] = await this.prisma.$transaction([
      this.prisma.usuario.count({ where }),
      this.prisma.usuario.findMany({
        where,
        include: FILA,
        orderBy: { creado: "desc" },
        skip: (filtro.pagina - 1) * USUARIOS_POR_PAGINA,
        take: USUARIOS_POR_PAGINA,
      }),
    ]);
    return { total, pagina: filtro.pagina, porPagina: USUARIOS_POR_PAGINA, usuarios: filas.map(filaDesdePrisma) };
  }

  async detalle(usuarioId: string): Promise<DetalleUsuario | null> {
    const fila = await this.prisma.usuario.findUnique({ where: { id: usuarioId }, include: DETALLE });
    return fila ? detalleDesdePrisma(fila) : null;
  }
}
