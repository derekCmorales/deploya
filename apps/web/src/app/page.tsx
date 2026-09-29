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
          Conecta un repositorio público de GitHub con su <span className="font-mono text-[13px] text-foreground">Dockerfile</span>{" "}
          y Deploya lo construye, lo corre con los límites de tu plan y lo publica en su propio subdominio.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/registro">
              Empezar en Sandbox
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/ingresar">Iniciar sesión</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/planes">Ver planes</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Hecho con el design system v4.1 ·{" "}
          <Link href="/sistema" className="underline underline-offset-[3px]">
            ver el sistema
          </Link>
        </p>
      </div>
    </main>
  );
}
