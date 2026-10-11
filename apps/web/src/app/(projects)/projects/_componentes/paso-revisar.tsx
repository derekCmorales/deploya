import { Cpu, FolderGit2, Globe, Package, Pencil, Terminal, Variable, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { RielEtapas } from "@/components/deploya/riel-etapas";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { useAltaProyecto } from "@/hooks/use-alta-proyecto";
import { DOMINIO_APPS, ESQUEMA_APPS } from "@/lib/api";
import { recursosPlan, shaCorto, textoConstruccion, urlProyecto, type ListaProyectos } from "@/lib/proyectos";
import { variablesDeAlta } from "@/lib/variables";

import { BannerBloqueo } from "./banner-bloqueo";

type Alta = ReturnType<typeof useAltaProyecto>;

const SIN_EMPEZAR = ["pendiente", "pendiente", "pendiente", "pendiente", "pendiente"] as const;

/** Paso 3 del asistente: pantalla 11d. */
export function PasoRevisar({ alta, lista }: { alta: Alta; lista: ListaProyectos | null }) {
  const { validacion } = alta;
  if (!validacion) return null;
  const editarFuente = (
    <Button type="button" variant="ghost" size="xs" onClick={() => alta.irA("repositorio")}>
      <Pencil />
      Editar
    </Button>
  );
  const editarVariables = (
    <Button type="button" variant="ghost" size="xs" onClick={() => alta.irA("variables")}>
      <Pencil />
      Editar
    </Button>
  );
  const cantidad = variablesDeAlta(alta.variables).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] font-medium text-muted-foreground">Revisar</p>
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Todo listo para desplegar</h2>
        <p className="text-muted-foreground">Al confirmar, empieza el despliegue #1 y verás en qué etapa va.</p>
      </div>

      {alta.error?.tipo === "aviso" ? <Banner variant="bad" title={alta.error.mensaje} /> : null}
      {alta.error?.tipo === "bloqueo" ? <BannerBloqueo codigo={alta.error.codigo} mensaje={alta.error.mensaje} /> : null}

      <Card className="overflow-hidden">
        <dl>
          <Fila icono={FolderGit2} titulo="Fuente" accion={editarFuente}>
            {validacion.repositorio} · {alta.rama} · {shaCorto(validacion.commit.sha)}
          </Fila>
          <Fila icono={Package} titulo="Construcción" accion={editarFuente}>
            {textoConstruccion(validacion)}
          </Fila>
          <Fila icono={Terminal} titulo="Puerto" accion={editarFuente}>
            {alta.puerto} → {ESQUEMA_APPS}
          </Fila>
          <Fila icono={Variable} titulo="Variables" accion={editarVariables}>
            {cantidad === 0 ? <span className="text-muted-foreground">Sin variables</span> : `${cantidad} cifradas`}
          </Fila>
          <Fila icono={Cpu} titulo="Recursos" nota="según tu plan">
            {lista ? `${recursosPlan(lista.plan)} (${lista.plan.nombre})` : "—"}
          </Fila>
          <Fila icono={Globe} titulo="URL" nota="automática">
            {urlProyecto(alta.subdominio, DOMINIO_APPS, ESQUEMA_APPS)}
          </Fila>
        </dl>
      </Card>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-muted-foreground">Qué pasará</p>
        <RielEtapas size="lg" etapas={SIN_EMPEZAR} />
      </div>
    </div>
  );
}

function Fila({
  icono: Icono,
  titulo,
  accion,
  nota,
  children,
}: {
  icono: LucideIcon;
  titulo: string;
  accion?: ReactNode;
  nota?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-b-0">
      <Icono className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <dt className="w-[120px] shrink-0 text-muted-foreground">{titulo}</dt>
      <dd className="min-w-0 flex-1 truncate font-mono text-[13px]">{children}</dd>
      {accion ?? (nota ? <span className="text-xs text-muted-foreground">{nota}</span> : null)}
    </div>
  );
}
