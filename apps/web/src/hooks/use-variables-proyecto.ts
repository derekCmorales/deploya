"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useSondeo } from "@/hooks/use-sondeo";
import { ErrorApi, pedirApi } from "@/lib/api";
import { rutaDespliegue } from "@/lib/despliegues";
import {
  contarCambios,
  cuerpoVariables,
  errorClave,
  filasDesdeGuardadas,
  type FilaVariable,
  type VariableGuardada,
} from "@/lib/variables";

interface RespuestaGuardado {
  variables: VariableGuardada[];
  despliegue: { id: string; numero: number; estado: string } | null;
}

const unaVez = () => false;

/** Pantalla 17: borrador local, Mostrar y PUT del conjunto. */
export function useVariablesProyecto(proyectoId: string) {
  const router = useRouter();
  const leer = useMemo(() => () => pedirApi<VariableGuardada[]>(`/proyectos/${proyectoId}/variables`), [proyectoId]);
  const sondeo = useSondeo(leer, unaVez);
  const [borrador, setBorrador] = useState<FilaVariable[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const base = sondeo.datos ?? [];
  const filas = borrador ?? filasDesdeGuardadas(base);
  const cambios = contarCambios(base.map((variable) => variable.clave), filas);

  const actualizar = (indice: number, cambio: Partial<FilaVariable>) => {
    setBorrador((previo) => {
      const origen = previo ?? filasDesdeGuardadas(base);
      return origen.map((fila, i) => (i === indice ? { ...fila, ...cambio } : fila));
    });
  };

  const guardar = async (desplegar: boolean) => {
    const invalida = filas.map((fila) => errorClave(fila.clave)).find((mensaje) => mensaje);
    if (invalida) {
      setCodigo(null);
      return setError(invalida);
    }
    setOcupado(true);
    setError(null);
    setCodigo(null);
    try {
      const respuesta = await pedirApi<RespuestaGuardado>(`/proyectos/${proyectoId}/variables`, {
        metodo: "PUT",
        cuerpo: { variables: cuerpoVariables(filas), desplegar },
      });
      setBorrador(null);
      sondeo.recargar();
      if (respuesta.despliegue) router.push(rutaDespliegue(proyectoId, respuesta.despliegue.numero));
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos guardar las variables.");
      setCodigo(e instanceof ErrorApi ? e.codigo : null);
    } finally {
      setOcupado(false);
    }
  };

  const mostrar = async (indice: number) => {
    const fila = filas[indice];
    if (!fila || fila.nueva) return;
    if (fila.valor !== undefined) return actualizar(indice, { oculta: !fila.oculta });
    try {
      const visible = await pedirApi<{ valor: string }>(`/proyectos/${proyectoId}/variables/${encodeURIComponent(fila.clave)}`);
      actualizar(indice, { valor: visible.valor, oculta: false });
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos mostrar el valor.");
    }
  };

  return {
    filas,
    cambios,
    error: error ?? sondeo.error?.message ?? null,
    codigo,
    cargando: sondeo.cargando,
    ocupado,
    guardadas: base,
    descartar: () => setBorrador(filasDesdeGuardadas(base)),
    guardar: () => guardar(false),
    guardarYDesplegar: () => guardar(true),
    mostrar,
    anadir: () => setBorrador([...filas, { clave: "", valor: "", editada: false, nueva: true }]),
    editar: (indice: number, cambio: Partial<FilaVariable>) => actualizar(indice, { ...cambio, editada: true, oculta: false }),
  };
}
