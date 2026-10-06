import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../compartido/prisma/prisma.service";
import type { Despliegue, LineaBitacora } from "../../modules/construccion/dominio/despliegue";
import { DespliegueNoEncontrado } from "../../modules/construccion/dominio/errores";
import { ETAPAS, type EstadoDespliegue, type EstadoEtapa, type Etapa } from "../../modules/construccion/dominio/estados";
import {
  RepositorioDespliegues,
  type CambiosDespliegue,
  type NuevoDespliegue,
} from "../../modules/construccion/puertos/repositorio-despliegues.puerto";
import { despliegueDesdePrisma, estadoEtapaAPrisma, lineaDesdePrisma } from "./traduccion-motor";

const CON_ETAPAS = { etapas: true } as const;
const VIOLACION_UNICA = "P2002";
const REGISTRO_INEXISTENTE = "P2025";
const INTENTOS_NUMERACION = 3;

function datosDe(estado: EstadoDespliegue, cambios: CambiosDespliegue): Prisma.DespliegueUpdateInput {
  const { commit, artefactoId, ...resto } = cambios;
  return {
    ...resto,
    estado,
    ...(commit ? { commitSha: commit.sha, commitMensaje: commit.mensaje, commitAutor: commit.autor } : {}),
    ...(artefactoId ? { artefacto: { connect: { id: artefactoId } } } : {}),
  };
}

/**
 * Agregado Despliegue en PostgreSQL (DB-01). Es lo que comparten la API, que registra y
 * lee, y el trabajador, que avanza el pipeline: sin esto cada proceso vería su propia memoria.
 */
@Injectable()
export class RepositorioDesplieguesPrisma extends RepositorioDespliegues {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async crear(nuevo: NuevoDespliegue): Promise<Despliegue> {
    for (let intento = 1; ; intento++) {
      try {
        return await this.crearConSiguienteNumero(nuevo);
      } catch (error) {
        const choque = error instanceof Prisma.PrismaClientKnownRequestError && error.code === VIOLACION_UNICA;
        if (!choque || intento >= INTENTOS_NUMERACION) throw error;
      }
    }
  }

  async porId(id: string): Promise<Despliegue | null> {
    const fila = await this.prisma.despliegue.findUnique({ where: { id }, include: CON_ETAPAS });
    return fila ? despliegueDesdePrisma(fila) : null;
  }

  async porNumero(proyectoId: string, numero: number): Promise<Despliegue | null> {
    const fila = await this.prisma.despliegue.findUnique({
      where: { proyectoId_numero: { proyectoId, numero } },
      include: CON_ETAPAS,
    });
    return fila ? despliegueDesdePrisma(fila) : null;
  }

  async cambiarEstado(id: string, estado: EstadoDespliegue, cambios: CambiosDespliegue = {}): Promise<void> {
    try {
      await this.prisma.despliegue.update({ where: { id }, data: datosDe(estado, cambios) });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === REGISTRO_INEXISTENTE) throw new DespliegueNoEncontrado(id);
      throw error;
    }
  }

  async marcarEtapa(id: string, etapa: Etapa, estado: EstadoEtapa, marca: Date): Promise<void> {
    await this.prisma.etapaDespliegue.updateMany({
      where: { despliegueId: id, etapa },
      data: {
        estado: estadoEtapaAPrisma(estado),
        ...(estado === "en-curso" ? { iniciada: marca } : {}),
        ...(estado === "completada" || estado === "fallida" ? { terminada: marca } : {}),
      },
    });
  }

  async agregarLineas(id: string, lineas: LineaBitacora[]): Promise<void> {
    if (lineas.length === 0) return;
    await this.prisma.lineaBitacora.createMany({
      data: lineas.map((l) => ({ despliegueId: id, n: l.n, marca: l.marca, etapa: l.etapa, nivel: l.nivel, texto: l.texto })),
      skipDuplicates: true,
    });
  }

  async lineasDesde(id: string, desde: number, limite: number): Promise<LineaBitacora[]> {
    const filas = await this.prisma.lineaBitacora.findMany({
      where: { despliegueId: id, n: { gt: desde } },
      orderBy: { n: "asc" },
      take: limite,
    });
    return filas.map(lineaDesdePrisma);
  }

  async ultimosDe(proyectoIds: string[]): Promise<Despliegue[]> {
    if (proyectoIds.length === 0) return [];
    const filas = await this.prisma.despliegue.findMany({
      where: { proyectoId: { in: proyectoIds } },
      orderBy: [{ proyectoId: "asc" }, { numero: "desc" }],
      distinct: ["proyectoId"],
      include: CON_ETAPAS,
    });
    return filas.map(despliegueDesdePrisma);
  }

  async activoDe(proyectoId: string): Promise<Despliegue | null> {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      select: { despliegueActivo: { include: CON_ETAPAS } },
    });
    return proyecto?.despliegueActivo ? despliegueDesdePrisma(proyecto.despliegueActivo) : null;
  }

  async marcarActivo(proyectoId: string, despliegueId: string): Promise<void> {
    await this.prisma.proyecto.update({ where: { id: proyectoId }, data: { despliegueActivoId: despliegueId } });
  }

  private async crearConSiguienteNumero(nuevo: NuevoDespliegue): Promise<Despliegue> {
    return this.prisma.$transaction(async (tx) => {
      const maximo = await tx.despliegue.aggregate({ where: { proyectoId: nuevo.proyectoId }, _max: { numero: true } });
      const fila = await tx.despliegue.create({
        data: {
          proyectoId: nuevo.proyectoId,
          numero: (maximo._max.numero ?? 0) + 1,
          estado: nuevo.estado,
          disparador: nuevo.disparador,
          rama: nuevo.rama,
          creado: nuevo.creado,
          etapas: { create: ETAPAS.map((etapa) => ({ etapa })) },
        },
        include: CON_ETAPAS,
      });
      return despliegueDesdePrisma(fila);
    });
  }
}
