import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../compartido/prisma/prisma.service";
import { ID_INSTALACION } from "../../../suscripciones/modo/configuracion-instalacion";
import type { UltimaLimpieza } from "../dominio/politica-limpieza";
import { RegistroLimpiezaPuerto } from "../puertos/registro-limpieza.puerto";

/** `ultimaLimpieza` y `filasLimpiadas` en la fila única de `ConfiguracionInstalacion`. */
@Injectable()
export class RegistroLimpiezaPrisma extends RegistroLimpiezaPuerto {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async guardar(limpieza: UltimaLimpieza): Promise<void> {
    await this.prisma.configuracionInstalacion.upsert({ where: { id: ID_INSTALACION }, create: { ...limpieza, id: ID_INSTALACION }, update: limpieza });
  }

  async ultima(): Promise<UltimaLimpieza | null> {
    const fila = await this.prisma.configuracionInstalacion.findUnique({
      where: { id: ID_INSTALACION },
      select: { ultimaLimpieza: true, filasLimpiadas: true },
    });
    if (!fila?.ultimaLimpieza || fila.filasLimpiadas === null) return null;
    return { ultimaLimpieza: fila.ultimaLimpieza, filasLimpiadas: fila.filasLimpiadas };
  }
}
