"use client";

import { FileArchive, GitBranch } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { varianteEstado } from "@/lib/mock/estados";
import {
  ETAPA_ETIQUETA,
  ETAPAS_CICLO,
  type EtapaCiclo,
  proyectos,
  type Proyecto,
} from "@/lib/mock/proyectos";
import { cn } from "@/lib/utils";

type Props = {
  seleccionadoId: string;
};

export function ProjectList({ seleccionadoId }: Props) {
  const [q, setQ] = useState("");
  const [etapa, setEtapa] = useState<"todas" | EtapaCiclo>("todas");

  const filtrados = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return proyectos.filter((p) => {
      const coincideTexto =
        !texto ||
        p.nombre.toLowerCase().includes(texto) ||
        p.subdominio.toLowerCase().includes(texto) ||
        p.origen.toLowerCase().includes(texto);
      const coincideEtapa = etapa === "todas" || p.etapa === etapa;
      return coincideTexto && coincideEtapa;
    });
  }, [q, etapa]);

  return (
    <section
      className="flex h-full w-full max-w-md min-w-[18rem] flex-col border-r border-border bg-card/40"
      aria-label="Lista de proyectos"
    >
      <div className="space-y-3 border-b border-border p-3">
        <div>
          <h1 className="text-sm font-semibold">Proyectos</h1>
          <p className="text-xs text-muted-foreground">
            Lista de recepción. Datos mock; no hay cola real.
          </p>
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar nombre, fuente o subdominio"
          aria-label="Buscar proyectos"
        />
        <Tabs
          value={etapa}
          onValueChange={(v) => setEtapa(v as typeof etapa)}
        >
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            <TabsTrigger value="todas" className="h-7 px-2 text-xs">
              Todas
            </TabsTrigger>
            {ETAPAS_CICLO.map((e) => (
              <TabsTrigger key={e} value={e} className="h-7 px-2 text-xs">
                {ETAPA_ETIQUETA[e]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <ScrollArea className="flex-1">
        <ul className="p-1">
          {filtrados.map((p) => (
            <li key={p.id}>
              <ProjectRow
                proyecto={p}
                activo={p.id === seleccionadoId}
              />
            </li>
          ))}
          {filtrados.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              Ningún proyecto coincide.
            </li>
          ) : null}
        </ul>
      </ScrollArea>
    </section>
  );
}

function ProjectRow({
  proyecto,
  activo,
}: {
  proyecto: Proyecto;
  activo: boolean;
}) {
  const Icon = proyecto.fuente === "repositorio" ? GitBranch : FileArchive;
  return (
    <Link
      href={`/projects/${proyecto.id}`}
      className={cn(
        "flex gap-3 rounded-lg px-3 py-2.5 hover:bg-accent/60",
        activo && "bg-accent/80",
      )}
      aria-current={activo ? "page" : undefined}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{proyecto.nombre}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {proyecto.actualizado}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {proyecto.subdominio}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          <Badge variant={varianteEstado(proyecto.estado)}>
            {proyecto.estado}
          </Badge>
          <Badge variant="outline">{ETAPA_ETIQUETA[proyecto.etapa]}</Badge>
        </div>
      </div>
    </Link>
  );
}
