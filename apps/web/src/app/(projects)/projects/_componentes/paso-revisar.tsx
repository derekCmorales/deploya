import { Cpu, Database, FolderGit2, Globe, Hammer, Package, Pencil, Terminal, Variable, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { RielEtapas } from "@/components/deploya/riel-etapas";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { useAltaProyecto } from "@/hooks/use-alta-proyecto";
import type { PasoAlta } from "@/lib/alta";
import { DOMINIO_APPS, ESQUEMA_APPS } from "@/lib/api";
import { DESCRIPCION_TIPO } from "@/lib/datos";
import { recursosPlan, shaCorto, textoConstruccion, urlProyecto, type ListaProyectos } from "@/lib/proyectos";
import { variablesDeBorrador } from "@/lib/variables";

import { BannerBloqueo } from "./banner-bloqueo";

type Alta = ReturnType<typeof useAltaProyecto>;

export const NOTA_DATOS = "Los recursos de datos se crean antes del despliegue #1 y siguen en la pestaña Datos.";

const SIN_EMPEZAR = ["pendiente", "pendiente", "pendiente", "pendiente", "pendiente"] as const;

/** Paso 3 del asistente: pantalla 11d. */
export function PasoRevisar({ alta, lista }: { alta: Alta; lista: ListaProyectos | null }) {
  const { validacion } = alta;
  if (!validacion) return null;
  const editar = (destino: PasoAlta) => (
    <Button type="button" variant="ghost" size="xs" onClick={() => alta.irA(destino)}>
      <Pencil />
      Editar
    </Button>
  );
  const cantidad = variablesDeBorrador(alta.variables).length;
  const construccion = alta.aplicaComandoConstruccion ? alta.comandoConstruccion.trim() : "";
  const inicio = alta.comandoInicio.trim();

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
          <Fila icono={FolderGit2} titulo="Fuente" accion={editar("repositorio")}>
            {validacion.repositorio} · {alta.rama} · {shaCorto(validacion.commit.sha)}
          </Fila>
          <Fila icono={Package} titulo="Construcción" accion={editar("repositorio")}>
            {textoConstruccion(validacion)}
          </Fila>
          <Fila icono={Hammer} titulo="Comandos" accion={editar("construccion")}>
            {construccion || inicio ? (
              [construccion && `build: ${construccion}`, inicio && `inicio: ${inicio}`].filter(Boolean).join(" · ")
            ) : (
              <span className="text-muted-foreground">Los detectados</span>
            )}
          </Fila>
          <Fila icono={Terminal} titulo="Puerto" accion={editar("repositorio")}>
            {alta.puerto} → {ESQUEMA_APPS}
          </Fila>
          <Fila icono={Database} titulo="Datos" accion={editar("datos")}>
            {alta.datos.length === 0 ? (
              <span className="text-muted-foreground">Sin bases de datos</span>
            ) : (
              alta.datos.map((tipo) => DESCRIPCION_TIPO[tipo].nombre).join(" · ")
            )}
          </Fila>
          <Fila icono={Variable} titulo="Variables" accion={editar("variables")}>
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

      {alta.datos.length > 0 ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Database className="size-3.5 shrink-0" aria-hidden />
          {NOTA_DATOS}
        </p>
      ) : null}

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
