export interface LineaBitacora {
  n: number;
  marca: string;
  etapa: string;
  texto: string;
  nivel?: string;
}

export interface VistaDespliegue {
  id: string;
  numero: number;
  estado: string;
  imagen?: string;
  recursos?: string;
  codigoSalida?: number;
  motivoFallo?: string;
  disparador?: string;
  creado?: string;
  terminado?: string;
}

export function fusionarLineas(previas: LineaBitacora[], nuevas: LineaBitacora[]): LineaBitacora[] {
  const mapa = new Map<number, LineaBitacora>();
  for (const l of previas) {
    mapa.set(l.n, l);
  }
  for (const l of nuevas) {
    mapa.set(l.n, l);
  }
  return Array.from(mapa.values()).sort((a, b) => a.n - b.n);
}

export function lineaDeError(lineas: LineaBitacora[]): LineaBitacora | undefined {
  const conNivelError = [...lineas].reverse().find(l => l.nivel === 'error');
  if (conNivelError) {
    return conNivelError;
  }
  return lineas[lineas.length - 1];
}

export function textoParaCopiar(lineas: LineaBitacora[]): string {
  return lineas
    .map((l) => `${l.n} ${l.marca} ${l.texto}`)
    .join('\n');
}

export function tiempoTranscurrido(desde: string | Date, ahora: string | Date): string {
  const inicio = new Date(desde).getTime();
  const actual = new Date(ahora).getTime();
  const diffMs = Math.max(0, actual - inicio);

  const segundosTotales = Math.floor(diffMs / 1000);
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = segundosTotales % 60;

  if (minutos === 0) {
    return `${segundos}s`;
  }
  return `${minutos}m ${segundos}s`;
}

export function avisoVersionAnterior(numeroAnterior?: number): string | null {
  if (numeroAnterior === undefined || numeroAnterior === null) {
    return null;
  }
  return `La versión #${numeroAnterior} sigue sirviendo tráfico`;
}

export interface SiguientePasoSondeo {
  siguienteDesde: number;
  terminado: boolean;
}

export function calcularSiguientePasoSondeo(
  respuesta: { siguiente: number; terminado: boolean },
  actualDesde: number
): SiguientePasoSondeo {
  if (respuesta.terminado) {
    return {
      siguienteDesde: actualDesde,
      terminado: true,
    };
  }
  return {
    siguienteDesde: respuesta.siguiente ?? actualDesde,
    terminado: false,
  };
}