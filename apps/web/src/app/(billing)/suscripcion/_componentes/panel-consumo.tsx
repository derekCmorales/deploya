import { FolderGit2, Hammer, TriangleAlert } from "lucide-react";

import { RitmoConstrucciones } from "@/components/deploya/ritmo-construcciones";
import { Badge } from "@/components/ui/badge";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { Skeleton } from "@/components/ui/skeleton";
import type { Sondeo } from "@/hooks/use-sondeo";
import { textoMiles } from "@/lib/planes";
import type { ListaProyectos } from "@/lib/proyectos";
import { fechaCorta, porcentajeConsumo, reinicioConsumo, type ConsumoPeriodo, type MiSuscripcion } from "@/lib/suscripcion";

const COTA_AVISO = 0.8;

/**
 * «Consumo del período» de 08. Proyectos sale de `GET /proyectos`; el conteo de construcciones
 * del mes, de `GET /observabilidad/consumo` (M7-03): si no responde se muestra el límite del plan. El
 * período es el mes calendario en UTC (M5-03), no la vigencia: se reinicia el día 1 aunque la vigencia haya terminado.
 * Debajo de los dos medidores va el ritmo de construcciones (08c), que desaparece si su petición falla.
 */
export function PanelConsumo({
  suscripcion,
  proyectos,
  consumo,
  ahora,
}: {
  suscripcion: MiSuscripcion;
  proyectos: ListaProyectos | null;
  consumo: Sondeo<ConsumoPeriodo>;
  ahora: Date;
}) {
  const { plan } = suscripcion;
  const alLimite = proyectos !== null && proyectos.usados >= proyectos.maximo;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex-1 text-base">Consumo del período</CardTitle>
        <span className="text-[13px] text-muted-foreground">Se reinicia el {fechaCorta(consumo.datos?.periodo.reinicia ?? reinicioConsumo(ahora))}</span>
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
        {consumo.datos ? (
          <div className="flex flex-col gap-2">
            <Meter
              label={
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <Hammer aria-hidden className="size-4 text-muted-foreground" />
                  Construcciones
                </span>
              }
              value={consumo.datos.construcciones.usadas}
              max={consumo.datos.construcciones.limite}
              cota={consumo.datos.construcciones.limite * COTA_AVISO}
              valueLabel={
                <>
                  <span className="text-muted-foreground">
                    {porcentajeConsumo(consumo.datos.construcciones.usadas, consumo.datos.construcciones.limite)} %
                  </span>{" "}
                  {textoMiles(consumo.datos.construcciones.usadas)}{" "}
                  <span className="text-muted-foreground">/ {textoMiles(consumo.datos.construcciones.limite)}</span>
                </>
              }
            />
            <span className="text-[13px] text-muted-foreground">Este mes</span>
          </div>
        ) : consumo.error ? (
          <div className="flex flex-col gap-2 text-sm">
            <span className="flex items-center gap-2 font-medium">
              <Hammer aria-hidden className="size-4 text-muted-foreground" />
              Construcciones
            </span>
            <span className="tnum">
              {textoMiles(plan.construccionesMes)} <span className="text-muted-foreground">/ mes</span>
            </span>
            <span className="text-[13px] text-muted-foreground">No pudimos leer cuántas llevas este mes.</span>
          </div>
        ) : (
          <Skeleton className="h-14 w-full" />
        )}
      </div>
      <RitmoConstrucciones plan={plan.nombre} className="border-t border-border px-4 py-5" />
      <CardFooter>
        <span className="text-[13px] text-muted-foreground">
          Si llegas al límite, no podrás crear más proyectos ni lanzar más construcciones este mes.
        </span>
      </CardFooter>
    </Card>
  );
}
