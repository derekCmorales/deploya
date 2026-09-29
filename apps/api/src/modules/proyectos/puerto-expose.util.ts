export function puertoDesdeExpose(dockerfile: string): number {
  const lineas = dockerfile.split('\n');
  
  for (const linea of lineas) {
    const lineaLimpiada = linea.trim().toUpperCase();
    if (lineaLimpiada.startsWith('EXPOSE')) {
      const partes = lineaLimpiada.split(/\s+/);
      if (partes.length > 1) {
        const puerto = parseInt(partes[1], 10);
        if (!isNaN(puerto)) {
          return puerto;
        }
      }
    }
  }
  
  return 8080; // Puerto por defecto si el Dockerfile no tiene EXPOSE
}