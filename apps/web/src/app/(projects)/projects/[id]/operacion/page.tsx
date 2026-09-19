import { notFound } from "next/navigation";

import { OperacionView } from "@/components/panel/operacion-view";
import { proyectoPorId } from "@/lib/mock/proyectos";

export default async function OperacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proyecto = proyectoPorId(id);
  if (!proyecto) notFound();
  return <OperacionView proyecto={proyecto} />;
}
