export function medianaDe(totales: number[]): number {
  if (totales.length === 0) return 0;
  const ordenados = [...totales].sort((a, b) => a - b);
  const mitad = Math.floor(ordenados.length / 2);
  if (ordenados.length % 2 === 0) {
    return Math.round((ordenados[mitad - 1] + ordenados[mitad]) / 2);
  }
  return ordenados[mitad];
}

export function porcentajeDe(etapa: string, despliegues: Array<{ etapas: Record<string, number> }>): number {
  if (despliegues.length === 0) return 0;
  let totalTiempoEtapas = 0;
  let totalGeneral = 0;

  for (const d of despliegues) {
    const duracionEtapa = d.etapas[etapa] ?? 0;
    totalTiempoEtapas += duracionEtapa;
    for (const dur of Object.values(d.etapas)) {
      totalGeneral += dur as number;
    }
  }

  if (totalGeneral === 0) return 0;
  return Math.round((totalTiempoEtapas / totalGeneral) * 100);
}