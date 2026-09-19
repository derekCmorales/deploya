import { notFound } from "next/navigation";

import { ProjectDetail } from "@/components/panel/project-detail";
import { proyectoPorId } from "@/lib/mock/proyectos";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proyecto = proyectoPorId(id);
  if (!proyecto) notFound();
  return <ProjectDetail proyecto={proyecto} />;
}
