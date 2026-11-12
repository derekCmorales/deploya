"use client";

import { useCallback, useMemo, useState } from "react";

import { useSondeo } from "@/hooks/use-sondeo";
import { ErrorApi, pedirApi } from "@/lib/api";
import {
  clienteDatos,
  errorDeDatos,
  hayRecursoCreando,
  type ConexionRecurso,
  type ErrorDatos,
  type ListaRecursosDatos,
  type TipoRecurso,
} from "@/lib/datos";

const cliente = clienteDatos(pedirApi);

function errorDe(e: unknown): ErrorDatos {
  if (e instanceof ErrorApi) return errorDeDatos(e.codigo, e.message);
  return errorDeDatos("", "Algo salió mal. Intenta de nuevo.");
}

/**
 * Pestaña Datos (18): `GET /proyectos/:id/datos` con sondeo cada 3 s mientras algún recurso esté «Creando»,
 * y las acciones del contrato. Cada acción devuelve `true` si salió bien; si no, deja el error en `error`.
 */
export function useDatosProyecto(proyectoId: string) {
  const leer = useMemo(() => () => cliente.listar(proyectoId), [proyectoId]);
  const sondeo = useSondeo<ListaRecursosDatos>(leer, hayRecursoCreando);
  const { recargar } = sondeo;
  const [error, setError] = useState<ErrorDatos | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const ejecutar = useCallback(
    async (accion: () => Promise<unknown>): Promise<boolean> => {
      setOcupado(true);
      setError(null);
      try {
        await accion();
        recargar();
        return true;
      } catch (e) {
        setError(errorDe(e));
        return false;
      } finally {
        setOcupado(false);
      }
    },
    [recargar],
  );

  const conexion = useCallback(async (recursoId: string): Promise<ConexionRecurso> => cliente.conexion(proyectoId, recursoId), [proyectoId]);

  return {
    datos: sondeo.datos,
    errorCarga: sondeo.error,
    cargando: sondeo.cargando,
    recargar,
    error,
    limpiarError: () => setError(null),
    ocupado,
    conexion,
    crear: (tipo: TipoRecurso) => ejecutar(() => cliente.crear(proyectoId, tipo)),
    compartir: (recursoId: string, destinoId: string) => ejecutar(() => cliente.compartir(proyectoId, recursoId, destinoId)),
    dejarDeCompartir: (recursoId: string, destinoId: string) => ejecutar(() => cliente.dejarDeCompartir(proyectoId, recursoId, destinoId)),
    eliminar: (recursoId: string, tipo: TipoRecurso) => ejecutar(() => cliente.eliminar(proyectoId, recursoId, tipo)),
  };
}

export type DatosProyecto = ReturnType<typeof useDatosProyecto>;
