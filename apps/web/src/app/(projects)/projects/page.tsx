"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Proyecto {
  id: string;
  nombre: string;
  subdominio: string;
  urlRepositorio: string;
  rama: string;
  puertoInterno: number;
  ultimoDespliegue?: {
    estado: string;
    actualizado: string;
  } | null;
}

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [usados, setUsados] = useState(0);
  const [maximo, setMaximo] = useState(5);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:3001/proyectos", {
      headers: {
        // Simulación de cabecera de identidad / usuario solicitante si aplica
        "x-usuario-id": "u1",
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("No se pudo cargar la lista de proyectos");
        return res.json();
      })
      .then((data) => {
        setProyectos(data.proyectos || []);
        setUsados(data.usados || 0);
        setMaximo(data.maximo || 5);
        setCargando(false);
      })
      .catch((err) => {
        setError(err.message);
        setCargando(false);
      });
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus despliegues y contenedores en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium bg-secondary px-3 py-1.5 rounded-md">
            Cuota: <span className="font-bold">{usados}</span> / {maximo} usados
          </div>
          <Link
            href="/proyectos/nuevo"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 transition"
          >
            + Nuevo Proyecto
          </Link>
        </div>
      </div>

      {cargando && <p className="text-sm text-muted-foreground">Cargando proyectos...</p>}
      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}

      {!cargando && !error && proyectos.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg space-y-3">
          <p className="text-muted-foreground text-sm">No tienes ningún proyecto registrado todavía.</p>
          <Link
            href="/proyectos/nuevo"
            className="inline-block text-primary font-medium text-sm hover:underline"
          >
            Crea tu primer proyecto &rarr;
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {proyectos.map((p) => (
          <div key={p.id} className="border rounded-lg p-5 space-y-3 bg-card shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{p.nombre}</h3>
                <a
                  href={`http://${p.subdominio}.deploya.local`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  {p.subdominio}.deploya.local
                </a>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-secondary text-secondary-foreground">
                {p.ultimoDespliegue?.estado || "pendiente"}
              </span>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Repo: <span className="font-mono">{p.urlRepositorio}</span> (rama: {p.rama})</p>
              <p>Puerto interno: {p.puertoInterno}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}