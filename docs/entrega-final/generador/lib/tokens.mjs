// Lee los tokens del modo claro desde globals.css (fuente madre del design system v4.1)
// y los convierte a hex para Mermaid, que no entiende OKLCH.
import { readFileSync } from "node:fs";

const BLOQUE_RAIZ = /:root\s*\{([\s\S]*?)\n\}/;
const DECLARACION = /--([\w-]+):\s*([^;]+);/g;
const OKLCH = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)/;

/** Tokens de `:root` (modo claro) tal como están en el CSS. */
export function leerTokens(rutaGlobals) {
  const css = readFileSync(rutaGlobals, "utf8");
  const raiz = css.match(BLOQUE_RAIZ);
  if (!raiz) throw new Error(`No hay bloque :root en ${rutaGlobals}`);
  const tokens = {};
  for (const [, nombre, valor] of raiz[1].matchAll(DECLARACION)) tokens[nombre] = valor.trim();
  return resolverReferencias(tokens);
}

function resolverReferencias(tokens) {
  const resueltos = { ...tokens };
  for (const [nombre, valor] of Object.entries(resueltos)) {
    const referencia = valor.match(/^var\(--([\w-]+)\)$/);
    if (referencia) resueltos[nombre] = resueltos[referencia[1]];
  }
  return resueltos;
}

/** Hex opaco del token, mezclado sobre `fondo` si tiene transparencia. */
export function hexDe(valor, fondo = "#ffffff") {
  const color = valor.match(OKLCH);
  if (!color) return valor;
  const [l, c, h, alfa = "1"] = color.slice(1);
  const rgb = oklchARgb(Number(l), Number(c), Number(h));
  const base = rgbDeHex(fondo);
  const a = Number(alfa);
  return hexDeRgb(rgb.map((canal, i) => canal * a + base[i] * (1 - a)));
}

function oklchARgb(l, c, h) {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lineal = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  return lineal.map((v) => 255 * gamma(Math.min(1, Math.max(0, v))));
}

const gamma = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const rgbDeHex = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hexDeRgb = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
