"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function NuevoProyectoPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [rama, setRama] = useState("main");
  const [nombre, setNombre] = useState("");
  const [puerto, setPuerto] = useState<number>(8080);

  const [validando, setValidando] = useState(false);
  const [datosValidacion, setDatosValidacion] = useState<any>(null);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [errorCreacion, setErrorCreacion] = useState<string | null>(null);

  const handleValidar = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidando(true);
    setErrorValidacion(null);
    setDatosValidacion(null);

    try {
      const res = await fetch("http://localhost:3001/proyectos/validar-repositorio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, rama }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.mensaje || "Error al validar el repositorio");
      }

      setDatosValidacion(data);
      if (data.puerto) {
        setPuerto(data.puerto);
      }
    } catch (err: any) {
      setErrorValidacion(err.message);
    } finally {
      setValidando(false);
    }
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    setErrorCreacion(null);

    try {
      const res = await fetch("http://localhost:3001/proyectos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-usuario-id": "u1",
        },
        body: JSON.stringify({ url, rama, nombre, puerto }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.mensaje || "Error al crear el proyecto");
      }

      router.push("/proyectos");
    } catch (err: any) {
      setErrorCreacion(err.message);
      setCreando(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Nuevo Proyecto</h1>
        <p className="text-sm text-muted-foreground">
          Conecta un repositorio público de GitHub para desplegar tu aplicación.
        </p>
      </div>

      <form onSubmit={handleValidar} className="space-y-4 border p-5 rounded-lg bg-card">
        <h2 className="font-semibold text-base">1. Validar Repositorio</h2>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">URL del Repositorio GitHub</label>
          <input
            type="text"
            placeholder="https://github.com/usuario/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rama</label>
            <input
              type="text"
              value={rama}
              onChange={(e) => setRama(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={validando}
              className="w-full bg-secondary text-secondary-foreground font-medium py-2 rounded-md text-sm hover:opacity-90 transition disabled:opacity-50"
            >
              {validando ? "Validando..." : "Validar"}
            </button>
          </div>
        </div>

        {errorValidacion && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {errorValidacion}
          </div>
        )}

        {datosValidacion && (
          <div className="p-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm rounded-md space-y-1">
            <p className="font-semibold">¡Repositorio accesible!</p>
            <p className="text-xs">Commit: {datosValidacion.commit?.mensaje} ({datosValidacion.commit?.sha.substring(0, 7)})</p>
            <p className="text-xs">Puerto detectado: {datosValidacion.puerto}</p>
          </div>
        )}
      </form>

      {datosValidacion && (
        <form onSubmit={handleCrear} className="space-y-4 border p-5 rounded-lg bg-card">
          <h2 className="font-semibold text-base">2. Configurar Alta</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre del Proyecto</label>
            <input
              type="text"
              placeholder="Mi Aplicación Web"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Puerto Interno</label>
            <input
              type="number"
              value={puerto}
              onChange={(e) => setPuerto(Number(e.target.value))}
              required
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            />
          </div>

          {errorCreacion && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {errorCreacion}
            </div>
          )}

          <button
            type="submit"
            disabled={creando}
            className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-md text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            {creando ? "Creando y desplegando..." : "Desplegar Proyecto"}
          </button>
        </form>
      )}
    </div>
  );
}