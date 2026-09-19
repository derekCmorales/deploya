import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { observabilidadDe } from "@/lib/mock/observabilidad";
import { varianteEstado } from "@/lib/mock/estados";
import type { Proyecto } from "@/lib/mock/proyectos";
import { cn } from "@/lib/utils";

export function OperacionView({ proyecto }: { proyecto: Proyecto }) {
  const { metricas, bitacoras } = observabilidadDe(proyecto.id);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-auto">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold">
            Operación · {proyecto.nombre}
          </h2>
          <p className="text-xs text-muted-foreground">
            Métricas y bitácoras mock. Sin canal en vivo ni motor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={varianteEstado(proyecto.estado)}>
            {proyecto.estado}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/projects/${proyecto.id}`}>Volver al detalle</Link>
          </Button>
        </div>
      </header>

      <div className="space-y-4 p-6">
        {metricas.avisoCuota ? (
          <div
            role="status"
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
          >
            Aviso de cuota: el CPU de este entorno está al {metricas.cpuPct} %
            del límite del plan.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <Metrica
            titulo="CPU"
            valor={`${metricas.cpuPct} %`}
            detalle={`límite del plan ${metricas.cpuLimite} %`}
            pct={metricas.cpuPct}
            alerta={metricas.avisoCuota}
          />
          <Metrica
            titulo="Memoria"
            valor={`${metricas.memoriaPct} %`}
            detalle={`tope ${metricas.memoriaLimiteGi} Gi`}
            pct={metricas.memoriaPct}
          />
          <Metrica
            titulo="Transferencia"
            valor={`${metricas.transferenciaPct} %`}
            detalle={`tope ${metricas.transferenciaLimiteGi} Gi`}
            pct={metricas.transferenciaPct}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bitácoras</CardTitle>
            <CardDescription>
              Construcción y runtime, en orden. Contenido no confiable para M8.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 rounded-md border border-border bg-black/40">
              <ol className="space-y-1 p-3 font-mono text-xs">
                {bitacoras.map((linea) => (
                  <li key={`${linea.t}-${linea.texto}`}>
                    <span className="text-muted-foreground">{linea.t}</span>{" "}
                    <span
                      className={
                        linea.canal === "construccion"
                          ? "text-sky-300"
                          : "text-emerald-300"
                      }
                    >
                      [{linea.canal === "construccion" ? "construcción" : "runtime"}]
                    </span>{" "}
                    <span>{linea.texto}</span>
                  </li>
                ))}
              </ol>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metrica({
  titulo,
  valor,
  detalle,
  pct,
  alerta,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  pct: number;
  alerta?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>{detalle}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{valor}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full bg-primary",
              alerta && "bg-amber-400",
            )}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
