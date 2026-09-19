import { notFound } from "next/navigation";

import { CycleFlow } from "@/components/panel/cycle-flow";
import { proyectoPorId } from "@/lib/mock/proyectos";

export default async function FlujoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proyecto = proyectoPorId(id);
  if (!proyecto) notFound();
  return <CycleFlow proyecto={proyecto} />;
}
