import { CircleCheck, CircleDashed } from "lucide-react";

import { cn } from "@/lib/utils";

/** Reglas de contraseña del núcleo (pantallas 01, 04 y 05b). Misma lista en API y web. */
export const REGLAS_CONTRASENA = [
  { id: "largo", texto: "Mínimo 12 caracteres", cumple: (v: string) => v.length >= 12 },
  { id: "caso", texto: "Mayúsculas y minúsculas", cumple: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { id: "numero", texto: "Al menos un número", cumple: (v: string) => /\d/.test(v) },
  { id: "simbolo", texto: "Al menos un símbolo", cumple: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

export function contrasenaValida(v: string) {
  return REGLAS_CONTRASENA.every((r) => r.cumple(v));
}

function RequisitosContrasena({ valor, id, className }: { valor: string; id?: string; className?: string }) {
  return (
    <ul id={id} className={cn("flex flex-col gap-1.5 pt-1", className)} aria-label="Requisitos de la contraseña">
      {REGLAS_CONTRASENA.map((r) => {
        const ok = r.cumple(valor);
        const Icono = ok ? CircleCheck : CircleDashed;
        return (
          <li key={r.id} className={cn("flex items-center gap-2 text-xs", ok ? "text-foreground" : "text-muted-foreground")}>
            <Icono className={cn("size-3.5", ok && "text-ok")} aria-hidden />
            {r.texto}
            <span className="sr-only">{ok ? "(cumple)" : "(pendiente)"}</span>
          </li>
        );
      })}
    </ul>
  );
}

export { RequisitosContrasena };
