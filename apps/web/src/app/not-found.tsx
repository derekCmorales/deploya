import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold">No encontrado</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Esa ruta no existe. Guía del kit: docs/diseno/.
      </p>
      <Button className="mt-4" asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </main>
  );
}
