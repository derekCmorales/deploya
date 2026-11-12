import { RelojFijo } from "../compartido/reloj";
import { ProyectosLecturaMemoria } from "../adapters/memoria/proyectos-lectura.memoria";
import { RepositorioRecursosDatosMemoria } from "../adapters/memoria/repositorio-recursos-datos.memoria";
import { ColaDatosMemoria } from "../adapters/stubs/cola-datos.memoria";
import { EnrutamientoStub } from "../adapters/stubs/enrutamiento.stub";
import { RecursosDatosStub } from "../adapters/stubs/recursos-datos.stub";
import type { ProyectoDesplegable } from "../modules/construccion/dominio/despliegue";
import { GeneradorSecretosFijo } from "../modules/datos/adaptadores/generador-secretos.fijo";
import { ConexionesDatos } from "../modules/datos/conexiones-datos";
import { DatosService } from "../modules/datos/datos.service";
import { MotorDatosService } from "../modules/datos/motor-datos.service";
import { CuotaDatosPuerto, type CuotaDatos } from "../modules/datos/puertos/cuota-datos.puerto";
import { EnrutamientoService } from "../modules/enrutamiento/enrutamiento.service";
import { CifradorFalso } from "../modules/proyectos/adaptadores/cifrador-falso";

/** Cuota fija por usuario (Starter activa por omisión); la prueba la cambia con `fijar`. */
export class CuotaDatosFija extends CuotaDatosPuerto {
  private readonly cuotas = new Map<string, CuotaDatos>();

  constructor(private readonly porOmision: CuotaDatos = { estado: "activa", maxRecursosDatos: 3, discoDatosMb: 2048 }) {
    super();
  }

  fijar(usuarioId: string, cambios: Partial<CuotaDatos>): void {
    this.cuotas.set(usuarioId, { ...this.porOmision, ...cambios });
  }

  async deUsuario(usuarioId: string): Promise<CuotaDatos> {
    return this.cuotas.get(usuarioId) ?? this.porOmision;
  }
}

export function proyectoDatos(id: string, cambios: Partial<ProyectoDesplegable> = {}): ProyectoDesplegable {
  return {
    id,
    usuarioId: "usuario-1",
    nombre: id,
    subdominio: id,
    urlRepositorio: `https://github.com/nimbo/${id}`,
    rama: "main",
    rutaDockerfile: "Dockerfile",
    puertoInterno: 8080,
    ...cambios,
  };
}

/**
 * Recursos de datos completos sin Docker, red, base ni reloj reales: la API (`servicio`) encola en
 * memoria y `procesar()` ejecuta la cola como el trabajador (`motor`) sobre el Docker falso.
 */
export function datosDePrueba() {
  const reloj = new RelojFijo(new Date("2026-11-12T10:00:00.000Z"));
  const proyectos = new ProyectosLecturaMemoria();
  const repositorio = new RepositorioRecursosDatosMemoria(reloj);
  const cola = new ColaDatosMemoria();
  const cuota = new CuotaDatosFija();
  const cifrador = new CifradorFalso();
  const dominio = { esquema: "https", dominioBase: "deploya.app" };
  const conexiones = new ConexionesDatos(cifrador, dominio);
  const servicio = new DatosService(proyectos, repositorio, cola, cuota, new GeneradorSecretosFijo(), cifrador, conexiones);
  const docker = new RecursosDatosStub();
  const rutas = new EnrutamientoStub();
  const motor = new MotorDatosService(repositorio, proyectos, docker, conexiones, new EnrutamientoService(rutas), reloj);
  for (const id of ["api", "worker", "web"]) proyectos.agregar(proyectoDatos(id));
  proyectos.agregar(proyectoDatos("ajeno", { usuarioId: "usuario-2" }));
  let procesados = 0;
  return {
    reloj, proyectos, repositorio, cola, cuota, cifrador, conexiones, servicio, docker, rutas, motor,
    /** Ejecuta en el «trabajador» los comandos que la API dejó en la cola desde la última vez. */
    async procesar() {
      for (const comando of cola.comandos.slice(procesados)) await motor.ejecutar(comando);
      procesados = cola.comandos.length;
    },
  };
}
