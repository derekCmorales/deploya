import { RelojFijo } from "../compartido/reloj";
import { DetalleProyectoMemoria } from "../adapters/memoria/detalle-proyecto.memoria";
import { ProyectosLecturaMemoria } from "../adapters/memoria/proyectos-lectura.memoria";
import { RecetaProyectoMemoria } from "../adapters/memoria/receta-proyecto.memoria";
import { RepositorioArtefactosMemoria } from "../adapters/memoria/repositorio-artefactos.memoria";
import { RepositorioDesplieguesMemoria } from "../adapters/memoria/repositorio-despliegues.memoria";
import { CancelacionesMemoria } from "../adapters/stubs/cancelaciones.memoria";
import { ClonadorStub } from "../adapters/stubs/clonador.stub";
import { ColaMemoria } from "../adapters/stubs/cola.memoria";
import { ColaOperacionMemoria } from "../adapters/stubs/cola-operacion.memoria";
import { ConstructorImagenStub } from "../adapters/stubs/constructor-imagen.stub";
import { CertificadoFijo } from "../adapters/stubs/certificado-ausente";
import { ContenedorStub } from "../adapters/stubs/contenedor.stub";
import { CuotaPlanStub } from "../adapters/stubs/cuota-plan.stub";
import { EnrutamientoStub } from "../adapters/stubs/enrutamiento.stub";
import { VariablesEntornoStub } from "../adapters/stubs/variables-entorno.stub";
import { VerificacionEntornoStub } from "../adapters/stubs/verificacion-entorno.stub";
import { ConstruccionService } from "../modules/construccion/construccion.service";
import { AccionesContenedorService } from "../modules/orquestacion/acciones/acciones-contenedor.service";
import { AccionesProyectoService } from "../modules/orquestacion/acciones/acciones-proyecto.service";
import { DetenerManejador } from "../modules/orquestacion/acciones/detener.manejador";
import { EliminarManejador } from "../modules/orquestacion/acciones/eliminar.manejador";
import { ReiniciarManejador } from "../modules/orquestacion/acciones/reiniciar.manejador";
import { BloqueosService } from "../modules/orquestacion/bloqueos.service";
import { DeteccionStackService } from "../modules/construccion/deteccion/deteccion-stack.service";
import { recetasEnOrden } from "../modules/construccion/deteccion/recetas-stack";
import type { ProyectoDesplegable } from "../modules/construccion/dominio/despliegue";
import { PasoConstruccion } from "../modules/construccion/pipeline/paso-construccion";
import { PasoRecepcion } from "../modules/construccion/pipeline/paso-recepcion";
import { VigiaCancelacion } from "../modules/construccion/pipeline/vigia-cancelacion";
import { AccionesDespliegueService } from "../modules/construccion/acciones/acciones-despliegue.service";
import { PipelineDespliegue } from "../modules/construccion/pipeline/pipeline-despliegue";
import { EnrutamientoService } from "../modules/enrutamiento/enrutamiento.service";
import { PasoEnrutamiento } from "../modules/enrutamiento/paso-enrutamiento";
import { OrquestacionService } from "../modules/orquestacion/orquestacion.service";
import { PasoEjecucion } from "../modules/orquestacion/paso-ejecucion";
import { PasoOperacion } from "../modules/orquestacion/paso-operacion";
import { ResumenProyectoService } from "../modules/observabilidad/resumen/resumen-proyecto.service";
import { ReversionService } from "../modules/orquestacion/reversion/reversion.service";
import { RetencionArtefactos } from "../modules/orquestacion/retencion/retencion-artefactos";

/** Proyecto de ejemplo para las pruebas del motor. */
export function proyectoDemo(cambios: Partial<ProyectoDesplegable> = {}): ProyectoDesplegable {
  return {
    id: "proyecto-1",
    usuarioId: "usuario-1",
    nombre: "hola-deploya",
    subdominio: "hola-deploya",
    urlRepositorio: "https://github.com/derekCmorales/hola-deploya",
    rama: "main",
    rutaDockerfile: "Dockerfile",
    puertoInterno: 8080,
    ...cambios,
  };
}

/** El motor completo con todos sus puertos en stubs o en memoria (sin Docker, red, base ni reloj reales). */
export function motorDePrueba() {
  const reloj = new RelojFijo();
  const despliegues = new RepositorioDesplieguesMemoria();
  const artefactos = new RepositorioArtefactosMemoria();
  const proyectos = new ProyectosLecturaMemoria();
  const cola = new ColaMemoria();
  const clonador = new ClonadorStub();
  const constructorImagen = new ConstructorImagenStub();
  const contenedores = new ContenedorStub();
  const salud = new VerificacionEntornoStub();
  const enrutamiento = new EnrutamientoStub();
  const cuota = new CuotaPlanStub();
  const recetas = new RecetaProyectoMemoria();
  const variables = new VariablesEntornoStub();
  const orquestacion = new OrquestacionService(contenedores, salud, cuota);
  const enrutamientoServicio = new EnrutamientoService(enrutamiento);
  const colaOperacion = new ColaOperacionMemoria();
  const accionesProyecto = new AccionesProyectoService(proyectos, despliegues, colaOperacion);
  const accionesContenedor = new AccionesContenedorService([
    new ReiniciarManejador(despliegues, proyectos, orquestacion, enrutamientoServicio, reloj),
    new DetenerManejador(despliegues, orquestacion, enrutamientoServicio, reloj),
    new EliminarManejador(orquestacion, enrutamientoServicio),
  ]);
  const recepcion = new PasoRecepcion(clonador, despliegues, new DeteccionStackService(recetasEnOrden()), recetas);
  const construccion = new PasoConstruccion(constructorImagen, artefactos, despliegues, reloj);
  const ejecucion = new PasoEjecucion(orquestacion, despliegues, variables, artefactos);
  const enrutamientoPaso = new PasoEnrutamiento(enrutamientoServicio, despliegues);
  const operacion = new PasoOperacion(orquestacion, despliegues);
  const planes = {
    construccion: [recepcion, construccion, ejecucion, enrutamientoPaso, operacion],
    reversion: [ejecucion, enrutamientoPaso, operacion],
  };
  const retencion = new RetencionArtefactos(artefactos, despliegues, orquestacion);
  const bloqueos = new BloqueosService(cuota, despliegues, reloj);
  const certificado = new CertificadoFijo();
  const servicio = new ConstruccionService(despliegues, artefactos, proyectos, cola, bloqueos, reloj, certificado);
  const cancelaciones = new CancelacionesMemoria();
  const vigia = new VigiaCancelacion(cancelaciones, 0);
  const pipeline = new PipelineDespliegue(despliegues, proyectos, reloj, planes, [retencion], vigia);
  const accionesDespliegue = new AccionesDespliegueService(despliegues, proyectos, cola, cancelaciones, servicio, reloj);
  const reversion = new ReversionService(proyectos, artefactos, despliegues, cola, reloj);
  const detalleProyectos = new DetalleProyectoMemoria();
  const resumen = new ResumenProyectoService(detalleProyectos, despliegues, artefactos, cuota, servicio);
  proyectos.agregar(proyectoDemo());
  detalleProyectos.agregar({
    id: "proyecto-1",
    usuarioId: "usuario-1",
    nombre: "hola-deploya",
    subdominio: "hola-deploya",
    urlRepositorio: "https://github.com/derekCmorales/hola-deploya",
    rama: "main",
    puertoInterno: 8080,
  });
  despliegues.registrarDueno("proyecto-1", "usuario-1");
  return {
    reloj, despliegues, artefactos, proyectos, cola, clonador, constructorImagen,
    contenedores, salud, enrutamiento, cuota, recetas, bloqueos, orquestacion, servicio, pipeline,
    colaOperacion, accionesProyecto, accionesContenedor, variables, reversion, retencion, planes, cancelaciones, vigia, certificado, accionesDespliegue, detalleProyectos, resumen,
    /** Crea un despliegue y lo pasa por el pipeline sin temporizador de bitácora. */
    async desplegar(proyectoId = "proyecto-1") {
      const creado = await servicio.crearDespliegue(proyectoId);
      cola.tomar(creado.id);
      await pipeline.ejecutar({ despliegueId: creado.id, plan: "construccion" }, 0);
      return (await despliegues.porId(creado.id))!;
    },
    /** Pide la reversión como la API y la ejecuta como el trabajador (plan `reversion`). */
    async revertir(artefactoId: string, proyectoId = "proyecto-1") {
      const creado = await reversion.revertir(proyectoId, artefactoId, "usuario-1");
      cola.tomar(creado.id);
      await pipeline.ejecutar({ despliegueId: creado.id, plan: "reversion" }, 0);
      return (await despliegues.porId(creado.id))!;
    },
    /** Pide la acción como la API y la ejecuta como el trabajador (cola `operacion`). */
    async accion(tipo: "reiniciar" | "detener", proyectoId = "proyecto-1") {
      await accionesProyecto[tipo](proyectoId, "usuario-1");
      await accionesContenedor.ejecutar(colaOperacion.acciones.at(-1)!);
      return (await despliegues.activoDe(proyectoId))!;
    },
  };
}
