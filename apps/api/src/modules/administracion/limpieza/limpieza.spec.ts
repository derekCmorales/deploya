import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { Reflector } from "@nestjs/core";
import { RelojFijo } from "../../../compartido/reloj";
import type { UsuarioSesion } from "../../identidad/dominio/sesion";
import { RolGuard, SOLO_ADMINISTRACION } from "../../identidad/rol.guard";
import { SesionGuard } from "../../identidad/sesion.guard";
import { PurgaDatosVencidosMemoria } from "./adaptadores/purga-datos-vencidos.memoria";
import { RegistroLimpiezaMemoria } from "./adaptadores/registro-limpieza.memoria";
import { ColaLimpiezaMemoria } from "./cola-limpieza.memoria";
import { cortesDeLimpieza } from "./dominio/politica-limpieza";
import { LimpiezaController } from "./limpieza.controller";
import { LimpiezaService } from "./limpieza.service";
import { TareaLimpiezaDiaria } from "./tarea-limpieza-diaria";

const AHORA = new Date("2026-11-07T00:35:00.000Z");
const DIA_MS = 24 * 60 * 60 * 1000;
const haceDias = (dias: number) => new Date(AHORA.getTime() - dias * DIA_MS);
const enDias = (dias: number) => new Date(AHORA.getTime() + dias * DIA_MS);

const CLIENTE: UsuarioSesion = { id: "u-cliente", correo: "cliente@deploya.app", nombre: "Cliente Demo", rol: "cliente" };

function armar() {
  const purga = new PurgaDatosVencidosMemoria();
  const registro = new RegistroLimpiezaMemoria();
  const limpieza = new LimpiezaService(purga, registro, new RelojFijo(AHORA));
  return { purga, registro, limpieza };
}

function contextoEjecutar(usuario: UsuarioSesion): ExecutionContext {
  return {
    getClass: () => LimpiezaController,
    getHandler: () => LimpiezaController.prototype.ejecutar,
    switchToHttp: () => ({ getRequest: () => ({ headers: {}, usuario }) }),
  } as unknown as ExecutionContext;
}

describe("EST-01b · Limpieza diaria", () => {
  it("Borra lo vencido", async () => {
    const { purga, registro, limpieza } = armar();
    purga.tokens = [{ id: "t-usado", expira: haceDias(7.9), usadoEn: haceDias(8) }];
    purga.sesiones = [{ id: "s-inactiva", ultimaActividad: haceDias(15), revocadaEn: null }];
    purga.invitaciones = [{ id: "i-vencida", vence: haceDias(31), usada: null, revocada: null }];

    const resultado = await limpieza.ejecutar();

    expect([purga.tokens, purga.sesiones, purga.invitaciones]).toEqual([[], [], []]);
    expect(resultado).toEqual({ ejecutada: AHORA, filas: { tokens: 1, sesiones: 1, invitaciones: 1, total: 3 } });
    expect(registro.guardada).toEqual({ ultimaLimpieza: AHORA, filasLimpiadas: 3 });
  });

  it("Respeta lo vigente", async () => {
    const { purga, registro, limpieza } = armar();
    purga.tokens = [{ id: "t-vencido-hace-2", expira: haceDias(2), usadoEn: null }];
    purga.sesiones = [{ id: "s-de-ayer", ultimaActividad: haceDias(1), revocadaEn: null }];

    const resultado = await limpieza.ejecutar();

    expect(purga.tokens.map((t) => t.id)).toEqual(["t-vencido-hace-2"]);
    expect(purga.sesiones.map((s) => s.id)).toEqual(["s-de-ayer"]);
    expect(resultado.filas.total).toBe(0);
    expect(registro.guardada).toEqual({ ultimaLimpieza: AHORA, filasLimpiadas: 0 });
  });

  it("Correr dos veces el mismo día", async () => {
    const { purga, registro, limpieza } = armar();
    purga.sesiones = [{ id: "s-revocada", ultimaActividad: haceDias(8), revocadaEn: haceDias(8) }];

    await expect(limpieza.ejecutar()).resolves.toMatchObject({ filas: { total: 1 } });
    await expect(limpieza.ejecutar()).resolves.toMatchObject({ filas: { tokens: 0, sesiones: 0, invitaciones: 0, total: 0 } });
    expect(registro.guardada).toEqual({ ultimaLimpieza: AHORA, filasLimpiadas: 0 });
  });

  it("Cliente no puede", () => {
    const guard = new RolGuard(new Reflector());

    expect(Reflect.getMetadata(GUARDS_METADATA, LimpiezaController)).toEqual([SesionGuard, RolGuard]);
    let error: unknown = null;
    try {
      guard.canActivate(contextoEjecutar(CLIENTE));
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ForbiddenException);
    expect((error as ForbiddenException).getStatus()).toBe(403);
    expect((error as ForbiddenException).getResponse()).toEqual(SOLO_ADMINISTRACION);
  });

  it("los plazos: tokens y sesiones revocadas 7 días, sesiones inactivas 14, invitaciones 30", () => {
    expect(cortesDeLimpieza(AHORA)).toEqual({
      tokens: haceDias(7),
      sesionesRevocadas: haceDias(7),
      sesionesInactivas: haceDias(14),
      invitaciones: haceDias(30),
    });
  });

  it("no borra un token sin usar que vence en el futuro, ni invitaciones usadas o revocadas hace menos de 30 días", async () => {
    const { purga, limpieza } = armar();
    purga.tokens = [{ id: "t-vigente", expira: enDias(1), usadoEn: null }];
    purga.sesiones = [{ id: "s-revocada-ayer", ultimaActividad: haceDias(1), revocadaEn: haceDias(1) }];
    purga.invitaciones = [
      { id: "i-usada-hace-10", vence: enDias(1), usada: haceDias(10), revocada: null },
      { id: "i-revocada-hace-31", vence: enDias(1), usada: null, revocada: haceDias(31) },
    ];

    await expect(limpieza.ejecutar()).resolves.toMatchObject({ filas: { tokens: 0, sesiones: 0, invitaciones: 1, total: 1 } });
    expect(purga.invitaciones.map((i) => i.id)).toEqual(["i-usada-hace-10"]);
  });

  it("el administrador la corre desde POST /admin/limpieza/ejecutar", async () => {
    const { limpieza } = armar();

    await expect(new LimpiezaController(limpieza).ejecutar()).resolves.toEqual({
      ejecutada: AHORA,
      filas: { tokens: 0, sesiones: 0, invitaciones: 0, total: 0 },
    });
  });

  it("la tarea diaria se programa al arrancar el trabajador y entrega cada corrida al servicio", async () => {
    const { purga, registro, limpieza } = armar();
    purga.tokens = [{ id: "t-usado", expira: haceDias(9), usadoEn: haceDias(9) }];
    const cola = new ColaLimpiezaMemoria();
    const tarea = new TareaLimpiezaDiaria(cola, limpieza);

    await tarea.onApplicationBootstrap();
    expect(cola.programada).toBe(true);
    await cola.correr();
    expect(registro.guardada).toEqual({ ultimaLimpieza: AHORA, filasLimpiadas: 1 });

    await tarea.onModuleDestroy();
    expect(cola.programada).toBe(false);
    await expect(cola.correr()).rejects.toThrow("no está programada");
  });

  it("sin registro todavía, la última limpieza es null", async () => {
    await expect(new RegistroLimpiezaMemoria().ultima()).resolves.toBeNull();
  });
});
