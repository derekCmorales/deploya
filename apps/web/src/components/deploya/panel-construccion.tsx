'use client';

import { useState } from 'react';

interface PanelConstruccionProps {
  proyectoId: string;
  urlRepo: string;
}

export default function PanelConstruccion({ proyectoId, urlRepo }: PanelConstruccionProps) {
  const [construccionId, setConstruccionId] = useState<string | null>(null);
  const [estado, setEstado] = useState<string>('INACTIVO');
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const iniciarDespliegue = async () => {
    try {
      setLoading(true);
      setLogs('Enviando solicitud de despliegue...\n');

      const res = await fetch('http://localhost:3001/construcciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proyectoId, urlRepo, rama: 'main' }),
      });

      const data = await res.json();
      if (res.ok) {
        setConstruccionId(data.construccionId);
        setEstado(data.estado);
        // Iniciamos sondeo de logs
        consultarEstado(data.construccionId);
      } else {
        setLogs((prev) => prev + `Error: ${data.message}\n`);
      }
    } catch (error: any) {
      setLogs((prev) => prev + `Error de red: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  const consultarEstado = (id: string) => {
    const intervalo = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3001/construcciones/${id}`);
        const data = await res.json();
        if (res.ok) {
          setEstado(data.estado);
          setLogs(data.logs);

          // Si ya terminó (exitoso o fallido), detenemos el sondeo
          if (data.estado === 'EXITOSO' || data.estado === 'FALLIDO') {
            clearInterval(intervalo);
          }
        }
      } catch (e) {
        console.error('Error al consultar estado', e);
      }
    }, 2000); // Consulta cada 2 segundos
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl shadow-lg max-w-2xl mx-auto mt-6">
      <h2 className="text-xl font-bold mb-4">Motor de Despliegue y Construcción</h2>
      
      <div className="mb-4 flex items-center justify-between">
        <div>
          <span className="text-sm text-slate-400">Estado actual: </span>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            estado === 'EXITOSO' ? 'bg-green-600' :
            estado === 'FALLIDO' ? 'bg-red-600' :
            estado === 'INACTIVO' ? 'bg-slate-700' : 'bg-yellow-600 animate-pulse'
          }`}>
            {estado}
          </span>
        </div>

        <button
          onClick={iniciarDespliegue}
          disabled={loading || estado === 'CLONANDO' || estado === 'CONSTRUYENDO'}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded font-medium transition-colors"
        >
          {loading ? 'Iniciando...' : 'Iniciar Despliegue'}
        </button>
      </div>

      <div className="mt-4">
        <label className="text-sm text-slate-400 mb-1 block">Bitácora en Tiempo Real (Logs):</label>
        <pre className="w-full h-64 bg-black p-4 rounded text-green-400 font-mono text-xs overflow-y-auto whitespace-pre-wrap border border-slate-800">
          {logs || 'Esperando para iniciar la compilación...'}
        </pre>
      </div>
    </div>
  );
}