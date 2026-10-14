"use client";

import { RotateCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProyectos } from "@/hooks/use-proyectos";
import type { ErrorApi } from "@/lib/api";
import { subtituloProyectos } from "@/lib/proyectos";

import { ListaProyectos } from "./lista-proyectos";
import { PrimerProyecto } from "./primer-proyecto";

/** Container de 10 / 10b: lee la lista por polling y decide qué pantalla pintar. */
export function PanelProyectos() {
  const { datos: lista, error, cargando, recargar } = useProyectos();
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

      {error ? <ErrorLista error={error} onReintentar={recargar} /> : null}
      {cargando ? <CargandoLista /> : null}
      {lista && lista.proyectos.length === 0 ? <PrimerProyecto /> : null}
      {lista && lista.proyectos.length > 0 ? (
        <ListaProyectos
          lista={lista}
          seleccionado={seleccionado}
          onSeleccionar={(id) => router.replace(`/projects?proyecto=${id}`, { scroll: false })}
        />
      ) : null}
    </main>
  );
}

function ErrorLista({ error, onReintentar }: { error: ErrorApi; onReintentar: () => void }) {
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

function CargandoLista() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4" aria-busy="true" aria-label="Cargando proyectos">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-1 w-14" />
          <Skeleton className="ml-auto h-3 w-16" />
        </div>
      ))}
    </div>
  );
}
