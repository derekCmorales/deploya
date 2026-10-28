// Diccionario de datos generado desde schema.prisma: el documento no puede
// desfasarse del modelo real porque sale del mismo archivo que usan las migraciones.
import { readFileSync } from "node:fs";

const BLOQUE = /^(model|enum)\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
const SECCION = /^\/\/\s*─+\s*(.+?)\s*─+\s*$/;

const TIPOS_SQL = {
  String: "text",
  Int: "integer",
  BigInt: "bigint",
  Boolean: "boolean",
  DateTime: "timestamp(3)",
  Decimal: "numeric",
};

/** Lee modelos, enums y el módulo (sección del schema) al que pertenece cada uno. */
export function leerEsquema(rutaSchema) {
  const texto = readFileSync(rutaSchema, "utf8");
  const enums = new Map();
  const modelos = [];
  for (const coincidencia of texto.matchAll(BLOQUE)) {
    const [, tipo, nombre, cuerpo] = coincidencia;
    const seccion = seccionAntesDe(texto, coincidencia.index);
    if (tipo === "enum") enums.set(nombre, valoresDeEnum(cuerpo));
    else modelos.push({ nombre, seccion, ...camposDeModelo(cuerpo) });
  }
  for (const modelo of modelos) modelo.campos.forEach((campo) => (campo.esEnum = enums.has(campo.tipo)));
  return { enums, modelos };
}

function seccionAntesDe(texto, posicion) {
  const lineas = texto.slice(0, posicion).split("\n").reverse();
  const encabezado = lineas.find((linea) => SECCION.test(linea));
  return encabezado ? encabezado.match(SECCION)[1] : "General";
}

function valoresDeEnum(cuerpo) {
  return cuerpo
    .split("\n")
    .map((linea) => linea.replace(/\/\/.*$/, "").trim())
    .filter(Boolean)
    .map((linea) => linea.match(/^(\w+)(?:\s+@map\("([^"]+)"\))?/))
    .filter(Boolean)
    .map(([, valor, mapeado]) => mapeado ?? valor);
}

function camposDeModelo(cuerpo) {
  const campos = [];
  const restricciones = [];
  for (const cruda of cuerpo.split("\n")) {
    const comentario = cruda.match(/\/\/\s*(.*)$/)?.[1]?.trim() ?? "";
    const linea = cruda.replace(/\/\/.*$/, "").trim();
    if (!linea) continue;
    if (linea.startsWith("@@")) restricciones.push(linea);
    else campos.push(campoDe(linea, comentario));
  }
  return { campos: campos.filter((campo) => !campo.esRelacion), relaciones: campos.filter((c) => c.esRelacion), restricciones };
}

function campoDe(linea, comentario) {
  const [nombre, tipoCrudo, ...resto] = linea.split(/\s+/);
  const atributos = resto.join(" ");
  const tipo = tipoCrudo.replace(/[?[\]]/g, "");
  return {
    nombre,
    tipo,
    opcional: tipoCrudo.endsWith("?"),
    lista: tipoCrudo.endsWith("[]"),
    atributos,
    comentario,
    esRelacion: atributos.includes("@relation") || tipoCrudo.endsWith("[]"),
  };
}

/** Markdown con una tabla por modelo y el catálogo de enums, agrupado por módulo. */
export function diccionarioEnMarkdown({ enums, modelos }) {
  const nombresModelos = new Set(modelos.map((m) => m.nombre));
  const partes = [];
  let seccionActual = null;
  for (const modelo of modelos) {
    if (modelo.seccion !== seccionActual) {
      seccionActual = modelo.seccion;
      partes.push(`### ${seccionActual}\n`);
    }
    partes.push(tablaDeModelo(modelo, nombresModelos));
  }
  partes.push("### Dominios enumerados\n");
  partes.push("| Enum | Valores en la base |\n|---|---|");
  for (const [nombre, valores] of enums) partes.push(`| \`${nombre}\` | ${valores.map((v) => `\`${v}\``).join(" · ")} |`);
  return partes.join("\n") + "\n";
}

function tablaDeModelo(modelo, nombresModelos) {
  const columnas = modelo.campos.filter((campo) => !nombresModelos.has(campo.tipo));
  const filas = columnas.map((campo) => {
    const tipo = campo.esEnum ? `enum \`${campo.tipo}\`` : `\`${tipoSql(campo)}\``;
    const nulo = campo.opcional ? "Sí" : "No";
    return `| \`${campo.nombre}\` | ${tipo} | ${nulo} | ${claves(campo, modelo)} | ${descripcion(campo)} |`;
  });
  const extra = restriccionesLegibles(modelo);
  return [
    `#### \`${modelo.nombre}\`\n`,
    "| Columna | Tipo | Nulo | Clave | Descripción |",
    "|---|---|---|---|---|",
    ...filas,
    extra ? `\n${extra}\n` : "",
  ].join("\n");
}

function tipoSql(campo) {
  const nativo = campo.atributos.match(/@db\.(\w+)(?:\(([^)]*)\))?/);
  if (nativo) return `${nativo[1].toLowerCase()}${nativo[2] ? `(${nativo[2]})` : ""}`;
  return TIPOS_SQL[campo.tipo] ?? campo.tipo;
}

function claves(campo, modelo) {
  const marcas = [];
  if (campo.atributos.includes("@id")) marcas.push("PK");
  const esFk = modelo.relaciones.some((r) => r.atributos.match(new RegExp(`fields:\\s*\\[${campo.nombre}\\]`)));
  if (esFk) marcas.push("FK");
  if (campo.atributos.includes("@unique")) marcas.push("UQ");
  return marcas.join(" · ") || "—";
}

function descripcion(campo) {
  const defecto = campo.atributos.match(/@default\(((?:[^()]|\([^)]*\))*)\)/)?.[1];
  const partes = [];
  if (campo.comentario) partes.push(comentarioLegible(campo.comentario));
  if (defecto) partes.push(`Por defecto: \`${defecto}\`.`);
  if (campo.atributos.includes("@updatedAt")) partes.push("Se actualiza en cada escritura.");
  return partes.join(" ") || "—";
}

function restriccionesLegibles(modelo) {
  const lineas = modelo.restricciones.map((r) => {
    const [, tipo, campos] = r.match(/@@(\w+)\(\[([^\]]+)\]/) ?? [];
    if (!tipo) return null;
    const nombre = { unique: "Única", index: "Índice", id: "Clave primaria compuesta" }[tipo] ?? tipo;
    return `**${nombre}:** \`(${campos.replace(/\s/g, "").split(",").join(", ")})\``;
  });
  const fks = modelo.relaciones
    .map((r) => {
      const local = r.atributos.match(/fields:\s*\[(\w+)\]/)?.[1];
      if (!local) return null;
      const borrado = r.atributos.match(/onDelete:\s*(\w+)/)?.[1];
      return `\`${local}\` → \`${r.tipo}.id\`${borrado ? ` (al borrar: ${borrado})` : ""}`;
    })
    .filter(Boolean);
  const partes = lineas.filter(Boolean);
  if (fks.length) partes.push(`**Claves foráneas:** ${fks.join("; ")}`);
  return partes.join(" · ");
}

// El comentario del schema se respeta tal cual (puede empezar con un valor como `sandbox`);
// solo se escapa la barra para no romper la tabla y se cierra con punto.
const comentarioLegible = (texto) => {
  const limpio = texto.trim().replace(/\|/g, "\\|");
  return /[.!?)]$/.test(limpio) ? limpio : `${limpio}.`;
};
