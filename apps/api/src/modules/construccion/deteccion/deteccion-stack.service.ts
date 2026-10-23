import { Inject, Injectable, type Provider } from "@nestjs/common";
import { StackNoReconocido } from "../dominio/errores";
import type { RecetaConstruccion } from "../dominio/estados";
import type { LectorFuente } from "../puertos/lector-fuente.puerto";
import { capasComunes } from "./capas/capas-comunes";
import { PISTA_GENERAL, RUTA_DOCKERFILE } from "./deteccion.constantes";
import type { DockerfileReceta } from "./dockerfile-receta";
import { LectorDockerfileEn } from "./lector-dockerfile-en";
import type { MapaArchivos } from "./mapa-archivos";
import type { RecetaStack } from "./receta-stack";
import { RECETAS_STACK, recetasEnOrden } from "./recetas-stack";

/** Contrato de despliegues v2 (`ResultadoDeteccion`); `nombre` y `dockerfile` los agrega v2.1 y v3.4 tipa `dockerfile`. */
export interface ResultadoDeteccion {
  receta: RecetaConstruccion;
  /** «Node.js 22», para «Stack detectado: Node.js 22 · receta Deploya». */
  nombre: string;
  descripcion: string;
  puertoSugerido: number;
  evidencia: string[];
  /** El `Dockerfile.deploya` con las capas comunes; el trabajador le suma las suyas. `null` si se usa el del repositorio. */
  dockerfile: DockerfileReceta | null;
}

/**
 * M4-03: la primera receta que reconoce la rama decide cómo se construye (Chain of
 * Responsibility sobre Strategy). Solo orquesta la lectura y el orden; las capas comunes del
 * Dockerfile generado las arma `capasComunes` (Decorator).
 */
@Injectable()
export class DeteccionStackService {
  constructor(@Inject(RECETAS_STACK) private readonly recetas: readonly RecetaStack[]) {}

  /** Lanza `StackNoReconocido` si no hay `Dockerfile` ni receta que reconozca la rama. */
  async detectar(fuente: LectorFuente, rutaDockerfile = RUTA_DOCKERFILE): Promise<ResultadoDeteccion> {
    const archivos = await this.leer(new LectorDockerfileEn(fuente, rutaDockerfile));
    const receta = this.recetas.find((candidata) => candidata.reconoce(archivos));
    if (!receta) throw new StackNoReconocido(this.pistaPara(archivos));
    return {
      receta: receta.receta,
      nombre: receta.nombre,
      ...receta.describir(archivos),
      puertoSugerido: receta.puertoSugerido(archivos),
      dockerfile: this.conCapasComunes(receta, archivos),
    };
  }

  private conCapasComunes(receta: RecetaStack, archivos: MapaArchivos): DockerfileReceta | null {
    const base = receta.dockerfile(archivos);
    return base && capasComunes(base, receta.usuarioFinal);
  }

  private async leer(fuente: LectorFuente): Promise<MapaArchivos> {
    const rutas = [...new Set(this.recetas.flatMap((receta) => receta.archivosQueLee))];
    const contenidos = await Promise.all(rutas.map((ruta) => fuente.leer(ruta)));
    return Object.fromEntries(rutas.map((ruta, i) => [ruta, contenidos[i]]));
  }

  private pistaPara(archivos: MapaArchivos): string {
    return this.recetas.map((receta) => receta.pista(archivos)).find((pista) => pista !== null) ?? PISTA_GENERAL;
  }
}

/** Lo que registran la API (alta, 11a) y el trabajador (`PasoRecepcion`). */
export const PROVEEDORES_DETECCION: Provider[] = [
  { provide: RECETAS_STACK, useFactory: recetasEnOrden },
  DeteccionStackService,
];
