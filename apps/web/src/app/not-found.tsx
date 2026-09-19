import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold">No encontrado</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ese proyecto mock no existe.
      </p>
      <Button className="mt-4" asChild>
        <Link href="/projects">Ir a proyectos</Link>
      </Button>
    </main>
  );
}
