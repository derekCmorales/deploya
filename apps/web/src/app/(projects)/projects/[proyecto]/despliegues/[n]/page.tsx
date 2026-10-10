'use client';

import React, { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { pedirApi } from '../../../../../../lib/api';
import { VistaDespliegue, lineaDeError, textoParaCopiar, tiempoTranscurrido, avisoVersionAnterior } from '../../../../../../lib/despliegues';
import { useDespliegue } from '../../../../../../hooks/use-despliegue';
import { useBitacora } from '../../../../../../hooks/use-bitacora';
import { RielEtapas } from '../../../../../../components/deploya/riel-etapas';
import { Bitacora } from '../../../../../../components/deploya/bitacora';
import { EstadoDespliegue } from '../../../../../../components/deploya/estado-despliegue';
import { PuntoVivo } from '../../../../../../components/deploya/punto-vivo';

export default function DesplieguePage() {
  const params = useParams();
  const proyectoId = params.proyecto as string;
  const numeroStr = params.n as string;
  const numero = parseInt(numeroStr, 10);

  const [despliegueInicial, setDespliegueInicial] = useState<VistaDespliegue | null>(null);
  const [error404, setError404] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [ahora, setAhora] = useState<string>(new Date().toISOString());

  // Actualizar reloj local cada segundo para el tiempo transcurrido
  useEffect(() => {
    const timer = setInterval(() => {
      setAhora(new Date().toISOString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isNaN(numero)) {
      setError404(true);
      return;
    }
    pedirApi<VistaDespliegue>(`/proyectos/${proyectoId}/despliegues/${numero}`)
      .then((data) => {
        if (!data) setError404(true);
        else setDespliegueInicial(data);
      })
      .catch(() => setError404(true));
  }, [proyectoId, numero]);

  const idDespliegue = despliegueInicial?.id;
  const despliegueActual = useDespliegue(idDespliegue ?? '');
  const despliegue = (despliegueActual as unknown as VistaDespliegue) || despliegueInicial;

  const { lineas, terminado } = useBitacora(idDespliegue ?? '');

  if (error404) {
    notFound();
  }

  if (!despliegue) {
    return <div className="p-8 text-center text-muted-foreground">Cargando despliegue...</div>;
  }

  const estado = despliegue.estado;
  const esEnCurso = estado === 'construyendo' || estado === 'encolado';
  const esSaludable = estado === 'saludable';
  const esFallido = estado === 'fallido';

  const errLinea = lineaDeError(lineas);
  const avisoAnt = avisoVersionAnterior(numero > 1 ? numero - 1 : undefined);

  const handleCopiar = () => {
    const texto = textoParaCopiar(lineas);
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera común de la vista de despliegue */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">api-tienda - versión #{despliegue.numero}</h2>
            <EstadoDespliegue estado={estado} />
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
            <span>Branch: main</span>
            <span>•</span>
            <span>Disparador: {despliegue.disparador || 'manual'}</span>
          </div>
        </div>
        {esEnCurso && <PuntoVivo />}
        {esSaludable && (
          <a
            href={`https://${proyectoId}.deploya.app`}
            target="_blank"
            rel="noreferrer"
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Visitar
          </a>
        )}
      </div>

      {/* Riel de etapas */}
      <div className="rounded-lg border border-border bg-card p-6">
        <RielEtapas
            size="lg"
            saludable={esSaludable}
            etapas={[
                'completada',
                esEnCurso ? 'en-curso' : esFallido ? 'fallida' : esSaludable ? 'completada' : 'pendiente',
                'pendiente',
                'pendiente',
                'pendiente',
            ]}
        />
        </div>
      

      {/* Estados específicos: Fallido (12c) */}
      {esFallido && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="font-semibold">La construcción terminó con código {despliegue.codigoSalida || 127}</p>
          <p className="text-sm">Motivo: {despliegue.motivoFallo || 'Error desconocido'}</p>
          {avisoAnt && <p className="mt-2 text-sm text-foreground">{avisoAnt}</p>}
        </div>
      )}

      {/* Estados específicos: Saludable (12b) */}
      {esSaludable && (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          <p>Imagen: {despliegue.imagen || 'sha256:9f2e...'}</p>
          <p>Recursos aplicados: {despliegue.recursos || '0.5 CPU - 512 MB'}</p>
          {avisoAnt && <p className="mt-1 text-foreground">{avisoAnt}</p>}
        </div>
      )}

      {/* Bitácora */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Bitácora de construcción ({lineas.length} líneas)</h3>
          <button
            onClick={handleCopiar}
            className="rounded border border-border px-3 py-1 text-xs font-medium hover:bg-accent"
          >
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <Bitacora lineas={lineas} />
      </div>
    </div>
  );
}