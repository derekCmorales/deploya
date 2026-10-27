"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent as TecladoReact, type PointerEvent as PunteroReact } from "react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  UMBRAL_AVISO,
  diasDelMes as diasDelContrato,
  ejeRitmo,
  etiquetaDia,
  etiquetasDeDia,
  indiceDeDia,
  porcentajeDeCuota,
  proyectar,
  puntosRitmo,
  type ConsumoDiario,
  type PuntoRitmo,
} from "@/lib/proyeccion";

import { Ejes } from "./ejes";
import { escalaLineal } from "./escalas";
import { PuntoVivoSvg } from "./punto-vivo-svg";
import { esTeclaDeNavegacion, indiceAlMover } from "./series";

export interface GraficaRitmoProps {
  datos: ConsumoDiario;
}

const ANCHO_INICIAL = 640;
const ALTO = 240;
const MARGEN = { top: 20, right: 52, bottom: 26, left: 44 };
const PORCENTAJE = 100;
const ALTURA_MAXIMA_COLUMNA = 0.45;
const ANCHO_COLUMNA = 0.55;
const ANCHO_TOOLTIP = 150;
const ALTO_TOOLTIP = 100;
const MARGEN_TOOLTIP = 8;
const SEPARACION_ETIQUETA = 6;
const AJUSTE_BASE_TEXTO = 3;
const ALTURA_ETIQUETA_HOY = 12;
const SEGUNDA_LINEA = 13;
/** Medio día a cada lado: la columna del día 1 y la del último no quedan cortadas. */
const MEDIO_DIA = 0.5;
/** Cerca del borde izquierdo, «hoy · 1 oct» se alinea al inicio para no salirse. */
const BORDE_ETIQUETA_HOY = 48;

/**
 * Ritmo de construcciones (08c): acumulado del período contra la cuota, columnas por día,
 * proyección al cierre y banda de aviso. SVG a mano, sin librerías (README § Gráficas).
 */
export function GraficaRitmo({ datos }: GraficaRitmoProps) {
  const [mostrarTabla, setMostrarTabla] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState<number | null>(null);
  const [ancho, setAncho] = useState(ANCHO_INICIAL);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const idZona = `zona-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const idAviso = `aviso-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  // El viewBox sigue al ancho real: así un texto de 10 px mide 10 px también en dos columnas.
  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor || typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver((entradas) => {
      const medida = entradas[0]?.contentRect.width ?? 0;
      if (medida > 0) setAncho(Math.round(medida));
    });
    observador.observe(contenedor);
    return () => observador.disconnect();
  }, []);

  const dias = datos.diarios.length;
  const diasPeriodo = diasDelContrato(datos.desde, datos.reinicia);
  const puntos = puntosRitmo(datos.diarios);
  const proyeccion = proyectar(datos.diarios, diasPeriodo);
  const conProyeccion = proyeccion !== null && dias < diasPeriodo;
  const acumulado = puntos[dias - 1]?.acumulado ?? 0;
  const maxDiario = Math.max(1, ...datos.diarios);

  const wGrafica = ancho - MARGEN.left - MARGEN.right;
  const hGrafica = ALTO - MARGEN.top - MARGEN.bottom;
  const eje = ejeRitmo(Math.max(datos.cuota, proyeccion ?? 0, acumulado));
  const escalaY = escalaLineal([0, eje.tope], [hGrafica, 0]);
  const escalaX = escalaLineal([1 - MEDIO_DIA, Math.max(1, diasPeriodo) + MEDIO_DIA], [0, wGrafica]);

  const yCuota = escalaY(datos.cuota);
  const yAviso = escalaY(datos.cuota * UMBRAL_AVISO);
  const anchoColumna = (wGrafica / Math.max(1, diasPeriodo)) * ANCHO_COLUMNA;

  const camino = puntos
    .map((punto, indice) => `${indice === 0 ? "M" : "L"} ${escalaX(punto.dia)} ${escalaY(punto.acumulado)}`)
    .join(" ");
  const area = puntos.length ? `${camino} L ${escalaX(puntos[dias - 1].dia)} ${hGrafica} L ${escalaX(puntos[0].dia)} ${hGrafica} Z` : "";
  const ultimoX = puntos.length ? escalaX(puntos[dias - 1].dia) : 0;
  const ultimoY = escalaY(acumulado);
  const finX = escalaX(diasPeriodo);
  const finY = proyeccion === null ? 0 : escalaY(proyeccion);

  const marcasY = eje.marcas.map((valor) => ({ y: escalaY(valor), texto: `${valor}` }));
  const marcasX = etiquetasDeDia(datos.desde, diasPeriodo).map((etiqueta) => ({
    x: escalaX(etiqueta.dia),
    texto: etiqueta.texto,
  }));

  const resumenAria = [
    `Ritmo de construcciones: ${acumulado} de ${datos.cuota} usadas en ${dias} días (${porcentajeDeCuota(acumulado, datos.cuota)} % de la cuota).`,
    proyeccion === null ? "Sin proyección al cierre todavía." : `Proyección al cierre: ${proyeccion}.`,
    "Usa las flechas para recorrer los días.",
  ].join(" ");
  const activo = indiceActivo !== null ? puntos[indiceActivo] : null;

  const moverPuntero = (evento: PunteroReact<SVGSVGElement>) => {
    if (!puntos.length || wGrafica <= 0) return;
    const caja = evento.currentTarget.getBoundingClientRect();
    const x = ((evento.clientX - caja.left) / caja.width) * ancho - MARGEN.left;
    setIndiceActivo(indiceDeDia(x / wGrafica, diasPeriodo, puntos.length));
  };

  const moverTeclado = (evento: TecladoReact<HTMLDivElement>) => {
    if (!puntos.length || !esTeclaDeNavegacion(evento.key)) return;
    evento.preventDefault();
    setIndiceActivo(indiceAlMover(indiceActivo, evento.key, puntos.length));
  };

  return (
    <div ref={contenedorRef} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Leyenda />
        <Button type="button" variant="ghost" size="xs" onClick={() => setMostrarTabla((valor) => !valor)}>
          {mostrarTabla ? "Ver gráfica" : "Ver tabla"}
        </Button>
      </div>

      {mostrarTabla ? (
        <div className="max-h-[260px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-xs">Día</TableHead>
                <TableHead className="text-right font-mono text-xs">Por día</TableHead>
                <TableHead className="text-right font-mono text-xs">Acumuladas</TableHead>
                <TableHead className="text-right font-mono text-xs">% de la cuota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {puntos.length ? null : (
                <TableRow>
                  <TableCell colSpan={4} className="text-xs text-muted-foreground">
                    Sin construcciones todavía.
                  </TableCell>
                </TableRow>
              )}
              {puntos.map((punto) => (
                <TableRow key={punto.dia}>
                  <TableCell className="font-mono text-xs">{etiquetaDia(datos.desde, punto.dia)}</TableCell>
                  <TableCell className="text-right font-mono text-xs tnum">{punto.porDia}</TableCell>
                  <TableCell className="text-right font-mono text-xs tnum">{punto.acumulado}</TableCell>
                  <TableCell className="text-right font-mono text-xs tnum">{porcentajeDeCuota(punto.acumulado, datos.cuota)} %</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div
          role="group"
          aria-roledescription="gráfica"
          aria-label={resumenAria}
          tabIndex={0}
          onKeyDown={moverTeclado}
          onFocus={() => {
            if (indiceActivo === null && puntos.length) setIndiceActivo(puntos.length - 1);
          }}
          onBlur={() => setIndiceActivo(null)}
          className="rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg
            viewBox={`0 0 ${ancho} ${ALTO}`}
            className="h-auto w-full overflow-visible"
            onPointerMove={moverPuntero}
            onPointerLeave={() => setIndiceActivo(null)}
          >
            <defs>
              <clipPath id={idZona}>
                <rect x="0" y="0" width={wGrafica} height={hGrafica} />
              </clipPath>
              <clipPath id={idAviso}>
                <rect x="0" y={yCuota} width={wGrafica} height={Math.max(0, yAviso - yCuota)} />
              </clipPath>
            </defs>

            <g transform={`translate(${MARGEN.left}, ${MARGEN.top})`}>
              <Ejes ancho={wGrafica} alto={hGrafica} marcasY={marcasY} marcasX={marcasX} />

              <rect x="0" y={yCuota} width={wGrafica} height={Math.max(0, yAviso - yCuota)} fill="var(--warn)" fillOpacity="0.08" />
              <line x1="0" y1={yAviso} x2={wGrafica} y2={yAviso} stroke="var(--warn)" strokeWidth="1" strokeDasharray="2 3" />
              <line x1="0" y1={yCuota} x2={wGrafica} y2={yCuota} stroke="var(--muted-foreground)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={wGrafica + SEPARACION_ETIQUETA} y={yAviso + AJUSTE_BASE_TEXTO} className="fill-warn font-mono text-[8px] tnum">
                aviso {UMBRAL_AVISO * PORCENTAJE} %
              </text>
              <text x={wGrafica + SEPARACION_ETIQUETA} y={yCuota + AJUSTE_BASE_TEXTO} className="fill-muted-foreground font-mono text-[10px] tnum">
                {datos.cuota}
              </text>
              <text x={wGrafica + SEPARACION_ETIQUETA} y={yCuota + SEGUNDA_LINEA} className="fill-muted-foreground font-mono text-[9px]">
                cuota
              </text>

              <g clipPath={`url(#${idZona})`}>
                {puntos.map((punto) => {
                  const altura = (punto.porDia / maxDiario) * hGrafica * ALTURA_MAXIMA_COLUMNA;
                  return (
                    <rect
                      key={`dia-${punto.dia}`}
                      x={escalaX(punto.dia) - anchoColumna / 2}
                      y={hGrafica - altura}
                      width={anchoColumna}
                      height={altura}
                      fill="var(--foreground)"
                      fillOpacity="0.15"
                      rx="1"
                    />
                  );
                })}

                {puntos.length > 1 ? (
                  <>
                    <path d={area} fill="var(--foreground)" fillOpacity="0.05" />
                    <path d={camino} fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                ) : null}

                <g clipPath={`url(#${idAviso})`}>
                  <path d={camino} fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </g>

              {conProyeccion && puntos.length ? (
                <>
                  <line
                    x1={ultimoX}
                    y1={ultimoY}
                    x2={finX}
                    y2={finY}
                    stroke="var(--muted-foreground)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <circle cx={finX} cy={finY} r="2.5" fill="var(--card)" stroke="var(--muted-foreground)" strokeWidth="1.5" />
                  <text x={finX} y={finY - SEPARACION_ETIQUETA - AJUSTE_BASE_TEXTO} textAnchor="end" className="fill-foreground font-mono text-[10px] font-medium tnum">
                    ~{proyeccion}
                  </text>
                </>
              ) : null}

              {puntos.length ? (
                <>
                  <PuntoVivoSvg cx={ultimoX} cy={ultimoY} />
                  {activo ? null : (
                    <text
                      x={ultimoX}
                      y={ultimoY - ALTURA_ETIQUETA_HOY}
                      textAnchor={ultimoX < BORDE_ETIQUETA_HOY ? "start" : conProyeccion ? "middle" : "end"}
                      className="fill-muted-foreground font-mono text-[10px] tnum"
                    >
                      hoy · {etiquetaDia(datos.desde, dias)}
                    </text>
                  )}
                </>
              ) : null}

              {activo ? (
                <g>
                  <line x1={escalaX(activo.dia)} y1="0" x2={escalaX(activo.dia)} y2={hGrafica} stroke="var(--muted-foreground)" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx={escalaX(activo.dia)} cy={escalaY(activo.acumulado)} r="4" fill="var(--foreground)" />
                  <TooltipDia
                    x={escalaX(activo.dia)}
                    y={escalaY(activo.acumulado)}
                    desde={datos.desde}
                    punto={activo}
                    cuota={datos.cuota}
                    anchoContenedor={wGrafica}
                    altoContenedor={hGrafica}
                  />
                </g>
              ) : null}
            </g>
          </svg>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {activo
          ? `${etiquetaDia(datos.desde, activo.dia)}: ${activo.porDia} construcciones, ${activo.acumulado} de ${datos.cuota} acumuladas (${porcentajeDeCuota(activo.acumulado, datos.cuota)} % de la cuota).`
          : ""}
      </p>
    </div>
  );
}

/** Leyenda de la ficha: Acumuladas · Proyección · Por día · Zona de aviso. */
function Leyenda() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden="true">
      <li className="flex items-center gap-1.5">
        <span className="h-0.5 w-3 rounded-full bg-foreground" />
        Acumuladas
      </li>
      <li className="flex items-center gap-1.5">
        <span className="w-3 border-t-[1.5px] border-dashed border-muted-foreground" />
        Proyección
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[2px] bg-foreground/15" />
        Por día
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[2px] border border-dashed border-warn bg-warn/8" />
        Zona de aviso
      </li>
    </ul>
  );
}

function TooltipDia({
  x,
  y,
  desde,
  punto,
  cuota,
  anchoContenedor,
  altoContenedor,
}: {
  x: number;
  y: number;
  desde: string;
  punto: PuntoRitmo;
  cuota: number;
  anchoContenedor: number;
  altoContenedor: number;
}) {
  const aLaDerecha = x < anchoContenedor - ANCHO_TOOLTIP - MARGEN_TOOLTIP;
  const izquierda = aLaDerecha ? x + MARGEN_TOOLTIP : x - ANCHO_TOOLTIP - MARGEN_TOOLTIP;
  const arriba = Math.max(0, Math.min(y - ALTO_TOOLTIP / 2, altoContenedor - ALTO_TOOLTIP));

  return (
    <g transform={`translate(${Math.max(0, izquierda)}, ${arriba})`} className="pointer-events-none">
      <foreignObject width={ANCHO_TOOLTIP} height={ALTO_TOOLTIP}>
        <div className="flex flex-col gap-0.5 rounded-md border border-border-strong bg-popover p-2 font-mono text-[10px] text-popover-foreground shadow-elev">
          <span className="font-medium text-muted-foreground">{etiquetaDia(desde, punto.dia)}</span>
          <span>
            Por día: <span className="font-semibold tnum">{punto.porDia}</span>
          </span>
          <span>
            Acumuladas:{" "}
            <span className="font-semibold tnum">
              {punto.acumulado} de {cuota}
            </span>
          </span>
          <span>
            Uso: <span className="font-semibold tnum">{porcentajeDeCuota(punto.acumulado, cuota)} % de la cuota</span>
          </span>
        </div>
      </foreignObject>
    </g>
  );
}
