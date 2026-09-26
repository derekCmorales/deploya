import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { RielEtapas } from "@/components/deploya/riel-etapas";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="puntos flex min-h-full flex-col justify-center gap-6 px-8 py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <RielEtapas etapas={["completada", "completada", "completada", "completada", "completada"]} saludable size="sm" />
        <h1 className="text-[40px] leading-[44px] font-semibold tracking-[-0.04em]">
          Deploya: del repositorio a un servicio en línea.
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Las rutas del panel se construyen historia por historia con el design system v4.1. Guía para el equipo y
          para agentes: <span className="font-mono text-[13px] text-foreground">docs/diseno/</span>.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/sistema">
              Ver el sistema de diseño
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/projects">Proyectos</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
