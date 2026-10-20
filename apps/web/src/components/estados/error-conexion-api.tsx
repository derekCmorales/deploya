"use client";

import { RotateCw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sunken } from "@/components/ui/card";
import type { ErrorApi } from "@/lib/api";
import { detalleReintento, esperaDeReintento } from "@/lib/reintento";

const UN_SEGUNDO_MS = 1000;

/**
 * Pantalla 28 · «Error de conexión con la API» (WEB-02). Reintenta sola a los 8 s, luego a los
 * 16 s y cada 30 s; «Reintentar ahora» lo hace de inmediato. Al desmontarse deja de contar.
 */
export function ErrorConexionApi({ error, ruta, onReintentar }: { error: ErrorApi; ruta: string; onReintentar: () => void }) {
  const [intento, setIntento] = useState(0);
  const [faltan, setFaltan] = useState(() => esperaDeReintento(0));

  useEffect(() => {
    setFaltan(esperaDeReintento(intento));
    const reloj = setInterval(() => setFaltan((s) => Math.max(s - 1, 0)), UN_SEGUNDO_MS);
    return () => clearInterval(reloj);
  }, [intento, error]);

  useEffect(() => {
    if (faltan > 0) return;
    setIntento((i) => i + 1);
    onReintentar();
  }, [faltan, onReintentar]);

  return (
    <section className="flex flex-col items-center gap-3.5 rounded-xl border border-border bg-card px-8 py-12 text-center" role="alert">
      <span className="grid size-12 place-items-center rounded-xl border border-border-strong bg-background text-muted-foreground">
        <WifiOff className="size-5" aria-hidden />
      </span>
      <h2 className="text-xl font-semibold tracking-[-0.02em]">No pudimos conectar con deploya</h2>
      <p className="max-w-[420px] text-muted-foreground">
        Tus servicios siguen en línea; lo que falla es la conexión del panel. Reintentamos solos.
      </p>
      <Sunken className="px-3 py-2 font-mono text-xs text-muted-foreground" aria-live="polite">
        {detalleReintento(ruta, error.codigo, faltan)}
      </Sunken>
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
        Reintentar ahora
      </Button>
    </section>
  );
}
