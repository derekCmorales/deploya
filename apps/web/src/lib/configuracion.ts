/**
 * Lógica pura de la pantalla 19 (Configuración): el borrador del formulario, lo que cambió y cómo se
 * pintan los errores de `PATCH /proyectos/:id`. Sin DOM ni red, para `node --test`.
 */

export interface DatosProyecto {
  nombre: string;
  urlRepositorio: string;
  rama: string;
  rutaDockerfile: string;
  puertoInterno: number;
}

/** El formulario edita texto: el puerto y la ruta se normalizan al enviar. */
export interface BorradorProyecto {
  nombre: string;
  urlRepositorio: string;
  rama: string;
  rutaDockerfile: string;
  puertoInterno: string;
}

export type CampoConfiguracion = keyof BorradorProyecto;

/** Cuerpo de `PATCH /proyectos/:id`: solo lo que cambió. */
export type CambiosConfiguracion = Partial<DatosProyecto>;

/** `PATCH` guardó: el marco del proyecto vuelve a leer la lista para mostrar el nombre nuevo. */
export const EVENTO_PROYECTO_ACTUALIZADO = "deploya:proyecto-actualizado";

const NOMBRE_MAXIMO = 64;
const PUERTO_MINIMO = 1;
const PUERTO_MAXIMO = 65535;

/** La API guarda `Dockerfile`; la ficha lo muestra como `/Dockerfile`. */
export function rutaNormalizada(ruta: string): string {
  return ruta.trim().replace(/^(\.?\/)+/, "");
}

export function borradorDe(proyecto: DatosProyecto): BorradorProyecto {
  return {
    nombre: proyecto.nombre,
    urlRepositorio: proyecto.urlRepositorio,
    rama: proyecto.rama,
    rutaDockerfile: `/${rutaNormalizada(proyecto.rutaDockerfile)}`,
    puertoInterno: String(proyecto.puertoInterno),
  };
}

/** Lo que el cliente cambió respecto al original; vacío si no tocó nada (el botón queda deshabilitado). */
export function cambiosDe(original: BorradorProyecto, borrador: BorradorProyecto): CambiosConfiguracion {
  const cambios: CambiosConfiguracion = {};
  if (borrador.nombre.trim() !== original.nombre.trim()) cambios.nombre = borrador.nombre.trim();
  if (borrador.urlRepositorio.trim() !== original.urlRepositorio.trim()) cambios.urlRepositorio = borrador.urlRepositorio.trim();
  if (borrador.rama.trim() !== original.rama.trim()) cambios.rama = borrador.rama.trim();
  if (rutaNormalizada(borrador.rutaDockerfile) !== rutaNormalizada(original.rutaDockerfile)) {
    cambios.rutaDockerfile = rutaNormalizada(borrador.rutaDockerfile);
  }
  if (borrador.puertoInterno.trim() !== original.puertoInterno.trim()) cambios.puertoInterno = Number(borrador.puertoInterno);
  return cambios;
}

export function hayCambios(cambios: CambiosConfiguracion): boolean {
  return Object.keys(cambios).length > 0;
}

export type ErroresBorrador = Partial<Record<CampoConfiguracion, string>>;

/** Validación local antes de pedir a la API (la API repite las mismas reglas). */
export function erroresDeBorrador(borrador: BorradorProyecto): ErroresBorrador {
  const errores: ErroresBorrador = {};
  const nombre = borrador.nombre.trim();
  if (!nombre) errores.nombre = "El nombre es obligatorio.";
  else if (nombre.length > NOMBRE_MAXIMO) errores.nombre = `El nombre admite hasta ${NOMBRE_MAXIMO} caracteres.`;
  if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+?(\.git)?\/?$/.test(borrador.urlRepositorio.trim())) {
    errores.urlRepositorio = "La URL debe ser https://github.com/<dueño>/<repositorio>.";
  }
  if (!borrador.rama.trim()) errores.rama = "La rama es obligatoria.";
  const ruta = rutaNormalizada(borrador.rutaDockerfile);
  if (!ruta || ruta.includes("\\") || ruta.split("/").some((s) => s === ".." || s === "")) {
    errores.rutaDockerfile = "Usa una ruta relativa al repositorio, sin «..».";
  }
  const puerto = Number(borrador.puertoInterno);
  if (!/^\d+$/.test(borrador.puertoInterno.trim()) || puerto < PUERTO_MINIMO || puerto > PUERTO_MAXIMO) {
    errores.puertoInterno = `El puerto debe ser un entero entre ${PUERTO_MINIMO} y ${PUERTO_MAXIMO}.`;
  }
  return errores;
}

export interface ErrorGuardado {
  campo: CampoConfiguracion | null;
  mensaje: string;
}

const CAMPO_POR_CODIGO: Record<string, CampoConfiguracion> = {
  "nombre-repetido": "nombre",
  "url-invalida": "urlRepositorio",
  "repositorio-no-accesible": "urlRepositorio",
  "rama-no-encontrada": "rama",
  "ruta-invalida": "rutaDockerfile",
  "puerto-invalido": "puertoInterno",
};

/** Cada `codigo` de la API se pinta bajo su campo; lo demás (sin red, GitHub caído) va en un aviso general. */
export function errorDeGuardado(codigo: string, mensaje: string): ErrorGuardado {
  return { campo: CAMPO_POR_CODIGO[codigo] ?? null, mensaje };
}

/** Textos de 19b: «6 variables de entorno cifradas» · «El historial de 14 despliegues». */
export function textoVariables(cantidad: number): string {
  return cantidad === 1 ? "1 variable de entorno cifrada" : `${cantidad} variables de entorno cifradas`;
}

export function textoHistorial(cantidad: number): string {
  return cantidad === 1 ? "El historial de 1 despliegue" : `El historial de ${cantidad} despliegues`;
}
