"use client";

import { RotateCw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sunken } from "@/components/ui/card";
import type { ErrorApi } from "@/lib/api";
import { detalleReintento, esperaDeReintento } from "@/lib/reintento";

const UN_SEGUNDO_MS = 1000;

type Props = {
  /** Solo se usa el código en la línea de reintento; vale cualquier error, no solo `ErrorApi`. */
  error: Pick<ErrorApi, "codigo">;
  /** Ruta que se muestra en la línea de reintento; solo hace falta con reintento automático. */
  ruta?: string;
  onReintentar: () => void;
  /** Copia del estado. Por defecto, la de «Error de conexión con la API» de 28. */
  titulo?: string;
  descripcion?: string;
  /**
   * Un fallo de conexión se reintenta solo (8 s, 16 s, 30 s); un error de render no, porque se
   * repite hasta que cambie el código. Sin reintento automático, la acción dice «Reintentar».
   */
  reintentoAutomatico?: boolean;
};

/**
 * Pantalla 28 · «Error de conexión con la API» (WEB-02). Reintenta sola a los 8 s, luego a los
 * 16 s y cada 30 s; «Reintentar ahora» lo hace de inmediato. Al desmontarse deja de contar.
 */
export function ErrorConexionApi({
  error,
  ruta = "",
  onReintentar,
  titulo = "No pudimos conectar con deploya",
  descripcion = "Tus servicios siguen en línea; lo que falla es la conexión del panel. Reintentamos solos.",
  reintentoAutomatico = true,
}: Props) {
  const [intento, setIntento] = useState(0);
  const [faltan, setFaltan] = useState(() => esperaDeReintento(0));

  useEffect(() => {
    if (!reintentoAutomatico) return;
    setFaltan(esperaDeReintento(intento));
    const reloj = setInterval(() => setFaltan((s) => Math.max(s - 1, 0)), UN_SEGUNDO_MS);
    return () => clearInterval(reloj);
  }, [intento, error, reintentoAutomatico]);

  useEffect(() => {
    if (!reintentoAutomatico || faltan > 0) return;
    setIntento((i) => i + 1);
    onReintentar();
  }, [faltan, onReintentar, reintentoAutomatico]);

  return (
    <section className="flex flex-col items-center gap-3.5 rounded-xl border border-border bg-card px-8 py-12 text-center" role="alert">
      <span className="grid size-12 place-items-center rounded-xl border border-border-strong bg-background text-muted-foreground">
        <WifiOff className="size-5" aria-hidden />
      </span>
      <h2 className="text-xl font-semibold tracking-[-0.02em]">{titulo}</h2>
      <p className="max-w-[420px] text-muted-foreground">{descripcion}</p>
      {reintentoAutomatico ? (
        <Sunken className="px-3 py-2 font-mono text-xs text-muted-foreground" aria-live="polite">
          {detalleReintento(ruta, error.codigo, faltan)}
        </Sunken>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setIntento((i) => i + 1);
          onReintentar();
        }}
      >
        <RotateCw />
        {reintentoAutomatico ? "Reintentar ahora" : "Reintentar"}
      </Button>
    </section>
  );
}
