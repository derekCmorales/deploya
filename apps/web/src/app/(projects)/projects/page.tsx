import { redirect } from "next/navigation";

import { proyectoPorDefecto } from "@/lib/mock/proyectos";

export default function ProjectsIndexPage() {
  redirect(`/projects/${proyectoPorDefecto.id}`);
}
