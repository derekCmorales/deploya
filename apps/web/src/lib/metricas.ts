export function estadoEnPalabra(pct: number): "Holgada" | "Cerca del límite" | "Al límite" {
  if (pct >= 100) return "Al límite";
  if (pct >= 80) return "Cerca del límite";
  return "Holgada";
}

export function deltaPorVersion(valorActual: number, valorVersionAnterior: number, unidad: string = "MB"): string {
  const diff = valorActual - valorVersionAnterior;
  if (diff === 0) return `Sin cambios desde la versión anterior`;
  const signo = diff > 0 ? "▲" : "▼";
  return `${signo} ${Math.abs(diff)} ${unidad} desde la versión previa`;
}

export function textoBanner(porcentajeMemoria: number, nombrePlan: string, versionDelta: string): string {
  return `La memoria está al ${porcentajeMemoria} % del límite de ${nombrePlan}. ${versionDelta}`;
}