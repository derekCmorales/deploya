import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ProjectList } from "@/components/panel/project-list";
import { proyectoPorId } from "@/lib/mock/proyectos";

export default async function ProjectWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!proyectoPorId(id)) notFound();

  return (
    <div className="flex h-full min-h-0">
      <ProjectList seleccionadoId={id} />
      {children}
    </div>
  );
}
