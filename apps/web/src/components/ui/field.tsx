import { CircleX } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Campo de formulario: etiqueta, control, pista y error.
 * El error reemplaza a la pista y se enlaza con `aria-describedby`.
 *
 * <Field id="correo" label="Correo" error={errores.correo}>
 *   <Input id="correo" type="email" aria-invalid={!!errores.correo} aria-describedby="correo-msg" />
 * </Field>
 */
export interface FieldProps {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Acción a la derecha de la etiqueta, p. ej. «Olvidé mi contraseña». */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

function Field({ id, label, hint, error, action, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] leading-[18px] font-medium">
          {label}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="flex items-center gap-1.5 text-xs text-bad" role="alert">
          <CircleX className="size-3.5" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export { Field };
