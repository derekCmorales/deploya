"use client";

import { useState } from "react";

import { cuerpoAlta, errorComando, pasoAnterior, pasoDeError, pasoSiguiente, type PasoAlta } from "@/lib/alta";
import { ErrorApi, pedirApi } from "@/lib/api";
import { alternarTipo, type TipoRecurso } from "@/lib/datos";
import {
  errorDeAlta,
  nombreSugerido,
  puertoValido,
  RUTA_DOCKERFILE,
  subdominioDesdeNombre,
  type ErrorAlta,
  type ValidacionRepositorio,
} from "@/lib/proyectos";
import {
  combinarVariables,
  errorClave,
  filaNueva,
  quitarFila,
  variablesDeBorrador,
  type FilaAlta,
  type FilaVariable,
} from "@/lib/variables";

export type { PasoAlta } from "@/lib/alta";

interface ProyectoCreado {
  proyecto: { id: string };
  despliegue: { id: string; numero: number; estado: string };
}

const RAMA_INICIAL = "main";

/**
 * Estado del asistente «Nuevo proyecto» en cinco pasos (feat/m3-alta-guiada). El orden y a qué paso
 * vuelve cada error salen de `lib/alta`; aquí solo se guarda lo escrito y se llama a la API
 * (`POST /proyectos/validar-repositorio` y `POST /proyectos`).
 */
export function useAltaProyecto() {
  const [paso, setPaso] = useState<PasoAlta>("repositorio");
  const [url, setUrl] = useState("");
  const [rama, setRama] = useState(RAMA_INICIAL);
  const [rutaDockerfile, setRutaDockerfile] = useState(RUTA_DOCKERFILE);
  const [nombre, setNombre] = useState("");
  const [nombreEditado, setNombreEditado] = useState(false);
  const [puerto, setPuerto] = useState("");
  const [comandoInicio, setComandoInicio] = useState("");
  const [comandoConstruccion, setComandoConstruccion] = useState("");
  const [datos, setDatos] = useState<TipoRecurso[]>([]);
  const [variables, setVariables] = useState<FilaVariable[]>([filaNueva()]);
  const [validacion, setValidacion] = useState<ValidacionRepositorio | null>(null);
  const [error, setError] = useState<ErrorAlta | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const aplicaComandoConstruccion = validacion?.deteccion?.aplicaComandoConstruccion === true;

  const invalidar = () => {
    setValidacion(null);
    setError(null);
  };

  const validar = async () => {
    if (!url.trim()) return setError({ tipo: "campo", campo: "url", mensaje: "Pega la URL del repositorio." });
    setOcupado(true);
    setError(null);
    try {
      const v = await pedirApi<ValidacionRepositorio>("/proyectos/validar-repositorio", { metodo: "POST", cuerpo: { url, rama, rutaDockerfile } });
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

  const errorDelPaso = (): ErrorAlta | null => {
    if (paso === "repositorio") return errorRepositorio(nombre, puerto);
    if (paso === "construccion") return errorConstruccion(comandoInicio, aplicaComandoConstruccion ? comandoConstruccion : "");
    if (paso === "variables") {
      const clave = variables.map((fila) => errorClave(fila.clave)).find((mensaje) => mensaje);
      return clave ? { tipo: "variables", mensaje: clave } : null;
    }
    return null;
  };

  const continuar = async () => {
    if (paso === "repositorio" && !validacion) return validar();
    const local = errorDelPaso();
    if (local) return setError(local);
    setError(null);
    setPaso(pasoSiguiente(paso));
  };

  /** Devuelve el proyecto y el número del despliegue, o `null` si la API lo rechazó. */
  const desplegar = async (): Promise<{ id: string; numero: number } | null> => {
    if (!validacion) return null;
    setOcupado(true);
    try {
      const creado = await pedirApi<ProyectoCreado>("/proyectos", {
        metodo: "POST",
        cuerpo: cuerpoAlta({
          url: validacion.urlNormalizada,
          rama,
          rutaDockerfile,
          nombre,
          puerto,
          comandoInicio,
          comandoConstruccion,
          aplicaComandoConstruccion,
          datos,
          variables: variablesDeBorrador(variables),
        }),
      });
      return { id: creado.proyecto.id, numero: creado.despliegue.numero };
    } catch (e) {
      const alta = errorDe(e);
      setError(alta);
      setPaso(pasoDeError(alta));
      return null;
    } finally {
      setOcupado(false);
    }
  };

  const cambiar = (setter: (valor: string) => void) => (valor: string) => {
    setter(valor);
    setError(null);
  };

  const editarVariables = (cambio: (filas: FilaVariable[]) => FilaVariable[]) => {
    setVariables(cambio);
    setError(null);
  };

  return {
    paso,
    url,
    rama,
    rutaDockerfile,
    nombre,
    puerto,
    comandoInicio,
    comandoConstruccion,
    aplicaComandoConstruccion,
    datos,
    variables,
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
    cambiarRutaDockerfile: (valor: string) => {
      setRutaDockerfile(valor);
      invalidar();
    },
    cambiarNombre: (valor: string) => {
      setNombre(valor);
      setNombreEditado(true);
      setError(null);
    },
    cambiarPuerto: cambiar(setPuerto),
    cambiarComandoInicio: cambiar(setComandoInicio),
    cambiarComandoConstruccion: cambiar(setComandoConstruccion),
    alternarDato: (tipo: TipoRecurso) => {
      setDatos((actuales) => alternarTipo(actuales, tipo));
      setError(null);
    },
    validar,
    continuar,
    desplegar,
    anadirVariable: () => editarVariables((filas) => [...filas, filaNueva()]),
    editarVariable: (indice: number, cambio: Partial<FilaVariable>) =>
      editarVariables((filas) => filas.map((fila, i) => (i === indice ? { ...fila, ...cambio } : fila))),
    quitarVariable: (indice: number) => editarVariables((filas) => quitarFila(filas, indice, true)),
    alternarValor: (indice: number) =>
      editarVariables((filas) => filas.map((fila, i) => (i === indice ? { ...fila, oculta: !fila.oculta } : fila))),
    pegarVariables: (pegadas: readonly FilaAlta[]) => editarVariables((filas) => combinarVariables(filas, pegadas)),
    irA: (destino: PasoAlta) => {
      setError(null);
      setPaso(destino);
    },
    volver: () => {
      setError(null);
      setPaso(pasoAnterior(paso));
    },
  };
}

function errorRepositorio(nombre: string, puerto: string): ErrorAlta | null {
  if (!subdominioDesdeNombre(nombre)) return { tipo: "campo", campo: "nombre", mensaje: "El nombre necesita al menos una letra o un número." };
  if (!puertoValido(puerto)) return { tipo: "campo", campo: "puerto", mensaje: "Usa un puerto entre 1 y 65535." };
  return null;
}

function errorConstruccion(comandoInicio: string, comandoConstruccion: string): ErrorAlta | null {
  const construccion = errorComando(comandoConstruccion, "construccion");
  if (construccion) return { tipo: "campo", campo: "comandoConstruccion", mensaje: construccion };
  const inicio = errorComando(comandoInicio, "inicio");
  return inicio ? { tipo: "campo", campo: "comandoInicio", mensaje: inicio } : null;
}

function errorDe(e: unknown): ErrorAlta {
  if (e instanceof ErrorApi) return errorDeAlta(e.codigo, e.message, e.detalle);
  return { tipo: "aviso", mensaje: "Algo salió mal. Intenta de nuevo." };
}
