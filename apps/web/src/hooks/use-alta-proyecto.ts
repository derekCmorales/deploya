"use client";

import { useState } from "react";

import { ErrorApi, pedirApi } from "@/lib/api";
import {
  errorDeAlta,
  nombreSugerido,
  puertoValido,
  subdominioDesdeNombre,
  type ErrorAlta,
  type ValidacionRepositorio,
} from "@/lib/proyectos";

export type PasoAlta = "repositorio" | "revisar";

interface ProyectoCreado {
  proyecto: { id: string };
  despliegue: { id: string; numero: number; estado: string };
}

const RAMA_INICIAL = "main";

/**
 * Estado del asistente «Nuevo proyecto» (11a → 11d, errores de 11e). Valida contra
 * `POST /proyectos/validar-repositorio` y crea con `POST /proyectos`.
 */
export function useAltaProyecto() {
  const [paso, setPaso] = useState<PasoAlta>("repositorio");
  const [url, setUrl] = useState("");
  const [rama, setRama] = useState(RAMA_INICIAL);
  const [nombre, setNombre] = useState("");
  const [nombreEditado, setNombreEditado] = useState(false);
  const [puerto, setPuerto] = useState("");
  const [validacion, setValidacion] = useState<ValidacionRepositorio | null>(null);
  const [error, setError] = useState<ErrorAlta | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const invalidar = () => {
    setValidacion(null);
    setError(null);
  };

  const validar = async () => {
    if (!url.trim()) return setError({ tipo: "campo", campo: "url", mensaje: "Pega la URL del repositorio." });
    setOcupado(true);
    setError(null);
    try {
      const v = await pedirApi<ValidacionRepositorio>("/proyectos/validar-repositorio", { metodo: "POST", cuerpo: { url, rama } });
      setValidacion(v);
      setUrl(v.urlNormalizada);
      setPuerto(String(v.puerto));
      if (!nombreEditado) setNombre(nombreSugerido(v.urlNormalizada));
    } catch (e) {
      setValidacion(null);
      setError(errorDe(e));
    } finally {
      setOcupado(false);
    }
  };

  const errorLocal = (): ErrorAlta | null => {
    if (!subdominioDesdeNombre(nombre)) {
      return { tipo: "campo", campo: "nombre", mensaje: "El nombre necesita al menos una letra o un número." };
    }
    if (!puertoValido(puerto)) return { tipo: "campo", campo: "puerto", mensaje: "Usa un puerto entre 1 y 65535." };
    return null;
  };

  const continuar = async () => {
    if (!validacion) return validar();
    const local = errorLocal();
    if (local) return setError(local);
    setError(null);
    setPaso("revisar");
  };

  /** Devuelve el id del proyecto creado, o `null` si la API lo rechazó. */
  const desplegar = async (): Promise<string | null> => {
    if (!validacion) return null;
    setOcupado(true);
    try {
      const creado = await pedirApi<ProyectoCreado>("/proyectos", {
        metodo: "POST",
        cuerpo: { url: validacion.urlNormalizada, rama, nombre, puerto: Number(puerto) },
      });
      return creado.proyecto.id;
    } catch (e) {
      const alta = errorDe(e);
      setError(alta);
      if (alta.tipo !== "aviso") setPaso("repositorio");
      return null;
    } finally {
      setOcupado(false);
    }
  };

  return {
    paso,
    url,
    rama,
    nombre,
    puerto,
    validacion,
    error,
    ocupado,
    subdominio: subdominioDesdeNombre(nombre),
    cambiarUrl: (valor: string) => {
      setUrl(valor);
      invalidar();
    },
    cambiarRama: (valor: string) => {
      setRama(valor);
      invalidar();
    },
    cambiarNombre: (valor: string) => {
      setNombre(valor);
      setNombreEditado(true);
      setError(null);
    },
    cambiarPuerto: (valor: string) => {
      setPuerto(valor);
      setError(null);
    },
    validar,
    continuar,
    desplegar,
    volver: () => setPaso("repositorio"),
  };
}

function errorDe(e: unknown): ErrorAlta {
  if (e instanceof ErrorApi) return errorDeAlta(e.codigo, e.message, e.detalle);
  return { tipo: "aviso", mensaje: "Algo salió mal. Intenta de nuevo." };
}
