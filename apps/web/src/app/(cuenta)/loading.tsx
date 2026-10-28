import { Skeleton } from "@/components/ui/skeleton";

/** EST-01c · Carga entre rutas de (cuenta): el ritmo de la cabecera y las filas. */
export default function CargandoCuenta() {
  return (
    <div className="flex flex-col gap-3 px-8 pt-6" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
