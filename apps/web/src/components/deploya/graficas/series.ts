export interface MuestraSerie {
  tiempo: string;
  valor: number;
}

export interface EventoDespliegue {
  id: string;
  tiempo: string;
  version: string;
}

export function puntosDeSerie(muestras: MuestraSerie[], maxIntervaloMs: number = 120000): MuestraSerie[][] {
  if (!muestras.length) return [];
  const segmentos: MuestraSerie[][] = [];
  let segmentoActual: MuestraSerie[] = [muestras[0]];

  for (let i = 1; i < muestras.length; i++) {
    const tPrev = new Date(muestras[i - 1].tiempo).getTime();
    const tCurr = new Date(muestras[i].tiempo).getTime();
    
    if (!isNaN(tPrev) && !isNaN(tCurr) && (tCurr - tPrev > maxIntervaloMs)) {
      if (segmentoActual.length > 0) {
        segmentos.push(segmentoActual);
      }
      segmentoActual = [muestras[i]];
    } else {
      segmentoActual.push(muestras[i]);
    }
  }
  if (segmentoActual.length > 0) {
    segmentos.push(segmentoActual);
  }
  return segmentos;
}

export function tonoDeUso(valor: number, limite: number): "normal" | "aviso" {
  if (limite <= 0) return "normal";
  const ratio = valor / limite;
  return ratio >= 0.8 ? "aviso" : "normal";
}

export function eventoEnX(evento: EventoDespliegue, ventanaInicio: string, ventanaFin: string, ancho: number): number | null {
  const tEv = new Date(evento.tiempo).getTime();
  const tIn = new Date(ventanaInicio).getTime();
  const tFi = new Date(ventanaFin).getTime();

  if (isNaN(tEv) || isNaN(tIn) || isNaN(tFi) || tFi === tIn) return null;
  if (tEv < tIn || tEv > tFi) return null;

  const fraccion = (tEv - tIn) / (tFi - tIn);
  return fraccion * ancho;
}