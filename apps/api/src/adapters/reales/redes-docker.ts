import type Docker from "dockerode";

export const ESTADO_YA_HECHO = 304;
export const ESTADO_PROHIBIDO = 403;
export const ESTADO_NO_EXISTE = 404;
export const ESTADO_CONFLICTO = 409;
/** Etiqueta de las redes y de los contenedores de app de cada proyecto (ADR 0005). */
export const ETIQUETA_DEPLOYA = "app.deploya.proyecto";

/** Corre la acción y descarta los errores de Docker con estos códigos HTTP (operaciones idempotentes). */
export async function ignorarEstados(estados: readonly number[], accion: () => Promise<unknown>): Promise<void> {
  try {
    await accion();
  } catch (error) {
    if (!estados.includes((error as { statusCode?: number }).statusCode ?? 0)) throw error;
  }
}

/**
 * Crea la red del proyecto si no existe y le conecta los servicios de la plataforma (Traefik y el
 * trabajador). La usan el contenedor de la app y los recursos de datos: un recurso puede existir
 * antes del primer despliegue.
 */
export async function asegurarRed(docker: Docker, nombre: string, serviciosConectados: readonly string[]): Promise<void> {
  const existentes = await docker.listNetworks({ filters: { name: [nombre] } });
  if (!existentes.some((red) => red.Name === nombre)) {
    await docker.createNetwork({ Name: nombre, Driver: "bridge", Labels: { [ETIQUETA_DEPLOYA]: nombre } });
  }
  const red = docker.getNetwork(nombre);
  for (const servicio of serviciosConectados) {
    // Ya conectado: Docker responde 403 o 409 según la versión.
    await ignorarEstados([ESTADO_PROHIBIDO, ESTADO_CONFLICTO], () => red.connect({ Container: servicio }));
  }
}
