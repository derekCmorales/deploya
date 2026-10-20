"use client";

import { ArrowLeft, FolderGit2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { RielEtapas } from "@/components/deploya/riel-etapas";
import { Button } from "@/components/ui/button";

const SIN_ETAPA = ["pendiente", "pendiente", "pendiente", "pendiente", "pendiente"] as const;

/** Pantalla 28 · 404 (WEB-02): muestra la ruta pedida, «Ir a proyectos» y «Volver». */
export function PaginaInexistente() {
  const ruta = usePathname();
  const router = useRouter();

  return (
    <section className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center gap-3.5 bg-sunken px-8 py-16 text-center">
      <span className="font-mono text-5xl font-semibold tracking-[-0.04em] text-muted-foreground">404</span>
      <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <RielEtapas etapas={SIN_ETAPA} />
        ruta sin etapa
      </span>
      <h1 className="text-xl font-semibold tracking-[-0.02em]">No encontramos esta página</h1>
      <p className="max-w-[420px] text-muted-foreground">
        La dirección <code className="font-mono text-[13px] text-foreground">{ruta}</code> no existe o se movió.
      </p>
      <div className="flex gap-2">
        <Button asChild size="sm">
          <Link href="/projects">
            <FolderGit2 />
            Ir a proyectos
          </Link>
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft />
          Volver
        </Button>
      </div>
    </section>
  );
}
