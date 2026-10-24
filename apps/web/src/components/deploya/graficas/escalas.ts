export function escalaLineal(dominio: [number, number], rango: [number, number]) {
  const [dMin, dMax] = dominio;
  const [rMin, rMax] = rango;
  const dominioSpan = dMax - dMin || 1;
  const rangoSpan = rMax - rMin;

  return (valor: number) => {
    const fraccion = (valor - dMin) / dominioSpan;
    return rMin + fraccion * rangoSpan;
  };
}

export function ticks(maximo: number, n: number = 4): number[] {
  if (maximo <= 0) return [0];
  const paso = maximo / n;
  const resultado: number[] = [];
  for (let i = 0; i <= n; i++) {
    resultado.push(Math.round(paso * i * 100) / 100);
  }
  return resultado;
}