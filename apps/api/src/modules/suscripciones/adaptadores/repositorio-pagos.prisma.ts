import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../compartido/prisma/prisma.service";
import type { PagoHistorial } from "../dominio/comprobante";
import { MONEDA, numeroComprobante, prefijoComprobante, type NuevoPago, type Pago } from "../dominio/pago";
import { RepositorioPagos } from "../puertos/repositorio-pagos.puerto";
import { conceptoAPrisma, INCLUIR_HISTORIAL, pagoDesdePrisma, pagoHistorialDesdePrisma } from "./traduccion-prisma";

/**
 * El número de comprobante sale de contar los aprobados del año dentro de la misma
 * transacción; la `@unique` de `numeroComprobante` rechaza una carrera en vez de duplicar.
 */
@Injectable()
export class RepositorioPagosPrisma extends RepositorioPagos {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  registrar(nuevo: NuevoPago): Promise<Pago> {
    return this.prisma.$transaction(async (tx) => {
      const numero = nuevo.estado === "aprobado" ? await this.siguienteComprobante(tx, nuevo.creado) : null;
      const fila = await tx.pago.create({
        data: { ...nuevo, concepto: conceptoAPrisma(nuevo.concepto), moneda: MONEDA, numeroComprobante: numero },
      });
      return pagoDesdePrisma(fila);
    });
  }

  async deUsuario(usuarioId: string): Promise<PagoHistorial[]> {
    const filas = await this.prisma.pago.findMany({ where: { usuarioId }, include: INCLUIR_HISTORIAL, orderBy: { creado: "desc" } });
    return filas.map(pagoHistorialDesdePrisma);
  }

  async porId(pagoId: string): Promise<PagoHistorial | null> {
    const fila = await this.prisma.pago.findUnique({ where: { id: pagoId }, include: INCLUIR_HISTORIAL });
    return fila ? pagoHistorialDesdePrisma(fila) : null;
  }

  private async siguienteComprobante(tx: Pick<PrismaService, "pago">, creado: Date): Promise<string> {
    const anio = creado.getUTCFullYear();
    const emitidos = await tx.pago.count({ where: { numeroComprobante: { startsWith: prefijoComprobante(anio) } } });
    return numeroComprobante(anio, emitidos + 1);
  }
}
