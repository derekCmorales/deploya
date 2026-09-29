'use client';

import { useState } from 'react';

export default function ProjectsPage() {
  const [nombre, setNombre] = useState('');
  const [url, setUrl] = useState('');
  const [rama, setRama] = useState('main');
  const [cargando, setCargando] = useState(false);
  const [respuestaExito, setRespuestaExito] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    setRespuestaExito(null);

    try {
      // Petición hacia tu backend de NestJS (ajusta el puerto si tu API corre en otro diferente, ej. 3000 o 4000)
      const res = await fetch('http://localhost:3000/proyectos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre,
          url,
          rama,
          usuarioId: 'eduardo-dev-id', // ID simulado para pruebas de desarrollo
        }),
      });

      if (!res.ok) {
        throw new Error('No se pudo crear el proyecto. Revisa la URL o el Dockerfile.');
      }

      const data = await res.json();
      setRespuestaExito(data);
      setNombre('');
      setUrl('');
      setRama('main');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-2">Gestión de Proyectos (M3)</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Registra un repositorio público de GitHub para iniciar su alta y despliegue automático.
      </p>

      {/* Formulario de Alta */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-lg border shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre del Proyecto</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="ej. Mi App Web"
            required
            className="w-full px-3 py-2 border rounded-md text-sm bg-background"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">URL del Repositorio de GitHub</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/usuario/repositorio"
            required
            className="w-full px-3 py-2 border rounded-md text-sm bg-background"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rama (Branch)</label>
          <input
            type="text"
            value={rama}
            onChange={(e) => setRama(e.target.value)}
            placeholder="main"
            required
            className="w-full px-3 py-2 border rounded-md text-sm bg-background"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full py-2 px-4 bg-primary text-primary-foreground font-medium rounded-md hover:opacity-90 transition disabled:opacity-50 text-sm"
        >
          {cargando ? 'Validando y creando proyecto...' : 'Crear y Desplegar Proyecto'}
        </button>
      </form>

      {/* Mensajes de Éxito o Error */}
      {error && (
        <div className="mt-4 p-4 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      {respuestaExito && (
        <div className="mt-4 p-4 bg-emerald-500/10 text-emerald-600 text-sm rounded-md border border-emerald-500/20">
          <p className="font-semibold">¡Proyecto creado y encolado con éxito!</p>
          <pre className="mt-2 text-xs bg-background p-2 rounded overflow-x-auto text-foreground">
            {JSON.stringify(respuestaExito, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}