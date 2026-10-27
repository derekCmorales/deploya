"use client";

import Link from "next/link";
import { CircleAlert, TriangleAlert } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";

import { GraficaRitmo } from "@/components/deploya/graficas/grafica-ritmo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { pedirApi } from "@/lib/api";
import {
  cabeceraRitmo,
  diasDelMes,
  estadoRitmo,
  fraseRitmo,
  promedioPorDia,
  proyectar,
  type ConsumoDiario,
  type EstadoRitmo,
} from "@/lib/proyeccion";

const RUTA_DIARIO = "/observabilidad/consumo/diario";

/**
 * 08c · Ritmo de construcciones, dentro de «Consumo del período» y debajo de los dos
 * medidores. Solo pinta lo que manda `GET /observabilidad/consumo/diario`; si la petición
 * falla no aparece, y los Meter de consumo siguen a la vista.
 */
export function RitmoConstrucciones({ plan, className }: { plan: string; className?: string }) {
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
  return <div className={className}>{datos ? <RitmoConstruccionesVista datos={datos} plan={plan} /> : <Skeleton className="h-72 w-full rounded-xl" />}</div>;
}

/** La sección con datos ya leídos: cabecera, cifras, gráfica, frase y «Ver planes». */
export function RitmoConstruccionesVista({ datos, plan }: { datos: ConsumoDiario; plan: string }) {
  const usadas = datos.diarios.reduce((total, dia) => total + dia, 0);
  const proyeccion = proyectar(datos.diarios, diasDelMes(datos.desde, datos.reinicia));
  const estado = estadoRitmo(datos);
  const idTitulo = useId();

  return (
    <section aria-labelledby={idTitulo} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex grow flex-col gap-1">
          <h4 id={idTitulo} className="text-sm font-semibold">
            Ritmo de construcciones
          </h4>
          <span className="text-[13px] text-muted-foreground">{cabeceraRitmo(datos, plan)}</span>
        </div>
        <BadgeRitmo estado={estado} />
      </div>

      <dl className="flex flex-wrap gap-x-10 gap-y-4">
        <Cifra titulo="Usadas">
          {usadas} <span className="text-muted-foreground">de {datos.cuota}</span>
        </Cifra>
        <Cifra titulo="Promedio">
          {promedioPorDia(datos.diarios)} <span className="text-muted-foreground">por día</span>
        </Cifra>
        <Cifra titulo="Al cierre, a este ritmo">{proyeccion === null ? "—" : `~${proyeccion}`}</Cifra>
      </dl>

      <GraficaRitmo datos={datos} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted-foreground">{fraseRitmo(datos)}</p>
        <Button asChild variant="ghost" size="xs">
          <Link href="/planes">Ver planes</Link>
        </Button>
      </div>
    </section>
  );
}

function Cifra({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{titulo}</dt>
      <dd className="font-mono text-lg tnum">{children}</dd>
    </div>
  );
}

/** Estado con palabra e icono (README § Gráficas, regla 8); holgado o sin proyección no lleva badge. */
function BadgeRitmo({ estado }: { estado: EstadoRitmo }) {
  if (estado === "aviso") {
    return (
      <Badge variant="warn">
        <TriangleAlert aria-hidden />
        En zona de aviso
      </Badge>
    );
  }
  if (estado === "se-acaba" || estado === "agotada") {
    return (
      <Badge variant="bad">
        <CircleAlert aria-hidden />
        {estado === "agotada" ? "Sin construcciones" : "Se acaba antes del cierre"}
      </Badge>
    );
  }
  return null;
}
