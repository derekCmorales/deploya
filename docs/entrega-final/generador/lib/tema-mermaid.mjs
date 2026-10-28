// Tema de Mermaid derivado de los tokens: los diagramas se ven como el producto.
// Los .mmd del repo traen colores propios en `classDef`; aquí se reemplazan por
// estilos del design system según el significado del nombre de la clase.
import { hexDe } from "./tokens.mjs";

/** Variables de tema para `mermaid.initialize`. */
export function variablesDeTema(tokens) {
  const fondo = hexDe(tokens.background);
  const sobre = (token) => hexDe(tokens[token], fondo);
  return {
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
    fontSize: "14px",
    background: hexDe(tokens.card),
    primaryColor: hexDe(tokens.card),
    primaryTextColor: sobre("foreground"),
    primaryBorderColor: sobre("border-stronger"),
    secondaryColor: sobre("sunken"),
    secondaryTextColor: sobre("foreground"),
    secondaryBorderColor: sobre("border-strong"),
    tertiaryColor: sobre("muted"),
    tertiaryTextColor: sobre("foreground"),
    tertiaryBorderColor: sobre("border-strong"),
    lineColor: sobre("muted-foreground"),
    textColor: sobre("foreground"),
    mainBkg: hexDe(tokens.card),
    nodeBorder: sobre("border-stronger"),
    clusterBkg: sobre("sunken"),
    clusterBorder: sobre("border-strong"),
    titleColor: sobre("foreground"),
    edgeLabelBackground: hexDe(tokens.card),
    noteBkgColor: sobre("signal-soft"),
    noteBorderColor: sobre("signal-line"),
    noteTextColor: sobre("foreground"),
    actorBkg: hexDe(tokens.card),
    actorBorder: sobre("border-stronger"),
    actorTextColor: sobre("foreground"),
    actorLineColor: sobre("border-strong"),
    signalColor: sobre("muted-foreground"),
    signalTextColor: sobre("foreground"),
    labelBoxBkgColor: sobre("sunken"),
    labelBoxBorderColor: sobre("border-strong"),
    labelTextColor: sobre("foreground"),
    loopTextColor: sobre("muted-foreground"),
    activationBkgColor: sobre("signal-soft"),
    activationBorderColor: sobre("signal"),
    sequenceNumberColor: hexDe(tokens["primary-foreground"]),
    altBackground: sobre("sunken"),
    attributeBackgroundColorOdd: hexDe(tokens.card),
    attributeBackgroundColorEven: sobre("sunken"),
    labelColor: sobre("foreground"),
    stateBkg: hexDe(tokens.card),
    compositeBackground: sobre("sunken"),
    compositeTitleBackground: sobre("muted"),
    transitionColor: sobre("muted-foreground"),
    stateLabelColor: sobre("foreground"),
    specialStateColor: sobre("foreground"),
    innerEndBackground: sobre("foreground"),
  };
}

/** Estilos por papel; cada `classDef` del repo cae en uno de estos. */
export function estilosPorPapel(tokens) {
  const fondo = hexDe(tokens.background);
  const c = (token) => hexDe(tokens[token], fondo);
  const tinta = c("foreground");
  return {
    sistema: `fill:${c("signal-soft")},stroke:${c("signal")},stroke-width:1.5px,color:${tinta}`,
    actor: `fill:${hexDe(tokens.card)},stroke:${tinta},stroke-width:1.5px,color:${tinta}`,
    externo: `fill:${c("sunken")},stroke:${c("border-stronger")},stroke-width:1px,stroke-dasharray:4 3,color:${tinta}`,
    adaptador: `fill:${c("muted")},stroke:${c("border-stronger")},stroke-width:1px,color:${tinta}`,
    datos: `fill:${c("sunken")},stroke:${c("border-stronger")},stroke-width:1px,color:${tinta}`,
    exito: `fill:${hexDe(tokens.ok.replace(")", " / 0.1)"), fondo)},stroke:${c("ok")},stroke-width:1.5px,color:${tinta}`,
    error: `fill:${hexDe(tokens.bad.replace(")", " / 0.09)"), fondo)},stroke:${c("bad")},stroke-width:1.5px,color:${tinta}`,
    decision: `fill:${hexDe(tokens.warn.replace(")", " / 0.1)"), fondo)},stroke:${c("warn")},stroke-width:1.5px,color:${tinta}`,
    extremo: `fill:${tinta},stroke:${tinta},stroke-width:1px,color:${hexDe(tokens["primary-foreground"])}`,
    neutro: `fill:${hexDe(tokens.card)},stroke:${c("border-stronger")},stroke-width:1px,color:${tinta}`,
  };
}

const PAPELES = [
  ["exito", /success|ok|saludable|exito/i],
  ["error", /error|fail|fallo|bad/i],
  ["decision", /decision|warn|aviso/i],
  ["extremo", /startend|inicio|fin/i],
  ["externo", /ext|externo|external/i],
  ["actor", /actor|persona|cliente|user/i],
  ["adaptador", /adapt|port|puerto/i],
  ["datos", /data|datos|input|store/i],
  ["sistema", /sistema|core|app|api|dom|worker|op|entry|deploya/i],
];

export const papelDe = (nombreClase) => PAPELES.find(([, patron]) => patron.test(nombreClase))?.[0] ?? "neutro";

/** Reescribe los `classDef` y quita `style` y `linkStyle` sueltos para que manden los tokens. */
export function aplicarEstilos(fuente, estilos) {
  return fuente
    .replace(/^(\s*)classDef\s+([\w,]+)\s+.*$/gm, (_, sangria, nombres) =>
      nombres
        .split(",")
        .map((nombre) => `${sangria}classDef ${nombre} ${estilos[papelDe(nombre)]}`)
        .join("\n"),
    )
    .replace(/^\s*(style|linkStyle)\s+\S+\s+.*$/gm, "");
}

/** Separa el título del front-matter: va como pie de figura, no dentro del SVG. */
export function separarTitulo(fuente) {
  const frente = fuente.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frente) return { titulo: null, cuerpo: fuente };
  const titulo = frente[1].match(/title:\s*(.+)/)?.[1]?.trim() ?? null;
  const resto = frente[1].replace(/title:.*\n?/, "").trim();
  const cuerpo = (resto ? `---\n${resto}\n---\n` : "") + fuente.slice(frente[0].length);
  return { titulo, cuerpo };
}
