"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { reenviarVerificacion, type DestinoReenvio } from "@/lib/api-identidad";
import { formatoCuentaAtras, puedeReenviar } from "@/lib/reenvio";

const UN_SEGUNDO_MS = 1000;

/**
 * «Reenviar correo» de 02 y 03b (M1-04). La cuenta atrás arranca con los segundos que devuelve
 * la API (202 o 429 `EsperaReenvio`) y el botón queda deshabilitado hasta que llega a cero.
 * `compacto` es la versión para las acciones de un `Banner` (03b), sin texto de apoyo.
 */
export function BotonReenviar({ destino, compacto = false }: { destino: DestinoReenvio; compacto?: boolean }) {
  const [segundos, setSegundos] = useState(0);
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
  const etiqueta = esperando ? `Reenviar correo · ${formatoCuentaAtras(segundos)}` : "Reenviar correo";

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant="outline"
        size={compacto ? "sm" : "lg"}
        className={compacto ? undefined : "w-full"}
        onClick={() => void reenviar()}
        disabled={enviando || esperando}
      >
        {enviando ? <Loader2 className="animate-spin" aria-hidden /> : null}
        <span className="tabular-nums">{etiqueta}</span>
      </Button>
      {esperando && !compacto ? (
        <p className="text-xs text-muted-foreground" aria-live="polite">
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
