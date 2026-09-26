import { cn } from "@/lib/utils";

/** Iniciales del nombre (no hay fotos de perfil en el núcleo). */
function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Avatar({ nombre, size = "default", className }: { nombre: string; size?: "default" | "lg"; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-border-strong bg-muted font-semibold tracking-[0.02em] text-foreground",
        size === "lg" ? "size-10 text-sm" : "size-7 text-[11px]",
        className,
      )}
    >
      {iniciales(nombre)}
    </span>
  );
}

export { Avatar, iniciales };
