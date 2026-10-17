"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useProyectos } from "@/hooks/use-proyectos";
import { DOMINIO_APPS, ESQUEMA_APPS, ErrorApi, pedirApi } from "@/lib/api";
import {
  EVENTO_PROYECTO_ACTUALIZADO,
  borradorDe,
  cambiosDe,
  erroresDeBorrador,
  errorDeGuardado,
  hayCambios,
  type BorradorProyecto,
  type CampoConfiguracion,
  type DatosProyecto,
} from "@/lib/configuracion";
import { urlProyecto } from "@/lib/proyectos";

import { EliminarProyecto, type ConteosProyecto } from "./eliminar-proyecto";

type ErroresCampo = Partial<Record<CampoConfiguracion, string>>;

/** Pantalla 19: General, Fuente y Contenedor con borrador local; «Zona de peligro» abre 19b. */
export function PanelConfiguracion({ proyectoId }: { proyectoId: string }) {
  const { datos, error, cargando } = useProyectos({ sondear: false });
  const proyecto = datos?.proyectos.find((p) => p.id === proyectoId) ?? null;
  const conteos = useConteos(proyectoId);

  if (error && !datos) return <Banner variant="bad" title="No pudimos cargar el proyecto">{error.message}</Banner>;
  if (cargando || !datos) return <Cargando />;
  if (!proyecto) return <Banner variant="bad" title="No encontramos este proyecto">Puede que ya no exista.</Banner>;
  return (
    <div className="flex max-w-3xl flex-col gap-8 px-8 py-6">
      <Formulario key={proyecto.id} proyecto={proyecto} />
      <EliminarConNavegacion
        proyecto={proyecto}
        url={urlProyecto(proyecto.subdominio, DOMINIO_APPS, ESQUEMA_APPS)}
        conteos={conteos}
      />
    </div>
  );
}

function EliminarConNavegacion(props: { proyecto: { id: string; nombre: string }; url: string; conteos: ConteosProyecto | null }) {
  const router = useRouter();
  return <EliminarProyecto {...props} onEliminado={() => router.push("/projects")} />;
}

function Formulario({ proyecto }: { proyecto: DatosProyecto & { id: string } }) {
  const [original, setOriginal] = useState(() => borradorDe(proyecto));
  const [borrador, setBorrador] = useState<BorradorProyecto>(original);
  const [errores, setErrores] = useState<ErroresCampo>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const cambios = useMemo(() => cambiosDe(original, borrador), [original, borrador]);

  const editar = (campo: CampoConfiguracion, valor: string) => {
    setBorrador((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
    setAviso(null);
    setGuardado(false);
  };

  const descartar = () => {
    setBorrador(original);
    setErrores({});
    setAviso(null);
  };

  const guardar = async () => {
    const locales = erroresDeBorrador(borrador);
    if (Object.keys(locales).length > 0) return setErrores(locales);
    setOcupado(true);
    setAviso(null);
    try {
      const actualizado = await pedirApi<DatosProyecto>(`/proyectos/${proyecto.id}`, { metodo: "PATCH", cuerpo: cambios });
      const nuevo = borradorDe(actualizado);
      setOriginal(nuevo);
      setBorrador(nuevo);
      setGuardado(true);
      window.dispatchEvent(new Event(EVENTO_PROYECTO_ACTUALIZADO));
    } catch (e) {
      const { campo, mensaje } = e instanceof ErrorApi ? errorDeGuardado(e.codigo, e.message) : errorDeGuardado("", "No pudimos guardar los cambios.");
      if (campo) setErrores({ [campo]: mensaje });
      else setAviso(mensaje);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={(evento) => {
        evento.preventDefault();
        void guardar();
      }}
    >
      <Seccion titulo="General" descripcion="Cambiar el nombre no cambia el subdominio.">
        <Campo id="nombre" etiqueta="Nombre del proyecto" valor={borrador.nombre} error={errores.nombre} alCambiar={(v) => editar("nombre", v)} />
      </Seccion>
      <Seccion titulo="Fuente" descripcion="De dónde traemos el código en cada despliegue.">
        <Campo id="urlRepositorio" etiqueta="Repositorio" valor={borrador.urlRepositorio} error={errores.urlRepositorio} alCambiar={(v) => editar("urlRepositorio", v)} mono />
        <Campo id="rama" etiqueta="Rama" valor={borrador.rama} error={errores.rama} alCambiar={(v) => editar("rama", v)} mono />
      </Seccion>
      <Seccion titulo="Contenedor" descripcion="Se construye con el Dockerfile de tu repositorio.">
        <Campo id="rutaDockerfile" etiqueta="Ruta del Dockerfile" valor={borrador.rutaDockerfile} error={errores.rutaDockerfile} alCambiar={(v) => editar("rutaDockerfile", v)} mono />
        <Campo id="puertoInterno" etiqueta="Puerto interno" valor={borrador.puertoInterno} error={errores.puertoInterno} alCambiar={(v) => editar("puertoInterno", v)} mono />
      </Seccion>
      {aviso ? <Banner variant="bad" title="No pudimos guardar los cambios">{aviso}</Banner> : null}
      {guardado ? <Banner variant="muted" title="Cambios guardados">Aplican en el próximo despliegue.</Banner> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">Los cambios aplican en el próximo despliegue.</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={ocupado || !hayCambios(cambios)} onClick={descartar}>
            Descartar
          </Button>
          <Button type="submit" disabled={ocupado || !hayCambios(cambios)}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </form>
  );
}

function Seccion({ titulo, descripcion, children }: { titulo: string; descripcion: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">{titulo}</h3>
        <p className="text-xs text-muted-foreground">{descripcion}</p>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Campo({
  id,
  etiqueta,
  valor,
  error,
  alCambiar,
  mono,
}: {
  id: CampoConfiguracion;
  etiqueta: string;
  valor: string;
  error?: string;
  alCambiar: (valor: string) => void;
  mono?: boolean;
}) {
  return (
    <Field id={id} label={etiqueta} error={error}>
      <Input
        id={id}
        value={valor}
        className={mono ? "font-mono" : undefined}
        onChange={(e) => alCambiar(e.target.value)}
        autoComplete="off"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-msg` : undefined}
      />
    </Field>
  );
}

/** Variables y despliegues reales del proyecto, para el diálogo 19b. Sin ellos el diálogo no inventa números. */
function useConteos(proyectoId: string): ConteosProyecto | null {
  const [conteos, setConteos] = useState<ConteosProyecto | null>(null);
  useEffect(() => {
    let vigente = true;
    const leer = async () => {
      try {
        const [variables, resumen] = await Promise.all([
          pedirApi<unknown[]>(`/proyectos/${proyectoId}/variables`),
          pedirApi<{ ultimo: { numero: number } | null }>(`/proyectos/${proyectoId}/resumen`),
        ]);
        if (vigente) setConteos({ variables: variables.length, despliegues: resumen.ultimo?.numero ?? 0 });
      } catch {
        if (vigente) setConteos(null);
      }
    };
    void leer();
    return () => {
      vigente = false;
    };
  }, [proyectoId]);
  return conteos;
}

function Cargando() {
  return (
    <div className="flex max-w-3xl flex-col gap-4 px-8 py-6" aria-busy="true" aria-label="Cargando configuración">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
