import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { useAltaProyecto } from "@/hooks/use-alta-proyecto";
import { DESCRIPCION_TIPO, opcionesAlta, textoLimiteAlta, VARIABLES_POR_TIPO, type LimiteRecursosDatos } from "@/lib/datos";
import type { ListaProyectos } from "@/lib/proyectos";
import { RUTA_SUSCRIPCION } from "@/lib/suscripcion";
import { cn } from "@/lib/utils";

import { ICONO_TIPO } from "./iconos-datos";

type Alta = ReturnType<typeof useAltaProyecto>;

const SIN_TOPE: LimiteRecursosDatos = { usados: 0, maximo: null };

/**
 * Paso 3 del asistente (feat/m3-alta-guiada): los recursos de la pestaña Datos (18), pedidos antes del
 * despliegue #1 para que sus variables ya lleguen al primer contenedor.
 */
export function PasoDatos({ alta, lista }: { alta: Alta; lista: ListaProyectos | null }) {
  const limite = lista?.datos ?? SIN_TOPE;
  const opciones = opcionesAlta(limite, alta.datos);
  const lleno = opciones.some((opcion) => opcion.deshabilitado);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] font-medium text-muted-foreground">Paso 3 · Datos</p>
        <h2 className="text-lg font-semibold tracking-[-0.02em]">¿Tu app necesita bases de datos?</h2>
        <p className="text-muted-foreground">
          Se crean con el proyecto, con volumen persistente, y sus variables llegan solas al despliegue #1. Este paso es opcional.
        </p>
      </div>

      {alta.error?.tipo === "datos" ? <Banner variant="bad" title={alta.error.mensaje} /> : null}
      {lleno ? (
        <Banner
          variant="warn"
          title="Llegaste al límite de tu plan"
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href={RUTA_SUSCRIPCION}>Cambiar plan</Link>
            </Button>
          }
        >
          Quita uno de los elegidos o cambia de plan para agregar más.
        </Banner>
      ) : null}

      <fieldset className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <legend className="sr-only">Recursos de datos</legend>
        {opciones.map((opcion) => {
          const Icono = ICONO_TIPO[opcion.tipo];
          const { nombre, descripcion } = DESCRIPCION_TIPO[opcion.tipo];
          const id = `dato-${opcion.tipo}`;
          return (
            <label key={opcion.tipo} htmlFor={id} className={cn("block", opcion.deshabilitado ? "cursor-not-allowed opacity-60" : "cursor-pointer")}>
              <Card className={cn("flex h-full flex-col transition-colors", opcion.elegido && "border-foreground")}>
                <CardHeader className="flex-row items-center gap-2">
                  <Icono className="size-[18px] text-muted-foreground" aria-hidden />
                  <CardTitle className="flex-1">{nombre}</CardTitle>
                  <Checkbox id={id} checked={opcion.elegido} disabled={opcion.deshabilitado} onChange={() => alta.alternarDato(opcion.tipo)} />
                </CardHeader>
                <CardContent className="flex grow flex-col gap-3">
                  <CardDescription className="text-xs">{descripcion}</CardDescription>
                  <div className="flex flex-wrap gap-1">
                    {VARIABLES_POR_TIPO[opcion.tipo].slice(0, 2).map((clave) => (
                      <Badge key={clave} variant="outline" className="font-mono">
                        {clave}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </label>
          );
        })}
      </fieldset>

      <p className="tnum text-xs text-muted-foreground">{textoLimiteAlta(limite, alta.datos.length)}</p>
    </div>
  );
}
