"use client";

import { GitBranch, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { EstadoDespliegue } from "@/components/deploya/estado-despliegue";
import { RielEtapas } from "@/components/deploya/riel-etapas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Meter } from "@/components/ui/meter";
import { rutaDespliegue } from "@/lib/despliegues";
import {
  contadorProyectos,
  etapasDelRiel,
  filtrarProyectos,
  haceCuanto,
  puedeCrearProyecto,
  type ListaProyectos as Lista,
  type ProyectoEnLista,
} from "@/lib/proyectos";
import { RUTA_SUSCRIPCION } from "@/lib/suscripcion";
import { cn } from "@/lib/utils";

import { DetalleProyecto } from "./detalle-proyecto";

/** Pantalla 10: lista de proyectos + detalle del seleccionado (patrón D de la guía). */
export function ListaProyectos({
  lista,
  seleccionado,
  onSeleccionar,
  onEliminado,
}: {
  lista: Lista;
  seleccionado: string | null;
  onSeleccionar: (id: string) => void;
  onEliminado: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const visibles = filtrarProyectos(lista.proyectos, busqueda);
  const activo = lista.proyectos.find((p) => p.id === seleccionado) ?? lista.proyectos[0];
  const contador = contadorProyectos(lista);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <label htmlFor="buscar-proyecto" className="sr-only">
          Buscar proyecto
        </label>
        <div className="relative w-[260px]">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="buscar-proyecto"
            type="search"
            placeholder="Buscar proyecto"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-8 pl-8"
          />
        </div>
        <span className="flex-1" />
        <span className="text-xs text-muted-foreground">{contador}</span>
        {puedeCrearProyecto(lista) ? (
          <Button asChild size="sm">
            <Link href="/projects/nuevo">
              <Plus />
              Nuevo proyecto
            </Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="link" size="sm" className="text-xs">
              <Link href={RUTA_SUSCRIPCION}>Cambiar plan</Link>
            </Button>
            <Button size="sm" disabled aria-describedby="limite-proyectos">
              <Plus />
              Nuevo proyecto
            </Button>
            <span id="limite-proyectos" className="sr-only">
              {contador}. Cambia de plan para crear más.
            </span>
          </>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[460px_1fr]">
        <div className="flex min-h-0 flex-col border-border lg:border-r">
          <div className="flex items-center gap-3 border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">
            <span className="flex-1">Proyecto</span>
            <span className="w-[70px]">Ciclo</span>
            <span className="w-[88px] text-right">Último</span>
          </div>
          <ul className="min-h-0 flex-1 overflow-auto">
            {visibles.map((p) => (
              <FilaProyecto key={p.id} proyecto={p} activo={p.id === activo?.id} onSeleccionar={onSeleccionar} />
            ))}
            {visibles.length === 0 ? (
              <li className="px-4 py-6 text-sm text-muted-foreground">Ningún proyecto coincide con «{busqueda}».</li>
            ) : null}
          </ul>
          <div className="border-t border-border p-4">
            <Meter label="Proyectos del plan" value={lista.usados} max={lista.maximo} tonoAlLimite="warn" />
          </div>
        </div>
        {activo ? <DetalleProyecto key={activo.id} proyecto={activo} plan={lista.plan} onEliminado={onEliminado} /> : null}
      </div>
    </section>
  );
}

function FilaProyecto({
  proyecto,
  activo,
  onSeleccionar,
}: {
  proyecto: ProyectoEnLista;
  activo: boolean;
  onSeleccionar: (id: string) => void;
}) {
  const ultimo = proyecto.ultimoDespliegue;
  const router = useRouter();
  const abrir = () => {
    onSeleccionar(proyecto.id);
    if (ultimo) router.push(rutaDespliegue(proyecto.id, ultimo.numero));
  };
  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={abrir}
        aria-current={activo ? "true" : undefined}
        className={cn(
          "relative flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          activo && "bg-muted before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-foreground",
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{proyecto.nombre}</span>
            {ultimo ? <EstadoDespliegue estado={ultimo.estado} /> : null}
          </span>
          <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <GitBranch className="size-3.5" aria-hidden />
            {proyecto.rama}
            <span className="text-faint">·</span>
            <span className="font-sans">Dockerfile</span>
          </span>
        </span>
        <span className="w-[70px] pt-2">
          <RielEtapas etapas={etapasDelRiel(ultimo)} saludable={ultimo?.estado === "saludable"} />
        </span>
        <span className="w-[88px] pt-0.5 text-right text-xs text-muted-foreground">
          {ultimo ? haceCuanto(ultimo.creado, new Date()) : "—"}
        </span>
      </button>
    </li>
  );
}
