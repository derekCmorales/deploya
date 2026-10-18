import { Skeleton } from "@/components/ui/skeleton";

const FILAS = [0, 1, 2];

/** Pantalla 28 · «Carga · esqueleto de la lista de proyectos» (WEB-02): mismas columnas que 10. */
export function EsqueletoProyectos() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border" aria-busy="true" aria-label="Cargando proyectos">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Skeleton className="h-8 w-[260px]" />
        <span className="flex-1" />
        <Skeleton className="h-8 w-32" />
      </div>
      {FILAS.map((i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-b-0">
          <span className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </span>
          <Skeleton className="h-1 w-14" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}
