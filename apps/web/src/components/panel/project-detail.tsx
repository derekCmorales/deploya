import {
  ArrowUpRight,
  Check,
  CircleDashed,
  FileArchive,
  GitBranch,
  Globe,
} from "lucide-react";
import Link from "next/link";

import { BorderBeam } from "@/components/magic/border-beam";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { etapaCompletada, varianteEstado } from "@/lib/mock/estados";
import {
  ETAPA_ETIQUETA,
  ETAPAS_CICLO,
  type Proyecto,
} from "@/lib/mock/proyectos";
import { cn } from "@/lib/utils";

export function ProjectDetail({ proyecto }: { proyecto: Proyecto }) {
  const FuenteIcon =
    proyecto.fuente === "repositorio" ? GitBranch : FileArchive;
  const etiquetaFuente =
    proyecto.fuente === "repositorio"
      ? "repositorio"
      : "archivo comprimido";

  return (
    <article className="flex h-full min-w-0 flex-1 flex-col overflow-auto">
      <header className="relative border-b border-border px-6 py-5">
        <BorderBeam />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Detalle del despliegue</p>
            <h2 className="text-xl font-semibold tracking-tight">
              {proyecto.nombre}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Globe className="size-3.5" aria-hidden />
              {proyecto.subdominio}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={varianteEstado(proyecto.estado)}>
              {proyecto.estado}
            </Badge>
            <Button variant="outline" size="sm" disabled>
              Publicar de nuevo
            </Button>
            <Button size="sm" asChild>
              <Link href={`/projects/${proyecto.id}/flujo`}>
                Ver flujo
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 p-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ciclo de despliegue</CardTitle>
            <CardDescription>
              Recepción → Construcción → Ejecución → Enrutamiento → Operación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-2 sm:grid-cols-5">
              {ETAPAS_CICLO.map((etapa) => {
                const hecha = etapaCompletada(proyecto.etapa, etapa);
                const actual = proyecto.etapa === etapa;
                return (
                  <li
                    key={etapa}
                    className={cn(
                      "rounded-lg border border-border p-3",
                      actual && "border-primary/50 bg-accent/40",
                    )}
                  >
                    <div className="mb-2 flex items-center gap-1.5 text-muted-foreground">
                      {hecha ? (
                        <Check className="size-3.5 text-primary" />
                      ) : (
                        <CircleDashed className="size-3.5" />
                      )}
                      <span className="text-[11px] uppercase tracking-wide">
                        {actual ? "actual" : hecha ? "hecha" : "pendiente"}
                      </span>
                    </div>
                    <p className="text-sm font-medium">
                      {ETAPA_ETIQUETA[etapa]}
                    </p>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuente</CardTitle>
            <CardDescription>ProveedorFuente (sin prefijo I)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <FuenteIcon className="size-4 text-muted-foreground" />
              {etiquetaFuente}
            </p>
            <p className="break-all text-muted-foreground">{proyecto.origen}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
            <CardDescription>
              Estados de despliegue, no de suscripción.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{proyecto.resumen}</p>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/projects/${proyecto.id}/operacion`}>
                  Abrir operación
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/projects/${proyecto.id}/flujo`}>
                  Lienzo del ciclo
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </article>
  );
}
