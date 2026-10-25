import { GraficaEtapas } from "@/components/deploya";
import { PanelHistorial } from "../../_componentes/panel-historial";

/** Pantalla 14 · Despliegues del proyecto (M7-02, M4-02, M5-04). */
export default async function DesplieguesPage({ params }: { params: Promise<{ proyecto: string }> }) {
  const { proyecto } = await params;

  return (
    <div className="space-y-6">
      {/* Tarjeta de Tiempos por Etapa (Artboard 14c) */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">Tiempo por etapa</h3>
            <p className="text-xs font-mono text-muted-foreground">
              Mediana: 18 s · Construcción 68 % del tiempo · Fallos 2 de 14 · ↺ Reversión sin construir
            </p>
          </div>
        </div>

        <GraficaEtapas
          titulo="Tiempo por etapa"
          etapas={[
            { nombre: "recepcion", duracion: 2 },
            { nombre: "clonacion", duracion: 4 },
            { nombre: "build", duracion: 10 },
            { nombre: "configuracion", duracion: 1 },
            { nombre: "inicio", duracion: 1 },
          ] as any}
        />

        <p className="text-[11px] font-mono text-muted-foreground">
          Consejo: Usa un Dockerfile con caché de dependencias para acelerar la etapa de construcción.
        </p>
      </div>

      {/* Historial de despliegues existente */}
      <PanelHistorial proyectoId={proyecto} />
    </div>
  );
}