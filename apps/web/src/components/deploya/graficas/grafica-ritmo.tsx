"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent as TecladoReact, type PointerEvent as PunteroReact } from "react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  UMBRAL_AVISO,
  diasDelMes as diasDelContrato,
  enZonaAviso,
  etiquetaDia,
  etiquetasDeDia,
  indiceDeDia,
  proyectar,
  puntosRitmo,
  type ConsumoDiario,
  type PuntoRitmo,
} from "@/lib/proyeccion";

import { Ejes } from "./ejes";
import { escalaLineal, ticks } from "./escalas";
import { PuntoVivoSvg } from "./punto-vivo-svg";
import { indiceAlMover } from "./series";

export interface GraficaRitmoProps {
  datos: ConsumoDiario;
}

const ANCHO_INICIAL = 640;
const ALTO = 240;
const MARGEN = { top: 16, right: 52, bottom: 26, left: 44 };
const DIVISIONES_Y = 4;
const ALTURA_MAXIMA_COLUMNA = 0.45;
const ANCHO_COLUMNA = 0.55;
const ANCHO_TOOLTIP = 150;
const ALTO_TOOLTIP = 72;
const MARGEN_TOOLTIP = 8;

function esTeclaDeNavegacion(tecla: string): boolean {
  return tecla === "ArrowRight" || tecla === "ArrowLeft" || tecla === "Home" || tecla === "End" || tecla === "Escape";
}

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
  const acumulado = puntos[dias - 1]?.acumulado ?? 0;
  const maxDiario = Math.max(1, ...datos.diarios);

  const wGrafica = ancho - MARGEN.left - MARGEN.right;
  const hGrafica = ALTO - MARGEN.top - MARGEN.bottom;
  const tope = Math.max(datos.cuota, proyeccion ?? 0, acumulado, 1);
  const escalaY = escalaLineal([0, tope], [hGrafica, 0]);
  const escalaX = escalaLineal([1, Math.max(2, diasPeriodo)], [0, wGrafica]);

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

  const marcasY = ticks(tope, DIVISIONES_Y).map((valor) => ({ y: escalaY(valor), texto: numero(valor) }));
  const marcasX = etiquetasDeDia(datos.desde, diasPeriodo).map((etiqueta) => ({
    x: escalaX(etiqueta.dia),
    texto: etiqueta.texto,
  }));

  const aviso = enZonaAviso(proyeccion, datos.cuota);
  const resumenAria = [
    `Ritmo de construcciones: ${acumulado} de ${datos.cuota} usadas en ${dias} días.`,
    proyeccion === null ? "Sin proyección al cierre todavía." : `Proyección al cierre: ${proyeccion}.`,
    `Usa las flechas para recorrer los días.`,
  ].join(" ");
  const activo = indiceActivo !== null ? puntos[indiceActivo] : null;

  const moverPuntero = (evento: PunteroReact<SVGSVGElement>) => {
    if (!puntos.length || wGrafica <= 0) return;
    const caja = evento.currentTarget.getBoundingClientRect();
    const x = ((evento.clientX - caja.left) / caja.width) * ancho - MARGEN.left;
    setIndiceActivo(indiceDeDia(x / wGrafica, puntos.length));
  };

  const moverTeclado = (evento: TecladoReact<HTMLDivElement>) => {
    if (!puntos.length || !esTeclaDeNavegacion(evento.key)) return;
    evento.preventDefault();
    setIndiceActivo(indiceAlMover(indiceActivo, evento.key, puntos.length));
  };

  return (
    <div ref={contenedorRef} className="flex flex-col gap-2">
      <div className="flex justify-end">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {puntos.length ? null : (
                <TableRow>
                  <TableCell colSpan={3} className="text-xs text-muted-foreground">
                    Sin construcciones todavía.
                  </TableCell>
                </TableRow>
              )}
              {puntos.map((punto) => (
                <TableRow key={punto.dia}>
                  <TableCell className="font-mono text-xs">{etiquetaDia(datos.desde, punto.dia)}</TableCell>
                  <TableCell className="text-right font-mono text-xs tnum">{punto.porDia}</TableCell>
                  <TableCell className="text-right font-mono text-xs tnum">{punto.acumulado}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div
          role="img"
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
              <text x={wGrafica + 6} y={yAviso + 3} className="fill-warn font-mono text-[8px] tnum">
                aviso {UMBRAL_AVISO * 100} %
              </text>
              <text x={wGrafica + 6} y={yCuota + 3} className="fill-muted-foreground font-mono text-[10px] tnum">
                {datos.cuota} · cuota
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

              {proyeccion !== null && puntos.length ? (
                <line
                  x1={ultimoX}
                  y1={ultimoY}
                  x2={finX}
                  y2={finY}
                  stroke="var(--muted-foreground)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              ) : null}

              {puntos.length ? <PuntoVivoSvg cx={ultimoX} cy={ultimoY} /> : null}

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

              {aviso ? (
                <text x="6" y="12" className="fill-warn font-mono text-[9px]">
                  En zona de aviso
                </text>
              ) : null}
            </g>
          </svg>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {activo
          ? `${etiquetaDia(datos.desde, activo.dia)}: ${activo.porDia} construcciones, ${activo.acumulado} de ${datos.cuota} acumuladas.`
          : ""}
      </p>
    </div>
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
        </div>
      </foreignObject>
    </g>
  );
}

function numero(valor: number): string {
  return Number.isInteger(valor) ? `${valor}` : `${Math.round(valor * 100) / 100}`;
}
