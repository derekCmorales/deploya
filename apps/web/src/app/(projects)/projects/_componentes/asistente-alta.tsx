"use client";

import { ArrowRight, LoaderCircle, Rocket } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { useAltaProyecto } from "@/hooks/use-alta-proyecto";
import { useProyectos } from "@/hooks/use-proyectos";
import { contadorProyectos, puedeCrearProyecto } from "@/lib/proyectos";

import { LateralAlta } from "./lateral-alta";
import { PasoRepositorio } from "./paso-repositorio";
import { PasoRevisar } from "./paso-revisar";

const INDICE_PASO = { repositorio: 0, revisar: 2 } as const;
const TOTAL_PASOS = 3;

/** Container del asistente «Nuevo proyecto» (11a → 11d, con 11e). */
export function AsistenteAlta() {
  const router = useRouter();
  const alta = useAltaProyecto();
  const { datos: lista } = useProyectos({ sondear: false });
  const sinCupo = lista !== null && !puedeCrearProyecto(lista);
  const indice = INDICE_PASO[alta.paso];

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (alta.paso === "repositorio") return alta.continuar();
    const id = await alta.desplegar();
    if (id) router.push(`/projects?proyecto=${id}`);
  };

  return (
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[320px_1fr]">
      <LateralAlta actual={indice} lista={lista} />
      <form onSubmit={enviar} className="flex min-w-0 flex-col" noValidate aria-busy={alta.ocupado}>
        <div className="flex max-w-[860px] flex-1 flex-col gap-6 px-12 py-8">
          {sinCupo && lista ? (
            <Banner
              variant="warn"
              title="Llegaste al límite de tu plan"
              actions={
                <Button asChild variant="outline" size="sm">
                  <Link href="/billing">Cambiar plan</Link>
                </Button>
              }
            >
              {contadorProyectos(lista)}. Cambia de plan para crear otro proyecto.
            </Banner>
          ) : null}
          {alta.paso === "repositorio" ? <PasoRepositorio alta={alta} /> : <PasoRevisar alta={alta} lista={lista} />}
        </div>
        <div className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-background px-12 py-4">
          <span className="flex-1 text-xs text-muted-foreground">
            Paso {indice + 1} de {TOTAL_PASOS}
          </span>
          {alta.paso === "repositorio" ? (
            <Button asChild variant="ghost">
              <Link href="/projects">Cancelar</Link>
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={alta.volver}>
              Atrás
            </Button>
          )}
          <Button type="submit" disabled={alta.ocupado || sinCupo}>
            {alta.ocupado ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
            {alta.paso === "repositorio" ? (
              <>
                Continuar
                {alta.ocupado ? null : <ArrowRight />}
              </>
            ) : (
              <>
                {alta.ocupado ? null : <Rocket />}
                Desplegar
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
