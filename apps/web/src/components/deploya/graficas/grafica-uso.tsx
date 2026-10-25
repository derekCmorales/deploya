"use client";

import { useId, useState, type KeyboardEvent as TecladoReact, type PointerEvent as PunteroReact } from "react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PORCENTAJE, UMBRAL_AVISO, etiquetaMomento, etiquetasDeTiempo, type RangoMetricas } from "@/lib/metricas";

import { ChipEvento } from "./chip-evento";
import { Ejes } from "./ejes";
import { escalaLineal, ticks } from "./escalas";
import { PuntoVivoSvg } from "./punto-vivo-svg";
import { detallePunto, eventoEnX, indiceAlMover, indiceMasCercano, intervaloMaximo, puntosDeSerie, type EventoDespliegue, type MuestraSerie } from "./series";
import { TooltipGrafica } from "./tooltip";

export interface GraficaUsoProps {
  titulo: string;
  muestras: MuestraSerie[];
  limite: number;
  unidad: string;
  divisiones?: number;
  inicio: string;
  fin: string;
  rango: RangoMetricas;
  despliegues?: EventoDespliegue[];
  compacta?: boolean;
  /** La Card que la contiene ya pinta el título; la gráfica lo deja solo para lectores. */
  mostrarTitulo?: boolean;
}

const ANCHO = 640;
const ALTO_NORMAL = 240;
const ALTO_COMPACTA = 96;
const MARGEN_NORMAL = { top: 16, right: 52, bottom: 26, left: 44 };
const MARGEN_COMPACTA = { top: 8, right: 8, bottom: 8, left: 8 };
const DIVISIONES_NORMAL = 4;
const DIVISIONES_COMPACTA = 2;

/** Gráfica de un recurso contra el límite del plan (memoria o CPU), en SVG a mano. */
export function GraficaUso({
  titulo,
  muestras,
  limite,
  unidad,
  divisiones,
  inicio,
  fin,
  rango,
  despliegues = [],
  compacta = false,
  mostrarTitulo = true,
}: GraficaUsoProps) {
  const [mostrarTabla, setMostrarTabla] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState<number | null>(null);
  const idAviso = `aviso-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const idZona = `zona-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const ancho = ANCHO;
  const alto = compacta ? ALTO_COMPACTA : ALTO_NORMAL;
  const margen = compacta ? MARGEN_COMPACTA : MARGEN_NORMAL;
  const wGrafica = ancho - margen.left - margen.right;
  const hGrafica = alto - margen.top - margen.bottom;
  const nDivisiones = divisiones ?? (compacta ? DIVISIONES_COMPACTA : DIVISIONES_NORMAL);

  const tInicio = Date.parse(inicio);
  const tFin = Date.parse(fin);
  const escalaTiempo = escalaLineal([tInicio, tFin], [0, wGrafica]);
  const maxValor = Math.max(limite > 0 ? limite : 1, ...muestras.map((muestra) => muestra.valor));
  const topeEjeY = limite > 0 ? limite : maxValor;
  const escalaY = escalaLineal([0, maxValor], [hGrafica, 0]);
  const yAviso = escalaY(limite * UMBRAL_AVISO);
  const yLimite = escalaY(limite);
  const segmentos = puntosDeSerie(muestras, intervaloMaximo(rango));

  const posicionX = (iso: string) => escalaTiempo(Date.parse(iso));
  const camino = (segmento: { muestra: MuestraSerie }[]) =>
    segmento.map((punto, indice) => `${indice === 0 ? "M" : "L"} ${posicionX(punto.muestra.tiempo)} ${escalaY(punto.muestra.valor)}`).join(" ");

  const ultimo = muestras[muestras.length - 1] ?? null;
  const ultimoX = ultimo ? posicionX(ultimo.tiempo) : 0;
  const ultimoY = ultimo ? escalaY(ultimo.valor) : 0;
  const porcentajeUltimo = limite > 0 && ultimo ? Math.round((ultimo.valor / limite) * PORCENTAJE) : 0;
  const resumenAria = ultimo
    ? `${titulo}: ${ultimo.valor} ${unidad} de ${limite} ${unidad} (${porcentajeUltimo} % del límite). Usa las flechas para recorrer los puntos.`
    : `${titulo}: sin muestras todavía.`;

  const marcasY = ticks(topeEjeY, nDivisiones).map((valor) => ({ y: escalaY(valor), texto: numero(valor) }));
  const marcasX = compacta
    ? []
    : etiquetasDeTiempo(inicio, fin, new Date(fin)).map((etiqueta) => ({ x: etiqueta.fraccion * wGrafica, texto: etiqueta.texto }));

  const detalle = indiceActivo !== null ? detallePunto(muestras, indiceActivo, limite, despliegues) : null;
  const activa = indiceActivo !== null ? muestras[indiceActivo] : null;

  const moverPuntero = (evento: PunteroReact<SVGSVGElement>) => {
    if (!muestras.length || wGrafica <= 0) return;
    const caja = evento.currentTarget.getBoundingClientRect();
    const x = ((evento.clientX - caja.left) / caja.width) * ancho - margen.left;
    setIndiceActivo(indiceMasCercano(muestras, x / wGrafica, inicio, fin));
  };

  const moverTeclado = (evento: TecladoReact<HTMLDivElement>) => {
    if (!muestras.length) return;
    if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft" && evento.key !== "Escape") return;
    evento.preventDefault();
    setIndiceActivo(indiceAlMover(indiceActivo, evento.key, muestras.length));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className={compacta || !mostrarTitulo ? "flex justify-end" : "flex items-center justify-between gap-3"}>
        {compacta || !mostrarTitulo ? <span className="sr-only">{titulo}</span> : <h4 className="text-sm font-semibold">{titulo}</h4>}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size={compacta ? "xs" : "sm"}
            onClick={() => setMostrarTabla((valor) => !valor)}
          >
            {mostrarTabla ? "Ver gráfica" : "Ver tabla"}
          </Button>
        </div>
      </div>

      {mostrarTabla ? (
        <div className={compacta ? "max-h-[132px] overflow-y-auto" : "max-h-[220px] overflow-y-auto"}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-xs">Hora</TableHead>
                <TableHead className="text-right font-mono text-xs">Valor</TableHead>
                <TableHead className="text-right font-mono text-xs">% del límite</TableHead>
                <TableHead className="text-right font-mono text-xs">Versión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {muestras.length ? null : (
                <TableRow>
                  <TableCell colSpan={4} className="text-xs text-muted-foreground">
                    Sin muestras todavía.
                  </TableCell>
                </TableRow>
              )}
              {muestras.map((muestra, indice) => {
                const fila = detallePunto(muestras, indice, limite, despliegues);
                return (
                  <TableRow key={`${muestra.tiempo}-${indice}`}>
                    <TableCell className="font-mono text-xs">{etiquetaMomento(muestra.tiempo, new Date(fin))}</TableCell>
                    <TableCell className="text-right font-mono text-xs tnum">
                      {muestra.valor} {unidad}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tnum">{fila?.porcentaje ?? 0} %</TableCell>
                    <TableCell className="text-right font-mono text-xs">{fila?.version ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
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
            if (indiceActivo === null && muestras.length) setIndiceActivo(muestras.length - 1);
          }}
          className="rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg
            viewBox={`0 0 ${ancho} ${alto}`}
            className="h-auto w-full overflow-visible"
            onPointerMove={moverPuntero}
            onPointerLeave={() => setIndiceActivo(null)}
          >
            <defs>
              <clipPath id={idZona}>
                <rect x="0" y="0" width={wGrafica} height={hGrafica} />
              </clipPath>
              <clipPath id={idAviso}>
                <rect x="0" y={yLimite} width={wGrafica} height={Math.max(0, yAviso - yLimite)} />
              </clipPath>
            </defs>

            <g transform={`translate(${margen.left}, ${margen.top})`}>
              {compacta ? null : <Ejes ancho={wGrafica} alto={hGrafica} marcasY={marcasY} marcasX={marcasX} />}

              {limite > 0 ? (
                <>
                  <rect x="0" y={yLimite} width={wGrafica} height={Math.max(0, yAviso - yLimite)} fill="var(--warn)" fillOpacity="0.08" />
                  <line x1="0" y1={yAviso} x2={wGrafica} y2={yAviso} stroke="var(--warn)" strokeWidth="1" strokeDasharray="2 3" />
                  <line x1="0" y1={yLimite} x2={wGrafica} y2={yLimite} stroke="var(--muted-foreground)" strokeWidth="1" strokeDasharray="4 4" />
                  {compacta ? null : (
                    <>
                      <text x={wGrafica + 6} y={yAviso + 3} className="fill-warn font-mono text-[8px] tnum">
                        aviso {UMBRAL_AVISO * PORCENTAJE} %
                      </text>
                      <text x={wGrafica + 6} y={yLimite + 3} className="fill-muted-foreground font-mono text-[10px] tnum">
                        {limite} {unidad}
                      </text>
                      <text x={wGrafica + 6} y={yLimite + 13} className="fill-muted-foreground font-mono text-[9px]">
                        límite
                      </text>
                    </>
                  )}
                </>
              ) : null}

              <g clipPath={`url(#${idZona})`}>
                {segmentos.map((segmento, indice) => {
                  const d = camino(segmento);
                  if (segmento.length === 1) {
                    const punto = segmento[0].muestra;
                    return <circle key={`punto-${indice}`} cx={posicionX(punto.tiempo)} cy={escalaY(punto.valor)} r="2" fill="var(--foreground)" />;
                  }
                  const primero = segmento[0].muestra;
                  const ultimoSegmento = segmento[segmento.length - 1].muestra;
                  const area = `${d} L ${posicionX(ultimoSegmento.tiempo)} ${hGrafica} L ${posicionX(primero.tiempo)} ${hGrafica} Z`;
                  return (
                    <g key={`segmento-${indice}`}>
                      <path d={area} fill="var(--foreground)" fillOpacity="0.05" />
                      <path d={d} fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  );
                })}
                <g clipPath={`url(#${idAviso})`}>
                  {segmentos.map((segmento, indice) =>
                    segmento.length === 1 ? (
                      <circle
                        key={`aviso-punto-${indice}`}
                        cx={posicionX(segmento[0].muestra.tiempo)}
                        cy={escalaY(segmento[0].muestra.valor)}
                        r="2"
                        fill="var(--warn)"
                      />
                    ) : (
                      <path
                        key={`aviso-${indice}`}
                        d={camino(segmento)}
                        fill="none"
                        stroke="var(--warn)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ),
                  )}
                </g>
              </g>

              {despliegues.map((despliegue) => {
                const x = eventoEnX(despliegue, inicio, fin, wGrafica);
                return x === null ? null : <ChipEvento key={`${despliegue.en}-${despliegue.version}`} x={x} version={despliegue.version} alto={hGrafica} />;
              })}

              {ultimo ? <PuntoVivoSvg cx={ultimoX} cy={ultimoY} /> : null}

              {activa && detalle ? (
                <g>
                  <line x1={posicionX(activa.tiempo)} y1="0" x2={posicionX(activa.tiempo)} y2={hGrafica} stroke="var(--muted-foreground)" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx={posicionX(activa.tiempo)} cy={escalaY(activa.valor)} r="4" fill="var(--foreground)" />
                  <TooltipGrafica
                    x={posicionX(activa.tiempo)}
                    y={escalaY(activa.valor)}
                    hora={etiquetaMomento(activa.tiempo, new Date(fin))}
                    valor={`${activa.valor} ${unidad}`}
                    porcentaje={detalle.porcentaje}
                    version={detalle.version}
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
        {activa && detalle
          ? `${etiquetaMomento(activa.tiempo, new Date(fin))}: ${activa.valor} ${unidad}, ${detalle.porcentaje} % del límite${detalle.version ? `, versión ${detalle.version}` : ""}.`
          : ""}
      </p>
    </div>
  );
}

function numero(valor: number): string {
  return Number.isInteger(valor) ? `${valor}` : `${Math.round(valor * 100) / 100}`;
}
