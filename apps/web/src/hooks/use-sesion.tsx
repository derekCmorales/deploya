"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { cerrarSesion, leerSesion, type UsuarioSesion } from "@/lib/api-identidad";

export type EstadoSesion = "cargando" | "con-sesion" | "sin-sesion" | "sin-conexion";

interface ContextoSesion {
  estado: EstadoSesion;
  usuario: UsuarioSesion | null;
  /** Vuelve a leer la cookie (tras iniciar sesión). */
  recargar: () => Promise<void>;
  salir: () => Promise<void>;
}

const Sesion = createContext<ContextoSesion | null>(null);

/** Una sola lectura de `GET /identidad/sesion` para el header y las rutas protegidas. */
export function SesionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSesion>("cargando");
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);

  const recargar = useCallback(async () => {
    try {
      const leido = await leerSesion();
      setUsuario(leido);
      setEstado(leido ? "con-sesion" : "sin-sesion");
    } catch {
      setUsuario(null);
      setEstado("sin-conexion");
    }
  }, []);

  const salir = useCallback(async () => {
    await cerrarSesion();
    setUsuario(null);
    setEstado("sin-sesion");
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const valor = useMemo(() => ({ estado, usuario, recargar, salir }), [estado, usuario, recargar, salir]);
  return <Sesion.Provider value={valor}>{children}</Sesion.Provider>;
}

export function useSesion(): ContextoSesion {
  const contexto = useContext(Sesion);
  if (!contexto) throw new Error("useSesion necesita <SesionProvider>");
  return contexto;
}
