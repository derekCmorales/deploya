import { BadRequestException } from "@nestjs/common";

/** Campo de texto obligatorio del cuerpo JSON; vacío o ausente responde 400. Lo usan todos los controladores de M1. */
export function textoDe(cuerpo: unknown, campo: string): string {
  const valor = typeof cuerpo === "object" && cuerpo !== null ? (cuerpo as Record<string, unknown>)[campo] : undefined;
  if (typeof valor !== "string" || valor === "") throw new BadRequestException(`Falta el campo «${campo}»`);
  return valor;
}

/** Campo de texto que puede faltar: ausente o de otro tipo es `""`, y decide el servicio (p. ej. el código, que da 401). */
export function textoOpcionalDe(cuerpo: unknown, campo: string): string {
  const valor = typeof cuerpo === "object" && cuerpo !== null ? (cuerpo as Record<string, unknown>)[campo] : undefined;
  return typeof valor === "string" ? valor : "";
}
