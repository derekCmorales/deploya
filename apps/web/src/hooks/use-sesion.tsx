"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { cerrarSesion, leerSesion, type UsuarioSesion } from "@/lib/api-identidad";
import { EVENTO_SIN_SESION } from "@/lib/sesion-expirada";

export type EstadoSesion = "cargando" | "con-sesion" | "sin-sesion" | "sin-conexion";

interface ContextoSesion {
  estado: EstadoSesion;
  usuario: UsuarioSesion | null;
  /** Había usuario y la cookie dejó de valer sin pulsar «Salir»: la sesión venció (pantalla 28). */
  expirada: boolean;
  /** Vuelve a leer la cookie (tras iniciar sesión). */
  recargar: () => Promise<void>;
  salir: () => Promise<void>;
}

const Sesion = createContext<ContextoSesion | null>(null);

/** Una sola lectura de `GET /identidad/sesion` para el header y las rutas protegidas. */
export function SesionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSesion>("cargando");
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [expirada, setExpirada] = useState(false);
  const habiaUsuario = useRef(false);

  const recargar = useCallback(async () => {
    try {
      const leido = await leerSesion();
      // Varias pantallas pueden avisar el mismo 401: una vez vencida, sigue así hasta entrar o «Salir».
      if (leido) setExpirada(false);
      else if (habiaUsuario.current) setExpirada(true);
      habiaUsuario.current = !!leido;
      setUsuario(leido);
      setEstado(leido ? "con-sesion" : "sin-sesion");
    } catch {
      setUsuario(null);
      setEstado("sin-conexion");
    }
  }, []);

  const salir = useCallback(async () => {
    await cerrarSesion();
    habiaUsuario.current = false;
    setExpirada(false);
    setUsuario(null);
    setEstado("sin-sesion");
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  useEffect(() => {
    const revisar = () => void recargar();
    window.addEventListener(EVENTO_SIN_SESION, revisar);
    return () => window.removeEventListener(EVENTO_SIN_SESION, revisar);
  }, [recargar]);

  const valor = useMemo(() => ({ estado, usuario, expirada, recargar, salir }), [estado, usuario, expirada, recargar, salir]);
  return <Sesion.Provider value={valor}>{children}</Sesion.Provider>;
}

export function useSesion(): ContextoSesion {
  const contexto = useContext(Sesion);
  if (!contexto) throw new Error("useSesion necesita <SesionProvider>");
  return contexto;
}
