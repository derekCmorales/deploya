"use client";

import { Download, Pause, Play, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Bitacora } from "@/components/deploya/bitacora";
import { PuntoVivo } from "@/components/deploya/punto-vivo";
import { ErrorConexionApi } from "@/components/estados/error-conexion-api";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { useBitacoraEjecucion } from "@/hooks/use-bitacora-ejecucion";
import {
  filtrarLineas,
  MAX_LINEAS_BITACORA,
  nombreDescarga,
  OPCIONES_NIVEL,
  textoActualizado,
  textoDescarga,
  textoPausa,
  textoResumen,
  textoVersion,
  type FiltroNivel,
} from "@/lib/bitacoras";
import { marcaVisible } from "@/lib/despliegues";
import { esFalloDeConexion } from "@/lib/reintento";

const MS_POR_SEGUNDO = 1000;

/** Reloj de un segundo para «Actualizado hace N s». */
function useAhora(): Date {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), MS_POR_SEGUNDO);
    return () => clearInterval(id);
  }, []);
  return ahora;
}

function descargar(nombre: string, contenido: string): void {
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/plain;charset=utf-8" }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

/**
 * Pantalla 15 (SP-12): salida del contenedor activo cada 3 s, con filtro por nivel, búsqueda,
 * pausa sin perder líneas y descarga. Deploya no guarda estas líneas: se leen de Docker.
 */
export function PanelBitacoras({ proyectoId }: { proyectoId: string }) {
  const { estado, ultima, error, leidoEn, pausar, reanudar, recargar } = useBitacoraEjecucion(proyectoId);
  const [nivel, setNivel] = useState<FiltroNivel>("todos");
  const [busqueda, setBusqueda] = useState("");
  const ahora = useAhora();
  const visibles = filtrarLineas(estado.lineas, nivel, busqueda);
  const version = textoVersion(ultima?.despliegue ?? null);
  const actualizado = textoActualizado(leidoEn, ahora);

  return (
    <div className="flex flex-col gap-4 px-8 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented<FiltroNivel> value={nivel} onValueChange={setNivel} aria-label="Nivel" options={OPCIONES_NIVEL} />
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-faint" aria-hidden />
          <Input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en la bitácora… (ej. /api/pagos)"
            aria-label="Buscar en la bitácora"
            className="pl-8 font-mono"
          />
        </div>
        <span className="ml-auto text-xs text-muted-foreground">Últimas {MAX_LINEAS_BITACORA} líneas del contenedor</span>
      </div>

      {error && esFalloDeConexion(error.estado) ? <ErrorConexionApi error={error} ruta={`/proyectos/${proyectoId}/bitacora`} onReintentar={recargar} /> : null}
      {error && !esFalloDeConexion(error.estado) ? (
        <Banner variant="bad" title="No pudimos leer la bitácora">
          {error.message} Lo volvemos a intentar en unos segundos.
        </Banner>
      ) : null}
      {ultima?.aviso ? <Banner variant="warn" title={ultima.aviso} /> : null}

      <Card>
        <CardHeader className="flex-wrap gap-x-3 gap-y-2">
          <CardTitle>Ejecución</CardTitle>
          {version ? <span className="font-mono text-xs text-muted-foreground">{version}</span> : null}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {estado.pausada ? (
              <Badge variant="warn">{textoPausa(estado.pendientes.length)}</Badge>
            ) : actualizado ? (
              <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground" aria-live="off">
                <PuntoVivo />
                {actualizado}
              </span>
            ) : null}
            {estado.pausada ? (
              <Button type="button" variant="outline" size="sm" onClick={reanudar}>
                <Play />
                Reanudar
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={pausar}>
                <Pause />
                Pausar
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={visibles.length === 0}
              onClick={() => descargar(nombreDescarga(proyectoId, new Date()), textoDescarga(visibles))}
            >
              <Download />
              Descargar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {leidoEn === null && error === null ? (
            <Skeleton className="h-96 w-full" aria-label="Cargando la bitácora" />
          ) : visibles.length === 0 ? (
            <p className="rounded-lg border border-border bg-sunken py-12 text-center text-sm text-muted-foreground">
              {estado.lineas.length === 0 ? "El contenedor todavía no escribió nada." : "Ninguna línea coincide con el filtro."}
            </p>
          ) : (
            <Bitacora
              aria-label="Bitácora de ejecución"
              className="max-h-[560px]"
              enCurso={!estado.pausada && ultima?.aviso === null}
              lineas={visibles.map((l) => ({ n: l.n, marca: marcaVisible(l.en), texto: l.texto, nivel: l.nivel }))}
            />
          )}
        </CardContent>
        <CardFooter className="flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-mono tnum">{textoResumen(visibles)}</span>
          <span>Se leen de la salida del contenedor; deploya no las guarda</span>
        </CardFooter>
      </Card>
    </div>
  );
}
