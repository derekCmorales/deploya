import { RelojFijo } from "../compartido/reloj";
import { ProyectosLecturaMemoria } from "../adapters/memoria/proyectos-lectura.memoria";
import { RecetaProyectoMemoria } from "../adapters/memoria/receta-proyecto.memoria";
import { RepositorioArtefactosMemoria } from "../adapters/memoria/repositorio-artefactos.memoria";
import { RepositorioDesplieguesMemoria } from "../adapters/memoria/repositorio-despliegues.memoria";
import { ClonadorStub } from "../adapters/stubs/clonador.stub";
import { ColaMemoria } from "../adapters/stubs/cola.memoria";
import { ConstructorImagenStub } from "../adapters/stubs/constructor-imagen.stub";
import { ContenedorStub } from "../adapters/stubs/contenedor.stub";
import { CuotaPlanStub } from "../adapters/stubs/cuota-plan.stub";
import { EnrutamientoStub } from "../adapters/stubs/enrutamiento.stub";
import { VerificacionEntornoStub } from "../adapters/stubs/verificacion-entorno.stub";
import { ConstruccionService } from "../modules/construccion/construccion.service";
import { DeteccionStackService } from "../modules/construccion/deteccion/deteccion-stack.service";
import { recetasEnOrden } from "../modules/construccion/deteccion/recetas-stack";
import type { ProyectoDesplegable } from "../modules/construccion/dominio/despliegue";
import { PasoConstruccion } from "../modules/construccion/pipeline/paso-construccion";
import { PasoRecepcion } from "../modules/construccion/pipeline/paso-recepcion";
import { PipelineDespliegue } from "../modules/construccion/pipeline/pipeline-despliegue";
import { EnrutamientoService } from "../modules/enrutamiento/enrutamiento.service";
import { PasoEnrutamiento } from "../modules/enrutamiento/paso-enrutamiento";
import { OrquestacionService } from "../modules/orquestacion/orquestacion.service";
import { PasoEjecucion } from "../modules/orquestacion/paso-ejecucion";
import { PasoOperacion } from "../modules/orquestacion/paso-operacion";

/** Proyecto de ejemplo para las pruebas del motor. */
export function proyectoDemo(cambios: Partial<ProyectoDesplegable> = {}): ProyectoDesplegable {
  return {
    id: "proyecto-1",
    usuarioId: "usuario-1",
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
  const orquestacion = new OrquestacionService(contenedores, salud, cuota);
  const pasos = [
    new PasoRecepcion(clonador, despliegues, new DeteccionStackService(recetasEnOrden()), recetas),
    new PasoConstruccion(constructorImagen, artefactos, despliegues, reloj),
    new PasoEjecucion(orquestacion, despliegues),
    new PasoEnrutamiento(new EnrutamientoService(enrutamiento), despliegues),
    new PasoOperacion(orquestacion, despliegues),
  ];
  const servicio = new ConstruccionService(despliegues, artefactos, proyectos, cola, reloj);
  const pipeline = new PipelineDespliegue(despliegues, proyectos, reloj, pasos);
  proyectos.agregar(proyectoDemo());
  return {
    reloj, despliegues, artefactos, proyectos, cola, clonador, constructorImagen,
    contenedores, salud, enrutamiento, cuota, recetas, orquestacion, servicio, pipeline,
    /** Crea un despliegue y lo pasa por el pipeline sin temporizador de bitácora. */
    async desplegar(proyectoId = "proyecto-1") {
      const creado = await servicio.crearDespliegue(proyectoId);
      await pipeline.ejecutar({ despliegueId: creado.id, plan: "construccion" }, 0);
      return (await despliegues.porId(creado.id))!;
    },
  };
}
