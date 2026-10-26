"use client";

import { useState, type KeyboardEvent as TecladoReact, type PointerEvent as PunteroReact } from "react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ETAPAS_TIEMPO,
  ETIQUETA_ETAPA,
  duracionTotal,
  formatoDuracion,
  minutosDelEje,
  MS_POR_MINUTO,
  resumenAccesible,
  textoTramo,
  tramosVisibles,
  type EtapaTiempo,
  type TiemposDespliegue,
} from "@/lib/tiempos";

import { escalaLineal } from "./escalas";
import { esTeclaDeNavegacion, indiceAlMover } from "./series";

export interface GraficaEtapasProps {
  despliegues: TiemposDespliegue[];
  /** Número del despliegue activo; `null` si el proyecto no tiene ninguno. */
  numeroActivo: number | null;
  /** Mediana de los Saludables sin reversión, en ms; la calcula la API (`resumen.medianaMs`). */
  medianaMs: number;
}

const ANCHO = 720;
const ALTO = 248;
const MARGEN = { top: 18, right: 62, bottom: 42, left: 42 };
const ALTO_MINIMO_BARRA = 2;
const ANCHO_MAXIMO_BARRA = 32;
const ANCHO_TOOLTIP = 174;
/** Cabecera y cinco etapas en `text-[10px]` con `leading-tight`, más el relleno. */
const ALTO_TOOLTIP = 124;
const MARGEN_TOOLTIP = 8;
const TONO_ETAPA: Record<EtapaTiempo, number> = {
  recepcion: 0.8,
  construccion: 0.62,
  ejecucion: 0.46,
  enrutamiento: 0.32,
  operacion: 0.2,
};
const DIVISIONES_EJE = 4;
/** Parte del ancho de la columna que ocupa la barra; el resto es aire entre versiones. */
const PROPORCION_BARRA = 0.55;
/** Posiciones (px del viewBox) de los textos bajo cada columna y junto a la mediana. */
const Y_NUMERO_COLUMNA = 15;
const Y_PRIMERA_PALABRA = 27;
const ALTO_LINEA_PALABRA = 10;
const SEPARACION_ETIQUETA = 6;
const SEPARACION_EJE = 8;
const AJUSTE_BASE_TEXTO = 3;
const Y_PALABRA_MEDIANA = 13;

/** Columnas apiladas por despliegue: una por versión, cinco tramos del riel (14c). */
export function GraficaEtapas({ despliegues, numeroActivo, medianaMs }: GraficaEtapasProps) {
  const [mostrarTabla, setMostrarTabla] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState<number | null>(null);

  if (despliegues.length === 0) return null;

  const anchoGrafica = ANCHO - MARGEN.left - MARGEN.right;
  const altoGrafica = ALTO - MARGEN.top - MARGEN.bottom;
  const minutos = minutosDelEje(despliegues);
  const topeMs = minutos * MS_POR_MINUTO;
  const escalaY = escalaLineal([0, topeMs], [altoGrafica, 0]);
  const anchoColumna = anchoGrafica / despliegues.length;
  const anchoBarra = Math.min(ANCHO_MAXIMO_BARRA, anchoColumna * PROPORCION_BARRA);
  const marcasY = marcasDelEje(minutos);
  const activa = indiceActivo !== null ? despliegues[indiceActivo] : null;

  const moverPuntero = (evento: PunteroReact<SVGSVGElement>) => {
    const caja = evento.currentTarget.getBoundingClientRect();
    const x = ((evento.clientX - caja.left) / caja.width) * ANCHO - MARGEN.left;
    if (x < 0 || x > anchoGrafica) {
      setIndiceActivo(null);
      return;
    }
    const indice = Math.min(despliegues.length - 1, Math.max(0, Math.floor(x / anchoColumna)));
    setIndiceActivo(indice);
  };

  const moverTeclado = (evento: TecladoReact<HTMLDivElement>) => {
    if (!esTeclaDeNavegacion(evento.key)) return;
    evento.preventDefault();
    setIndiceActivo(indiceAlMover(indiceActivo, evento.key, despliegues.length));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => setMostrarTabla((valor) => !valor)}>
          {mostrarTabla ? "Ver gráfica" : "Ver tabla"}
        </Button>
      </div>

      {mostrarTabla ? (
        <div className="max-h-[320px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-xs">Versión</TableHead>
                {ETAPAS_TIEMPO.map((etapa) => (
                  <TableHead key={etapa} className="text-right font-mono text-xs">
                    {ETIQUETA_ETAPA[etapa]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {despliegues.map((despliegue) => (
                <TableRow key={despliegue.numero} data-activa={despliegue.numero === numeroActivo}>
                  <TableCell className="font-mono text-xs">
                    #{despliegue.numero}
                    {despliegue.reversion ? " ↺" : ""}
                  </TableCell>
                  {ETAPAS_TIEMPO.map((etapa) => (
                    <TableCell key={etapa} className="text-right font-mono text-xs tnum">
                      {textoTramo(despliegue.etapas[etapa])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div
          role="group"
          aria-roledescription="gráfica"
          aria-label={`Tiempo por etapa. ${resumenAccesible(despliegues, medianaMs)} Usa las flechas, Inicio y Fin para recorrer las columnas.`}
          tabIndex={0}
          onKeyDown={moverTeclado}
          onFocus={() => {
            if (indiceActivo === null) setIndiceActivo(despliegues.length - 1);
          }}
          onBlur={() => setIndiceActivo(null)}
          className="rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg
            viewBox={`0 0 ${ANCHO} ${ALTO}`}
            className="h-auto w-full overflow-visible"
            onPointerMove={moverPuntero}
            onPointerLeave={() => setIndiceActivo(null)}
          >
            <g transform={`translate(${MARGEN.left}, ${MARGEN.top})`}>
              <EjeY marcas={marcasY} escala={escalaY} ancho={anchoGrafica} />

              {despliegues.map((despliegue, indice) => {
                const centro = anchoColumna * (indice + 0.5);
                const izquierda = centro - anchoBarra / 2;
                const tramos = tramosVisibles(despliegue);
                let base = altoGrafica;
                return (
                  <g key={despliegue.numero}>
                    {tramos.map((tramo) => {
                      const altura = Math.max(ALTO_MINIMO_BARRA, (tramo.ms / topeMs) * altoGrafica);
                      base -= altura;
                      return (
                        <rect
                          key={tramo.etapa}
                          x={izquierda}
                          y={base}
                          width={anchoBarra}
                          height={altura}
                          fill={tramo.fallo ? "var(--bad)" : "var(--foreground)"}
                          fillOpacity={tramo.fallo ? 1 : TONO_ETAPA[tramo.etapa]}
                        />
                      );
                    })}
                    <EtiquetaColumna
                      centro={centro}
                      alto={altoGrafica}
                      numero={despliegue.numero}
                      reversion={despliegue.reversion}
                      fallo={despliegue.falloEn !== null}
                      activa={despliegue.numero === numeroActivo}
                    />
                  </g>
                );
              })}

              {medianaMs > 0 ? (
                <g>
                  <line
                    x1="0"
                    y1={escalaY(medianaMs)}
                    x2={anchoGrafica}
                    y2={escalaY(medianaMs)}
                    stroke="var(--muted-foreground)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text x={anchoGrafica + SEPARACION_ETIQUETA} y={escalaY(medianaMs) + AJUSTE_BASE_TEXTO} className="fill-muted-foreground font-mono text-[9px] tnum">
                    {formatoDuracion(medianaMs)}
                  </text>
                  <text x={anchoGrafica + SEPARACION_ETIQUETA} y={escalaY(medianaMs) + Y_PALABRA_MEDIANA} className="fill-muted-foreground font-mono text-[8px]">
                    mediana
                  </text>
                </g>
              ) : null}

              {activa ? (
                <g>
                  <line
                    x1={anchoColumna * (indiceActivo ?? 0) + anchoColumna / 2}
                    y1="0"
                    x2={anchoColumna * (indiceActivo ?? 0) + anchoColumna / 2}
                    y2={altoGrafica}
                    stroke="var(--muted-foreground)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <TooltipEtapas
                    x={anchoColumna * (indiceActivo ?? 0) + anchoColumna / 2}
                    anchoContenedor={anchoGrafica}
                    altoContenedor={altoGrafica}
                    despliegue={activa}
                  />
                </g>
              ) : null}
            </g>
          </svg>
        </div>
      )}

      <Leyenda />
      <p className="sr-only" aria-live="polite">
        {activa
          ? `#${activa.numero}: ${ETAPAS_TIEMPO.map((etapa) => `${ETIQUETA_ETAPA[etapa]} ${textoTramo(activa.etapas[etapa])}`).join(", ")}.`
          : ""}
      </p>
    </div>
  );
}

function marcasDelEje(minutos: number): number[] {
  const paso = Math.max(1, Math.ceil(minutos / DIVISIONES_EJE));
  const marcas: number[] = [];
  for (let minuto = 0; minuto < minutos; minuto += paso) marcas.push(minuto);
  marcas.push(minutos);
  return marcas;
}

function EjeY({
  marcas,
  escala,
  ancho,
}: {
  marcas: number[];
  escala: (valor: number) => number;
  ancho: number;
}) {
  return (
    <g className="select-none text-muted-foreground" aria-hidden="true">
      {marcas.map((minuto) => {
        const y = escala(minuto * MS_POR_MINUTO);
        return (
          <g key={minuto}>
            <line x1="0" y1={y} x2={ancho} y2={y} stroke="currentColor" strokeOpacity="0.12" strokeDasharray="2 4" />
            <text x={-SEPARACION_EJE} y={y + AJUSTE_BASE_TEXTO} textAnchor="end" className="fill-muted-foreground font-mono text-[10px] tnum">
              {minuto} min
            </text>
          </g>
        );
      })}
    </g>
  );
}

function EtiquetaColumna({
  centro,
  alto,
  numero,
  reversion,
  fallo,
  activa,
}: {
  centro: number;
  alto: number;
  numero: number;
  reversion: boolean;
  fallo: boolean;
  activa: boolean;
}) {
  const palabras = [fallo ? "falló" : null, activa ? "activa" : null].filter((palabra) => palabra !== null);
  return (
    <g transform={`translate(${centro}, ${alto})`}>
      <text textAnchor="middle" y={Y_NUMERO_COLUMNA} className="fill-muted-foreground font-mono text-[10px] tnum">
        #{numero}
        {reversion ? " ↺" : ""}
      </text>
      {palabras.map((palabra, indice) => (
        <text
          key={palabra}
          textAnchor="middle"
          y={Y_PRIMERA_PALABRA + indice * ALTO_LINEA_PALABRA}
          className={palabra === "falló" ? "fill-bad font-mono text-[9px]" : "fill-foreground font-mono text-[9px]"}
        >
          {palabra}
        </text>
      ))}
    </g>
  );
}

function TooltipEtapas({
  x,
  anchoContenedor,
  altoContenedor,
  despliegue,
}: {
  x: number;
  anchoContenedor: number;
  altoContenedor: number;
  despliegue: TiemposDespliegue;
}) {
  const aLaDerecha = x < anchoContenedor - ANCHO_TOOLTIP - MARGEN_TOOLTIP;
  const izquierda = Math.max(0, aLaDerecha ? x + MARGEN_TOOLTIP : x - ANCHO_TOOLTIP - MARGEN_TOOLTIP);
  const arriba = Math.min(MARGEN_TOOLTIP, Math.max(0, altoContenedor - ALTO_TOOLTIP));
  return (
    <g transform={`translate(${izquierda}, ${arriba})`} className="pointer-events-none">
      <foreignObject width={ANCHO_TOOLTIP} height={ALTO_TOOLTIP}>
        <div className="flex flex-col gap-0.5 rounded-md border border-border-strong bg-popover p-2 font-mono text-[10px] leading-tight text-popover-foreground shadow-elev">
          <span className="flex items-center justify-between gap-2 font-medium">
            <span>
              #{despliegue.numero}
              {despliegue.reversion ? " ↺" : ""}
            </span>
            <span className="tnum text-muted-foreground">{formatoDuracion(duracionTotal(despliegue))}</span>
          </span>
          {ETAPAS_TIEMPO.map((etapa) => (
            <span
              key={etapa}
              className={despliegue.falloEn === etapa ? "flex justify-between gap-2 text-bad" : "flex justify-between gap-2"}
            >
              <span>{ETIQUETA_ETAPA[etapa]}</span>
              <span className={despliegue.etapas[etapa] > 0 ? "tnum" : "text-muted-foreground"}>
                {textoTramo(despliegue.etapas[etapa])}
              </span>
            </span>
          ))}
        </div>
      </foreignObject>
    </g>
  );
}

function Leyenda() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] text-muted-foreground" aria-label="Leyenda">
      {ETAPAS_TIEMPO.map((etapa) => (
        <li key={etapa} className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-[2px] bg-foreground"
            style={{ opacity: TONO_ETAPA[etapa] }}
            aria-hidden
          />
          {ETIQUETA_ETAPA[etapa]}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="size-2 rounded-[2px] bg-bad" aria-hidden />
        Donde falló
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden>↺</span>
        Reversión, sin construir
      </li>
    </ul>
  );
}
