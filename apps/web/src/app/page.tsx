import Link from "next/link";

import { BorderBeam } from "@/components/magic/border-beam";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ETAPA_ETIQUETA, ETAPAS_CICLO } from "@/lib/mock/proyectos";
import { proyectoPorDefecto } from "@/lib/mock/proyectos";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function HomePage() {
  return (
    <main className="h-full overflow-auto p-6">
      <section className="relative overflow-hidden rounded-xl border border-border bg-card px-6 py-8">
        <BorderBeam />
        <p className="text-xs uppercase tracking-[0.2em] text-primary">
          Kit visual canónico
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Deploya</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Plataforma como servicio para publicar aplicaciones. Esta pantalla
          valida el look &amp; feel del panel: SaaS oscuro, Geist, acento cian.
          Los datos son mock. No hay autenticación, pagos ni motor reales.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Ciclo: Recepción → Construcción → Ejecución → Enrutamiento →
          Operación
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/projects/${proyectoPorDefecto.id}`}>
              Abrir panel de proyectos
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href={`${api}/health`}>API /health</a>
          </Button>
        </div>
      </section>

      <nav
        aria-label="Etapas del ciclo"
        className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        {ETAPAS_CICLO.map((etapa) => (
          <Card key={etapa}>
            <CardHeader>
              <CardTitle>{ETAPA_ETIQUETA[etapa]}</CardTitle>
              <CardDescription>
                {etapa === "recepcion"
                  ? "Lista y alta mock de proyectos"
                  : etapa === "operacion"
                    ? "Métricas y bitácoras mock"
                    : "Visible en el lienzo de flujo"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" size="sm" asChild>
                <Link
                  href={
                    etapa === "operacion"
                      ? `/projects/${proyectoPorDefecto.id}/operacion`
                      : etapa === "recepcion"
                        ? `/projects/${proyectoPorDefecto.id}`
                        : `/projects/${proyectoPorDefecto.id}/flujo`
                  }
                >
                  Ir
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </nav>
    </main>
  );
}
