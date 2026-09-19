"use client";

import {
  Background,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  Position,
  ReactFlow,
} from "@xyflow/react";
import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { etapaCompletada, varianteEstado } from "@/lib/mock/estados";
import {
  ETAPA_ETIQUETA,
  ETAPAS_CICLO,
  type Proyecto,
} from "@/lib/mock/proyectos";

import "@xyflow/react/dist/style.css";

type Props = { proyecto: Proyecto };

export function CycleFlow({ proyecto }: Props) {
  const { nodes, edges } = useMemo(() => buildGraph(proyecto), [proyecto]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">
            Flujo · {proyecto.nombre}
          </h2>
          <p className="text-xs text-muted-foreground">
            Cinco etapas del ciclo. Datos mock; el motor no corre aquí.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={varianteEstado(proyecto.estado)}>
            {proyecto.estado}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/projects/${proyecto.id}`}>Volver al detalle</Link>
          </Button>
        </div>
      </header>
      <div className="min-h-0 flex-1 bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
        >
          <Background color="oklch(1 0 0 / 8%)" gap={18} />
          <Controls />
          <MiniMap
            pannable
            zoomable
            maskColor="oklch(0.145 0.012 250 / 70%)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

function buildGraph(proyecto: Proyecto): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = ETAPAS_CICLO.map((etapa, i) => {
    const actual = proyecto.etapa === etapa;
    const hecha = etapaCompletada(proyecto.etapa, etapa);
    return {
      id: etapa,
      position: { x: 40 + i * 220, y: 120 },
      data: {
        label: `${ETAPA_ETIQUETA[etapa]}${actual ? " · actual" : hecha ? " · hecha" : ""}`,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        width: 180,
        fontSize: 13,
        color: "oklch(0.97 0.004 250)",
        background: actual
          ? "oklch(0.26 0.02 175)"
          : "oklch(0.185 0.012 250)",
        borderColor: actual
          ? "oklch(0.78 0.12 175)"
          : "oklch(1 0 0 / 12%)",
      },
    };
  });

  const edges: Edge[] = ETAPAS_CICLO.slice(0, -1).map((etapa, i) => ({
    id: `${etapa}->${ETAPAS_CICLO[i + 1]}`,
    source: etapa,
    target: ETAPAS_CICLO[i + 1],
    animated: proyecto.etapa === ETAPAS_CICLO[i + 1],
    style: { stroke: "oklch(0.78 0.12 175)" },
  }));

  return { nodes, edges };
}
