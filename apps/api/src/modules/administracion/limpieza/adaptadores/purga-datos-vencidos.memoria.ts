import { PurgaDatosVencidosPuerto } from "../puertos/purga-datos-vencidos.puerto";

export interface TokenCuentaGuardado {
  id: string;
  expira: Date;
  usadoEn: Date | null;
}

export interface SesionGuardada {
  id: string;
  ultimaActividad: Date;
  revocadaEn: Date | null;
}

export interface InvitacionGuardada {
  id: string;
  vence: Date;
  usada: Date | null;
  revocada: Date | null;
}

const antesDe = (fecha: Date | null, corte: Date): boolean => fecha !== null && fecha.getTime() < corte.getTime();

/** Doble en memoria con las mismas condiciones que los `deleteMany` del adaptador Prisma. */
export class PurgaDatosVencidosMemoria extends PurgaDatosVencidosPuerto {
  tokens: TokenCuentaGuardado[] = [];
  sesiones: SesionGuardada[] = [];
  invitaciones: InvitacionGuardada[] = [];

  async purgarTokensCuenta(corte: Date): Promise<number> {
    const antes = this.tokens.length;
    this.tokens = this.tokens.filter((t) => !antesDe(t.usadoEn, corte) && !antesDe(t.expira, corte));
    return antes - this.tokens.length;
  }

  async purgarSesiones(revocadasAntesDe: Date, inactivasAntesDe: Date): Promise<number> {
    const antes = this.sesiones.length;
    this.sesiones = this.sesiones.filter((s) => !antesDe(s.revocadaEn, revocadasAntesDe) && !antesDe(s.ultimaActividad, inactivasAntesDe));
    return antes - this.sesiones.length;
  }

  async purgarInvitaciones(corte: Date): Promise<number> {
    const antes = this.invitaciones.length;
    this.invitaciones = this.invitaciones.filter((i) => !antesDe(i.usada, corte) && !antesDe(i.revocada, corte) && !antesDe(i.vence, corte));
    return antes - this.invitaciones.length;
  }
}
