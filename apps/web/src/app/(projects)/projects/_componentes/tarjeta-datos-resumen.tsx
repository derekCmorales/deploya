"use client";

import { ArrowRight, Database } from "lucide-react";
import Link from "next/link";

import { EstadoRecursoDatos } from "@/components/deploya/estado-recurso-datos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDatosProyecto } from "@/hooks/use-datos-proyecto";

import { ICONO_TIPO } from "./iconos-datos";

/**
 * Tarjeta «Datos» de 13: los recursos conectados y el enlace a la pestaña. Si la API de datos no responde
 * no se dibuja, para no tapar el resto del resumen.
 */
export function TarjetaDatosResumen({ proyectoId }: { proyectoId: string }) {
  const { datos } = useDatosProyecto(proyectoId);
  if (!datos) return null;
  const pestana = `/projects/${proyectoId}/datos`;
  return (
    <Card className="flex min-w-[min(100%,320px)] flex-[1_1_0] flex-col">
      <CardHeader>
        <Database className="size-4 text-muted-foreground" aria-hidden />
        <CardTitle className="grow">Datos</CardTitle>
        <Button asChild variant="ghost" size="xs">
          <Link href={pestana}>
            Abrir Datos
            <ArrowRight />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {datos.recursos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin bases de datos conectadas.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {datos.recursos.map((recurso) => {
              const Icono = ICONO_TIPO[recurso.tipo];
              return (
                <li key={recurso.id} className="flex items-center gap-2 text-sm">
                  <Icono className="size-3.5 text-muted-foreground" aria-hidden />
                  <span className="grow truncate">{recurso.nombre}</span>
                  <EstadoRecursoDatos estado={recurso.estado} />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
