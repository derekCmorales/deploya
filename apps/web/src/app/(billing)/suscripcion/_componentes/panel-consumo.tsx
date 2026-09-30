import { FolderGit2, Hammer, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { Skeleton } from "@/components/ui/skeleton";
import { textoMiles } from "@/lib/planes";
import type { ListaProyectos } from "@/lib/proyectos";
import { fechaCorta, type MiSuscripcion } from "@/lib/suscripcion";

const COTA_AVISO = 0.8;

/**
 * «Consumo del período» de 08. Proyectos sale de `GET /proyectos`; el conteo de
 * construcciones del mes es de M7-03 (Avance 3): mientras tanto se muestra el límite.
 */
export function PanelConsumo({ suscripcion, proyectos }: { suscripcion: MiSuscripcion; proyectos: ListaProyectos | null }) {
  const { plan, vence } = suscripcion;
  const alLimite = proyectos !== null && proyectos.usados >= proyectos.maximo;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex-1 text-base">Consumo del período</CardTitle>
        {vence ? <span className="text-[13px] text-muted-foreground">Se reinicia el {fechaCorta(vence)}</span> : null}
      </CardHeader>
      <div className="grid flex-1 grid-cols-1 gap-x-8 gap-y-6 px-4 pt-1 pb-5 sm:grid-cols-2">
        {proyectos ? (
          <div className="flex flex-col gap-2">
            <Meter
              label={
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <FolderGit2 aria-hidden className="size-4 text-muted-foreground" />
                  Proyectos
                  {alLimite ? (
                    <Badge variant="warn">
                      <TriangleAlert aria-hidden />
                      Al límite
                    </Badge>
                  ) : null}
                </span>
              }
              value={proyectos.usados}
              max={proyectos.maximo}
              cota={proyectos.maximo * COTA_AVISO}
              tonoAlLimite="warn"
            />
            <span className="text-[13px] text-muted-foreground">Límite del plan</span>
          </div>
        ) : (
          <Skeleton className="h-14 w-full" />
        )}
        <div className="flex flex-col gap-2 text-sm">
          <span className="flex items-center gap-2 font-medium">
            <Hammer aria-hidden className="size-4 text-muted-foreground" />
            Construcciones
          </span>
          <span className="tnum">
            {textoMiles(plan.construccionesMes)} <span className="text-muted-foreground">/ mes</span>
          </span>
          <span className="text-[13px] text-muted-foreground">El conteo del mes llega en la próxima entrega.</span>
        </div>
      </div>
      <CardFooter>
        <span className="text-[13px] text-muted-foreground">
          Si llegas al límite, no podrás crear más proyectos ni lanzar más construcciones este mes.
        </span>
      </CardFooter>
    </Card>
  );
}
