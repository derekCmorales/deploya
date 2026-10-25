"use client";

import { Gauge } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { cambiarLimites } from "@/hooks/use-admin-instalacion";
import {
  OPCIONES_CPU,
  OPCIONES_MEMORIA_MB,
  proyectosDesdeTexto,
  textoCapacidad,
  textoCpu,
  textoMemoria,
  type LimitesInstalacion,
} from "@/lib/admin-instalacion";
import { ErrorApi } from "@/lib/api";

import { FilaAjuste } from "./fila-ajuste";

function Fila({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="w-[170px] text-[13px] font-medium">{etiqueta}</span>
      {children}
    </div>
  );
}

/** Límites por proyecto: reemplazan a los planes y aplican en el próximo despliegue. */
export function BloqueLimites({ limites, alGuardar }: { limites: LimitesInstalacion; alGuardar: () => void }) {
  const [cpu, setCpu] = useState(String(limites.cpu));
  const [memoria, setMemoria] = useState(String(limites.memoriaMb));
  const [proyectos, setProyectos] = useState(limites.proyectosPorUsuario === null ? "" : String(limites.proyectosPorUsuario));
  const [estado, setEstado] = useState<{ tipo: "listo" } | { tipo: "error"; mensaje: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const proyectosPorUsuario = proyectosDesdeTexto(proyectos);
  const capacidad = textoCapacidad(limites, Number(memoria));

  const guardar = async () => {
    if (proyectosPorUsuario === undefined) return;
    setGuardando(true);
    setEstado(null);
    try {
      await cambiarLimites({ cpu: Number(cpu), memoriaMb: Number(memoria), proyectosPorUsuario });
      setEstado({ tipo: "listo" });
      alGuardar();
    } catch (e) {
      setEstado({ tipo: "error", mensaje: e instanceof ErrorApi ? e.message : "No pudimos guardar los límites." });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <FilaAjuste titulo="Límites por proyecto" descripcion="Reemplazan a los planes: lo mismo para todos los usuarios.">
      <Card className="flex flex-col gap-5 p-5">
        <Fila etiqueta="CPU por proyecto">
          <Segmented
            size="sm"
            aria-label="CPU por proyecto"
            value={cpu}
            onValueChange={setCpu}
            options={OPCIONES_CPU.map((c) => ({ value: String(c), label: textoCpu(c) }))}
          />
        </Fila>
        <Fila etiqueta="Memoria por proyecto">
          <Segmented
            size="sm"
            aria-label="Memoria por proyecto"
            value={memoria}
            onValueChange={setMemoria}
            options={OPCIONES_MEMORIA_MB.map((m) => ({ value: String(m), label: textoMemoria(m) }))}
          />
        </Fila>
        <Fila etiqueta="Proyectos por usuario">
          <Input
            aria-label="Proyectos por usuario"
            aria-invalid={proyectosPorUsuario === undefined}
            inputMode="numeric"
            className="h-8 w-40"
            placeholder="Sin límite"
            value={proyectos}
            onChange={(e) => setProyectos(e.target.value)}
          />
        </Fila>
        <Banner variant="muted" title={capacidad.titulo}>
          {capacidad.texto}
        </Banner>
        {estado?.tipo === "error" ? (
          <Banner variant="bad" title="No se guardaron los límites.">
            {estado.mensaje}
          </Banner>
        ) : null}
        <div className="flex items-center justify-end gap-3">
          {estado?.tipo === "listo" ? <span className="text-[13px] text-muted-foreground">Guardados. Aplican en el próximo despliegue.</span> : null}
          <Button size="sm" onClick={() => void guardar()} disabled={guardando || proyectosPorUsuario === undefined}>
            <Gauge />
            Guardar límites
          </Button>
        </div>
      </Card>
    </FilaAjuste>
  );
}
