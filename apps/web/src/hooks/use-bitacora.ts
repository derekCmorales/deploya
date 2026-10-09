import { useState, useCallback } from 'react';
import { useSondeo } from './use-sondeo';
import { fusionarLineas, LineaBitacora, calcularSiguientePasoSondeo } from '../lib/despliegues';
import { pedirApi } from '../lib/api';

interface RespuestaBitacora {
  lineas: LineaBitacora[];
  siguiente: number;
  terminado: boolean;
}

export function useBitacora(id: string) {
  const [lineas, setLineas] = useState<LineaBitacora[]>([]);
  const [terminado, setTerminado] = useState(false);
  const [desde, setDesde] = useState(0);

  const obtenerSiguienteBloque = useCallback(async () => {
    if (terminado || !id) return;
    try {
      const data = await pedirApi<RespuestaBitacora>(
        `/despliegues/${id}/bitacora?desde=${desde}`
      );
      if (data && data.lineas) {
        setLineas((prev) => fusionarLineas(prev, data.lineas));
      }
      const siguientePaso = calcularSiguientePasoSondeo(data, desde);
      setTerminado(siguientePaso.terminado);
      setDesde(siguientePaso.siguienteDesde);
    } catch {
      // Manejo de error de sondeo
    }
  }, [id, desde, terminado]);

  useSondeo(obtenerSiguienteBloque, () => terminado);

  return { lineas, terminado };
}