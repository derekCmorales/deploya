import { FolderGit2, Globe, Hammer, Plus, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { RielEtapas } from "@/components/deploya/riel-etapas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RUTA_NUEVO_PROYECTO } from "@/lib/inicio";
import { recursosPlan, type PlanProyectos } from "@/lib/proyectos";

const PASOS: { icono: LucideIcon; titulo: string; detalle: string }[] = [
  { icono: FolderGit2, titulo: "Conecta un repositorio", detalle: "Público, de GitHub, con Dockerfile o un stack que reconocemos." },
  { icono: Hammer, titulo: "Lo construimos", detalle: "Imagen y contenedor con los límites de tu plan, con la bitácora en vivo." },
  { icono: Globe, titulo: "Recibe tu URL", detalle: "Un subdominio propio con HTTPS, listo para compartir." },
];

const SIN_DESPLIEGUES = ["pendiente", "pendiente", "pendiente", "pendiente", "pendiente"] as const;

/** Inicio sin proyectos: qué hace deploya en tres pasos y la acción para empezar. */
export function Bienvenida({ plan, puedeCrear }: { plan: PlanProyectos; puedeCrear: boolean }) {
  return (
    <section className="dy-entrada puntos flex flex-col gap-7 rounded-xl border border-border bg-sunken p-8 sm:p-10">
      <div className="flex max-w-[620px] flex-col gap-3">
        <RielEtapas etapas={SIN_DESPLIEGUES} />
        <h2 className="text-[32px] leading-[38px] font-semibold tracking-[-0.035em]">Tu primer despliegue, en minutos.</h2>
        <p className="text-[15px] leading-[22px] text-muted-foreground">
          Pega la URL de tu repositorio y nosotros nos encargamos del resto. Tu plan {plan.nombre} incluye{" "}
          <span className="font-mono text-[13px] text-foreground">{recursosPlan(plan)}</span> por proyecto.
        </p>
      </div>
      <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PASOS.map(({ icono: Icono, titulo, detalle }, i) => (
          <li key={titulo}>
            <Card className="flex h-full flex-col gap-3 p-[18px]">
              <span className="flex items-center justify-between">
                <Icono className="size-[18px] text-muted-foreground" aria-hidden />
                <span className="font-mono text-xs text-faint">0{i + 1}</span>
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-sm font-semibold">{titulo}</span>
                <span className="text-xs leading-[18px] text-muted-foreground">{detalle}</span>
              </span>
            </Card>
          </li>
        ))}
      </ol>
      <div>
        {puedeCrear ? (
          <Button asChild size="lg">
            <Link href={RUTA_NUEVO_PROYECTO}>
              <Plus />
              Crear primer proyecto
            </Link>
          </Button>
        ) : (
          <Button size="lg" disabled>
            <Plus />
            Crear primer proyecto
          </Button>
        )}
      </div>
    </section>
  );
}
