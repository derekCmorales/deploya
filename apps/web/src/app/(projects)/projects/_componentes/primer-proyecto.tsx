import { FileCode, GitBranch, Hash, Plus, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { RielEtapas } from "@/components/deploya/riel-etapas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const REQUISITOS: { icono: LucideIcon; titulo: string; detalle: string }[] = [
  { icono: GitBranch, titulo: "Repositorio público", detalle: "github.com/usuario/proyecto" },
  { icono: FileCode, titulo: "Dockerfile en la raíz", detalle: "tú decides lenguaje y versión" },
  { icono: Hash, titulo: "Un puerto HTTP", detalle: "el que indica EXPOSE, p. ej. 8080" },
];

const SIN_DESPLIEGUES = ["pendiente", "pendiente", "pendiente", "pendiente", "pendiente"] as const;

/** Pantalla 10b: estado vacío didáctico de la lista de proyectos. */
export function PrimerProyecto() {
  return (
    <section className="dy-entrada flex flex-1 flex-col items-center justify-center gap-7 rounded-xl border border-border bg-sunken p-12">
      <div className="flex max-w-[560px] flex-col items-center gap-3 text-center">
        <RielEtapas etapas={SIN_DESPLIEGUES} className="scale-150" />
        <p className="mt-2 text-[13px] font-medium text-muted-foreground">0 / 5 · Nada desplegado todavía</p>
        <h2 className="text-[40px] leading-[44px] font-semibold tracking-[-0.04em]">
          Tu primer proyecto,
          <br />
          en cinco etapas.
        </h2>
        <p className="text-[15px] leading-[22px] text-muted-foreground">
          Pega la URL de un repositorio público de GitHub que tenga un{" "}
          <span className="font-mono text-[13px] text-foreground">Dockerfile</span>. Construimos la imagen, levantamos el
          contenedor y te damos una URL con HTTPS.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs font-medium text-muted-foreground">Lo único que necesitas</p>
        <ul className="flex flex-wrap justify-center gap-4">
          {REQUISITOS.map(({ icono: Icono, titulo, detalle }) => (
            <li key={titulo}>
              <Card className="flex w-[250px] flex-col gap-3 p-[18px]">
                <Icono className="size-[18px] text-muted-foreground" aria-hidden />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">{titulo}</p>
                  <p className="text-xs text-muted-foreground">{detalle}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </div>
      <Button asChild size="lg">
        <Link href="/projects/nuevo">
          <Plus />
          Crear primer proyecto
        </Link>
      </Button>
    </section>
  );
}
