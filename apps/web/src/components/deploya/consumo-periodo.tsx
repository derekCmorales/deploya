"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { GraficaRitmo } from "@/components/deploya/graficas/grafica-ritmo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { pedirApi } from "@/lib/api";
import {
  cabeceraRitmo,
  diasDelMes,
  enZonaAviso,
  fraseRitmo,
  promedioPorDia,
  proyectar,
  type ConsumoDiario,
} from "@/lib/proyeccion";

const RUTA_DIARIO = "/observabilidad/consumo/diario";

/**
 * Tarjeta 08c · Ritmo de construcciones, debajo de los medidores de 08. Solo pinta lo
 * que manda `GET /observabilidad/consumo/diario`; si la petición falla no aparece, y
 * los Meter de consumo del período siguen a la vista.
 */
export function TarjetaRitmo({ plan }: { plan: string }) {
  const [datos, setDatos] = useState<ConsumoDiario | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let vigente = true;
    pedirApi<ConsumoDiario>(RUTA_DIARIO)
      .then((respuesta) => {
        if (vigente) setDatos(respuesta);
      })
      .catch(() => {
        if (vigente) setFallo(true);
      });
    return () => {
      vigente = false;
    };
  }, []);

  if (fallo) return null;
  if (!datos) return <Skeleton className="h-72 w-full rounded-xl" />;

  const dias = diasDelMes(datos.desde, datos.reinicia);
  const usadas = datos.diarios.reduce((total, dia) => total + dia, 0);
  const proyeccion = proyectar(datos.diarios, dias);
  const aviso = enZonaAviso(proyeccion, datos.cuota);

  return (
    <Card>
      <CardHeader className="flex-wrap">
        <div className="flex grow flex-col gap-1">
          <CardTitle className="text-base">Ritmo de construcciones</CardTitle>
          <span className="text-[13px] text-muted-foreground">{cabeceraRitmo(datos, plan)}</span>
        </div>
        {aviso ? (
          <Badge variant="warn">
            <TriangleAlert aria-hidden />
            En zona de aviso
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Usadas</span>
            <span className="font-mono text-lg tnum">
              {usadas} de {datos.cuota}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Promedio</span>
            <span className="font-mono text-lg tnum">{promedioPorDia(datos.diarios)} por día</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Al cierre, a este ritmo</span>
            <span className="font-mono text-lg tnum">{proyeccion === null ? "—" : `~${proyeccion}`}</span>
          </div>
        </div>

        <GraficaRitmo datos={datos} />

        <p className="text-[13px] text-muted-foreground">{fraseRitmo(datos)}</p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="ghost" size="xs">
          <Link href="/planes">Ver planes</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
