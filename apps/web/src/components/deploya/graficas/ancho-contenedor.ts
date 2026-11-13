"use client";

import { useEffect, useRef, useState } from "react";

/** Ancho con el que se pinta la gráfica antes de medir el contenedor (y en el servidor). */
export const ANCHO_INICIAL = 640;

/**
 * Ancho real del contenedor de una gráfica. El viewBox lo sigue con un alto fijo: así un texto
 * de 10 px mide 10 px en cualquier columna y la gráfica no crece de alto al ensanchar la tarjeta.
 */
export function useAnchoContenedor<T extends HTMLElement>() {
  const [ancho, setAncho] = useState(ANCHO_INICIAL);
  const contenedorRef = useRef<T>(null);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor || typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver((entradas) => {
      const medida = entradas[0]?.contentRect.width ?? 0;
      if (medida > 0) setAncho(Math.round(medida));
    });
    observador.observe(contenedor);
    return () => observador.disconnect();
  }, []);

  return { ancho, contenedorRef };
}
