/** Mensaje listo para transportar: lo que recibe cualquier adaptador de `CorreoPuerto`. */
export interface MensajeCorreo {
  asunto: string;
  html: string;
  texto: string;
}

/** Fila «nombre · valor» de los avisos de 24b (Versión, Duración, URL, Plan…). */
export interface DetalleCorreo {
  nombre: string;
  valor: string;
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
 * Template Method (pantallas 24 y 24b): el esqueleto (marca, botón, enlace en texto plano y pie)
 * es fijo; cada plantilla aporta su asunto, título, párrafo, botón y aviso final. Los avisos de
 * 24b además llenan los ganchos opcionales (etiqueta, estado, notas, detalles y líneas de la
 * bitácora); si una plantilla no los usa, el correo sale igual que en 24.
 */
export abstract class PlantillaCorreo<D extends { enlace: string }> {
  protected abstract asunto(datos: D): string;
  protected abstract titulo(datos: D): string;
  protected abstract parrafo(datos: D): string;
  protected abstract textoBoton(datos: D): string;
  protected abstract aviso(datos: D): string;

  /** Rótulo sobre el título («Despliegue», «Suscripción»). */
  protected etiqueta(_datos: D): string | null {
    return null;
  }

  /** Línea corta de estado bajo el párrafo («5 / 5 · Saludable»). */
  protected estado(_datos: D): string | null {
    return null;
  }

  /** Párrafos extra después del principal. */
  protected notas(_datos: D): readonly string[] {
    return [];
  }

  protected detalles(_datos: D): readonly DetalleCorreo[] {
    return [];
  }

  /** Últimas líneas de la bitácora, en monoespaciada. */
  protected lineas(_datos: D): readonly string[] {
    return [];
  }

  componer(datos: D): MensajeCorreo {
    const enlace = escaparHtml(datos.enlace);
    const etiqueta = this.etiqueta(datos);
    const estado = this.estado(datos);
    const notas = this.notas(datos);
    const detalles = this.detalles(datos);
    const lineas = this.lineas(datos);

    const html = [
      `<div style="font-family:Geist,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#18181b">`,
      `<p style="font-weight:600;font-size:18px;margin:0 0 24px">deploya</p>`,
      etiqueta ? `<p style="margin:0 0 6px;font-size:12px;color:#71717a">${escaparHtml(etiqueta)}</p>` : "",
      `<h1 style="font-size:22px;margin:0 0 12px">${escaparHtml(this.titulo(datos))}</h1>`,
      `<p style="margin:0 0 24px;line-height:1.5">${escaparHtml(this.parrafo(datos))}</p>`,
      ...notas.map((nota) => `<p style="margin:-12px 0 24px;line-height:1.5">${escaparHtml(nota)}</p>`),
      estado ? `<p style="margin:-12px 0 24px;font-family:'Geist Mono',monospace;font-size:12px;color:#71717a">${escaparHtml(estado)}</p>` : "",
      detalles.length > 0 ? htmlDetalles(detalles) : "",
      lineas.length > 0 ? htmlLineas(lineas) : "",
      `<a href="${enlace}" style="display:inline-block;background:#18181b;color:#fafafa;padding:10px 18px;border-radius:6px;text-decoration:none">${escaparHtml(this.textoBoton(datos))}</a>`,
      `<p style="margin:24px 0 4px;font-size:13px">¿El botón no funciona? Copia este enlace:</p>`,
      `<p style="margin:0 0 24px;font-size:13px;word-break:break-all"><a href="${enlace}">${enlace}</a></p>`,
      `<p style="margin:0 0 24px;font-size:13px;color:#71717a">${escaparHtml(this.aviso(datos))}</p>`,
      `<p style="margin:0;font-size:12px;color:#71717a">${PIE}</p>`,
      `</div>`,
    ].join("");

    const extras = [
      ...notas,
      ...(estado ? [estado] : []),
      ...detalles.map((d) => `${d.nombre}: ${d.valor}`),
      ...lineas,
    ];
    const texto = [
      ...(etiqueta ? [etiqueta, ""] : []),
      this.titulo(datos),
      "",
      this.parrafo(datos),
      "",
      ...(extras.length > 0 ? [...extras, ""] : []),
      `${this.textoBoton(datos)}: ${datos.enlace}`,
      "",
      this.aviso(datos),
      "",
      PIE,
    ].join("\n");
    return { asunto: this.asunto(datos), html, texto };
  }
}

function htmlDetalles(detalles: readonly DetalleCorreo[]): string {
  const filas = detalles
    .map(
      (d) =>
        `<tr><td style="padding:6px 16px 6px 0;font-size:13px;color:#71717a">${escaparHtml(d.nombre)}</td>` +
        `<td style="padding:6px 0;font-size:13px;font-family:'Geist Mono',monospace">${escaparHtml(d.valor)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" style="border-collapse:collapse;margin:0 0 24px">${filas}</table>`;
}

function htmlLineas(lineas: readonly string[]): string {
  const cuerpo = lineas.map(escaparHtml).join("<br>");
  return `<p style="margin:0 0 24px;padding:12px;background:#f4f4f5;border-radius:6px;font-family:'Geist Mono',monospace;font-size:12px;line-height:1.6">${cuerpo}</p>`;
}
