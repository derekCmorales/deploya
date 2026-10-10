"use client";

import { Copy, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";

import { Bitacora } from "@/components/deploya/bitacora";
import { EstadoDespliegue } from "@/components/deploya/estado-despliegue";
import { RielEtapas } from "@/components/deploya/riel-etapas";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBitacora } from "@/hooks/use-bitacora";
import { useDespliegue } from "@/hooks/use-despliegue";
import { useDesplieguePorNumero } from "@/hooks/use-despliegue-por-numero";
import {
  INTERVALO_RELOJ_MS,
  avisoVersionAnterior,
  etapaVisible,
  etiquetaEtapaActual,
  lineaDeError,
  numeroAnterior,
  textoParaCopiar,
  tiempoTranscurrido,
} from "@/lib/despliegues";
import { duracionEtapa, recursosPlan, shaCorto, type VistaDespliegue } from "@/lib/proyectos";

const HTTP_NO_ENCONTRADO = 404;

/** Pantallas 12, 12b y 12c: riel grande y bitácora en vivo. Sin «Cancelar» (es del Avance 3). */
export function PanelDespliegue({ proyectoId, numeroTexto }: { proyectoId: string; numeroTexto: string }) {
  const numero = Number(numeroTexto);
  const inicial = useDesplieguePorNumero(proyectoId, numero);
  const id = inicial.datos?.id ?? null;
  const vivo = useDespliegue(id);
  const bitacora = useBitacora(id);
  const despliegue = vivo.datos ?? inicial.datos;

  if (!Number.isInteger(numero) || numero < 1 || inicial.error?.estado === HTTP_NO_ENCONTRADO) notFound();
  if (inicial.error) return <Banner variant="bad" title="No pudimos cargar el despliegue">{inicial.error.message}</Banner>;
  if (inicial.cargando || !despliegue) return <Cargando />;

  return <Vista despliegue={despliegue} lineas={bitacora.lineas} enCurso={!bitacora.terminado && despliegueEnPantalla(despliegue)} />;
}

function Vista({
  despliegue,
  lineas,
  enCurso,
}: {
  despliegue: VistaDespliegue;
  lineas: Parameters<typeof lineaDeError>[0];
  enCurso: boolean;
}) {
  const ahora = useAhora(enCurso);
  const error = lineaDeError(lineas, etapaFallida(despliegue));
  const aviso = avisoVersionAnterior(numeroAnterior(despliegue.numero));
  const etiqueta = etiquetaEtapaActual(despliegue.etapas);
  const transcurrido = despliegue.creado ? tiempoTranscurrido(despliegue.creado, despliegue.terminado ?? ahora) : null;

  return (
    <div className="flex flex-col gap-6 px-8 py-6">
      <Cabecera despliegue={despliegue} transcurrido={transcurrido} etiqueta={etiqueta} />
      <RielEtapas
        size="lg"
        etapas={despliegue.etapas.map((etapa) => etapa.estado)}
        detalle={despliegue.etapas.map((etapa) => ({ duracion: duracionEtapa(etapa.duracionMs) }))}
        saludable={despliegue.estado === "saludable"}
      />
      {despliegue.estado === "fallido" ? <Fallo despliegue={despliegue} error={error} aviso={aviso} /> : null}
      {despliegue.estado === "saludable" ? <Saludable despliegue={despliegue} aviso={aviso} /> : null}
      <BitacoraPanel lineas={lineas} resaltada={error?.n} enCurso={enCurso} />
    </div>
  );
}

function Cabecera({
  despliegue,
  transcurrido,
  etiqueta,
}: {
  despliegue: VistaDespliegue;
  transcurrido: string | null;
  etiqueta: string | null;
}) {
  const commit = despliegue.commit;
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold tracking-[-0.02em]">· versión #{despliegue.numero}</h2>
          <EstadoDespliegue estado={despliegue.estado} />
        </div>
        {commit ? (
          <p className="font-mono text-xs text-muted-foreground">
            {shaCorto(commit.sha)} {commit.mensaje} · {commit.rama} · {commit.autor}
          </p>
        ) : null}
      </div>
      <dl className="flex gap-6 text-sm">
        <Dato titulo={tituloTiempo(despliegue.estado)} valor={transcurrido ?? "—"} />
        {etiqueta ? <Dato titulo="Etapa" valor={etiqueta} /> : null}
      </dl>
    </header>
  );
}

function Fallo({
  despliegue,
  error,
  aviso,
}: {
  despliegue: VistaDespliegue;
  error: { n: number; texto: string } | undefined;
  aviso: string | null;
}) {
  return (
    <Banner
      variant="bad"
      title={`La construcción terminó con código ${despliegue.codigoSalida ?? "—"}`}
      actions={
        error ? (
          <Button asChild variant="outline" size="sm">
            <a href={`#linea-${error.n}`}>Ir al error</a>
          </Button>
        ) : null
      }
    >
      {error ? <span className="font-mono">{error.texto}</span> : despliegue.motivoFallo} {aviso ? `· ${aviso}` : null}
    </Banner>
  );
}

function Saludable({ despliegue, aviso }: { despliegue: VistaDespliegue; aviso: string | null }) {
  const digest = despliegue.imagen?.digest;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm">
      {despliegue.url ? (
        <a href={despliegue.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-mono text-[13px]">
          <ExternalLink className="size-3.5" aria-hidden />
          {despliegue.url}
        </a>
      ) : null}
      <p className="text-muted-foreground">
        {digest ? `Imagen ${acortarDigest(digest)}` : "Imagen"}
        {despliegue.imagen?.receta ? ` · receta ${despliegue.imagen.receta}` : null}
        {despliegue.recursos ? ` · ${recursosPlan(despliegue.recursos)}` : null}
      </p>
      {aviso ? <p>{aviso}</p> : null}
    </div>
  );
}

function BitacoraPanel({
  lineas,
  resaltada,
  enCurso,
}: {
  lineas: Parameters<typeof textoParaCopiar>[0];
  resaltada?: number;
  enCurso: boolean;
}) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    await navigator.clipboard.writeText(textoParaCopiar(lineas));
    setCopiado(true);
  };
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Bitácora de construcción</h3>
          <p className="text-xs text-muted-foreground">{enCurso ? "Se actualiza cada 3 s" : `${lineas.length} líneas`}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={copiar}>
          <Copy />
          {copiado ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <Bitacora
        lineas={lineas.map((linea) => ({ ...linea, etapa: etapaVisible(linea.etapa) }))}
        resaltada={resaltada}
        enCurso={enCurso}
        className="max-h-[420px]"
      />
    </section>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{titulo}</dt>
      <dd className="tnum font-medium">{valor}</dd>
    </div>
  );
}

function Cargando() {
  return (
    <div className="flex flex-col gap-4 px-8 py-6" aria-busy="true" aria-label="Cargando despliegue">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function useAhora(activo: boolean): string {
  const [ahora, setAhora] = useState(() => new Date().toISOString());
  useEffect(() => {
    if (!activo) return;
    const id = setInterval(() => setAhora(new Date().toISOString()), INTERVALO_RELOJ_MS);
    return () => clearInterval(id);
  }, [activo]);
  return ahora;
}

function tituloTiempo(estado: VistaDespliegue["estado"]): string {
  if (estado === "fallido") return "Falló tras";
  if (estado === "saludable") return "Duración";
  return "Transcurrido";
}

function etapaFallida(despliegue: VistaDespliegue): string | undefined {
  return despliegue.etapas.find((etapa) => etapa.estado === "fallida")?.nombre;
}

function despliegueEnPantalla(despliegue: VistaDespliegue): boolean {
  return despliegue.estado !== "saludable" && despliegue.estado !== "fallido" && despliegue.estado !== "cancelado" && despliegue.estado !== "detenido";
}

function acortarDigest(digest: string): string {
  if (digest.length <= 18) return digest;
  return `${digest.slice(0, 12)}…${digest.slice(-4)}`;
}
