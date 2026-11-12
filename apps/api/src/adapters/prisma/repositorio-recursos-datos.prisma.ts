import { Injectable } from "@nestjs/common";
import { Prisma, type RecursoDatos as RecursoDatosFila } from "@prisma/client";
import { PrismaService } from "../../compartido/prisma/prisma.service";
import { TipoYaConectado } from "../../modules/datos/dominio/errores";
import type { EstadoRecursoDatos, NuevoRecursoDatos, RecursoDatos } from "../../modules/datos/dominio/recurso-datos";
import { RepositorioRecursosDatos } from "../../modules/datos/puertos/repositorio-recursos-datos.puerto";

const VIOLACION_UNICA = "P2002";
const CON_COMPARTIDOS = { compartidos: { select: { proyectoId: true }, orderBy: { creado: "asc" } } } as const;

type FilaConCompartidos = RecursoDatosFila & { compartidos: { proyectoId: string }[] };

export function recursoDesdePrisma(fila: FilaConCompartidos): RecursoDatos {
  return {
    id: fila.id,
    proyectoId: fila.proyectoId,
    tipo: fila.tipo,
    estado: fila.estado,
    detalle: fila.detalle,
    contenedor: fila.contenedor,
    volumen: fila.volumen,
    contrasenaCifrada: fila.contrasenaCifrada,
    usoDiscoMb: fila.usoDiscoMb,
    medidoEn: fila.medidoEn,
    creado: fila.creado,
    compartidoCon: fila.compartidos.map((c) => c.proyectoId),
  };
}

/** Recursos de datos en PostgreSQL; las filas de compartido caen en cascada con el recurso o el proyecto. */
@Injectable()
export class RepositorioRecursosDatosPrisma extends RepositorioRecursosDatos {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async crear(nuevo: NuevoRecursoDatos): Promise<RecursoDatos> {
    try {
      return recursoDesdePrisma(await this.prisma.recursoDatos.create({ data: nuevo, include: CON_COMPARTIDOS }));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === VIOLACION_UNICA) throw new TipoYaConectado(nuevo.tipo);
      throw error;
    }
  }

  async porId(id: string): Promise<RecursoDatos | null> {
    const fila = await this.prisma.recursoDatos.findUnique({ where: { id }, include: CON_COMPARTIDOS });
    return fila ? recursoDesdePrisma(fila) : null;
  }

  async conectadosA(proyectoId: string): Promise<RecursoDatos[]> {
    const filas = await this.prisma.recursoDatos.findMany({
      where: { OR: [{ proyectoId }, { compartidos: { some: { proyectoId } } }] },
      include: CON_COMPARTIDOS,
      orderBy: { creado: "asc" },
    });
    return filas.map(recursoDesdePrisma);
  }

  async deDuenos(proyectoIds: readonly string[]): Promise<RecursoDatos[]> {
    if (proyectoIds.length === 0) return [];
    const filas = await this.prisma.recursoDatos.findMany({ where: { proyectoId: { in: [...proyectoIds] } }, include: CON_COMPARTIDOS });
    return filas.map(recursoDesdePrisma);
  }

  async disponibles(): Promise<RecursoDatos[]> {
    const filas = await this.prisma.recursoDatos.findMany({ where: { estado: "disponible" }, include: CON_COMPARTIDOS });
    return filas.map(recursoDesdePrisma);
  }

  async compartir(recursoId: string, proyectoId: string): Promise<void> {
    await this.prisma.recursoDatosCompartido.upsert({
      where: { recursoId_proyectoId: { recursoId, proyectoId } },
      create: { recursoId, proyectoId },
      update: {},
    });
  }

  async dejarDeCompartir(recursoId: string, proyectoId: string): Promise<void> {
    await this.prisma.recursoDatosCompartido.deleteMany({ where: { recursoId, proyectoId } });
  }

  async cambiarEstado(id: string, estado: EstadoRecursoDatos, detalle: string | null = null): Promise<void> {
    await this.prisma.recursoDatos.updateMany({ where: { id }, data: { estado, detalle } });
  }

  async registrarUso(id: string, usoDiscoMb: number, medidoEn: Date): Promise<void> {
    await this.prisma.recursoDatos.updateMany({ where: { id }, data: { usoDiscoMb, medidoEn } });
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.recursoDatos.deleteMany({ where: { id } });
  }
}
