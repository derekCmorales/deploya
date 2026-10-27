import type { ArgumentsHost } from "@nestjs/common";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { RepositorioDesplieguesMemoria } from "../../../adapters/memoria/repositorio-despliegues.memoria";
import { SalidaContenedorMemoria } from "../../../adapters/stubs/salida-contenedor.memoria";
import { ProyectoNoEncontrado } from "../../construccion/dominio/errores";
import { SesionGuard } from "../../identidad/sesion.guard";
import { DetalleProyectoPuerto, type DetalleProyecto } from "../puertos/detalle-proyecto.puerto";
import { BitacoraEjecucionService } from "./bitacora-ejecucion.service";
import { BitacoraProyectoController, desdeBitacora, ErroresBitacoraFilter } from "./bitacora-proyecto.controller";
import {
  AVISO_CONTENEDOR_DETENIDO,
  AVISO_SIN_CONTENEDOR,
  lineasEjecucion,
  MAX_LINEAS_EJECUCION,
  nivelDe,
} from "./dominio/bitacora-ejecucion";
import { BitacoraNoDisponible, DesdeBitacoraInvalido } from "./errores";

const PROYECTO = "api-tienda";
const DUENO = "usuario-1";
const CONTENEDOR = "c-14";
const INICIO = new Date("2026-10-20T10:41:52.118Z");
const SEGUNDO_MS = 1000;

const DETALLE: DetalleProyecto = {
  id: PROYECTO,
  usuarioId: DUENO,
  nombre: "api-tienda",
  subdominio: "api-tienda",
  urlRepositorio: "https://github.com/derekCmorales/api-tienda",
  rama: "main",
  puertoInterno: 8080,
};

class DetalleFijo extends DetalleProyectoPuerto {
  async porId(proyectoId: string): Promise<DetalleProyecto | null> {
    return proyectoId === PROYECTO ? DETALLE : null;
  }
}

const linea = (segundos: number, texto: string) => ({ marca: new Date(INICIO.getTime() + segundos * SEGUNDO_MS), texto });

async function armar(estado: "saludable" | "detenido" | null = "saludable") {
  const despliegues = new RepositorioDesplieguesMemoria();
  const salida = new SalidaContenedorMemoria();
  if (estado) {
    const activo = await despliegues.crear({ proyectoId: PROYECTO, disparador: "manual", rama: "main", estado: "encolado", creado: INICIO });
    await despliegues.cambiarEstado(activo.id, estado, { contenedorId: CONTENEDOR });
    await despliegues.marcarActivo(PROYECTO, activo.id);
  }
  return { salida, servicio: new BitacoraEjecucionService(new DetalleFijo(), despliegues, salida) };
}

function respuestaFalsa() {
  const respuesta = {
    estado: 0,
    cuerpo: {} as unknown,
    status(estado: number) {
      this.estado = estado;
      return this;
    },
    json(cuerpo: unknown) {
      this.cuerpo = cuerpo;
    },
  };
  const host = { switchToHttp: () => ({ getResponse: () => respuesta }) } as unknown as ArgumentsHost;
  return { respuesta, host };
}

describe("Bitácora de ejecución (SP-12)", () => {
  it("Líneas nuevas", async () => {
    const { salida, servicio } = await armar();
    salida.escribir(CONTENEDOR, linea(0, "INFO GET /health 200 · 2 ms"));
    const primera = await servicio.leer(PROYECTO, DUENO, null);
    const ultima = primera.lineas[primera.lineas.length - 1].en;

    salida.escribir(
      CONTENEDOR,
      linea(1, "INFO GET /api/productos 200 · 41 ms"),
      linea(2, "INFO POST /api/carrito/items 201 · 63 ms"),
      linea(3, "WARN pool de conexiones al 85 % (17/20)"),
      linea(4, "INFO POST /api/pedidos 201 · 212 ms"),
      linea(5, "ERROR POST /api/pagos 502 · pasarela sin respuesta tras 5000 ms"),
      linea(6, "INFO GET /health 200 · 1 ms"),
    );
    const siguiente = await servicio.leer(PROYECTO, DUENO, ultima);

    expect(siguiente.lineas).toHaveLength(6);
    expect(siguiente.lineas.map((l) => l.nivel)).toEqual(["info", "info", "aviso", "info", "error", "info"]);
    expect(siguiente.despliegue).toEqual({ numero: 1, commit: null });
    expect(siguiente.aviso).toBeNull();
  });

  it("no repite la línea de la marca `desde` aunque Docker filtre por segundos", () => {
    const salida = [linea(0, "INFO a"), linea(0.5, "INFO b")];

    expect(lineasEjecucion(salida, salida[0].marca).map((l) => l.texto)).toEqual(["INFO b"]);
  });

  it("devuelve como mucho las últimas 500 líneas", () => {
    const salida = Array.from({ length: MAX_LINEAS_EJECUCION + 20 }, (_, i) => linea(i, `INFO ${i}`));

    const lineas = lineasEjecucion(salida, null);

    expect(lineas).toHaveLength(MAX_LINEAS_EJECUCION);
    expect(lineas[0].texto).toBe("INFO 20");
  });

  it("el nivel sale del prefijo: ERROR y WARN, lo demás es Info", () => {
    expect(nivelDe("ERROR at ClientePagos.cobrar")).toBe("error");
    expect(nivelDe("[fatal] sin memoria")).toBe("error");
    expect(nivelDe("  warning: obsoleto")).toBe("aviso");
    expect(nivelDe("INFO GET /health 200")).toBe("info");
    expect(nivelDe("listo en :8080, sin errores")).toBe("info");
  });

  it("un contenedor detenido se sigue leyendo y avisa que no corre", async () => {
    const { salida, servicio } = await armar("detenido");
    salida.escribir(CONTENEDOR, linea(0, "INFO apagando"));

    const respuesta = await servicio.leer(PROYECTO, DUENO, null);

    expect(respuesta.lineas).toHaveLength(1);
    expect(respuesta.aviso).toBe(AVISO_CONTENEDOR_DETENIDO);
  });

  it("sin despliegue activo no hay contenedor que leer", async () => {
    const { servicio } = await armar(null);

    expect(await servicio.leer(PROYECTO, DUENO, null)).toEqual({ despliegue: null, lineas: [], aviso: AVISO_SIN_CONTENEDOR });
  });

  it("un proyecto ajeno es 404 y no lee el contenedor", async () => {
    const { salida, servicio } = await armar();
    salida.falla = new Error("no debería leerse");

    await expect(servicio.leer(PROYECTO, "otro", null)).rejects.toBeInstanceOf(ProyectoNoEncontrado);
    await expect(servicio.leer("inexistente", DUENO, null)).rejects.toBeInstanceOf(ProyectoNoEncontrado);
  });

  it("si el trabajador no responde, la lectura falla con un error de dominio", async () => {
    const { salida, servicio } = await armar();
    salida.falla = new Error("timeout");

    await expect(servicio.leer(PROYECTO, DUENO, null)).rejects.toBeInstanceOf(BitacoraNoDisponible);
  });

  it("`desde` vacío es el principio y uno inválido es 400", () => {
    expect(desdeBitacora(undefined)).toBeNull();
    expect(desdeBitacora("")).toBeNull();
    expect(desdeBitacora("2026-10-20T10:41:52.118Z")).toEqual(INICIO);
    expect(() => desdeBitacora("ayer")).toThrow(DesdeBitacoraInvalido);
  });

  it.each([
    [new ProyectoNoEncontrado(PROYECTO), 404],
    [new DesdeBitacoraInvalido("ayer"), 400],
    [new BitacoraNoDisponible("timeout"), 503],
  ])("el filtro traduce %s a %i", (error, estado) => {
    const { respuesta, host } = respuestaFalsa();

    new ErroresBitacoraFilter().catch(error, host);

    expect(respuesta.estado).toBe(estado);
    expect(respuesta.cuerpo).toEqual({ codigo: error.name, mensaje: error.message });
  });

  it("el controlador exige sesión y pasa el dueño y `desde` al servicio", async () => {
    const { salida, servicio } = await armar();
    salida.escribir(CONTENEDOR, linea(0, "INFO a"), linea(1, "INFO b"));

    const respuesta = await new BitacoraProyectoController(servicio).leer(PROYECTO, INICIO.toISOString(), DUENO);

    expect(Reflect.getMetadata(GUARDS_METADATA, BitacoraProyectoController)).toEqual([SesionGuard]);
    expect(respuesta.lineas.map((l) => l.texto)).toEqual(["INFO b"]);
  });
});
