import { PUERTO_RECETAS, VERSION_NODE } from "../deteccion.constantes";
import { existe, presentes, type MapaArchivos } from "../mapa-archivos";
import { plantillaNode } from "../plantillas";
import { RecetaStack, type DescripcionReceta } from "../receta-stack";

const PACKAGE_JSON = "package.json";
const LOCKFILE = "package-lock.json";

interface Paquete {
  scripts?: Record<string, unknown>;
}

/** `package.json` con script `start` → `node:22-alpine`, `npm ci` y `npm start`. */
export class RecetaNode extends RecetaStack {
  readonly receta = "node" as const;
  readonly nombre = `Node.js ${VERSION_NODE}`;
  readonly archivosQueLee = [PACKAGE_JSON, LOCKFILE];

  reconoce(archivos: MapaArchivos): boolean {
    return tieneScript(archivos, "start");
  }

  describir(archivos: MapaArchivos): DescripcionReceta {
    return { descripcion: `${this.nombre} · npm start`, evidencia: presentes(archivos, this.archivosQueLee) };
  }

  dockerfile(archivos: MapaArchivos): string {
    return plantillaNode({ conLockfile: existe(archivos, LOCKFILE), conBuild: tieneScript(archivos, "build") });
  }

  puertoSugerido(): number {
    return PUERTO_RECETAS;
  }

  pista(archivos: MapaArchivos): string | null {
    return existe(archivos, PACKAGE_JSON) ? "agrega un script start o un Dockerfile" : null;
  }
}

function tieneScript(archivos: MapaArchivos, script: string): boolean {
  const paquete = leerPaquete(archivos[PACKAGE_JSON]);
  return typeof paquete?.scripts?.[script] === "string";
}

function leerPaquete(contenido: string | null | undefined): Paquete | null {
  if (!contenido) return null;
  try {
    const paquete: unknown = JSON.parse(contenido);
    return typeof paquete === "object" && paquete !== null ? (paquete as Paquete) : null;
  } catch {
    return null;
  }
}
