export function puertoDesdeExpose(dockerfile: string): number | null {
  const lineas = dockerfile.split(/\r?\n/);
  for (const linea of lineas) {
    const lineaLimpia = linea.trim();
    if (lineaLimpia.startsWith("#")) {
      continue;
    }
    const match = lineaLimpia.match(/^EXPOSE\s+(.+)$/i);
    if (match) {
      const tokens = match[1].trim().split(/\s+/);
      for (const token of tokens) {
        const puertoLimpio = token.split("/")[0];
        const puertoNum = Number(puertoLimpio);
        if (!Number.isNaN(puertoNum) && puertoNum > 0 && puertoNum <= 65535) {
          return puertoNum;
        }
      }
    }
  }
  return null;
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/main
