export function proyectar(diarios: number[], diasDelMes: number): number {
  if (diarios.length === 0) return 0;
  const diasTranscurridos = diarios.length;
  const totalUsadas = diarios.reduce((a, b) => a + b, 0);
  if (diasTranscurridos === 0) return 0;
  
  const promedioDiario = totalUsadas / diasTranscurridos;
  return Math.round(promedioDiario * diasDelMes);
}

export function diaEnQueSeAcaba(diarios: number[], cuota: number, diasDelMes: number): number | null {
  if (diarios.length === 0) return null;
  const diasTranscurridos = diarios.length;
  const totalUsadas = diarios.reduce((a, b) => a + b, 0);
  if (diasTranscurridos === 0 || totalUsadas === 0) return null;

  const promedioDiario = totalUsadas / diasTranscurridos;
  if (promedioDiario <= 0) return null;

  const diasRestantes = (cuota - totalUsadas) / promedioDiario;
  if (diasRestantes < 0) return diasTranscurridos; // Ya se acabó

  const diaEstimado = Math.ceil(diasTranscurridos + diasRestantes);
  return diaEstimado <= diasDelMes ? diaEstimado : null;
}