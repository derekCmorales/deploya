import { Injectable } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import { cortesDeLimpieza, totalPurgado, type FilasPurgadas } from "./dominio/politica-limpieza";
import { PurgaDatosVencidosPuerto } from "./puertos/purga-datos-vencidos.puerto";
import { RegistroLimpiezaPuerto } from "./puertos/registro-limpieza.puerto";

/** `POST /admin/limpieza/ejecutar` y la tarea diaria. */
export interface ResultadoLimpieza {
  ejecutada: Date;
  filas: FilasPurgadas & { total: number };
}

/**
 * Service Layer de la limpieza diaria (EST-01b): la política da las fechas de corte, el puerto
 * borra y el registro guarda cuándo corrió y cuántas filas borró. Correrla dos veces el mismo día
 * no falla: la segunda borra 0.
 */
@Injectable()
export class LimpiezaService {
  constructor(
    private readonly purga: PurgaDatosVencidosPuerto,
    private readonly registro: RegistroLimpiezaPuerto,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(): Promise<ResultadoLimpieza> {
    const ahora = this.reloj.ahora();
    const cortes = cortesDeLimpieza(ahora);
    const tokens = await this.purga.purgarTokensCuenta(cortes.tokens);
    const sesiones = await this.purga.purgarSesiones(cortes.sesionesRevocadas, cortes.sesionesInactivas);
    const invitaciones = await this.purga.purgarInvitaciones(cortes.invitaciones);
    const filas = { tokens, sesiones, invitaciones };
    const total = totalPurgado(filas);
    await this.registro.guardar({ ultimaLimpieza: ahora, filasLimpiadas: total });
    return { ejecutada: ahora, filas: { ...filas, total } };
  }
}
