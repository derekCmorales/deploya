/** Mensaje listo para transportar: lo que recibe cualquier adaptador de `CorreoPuerto`. */
export interface MensajeCorreo {
  asunto: string;
  html: string;
  texto: string;
}

const PIE = "deploya · soporte@deploya.app";

/** Escapa lo que llega de la API (nombre, correo, enlace) antes de meterlo en el HTML. */
export function escaparHtml(valor: string): string {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Template Method (pantalla 24): el esqueleto (marca, botón, enlace en texto plano y pie)
 * es fijo; cada plantilla solo aporta su asunto, título, párrafo, botón y aviso final.
 */
export abstract class PlantillaCorreo<D extends { enlace: string }> {
  protected abstract asunto(datos: D): string;
  protected abstract titulo(datos: D): string;
  protected abstract parrafo(datos: D): string;
  protected abstract textoBoton(datos: D): string;
  protected abstract aviso(datos: D): string;

  componer(datos: D): MensajeCorreo {
    const enlace = escaparHtml(datos.enlace);
    const html = [
      `<div style="font-family:Geist,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#18181b">`,
      `<p style="font-weight:600;font-size:18px;margin:0 0 24px">deploya</p>`,
      `<h1 style="font-size:22px;margin:0 0 12px">${escaparHtml(this.titulo(datos))}</h1>`,
      `<p style="margin:0 0 24px;line-height:1.5">${escaparHtml(this.parrafo(datos))}</p>`,
      `<a href="${enlace}" style="display:inline-block;background:#18181b;color:#fafafa;padding:10px 18px;border-radius:6px;text-decoration:none">${escaparHtml(this.textoBoton(datos))}</a>`,
      `<p style="margin:24px 0 4px;font-size:13px">¿El botón no funciona? Copia este enlace:</p>`,
      `<p style="margin:0 0 24px;font-size:13px;word-break:break-all"><a href="${enlace}">${enlace}</a></p>`,
      `<p style="margin:0 0 24px;font-size:13px;color:#71717a">${escaparHtml(this.aviso(datos))}</p>`,
      `<p style="margin:0;font-size:12px;color:#71717a">${PIE}</p>`,
      `</div>`,
    ].join("");
    const texto = [
      this.titulo(datos),
      "",
      this.parrafo(datos),
      "",
      `${this.textoBoton(datos)}: ${datos.enlace}`,
      "",
      this.aviso(datos),
      "",
      PIE,
    ].join("\n");
    return { asunto: this.asunto(datos), html, texto };
  }
}
