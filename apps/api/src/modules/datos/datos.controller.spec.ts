import type { ArgumentsHost } from "@nestjs/common";
import { datosDePrueba } from "../../pruebas/datos";
import { DatosController } from "./datos.controller";
import {
  ConfirmacionRecursoNoCoincide,
  DatosSolicitudInvalidos,
  LimiteRecursosDatos,
  RecursoNoEncontrado,
  SuscripcionBloqueada,
  TipoYaConectado,
  type ErrorDatos,
} from "./dominio/errores";
import { ErroresDatosFilter } from "./errores-datos.filter";

function montar() {
  const datos = datosDePrueba();
  return { datos, controlador: new DatosController(datos.servicio) };
}

function respuestaDe(error: ErrorDatos) {
  const respuesta = { estado: 0, cuerpo: undefined as unknown };
  const res = {
    status(estado: number) {
      respuesta.estado = estado;
      return this;
    },
    json(cuerpo: unknown) {
      respuesta.cuerpo = cuerpo;
    },
  };
  const host = { switchToHttp: () => ({ getResponse: () => res }) } as unknown as ArgumentsHost;
  new ErroresDatosFilter().catch(error, host);
  return respuesta;
}

describe("DatosController", () => {
  it("GET /datos/health responde ok", () => {
    expect(montar().controlador.health()).toEqual({ status: "ok", module: "datos" });
  });

  it("POST, GET, compartir, conexión y DELETE con el usuario de la sesión", async () => {
    const { controlador, datos } = montar();

    const creado = await controlador.crear("usuario-1", "api", { tipo: "postgres" });
    const compartido = await controlador.compartir("usuario-1", "api", creado.id, { proyectoId: "worker" });
    const lista = await controlador.listar("usuario-1", "worker");
    const conexion = await controlador.conexion("usuario-1", "worker", creado.id);
    await controlador.dejarDeCompartir("usuario-1", "api", creado.id, "worker");
    await controlador.eliminar("usuario-1", "api", creado.id, { confirmacion: "postgres" });

    expect(creado.estado).toBe("creando");
    expect(compartido.compartidoCon).toEqual([{ id: "worker", nombre: "worker" }]);
    expect(lista.recursos[0]).toMatchObject({ id: creado.id, esDueno: false });
    expect(conexion.variables.PGDATABASE).toBe("app");
    expect(await datos.repositorio.porId(creado.id)).toBeNull();
  });

  it("el cuerpo se valida antes del servicio: un tipo desconocido no crea nada", () => {
    const { controlador } = montar();

    expect(() => controlador.crear("usuario-1", "api", { tipo: "mongo" })).toThrow(DatosSolicitudInvalidos);
  });

  it.each([
    [new LimiteRecursosDatos(1), 409, "LIMITE_RECURSOS_DATOS"],
    [new TipoYaConectado("postgres"), 409, "TIPO_YA_CONECTADO"],
    [new SuscripcionBloqueada("vencida"), 409, "SUSCRIPCION_BLOQUEADA"],
    [new RecursoNoEncontrado("r1"), 404, "RECURSO_NO_ENCONTRADO"],
    [new ConfirmacionRecursoNoCoincide("s3"), 400, "CONFIRMACION_NO_COINCIDE"],
  ])("el filtro traduce %s a %i con el código del contrato", (error, estado, codigo) => {
    const respuesta = respuestaDe(error);

    expect(respuesta.estado).toBe(estado);
    expect(respuesta.cuerpo).toEqual({ codigo, mensaje: error.message });
  });
});
