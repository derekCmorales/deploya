import { Injectable } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import { RepositorioDespliegues } from "../../construccion/puertos/repositorio-despliegues.puerto";
import { CuotaPlanPuerto } from "../../orquestacion/puertos/cuota-plan.puerto";
import { CuotaProyectosPuerto } from "../../proyectos/puertos/cuota-proyectos.puerto";
import { ProyectosLecturaPuerto } from "../../construccion/puertos/proyectos-lectura.puerto";
import { periodoDe, type PeriodoConsumo } from "../dominio/periodo";

export interface ConsumoPeriodoDto {
  periodo: PeriodoConsumo;
  proyectos: { usados: number; limite: number };
  construcciones: { usadas: number; limite: number };
}

export interface ConsumoDiarioDto {
  desde: string;
  reinicia: string;
  cuota: number;
  diarios: number[];
}

@Injectable()
export class ConsumoService {
  constructor(
    private readonly reloj: Reloj,
    private readonly despliegues: RepositorioDespliegues,
    private readonly proyectosLectura: ProyectosLecturaPuerto,
    private readonly cuotaPlan: CuotaPlanPuerto,
    private readonly cuotaProyectos: CuotaProyectosPuerto,
  ) {}

  async de(usuarioId: string): Promise<ConsumoPeriodoDto> {
    const hoy = this.reloj.ahora();
    const periodo = periodoDe(hoy);

    const [proyectosUsuario, permiso, cuotaProj, usadasConstrucciones] = await Promise.all([
      this.proyectosLectura.deUsuario(usuarioId),
      this.cuotaPlan.permisoDe(usuarioId),
      this.cuotaProyectos.cuotaDe(usuarioId),
      this.despliegues.contarConstruccionesDesde(usuarioId, periodo.desde),
    ]);

    return {
      periodo,
      proyectos: {
        usados: proyectosUsuario.length,
        limite: cuotaProj.maxProyectos,
      },
      construcciones: {
        usadas: usadasConstrucciones,
        limite: permiso.construccionesMes,
      },
    };
  }

  async diario(usuarioId: string): Promise<ConsumoDiarioDto> {
    const hoy = this.reloj.ahora();
    const periodo = periodoDe(hoy);
    const permiso = await this.cuotaPlan.permisoDe(usuarioId);

    const historial = await this.despliegues.historialDe(usuarioId, "todos", 100, 0);
    
    const vigentes = historial.filter((d: any) => {
      const fecha = new Date(d.fecha ?? d.creadoEn);
      return fecha >= periodo.desde && fecha < periodo.reinicia && !d.esReversion;
    });

    const anio = hoy.getUTCFullYear();
    const mes = hoy.getUTCMonth();
    const diasDelMes = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
    const diaActual = hoy.getUTCDate();

    const conteoDiario = new Array(Math.min(diaActual, diasDelMes)).fill(0);

    for (const d of vigentes) {
      const fechaDespliegue = new Date(d.fecha ?? d.creadoEn);
      const dia = fechaDespliegue.getUTCDate();
      if (dia >= 1 && dia <= conteoDiario.length) {
        conteoDiario[dia - 1]++;
      }
    }

    return {
      desde: periodo.desde.toISOString(),
      reinicia: periodo.reinicia.toISOString(),
      cuota: permiso.construccionesMes,
      diarios: conteoDiario,
    };
  }
}