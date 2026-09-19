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
import { useTheme } from "next-themes";
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

const paleta = {
  oscuro: {
    texto: "oklch(0.97 0.004 250)",
    nodo: "oklch(0.185 0.012 250)",
    nodoActual: "oklch(0.26 0.02 175)",
    borde: "oklch(1 0 0 / 12%)",
    acento: "oklch(0.78 0.12 175)",
    minimapa: "oklch(0.185 0.012 250)",
    mascara: "oklch(0.145 0.012 250 / 70%)",
    grid: "oklch(1 0 0 / 8%)",
  },
  claro: {
    texto: "oklch(0.22 0.02 250)",
    nodo: "oklch(1 0 0)",
    nodoActual: "oklch(0.94 0.03 175)",
    borde: "oklch(0.22 0.02 250 / 14%)",
    acento: "oklch(0.45 0.1 175)",
    minimapa: "oklch(0.97 0.004 250)",
    mascara: "oklch(0.985 0.004 250 / 70%)",
    grid: "oklch(0.22 0.02 250 / 10%)",
  },
} as const;

export function CycleFlow({ proyecto }: Props) {
  const { resolvedTheme } = useTheme();
  const oscuro = resolvedTheme !== "light";
  const { nodes, edges } = useMemo(
    () => buildGraph(proyecto, oscuro),
    [proyecto, oscuro],
  );
  const colores = oscuro ? paleta.oscuro : paleta.claro;

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
          colorMode={oscuro ? "dark" : "light"}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
        >
          <Background color={colores.grid} gap={18} />
          <Controls />
          <MiniMap
            pannable
            zoomable
            bgColor={colores.minimapa}
            nodeColor={colores.acento}
            maskColor={colores.mascara}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

function buildGraph(
  proyecto: Proyecto,
  oscuro: boolean,
): { nodes: Node[]; edges: Edge[] } {
  const c = oscuro ? paleta.oscuro : paleta.claro;
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
        color: c.texto,
        background: actual ? c.nodoActual : c.nodo,
        borderColor: actual ? c.acento : c.borde,
      },
    };
  });

  const edges: Edge[] = ETAPAS_CICLO.slice(0, -1).map((etapa, i) => ({
    id: `${etapa}->${ETAPAS_CICLO[i + 1]}`,
    source: etapa,
    target: ETAPAS_CICLO[i + 1],
    animated: proyecto.etapa === ETAPAS_CICLO[i + 1],
    style: { stroke: c.acento },
  }));

  return { nodes, edges };
}
