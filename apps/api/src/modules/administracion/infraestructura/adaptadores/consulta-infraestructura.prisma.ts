import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../compartido/prisma/prisma.service";
import { ESTADOS_EN_COLA } from "../dominio/infraestructura";
import { ConsultaInfraestructuraPuerto, type LecturaInfraestructura } from "../puertos/consulta-infraestructura.puerto";

/** Lectura de 27 en PostgreSQL: cuatro consultas en una transacción de solo lectura. */
@Injectable()
export class ConsultaInfraestructuraPrisma extends ConsultaInfraestructuraPuerto {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async leer(fallidasDesde: Date): Promise<LecturaInfraestructura> {
    const [trabajos, fallidas, proyectos, totalProyectos] = await this.prisma.$transaction([
      this.prisma.despliegue.findMany({
        where: { estado: { in: [...ESTADOS_EN_COLA] } },
        select: { numero: true, estado: true, creado: true, iniciado: true, proyecto: { select: { nombre: true } } },
        orderBy: { creado: "asc" },
      }),
      this.prisma.despliegue.count({ where: { estado: "fallido", terminado: { gte: fallidasDesde } } }),
      this.prisma.proyecto.findMany({
        where: { despliegueActivoId: { not: null } },
        orderBy: { nombre: "asc" },
        select: {
          nombre: true,
          usuario: { select: { correo: true } },
          despliegueActivo: {
            select: { estado: true, muestras: { orderBy: { tomada: "desc" }, take: 1, select: { tomada: true, cpu: true, memoriaMb: true } } },
          },
        },
      }),
      this.prisma.proyecto.count(),
    ]);
    return {
      trabajos: trabajos.map((t) => ({ proyecto: t.proyecto.nombre, numero: t.numero, estado: t.estado, creado: t.creado, iniciado: t.iniciado })),
      fallidas,
      entornos: proyectos.flatMap((p) => {
        if (!p.despliegueActivo) return [];
        const muestra = p.despliegueActivo.muestras[0];
        return [
          {
            proyecto: p.nombre,
            titular: p.usuario.correo,
            estado: p.despliegueActivo.estado,
            muestra: muestra ? { tomada: muestra.tomada, cpu: muestra.cpu.toNumber(), memoriaMb: muestra.memoriaMb } : null,
          },
        ];
      }),
      totalProyectos,
    };
  }
}
