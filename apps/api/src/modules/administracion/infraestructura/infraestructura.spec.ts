import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { Reflector } from "@nestjs/core";
import { Prisma } from "@prisma/client";
import { MetricasNodoStub } from "../../../adapters/stubs/metricas-nodo.stub";
import type { PrismaService } from "../../../compartido/prisma/prisma.service";
import { RelojFijo } from "../../../compartido/reloj";
import type { UsuarioSesion } from "../../identidad/dominio/sesion";
import { RolGuard, SOLO_ADMINISTRACION } from "../../identidad/rol.guard";
import { SesionGuard } from "../../identidad/sesion.guard";
import { ConsultaInfraestructuraMemoria } from "./adaptadores/consulta-infraestructura.memoria";
import { ConsultaInfraestructuraPrisma } from "./adaptadores/consulta-infraestructura.prisma";
import { ESTADOS_EN_COLA, VENTANA_FALLIDAS_MS, VIGENCIA_MUESTRA_MS } from "./dominio/infraestructura";
import { InfraestructuraAdminController } from "./infraestructura-admin.controller";
import { InfraestructuraService } from "./infraestructura.service";
import type { LecturaInfraestructura } from "./puertos/consulta-infraestructura.puerto";

const AHORA = new Date("2026-10-20T10:42:00.000Z");
const SEGUNDO_MS = 1000;
const hace = (segundos: number) => new Date(AHORA.getTime() - segundos * SEGUNDO_MS);
const CLIENTE: UsuarioSesion = { id: "u-derek", correo: "derek@tiendademo.com", nombre: "Derek Calderón", rol: "cliente" };

function armar(lectura?: LecturaInfraestructura) {
  const nodo = new MetricasNodoStub();
  const consulta = new ConsultaInfraestructuraMemoria(lectura);
  const servicio = new InfraestructuraService(nodo, consulta, new RelojFijo(AHORA));
  return { nodo, consulta, servicio, controlador: new InfraestructuraAdminController(servicio) };
}

function contexto(usuario: UsuarioSesion): ExecutionContext {
  return {
    getClass: () => InfraestructuraAdminController,
    getHandler: () => InfraestructuraAdminController.prototype.leer,
    switchToHttp: () => ({ getRequest: () => ({ headers: {}, usuario }) }),
  } as unknown as ExecutionContext;
}

describe("Admin · Infraestructura (SP-13)", () => {
  it("Vista del nodo", async () => {
    const { controlador } = armar();

    const vista = await controlador.leer();

    expect(vista.nodo).toEqual({ cpu: { usado: 1.24, total: 2 }, memoriaMb: { usado: 2662, total: 4096 }, discoGb: { usado: 31, total: 80 } });
    expect(vista.tomado).toEqual(AHORA);
  });

  it("Cola atascada", async () => {
    const { controlador } = armar({
      trabajos: [
        { proyecto: "landing-finca", numero: 9, estado: "encolado", creado: hace(65), iniciado: null },
        { proyecto: "bot-reservas", numero: 1, estado: "encolado", creado: hace(40), iniciado: null },
        { proyecto: "panel-admin", numero: 4, estado: "encolado", creado: hace(10), iniciado: null },
      ],
      fallidas: 0,
      entornos: [],
      totalProyectos: 3,
    });

    const { cola } = await controlador.leer();

    expect(cola.enEspera).toBe(3);
    expect(cola.enCurso).toBe(0);
    expect(cola.trabajos.map((t) => [t.proyecto, t.ms])).toEqual([
      ["landing-finca", 65_000],
      ["bot-reservas", 40_000],
      ["panel-admin", 10_000],
    ]);
  });

  it("Cliente no puede", () => {
    const guard = new RolGuard(new Reflector());

    let error: unknown = null;
    try {
      guard.canActivate(contexto(CLIENTE));
    } catch (e) {
      error = e;
    }

    expect(Reflect.getMetadata(GUARDS_METADATA, InfraestructuraAdminController)).toEqual([SesionGuard, RolGuard]);
    expect(error).toBeInstanceOf(ForbiddenException);
    expect((error as ForbiddenException).getResponse()).toEqual(SOLO_ADMINISTRACION);
  });

  it("lo que corre va primero y cuenta desde que empezó; las fallidas son de las últimas 24 h", async () => {
    const { consulta, servicio } = armar({
      trabajos: [
        { proyecto: "bot-reservas", numero: 1, estado: "encolado", creado: hace(40), iniciado: null },
        { proyecto: "api-tienda", numero: 15, estado: "construyendo", creado: hace(120), iniciado: hace(72) },
      ],
      fallidas: 3,
      entornos: [],
      totalProyectos: 2,
    });

    const { cola } = await servicio.leer();

    expect(consulta.fallidasDesde).toEqual(new Date(AHORA.getTime() - VENTANA_FALLIDAS_MS));
    expect(cola).toEqual({
      enEspera: 1,
      enCurso: 1,
      fallidas24h: 3,
      trabajos: [
        { proyecto: "api-tienda", numero: 15, estado: "construyendo", ms: 72_000 },
        { proyecto: "bot-reservas", numero: 1, estado: "encolado", ms: 40_000 },
      ],
    });
  });

  it("cada entorno lleva su última muestra si es reciente; una vieja o ausente va vacía", async () => {
    const { servicio } = armar({
      trabajos: [],
      fallidas: 0,
      entornos: [
        { proyecto: "api-tienda", titular: "derek@tiendademo.com", estado: "saludable", muestra: { tomada: hace(30), cpu: 0.12, memoriaMb: 430 } },
        { proyecto: "menu-aurora", titular: "maria.rios@cafeteriaaurora.com", estado: "detenido", muestra: { tomada: new Date(AHORA.getTime() - VIGENCIA_MUESTRA_MS - 1), cpu: 0.3, memoriaMb: 200 } },
        { proyecto: "landing", titular: "pedro.castillo@fincaelsol.com", estado: "saludable", muestra: null },
      ],
      totalProyectos: 41,
    });

    const vista = await servicio.leer();

    expect(vista.totalProyectos).toBe(41);
    expect(vista.entornos).toEqual([
      { proyecto: "api-tienda", titular: "derek@tiendademo.com", estado: "saludable", cpu: 0.12, memoriaMb: 430 },
      { proyecto: "menu-aurora", titular: "maria.rios@cafeteriaaurora.com", estado: "detenido", cpu: null, memoriaMb: null },
      { proyecto: "landing", titular: "pedro.castillo@fincaelsol.com", estado: "saludable", cpu: null, memoriaMb: null },
    ]);
  });
});

describe("ConsultaInfraestructuraPrisma", () => {
  it("lee la cola, las fallidas y los entornos en una transacción y traduce el Decimal", async () => {
    const tomada = hace(20);
    const despliegue = { findMany: jest.fn().mockReturnValue("cola"), count: jest.fn().mockReturnValue("fallidas") };
    const proyecto = { findMany: jest.fn().mockReturnValue("entornos"), count: jest.fn().mockReturnValue("total") };
    const $transaction = jest.fn().mockResolvedValue([
      [{ numero: 15, estado: "construyendo", creado: hace(120), iniciado: hace(72), proyecto: { nombre: "api-tienda" } }],
      3,
      [
        { nombre: "api-tienda", usuario: { correo: "derek@tiendademo.com" }, despliegueActivo: { estado: "saludable", muestras: [{ tomada, cpu: new Prisma.Decimal("0.120"), memoriaMb: 430 }] } },
        { nombre: "menu-aurora", usuario: { correo: "maria.rios@cafeteriaaurora.com" }, despliegueActivo: { estado: "detenido", muestras: [] } },
        { nombre: "huerfano", usuario: { correo: "x@y.z" }, despliegueActivo: null },
      ],
      41,
    ]);
    const prisma = { despliegue, proyecto, $transaction } as unknown as PrismaService;
    const desde = hace(86_400);

    const lectura = await new ConsultaInfraestructuraPrisma(prisma).leer(desde);

    expect($transaction).toHaveBeenCalledWith(["cola", "fallidas", "entornos", "total"]);
    expect(despliegue.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { estado: { in: [...ESTADOS_EN_COLA] } } }));
    expect(despliegue.count).toHaveBeenCalledWith({ where: { estado: "fallido", terminado: { gte: desde } } });
    expect(lectura).toEqual({
      trabajos: [{ proyecto: "api-tienda", numero: 15, estado: "construyendo", creado: hace(120), iniciado: hace(72) }],
      fallidas: 3,
      entornos: [
        { proyecto: "api-tienda", titular: "derek@tiendademo.com", estado: "saludable", muestra: { tomada, cpu: 0.12, memoriaMb: 430 } },
        { proyecto: "menu-aurora", titular: "maria.rios@cafeteriaaurora.com", estado: "detenido", muestra: null },
      ],
      totalProyectos: 41,
    });
  });
});
