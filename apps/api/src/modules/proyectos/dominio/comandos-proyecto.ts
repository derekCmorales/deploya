import { argumentosDeComando, ComandoMalFormado, LARGO_MAXIMO_COMANDO } from "../../../compartido/argumentos-comando";
import { ComandoInicioInvalido } from "./errores";

const SALTO_DE_LINEA = /[\r\n]/;

/**
 * Comando de inicio del alta y de 19: `null` o texto en blanco vuelven al `CMD` de la imagen. Se
 * valida que se pueda partir en argumentos (comillas cerradas): el trabajador lo pasa como `Cmd`
 * sin shell.
 */
export function comandoInicioDe(valor: unknown): string | null {
  const comando = textoDeComando(valor, "de inicio");
  if (comando === null) return null;
  try {
    argumentosDeComando(comando);
  } catch (error) {
    if (error instanceof ComandoMalFormado) throw new ComandoInicioInvalido(`El comando no se puede leer: ${error.message.toLowerCase()}.`);
    throw error;
  }
  return comando;
}

/**
 * Comando de construcción (feat/m3-alta-guiada): va en un `RUN` del `Dockerfile.deploya`, así
 * que una sola línea. Un salto de línea abriría otra instrucción del Dockerfile.
 */
export function comandoConstruccionDe(valor: unknown): string | null {
  const comando = textoDeComando(valor, "de construcción");
  if (comando !== null && SALTO_DE_LINEA.test(comando)) throw new ComandoInicioInvalido("El comando de construcción va en una sola línea.");
  return comando;
}

function textoDeComando(valor: unknown, cual: string): string | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== "string") throw new ComandoInicioInvalido(`El comando ${cual} debe ser texto.`);
  const comando = valor.trim();
  if (!comando) return null;
  if (comando.length > LARGO_MAXIMO_COMANDO) throw new ComandoInicioInvalido(`El comando admite hasta ${LARGO_MAXIMO_COMANDO} caracteres.`);
  return comando;
}
