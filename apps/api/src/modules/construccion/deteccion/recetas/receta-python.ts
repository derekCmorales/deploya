import { PUERTO_RECETAS, VERSION_PYTHON } from "../deteccion.constantes";
import { existe, presentes, type MapaArchivos } from "../mapa-archivos";
import { plantillaPython } from "../plantillas";
import { RecetaStack, type DescripcionReceta } from "../receta-stack";

const REQUIREMENTS = "requirements.txt";
const PYPROJECT = "pyproject.toml";
const ENTRADAS = ["main.py", "app.py"] as const;
const GUNICORN = /^\s*["']?gunicorn\b/im;

/** Dependencias (`requirements.txt` o `pyproject.toml`) y una entrada (`main.py` o `app.py`). */
export class RecetaPython extends RecetaStack {
  readonly receta = "python" as const;
  readonly nombre = `Python ${VERSION_PYTHON}`;
  readonly archivosQueLee = [REQUIREMENTS, PYPROJECT, ...ENTRADAS];

  reconoce(archivos: MapaArchivos): boolean {
    return (existe(archivos, REQUIREMENTS) || existe(archivos, PYPROJECT)) && entradaDe(archivos) !== null;
  }

  describir(archivos: MapaArchivos): DescripcionReceta {
    const arranque = conGunicorn(archivos) ? `gunicorn ${entradaDe(archivos)}:app` : `python ${entradaDe(archivos)}.py`;
    return { descripcion: `${this.nombre} · ${arranque}`, evidencia: presentes(archivos, this.archivosQueLee) };
  }

  dockerfile(archivos: MapaArchivos): string {
    return plantillaPython({
      instalacion: existe(archivos, REQUIREMENTS) ? "requirements" : "pyproject",
      modulo: entradaDe(archivos) ?? "main",
      conGunicorn: conGunicorn(archivos),
    });
  }

  puertoSugerido(): number {
    return PUERTO_RECETAS;
  }

  pista(archivos: MapaArchivos): string | null {
    const conDependencias = existe(archivos, REQUIREMENTS) || existe(archivos, PYPROJECT);
    return conDependencias ? "agrega main.py o app.py en la raíz, o un Dockerfile" : null;
  }
}

function entradaDe(archivos: MapaArchivos): "main" | "app" | null {
  const entrada = ENTRADAS.find((ruta) => existe(archivos, ruta));
  return entrada ? (entrada.replace(".py", "") as "main" | "app") : null;
}

function conGunicorn(archivos: MapaArchivos): boolean {
  return GUNICORN.test(archivos[REQUIREMENTS] ?? "") || /gunicorn/i.test(archivos[PYPROJECT] ?? "");
}
