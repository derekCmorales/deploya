"use client";

import { RotateCw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { ErrorConexionApi } from "@/components/estados/error-conexion-api";
import { EsqueletoProyectos } from "@/components/estados/esqueleto-proyectos";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProyectos } from "@/hooks/use-proyectos";
import { useMiSuscripcion } from "@/hooks/use-suscripcion";
import type { ErrorApi } from "@/lib/api";
import { subtituloProyectos } from "@/lib/proyectos";
import { esFalloDeConexion } from "@/lib/reintento";
import { RUTA_SUSCRIPCION, rutaRenovar, textoVencida, type MiSuscripcion } from "@/lib/suscripcion";

import { ListaProyectos } from "./lista-proyectos";
import { PrimerProyecto } from "./primer-proyecto";

/** Container de 10 / 10b / 10c: lee la lista por polling y decide qué pantalla pintar; los estados de 28 (WEB-02). */
export function PanelProyectos() {
  const { datos: lista, error, cargando, recargar } = useProyectos();
  const { datos: suscripcion } = useMiSuscripcion();
  const router = useRouter();
  const seleccionado = useSearchParams().get("proyecto");

  const subtitulo = lista ? subtituloProyectos(lista) : null;

  return (
    <main className="flex min-h-full flex-col gap-5 px-8 pt-6 pb-8">
      <header className="flex flex-col gap-1.5">
        <p className="text-[13px] font-medium text-muted-foreground">Proyectos</p>
        <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em]">Proyectos</h1>
        {subtitulo ? <p className="text-muted-foreground">{subtitulo}</p> : <Skeleton className="h-5 w-56" />}
      </header>

      {suscripcion?.estado === "vencida" ? <AvisoVencida suscripcion={suscripcion} /> : null}
      {error ? <ErrorLista error={error} onReintentar={recargar} /> : null}
      {cargando ? <EsqueletoProyectos /> : null}
      {lista && lista.proyectos.length === 0 ? <PrimerProyecto /> : null}
      {lista && lista.proyectos.length > 0 ? (
        <ListaProyectos
          lista={lista}
          suscripcion={suscripcion}
          seleccionado={seleccionado}
          onSeleccionar={(id) => router.replace(`/projects?proyecto=${id}`, { scroll: false })}
        />
      ) : null}
    </main>
  );
}

/** 10c: la suscripción venció y corre la gracia; «Nuevo proyecto» y «Desplegar» quedan deshabilitados. */
function AvisoVencida({ suscripcion }: { suscripcion: MiSuscripcion }) {
  const aviso = textoVencida(suscripcion);
  return (
    <Banner
      variant="warn"
      title={aviso.titulo}
      actions={
        <>
          <Button asChild variant="outline" size="sm">
            <Link href={RUTA_SUSCRIPCION}>Ver suscripción</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={rutaRenovar(suscripcion)}>Renovar</Link>
          </Button>
        </>
      }
    >
      {aviso.texto}
    </Banner>
  );
}

function ErrorLista({ error, onReintentar }: { error: ErrorApi; onReintentar: () => void }) {
  if (esFalloDeConexion(error.estado)) return <ErrorConexionApi error={error} ruta="/proyectos" onReintentar={onReintentar} />;
  const titulo = error.sinSesion ? "Inicia sesión para ver tus proyectos." : "No pudimos cargar tus proyectos.";
  return (
    <Banner
      variant="bad"
      title={titulo}
      actions={
        <Button variant="outline" size="sm" onClick={onReintentar}>
          <RotateCw />
          Reintentar
        </Button>
      }
    >
      {error.message}
    </Banner>
  );
}
