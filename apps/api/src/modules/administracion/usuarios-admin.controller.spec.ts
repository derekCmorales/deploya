import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { Reflector } from "@nestjs/core";
import { RelojFijo } from "../../compartido/reloj";
import type { UsuarioSesion } from "../identidad/dominio/sesion";
import { RolGuard, SOLO_ADMINISTRACION } from "../identidad/rol.guard";
import { SesionGuard } from "../identidad/sesion.guard";
import { ContenedoresClienteFalso } from "../suscripciones/ciclo/contenedores-cliente.falso";
import { AdministracionMemoria } from "./adaptadores/administracion.memoria";
import { cuentaDePrueba } from "./adaptadores/cuentas.fixture";
import { UsuarioNoEncontrado } from "./dominio/errores";
import { USUARIOS_POR_PAGINA } from "./dominio/usuarios";
import { ReactivacionCuentaService } from "./reactivacion-cuenta.service";
import { SuspensionService } from "./suspension.service";
import { UsuariosAdminController } from "./usuarios-admin.controller";

const CLIENTE: UsuarioSesion = { id: "u-derek", correo: "derek@tiendademo.com", nombre: "Derek Calderón", rol: "cliente" };

function armar() {
  const almacen = new AdministracionMemoria()
    .agregar(cuentaDePrueba({ id: "u-derek", correo: "derek@tiendademo.com", nombre: "Derek Calderón", plan: "Starter", creado: new Date("2026-09-03T10:00:00.000Z") }))
    .agregar(cuentaDePrueba({ id: "u-ana", correo: "ana.gomez@tiendademo.com", nombre: "Ana Gómez", plan: "Sandbox", creado: new Date("2026-09-21T10:00:00.000Z") }))
    .agregar(cuentaDePrueba({ id: "u-pedro", correo: "pedro.castillo@fincaelsol.com", nombre: "Pedro Castillo", plan: "Starter", suscripcion: "vencida", creado: new Date("2026-05-11T10:00:00.000Z") }))
    .agregar(
      cuentaDePrueba({
        proyectos: [
          { id: "p1", nombre: "menu-aurora", subdominio: "menu-aurora", despliegue: "saludable" },
          { id: "p2", nombre: "pedidos-api", subdominio: "pedidos-api", despliegue: "fallido" },
          { id: "p3", nombre: "landing", subdominio: "landing", despliegue: null },
        ],
        pagos: [
          { id: "pg2", fecha: new Date("2026-08-14T15:00:00.000Z"), plan: "Pro", vigenciaDias: 30, monto: 15, moneda: "USD", estado: "rechazado" },
          { id: "pg1", fecha: new Date("2026-07-14T15:00:00.000Z"), plan: "Pro", vigenciaDias: 30, monto: 15, moneda: "USD", estado: "aprobado" },
        ],
      }),
    );
  const contenedores = new ContenedoresClienteFalso();
  const servicio = new SuspensionService(almacen.escritura, contenedores, new RelojFijo());
  const reactivacion = new ReactivacionCuentaService(almacen.escritura, contenedores, new RelojFijo());
  return { controlador: new UsuariosAdminController(almacen.consulta, servicio, reactivacion), almacen };
}

function contexto(metodo: (...argumentos: never[]) => unknown, usuario: UsuarioSesion): ExecutionContext {
  return {
    getClass: () => UsuariosAdminController,
    getHandler: () => metodo,
    switchToHttp: () => ({ getRequest: () => ({ headers: {}, usuario }) }),
  } as unknown as ExecutionContext;
}

describe("M9-01 · GET /admin/usuarios", () => {
  it("Buscar por correo", async () => {
    const { controlador } = armar();

    const pagina = await controlador.buscar({ correo: "tiendademo" });

    expect(pagina.usuarios.map((u) => u.correo)).toEqual(["ana.gomez@tiendademo.com", "derek@tiendademo.com"]);
    expect(pagina.total).toBe(2);
  });

  it("Filtrar por suscripción", async () => {
    const { controlador } = armar();

    const pagina = await controlador.buscar({ suscripcion: "vencida" });

    expect(pagina.usuarios).toEqual([expect.objectContaining({ correo: "pedro.castillo@fincaelsol.com", suscripcion: "vencida" })]);
  });

  it("pagina de 20 en 20 y cuenta el total aparte", async () => {
    const { controlador, almacen } = armar();
    for (let n = 0; n < USUARIOS_POR_PAGINA + 5; n += 1) {
      almacen.agregar(cuentaDePrueba({ id: `u-${n}`, correo: `cliente${n}@mercadito.gt`, creado: new Date(Date.UTC(2026, 0, n + 1)) }));
    }

    const segunda = await controlador.buscar({ correo: "mercadito", pagina: "2" });

    expect(segunda).toMatchObject({ total: USUARIOS_POR_PAGINA + 5, pagina: 2, porPagina: USUARIOS_POR_PAGINA });
    expect(segunda.usuarios).toHaveLength(5);
  });

  it("Detalle de un usuario", async () => {
    const { controlador } = armar();

    const detalle = await controlador.detalle("u-maria");

    expect(detalle).toMatchObject({ plan: "Pro", suscripcion: "activa" });
    expect(detalle.proyectos.map((p) => [p.nombre, p.despliegue])).toEqual([
      ["menu-aurora", "saludable"],
      ["pedidos-api", "fallido"],
      ["landing", null],
    ]);
    expect(detalle.pagos.map((p) => p.estado)).toEqual(["rechazado", "aprobado"]);
  });

  it("una cuenta que no existe → UsuarioNoEncontrado (404)", async () => {
    const { controlador } = armar();

    await expect(controlador.detalle("u-nadie")).rejects.toBeInstanceOf(UsuarioNoEncontrado);
  });

  it("Cliente en administración", () => {
    const guard = new RolGuard(new Reflector());

    let error: unknown = null;
    try {
      guard.canActivate(contexto(UsuariosAdminController.prototype.buscar, CLIENTE));
    } catch (e) {
      error = e;
    }

    expect(Reflect.getMetadata(GUARDS_METADATA, UsuariosAdminController)).toEqual([SesionGuard, RolGuard]);
    expect(error).toBeInstanceOf(ForbiddenException);
    expect((error as ForbiddenException).getResponse()).toEqual(SOLO_ADMINISTRACION);
  });
});

describe("M9-02 · POST /admin/usuarios/:id/suspension", () => {
  it("suspende con el administrador de la sesión y el motivo de la lista", async () => {
    const { controlador, almacen } = armar();

    await controlador.suspender("u-admin", "u-maria", { motivo: "terminos", detalle: "Tráfico de minería detectado en 2 contenedores." });

    expect(almacen.acciones[0]).toMatchObject({ adminId: "u-admin", usuarioAfectadoId: "u-maria", motivo: "terminos" });
  });

  it("la lista de motivos de 25b", () => {
    const { controlador } = armar();

    expect(controlador.motivos().motivos[0]).toEqual({ clave: "terminos", texto: "Uso que incumple los términos de servicio." });
  });
});

describe("SP-05 · POST /admin/usuarios/:id/reactivacion", () => {
  it("reactiva con el administrador de la sesión y el detalle", async () => {
    const { controlador, almacen } = armar();
    await controlador.suspender("u-admin", "u-maria", { motivo: "terminos" });

    const resultado = await controlador.reactivar("u-admin", "u-maria", { detalle: "  Eran pruebas de carga.  " });

    expect(resultado).toEqual({ contenedores: "reanudados" });
    expect(almacen.acciones[1]).toMatchObject({ adminId: "u-admin", usuarioAfectadoId: "u-maria", accion: "reactivar-cuenta", detalle: "Eran pruebas de carga." });
  });

  it("Cliente no puede", () => {
    const guard = new RolGuard(new Reflector());

    let error: unknown = null;
    try {
      guard.canActivate(contexto(UsuariosAdminController.prototype.reactivar, CLIENTE));
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(ForbiddenException);
  });
});
