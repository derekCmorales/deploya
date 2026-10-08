"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { reenviarVerificacion, type DestinoReenvio } from "@/lib/api-identidad";
import { formatoCuentaAtras, puedeReenviar } from "@/lib/reenvio";
import { cn } from "@/lib/utils";

const UN_SEGUNDO_MS = 1000;

interface BotonReenviarProps {
  destino: DestinoReenvio;
  /** Cuenta atrás con la que llega la pantalla (02 a tras registrarse); por defecto, ninguna. */
  segundosIniciales?: number;
  /** 02 (c) lo usa como acción principal; en 02 (a) y 03b es secundaria. */
  principal?: boolean;
  /** Texto de apoyo bajo el botón mientras corre la cuenta atrás (02); 03b no lo lleva. */
  conAyuda?: boolean;
  className?: string;
}

/**
 * «Reenviar correo» de 02 y 03b (M1-04). La cuenta atrás arranca con los segundos que devuelve
 * la API (202 o 429 `EsperaReenvio`) y el botón queda deshabilitado hasta que llega a cero.
 */
export function BotonReenviar({ destino, segundosIniciales = 0, principal = false, conAyuda = true, className }: BotonReenviarProps) {
  const [segundos, setSegundos] = useState(segundosIniciales);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (puedeReenviar(segundos)) return;
    const reloj = setTimeout(() => setSegundos((s) => s - 1), UN_SEGUNDO_MS);
    return () => clearTimeout(reloj);
  }, [segundos]);

  async function reenviar() {
    setEnviando(true);
    setError(null);
    const resultado = await reenviarVerificacion(destino).catch(() => null);
    setEnviando(false);
    if (resultado && resultado.tipo !== "error") setSegundos(resultado.segundos);
    else setError(resultado?.mensaje ?? "No pudimos reenviar el correo. Intenta de nuevo en unos segundos.");
  }

  const esperando = !puedeReenviar(segundos);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Button
        type="button"
        variant={principal ? "default" : "outline"}
        size="lg"
        className="w-full"
        onClick={() => void reenviar()}
        disabled={enviando || esperando}
      >
        {enviando ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
        <span>
          Reenviar correo
          {esperando ? (
            <>
              {" · "}
              <span className="font-mono tabular-nums">{formatoCuentaAtras(segundos)}</span>
            </>
          ) : null}
        </span>
      </Button>
      {esperando && conAyuda ? (
        <p className="text-center text-xs text-muted-foreground" aria-live="polite">
          Podrás reenviarlo cuando termine la cuenta atrás.
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-bad" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
