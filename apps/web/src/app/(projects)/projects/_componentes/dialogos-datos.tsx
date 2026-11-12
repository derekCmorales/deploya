"use client";

import { Eye, Share2, Trash2, Unlink } from "lucide-react";
import { useState } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { CopyField } from "@/components/ui/copy-field";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { DatosProyecto } from "@/hooks/use-datos-proyecto";
import { ErrorApi } from "@/lib/api";
import {
  confirmacionRecursoCoincide,
  proyectosParaCompartir,
  type ConexionRecurso,
  type ProyectoReferencia,
  type VistaRecursoDatos,
} from "@/lib/datos";

import { BotonDesplegar } from "./boton-desplegar";

export const AVISO_SIGUIENTE_DESPLIEGUE = "Las variables se aplican en el siguiente despliegue de cada proyecto conectado. Tus variables con el mismo nombre ganan.";

/** «Ver conexión»: pide los valores reales solo al abrir y los muestra para copiar. */
export function VerConexion({
  recurso,
  proyectoId,
  leer,
  desplegarBloqueado,
}: {
  recurso: VistaRecursoDatos;
  proyectoId: string;
  leer: (recursoId: string) => Promise<ConexionRecurso>;
  desplegarBloqueado: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [conexion, setConexion] = useState<ConexionRecurso | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abrir = async () => {
    setAbierto(true);
    setConexion(null);
    setError(null);
    try {
      setConexion(await leer(recurso.id));
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos leer la conexión.");
    }
  };

  const cerrar = () => {
    setAbierto(false);
    setConexion(null);
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => void abrir()} disabled={recurso.estado === "creando"}>
        <Eye />
        Ver conexión
      </Button>
      <Dialog
        open={abierto}
        onOpenChange={(valor) => (valor ? setAbierto(true) : cerrar())}
        className="w-[min(640px,calc(100vw-32px))]"
        title={`Conexión · ${recurso.nombre}`}
        description="Valores reales: no los compartas. Tu app ya los recibe como variables de entorno."
        footer={
          <>
            <Button variant="ghost" onClick={cerrar}>
              Cerrar
            </Button>
            <BotonDesplegar proyectoId={proyectoId} bloqueado={desplegarBloqueado} />
          </>
        }
      >
        <Banner variant="muted" title="Se aplican en el siguiente despliegue">
          {AVISO_SIGUIENTE_DESPLIEGUE}
        </Banner>
        {error ? <Banner variant="bad" title={error} /> : null}
        {!conexion && !error ? <Skeleton className="h-24 w-full" /> : null}
        {conexion ? (
          <dl className="flex flex-col gap-3">
            {Object.entries(conexion.variables).map(([clave, valor]) => (
              <div key={clave} className="flex flex-col gap-1">
                <dt className="font-mono text-xs text-muted-foreground">{clave}</dt>
                <dd>
                  <CopyField value={valor} label={`Copiar ${clave}`} />
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Dialog>
    </>
  );
}

/** «Compartir con otro proyecto»: solo proyectos del mismo usuario que aún no lo tienen. */
export function CompartirRecurso({
  recurso,
  proyectos,
  datos,
}: {
  recurso: VistaRecursoDatos;
  proyectos: readonly ProyectoReferencia[];
  datos: DatosProyecto;
}) {
  const [abierto, setAbierto] = useState(false);
  const [destino, setDestino] = useState("");
  const candidatos = proyectosParaCompartir(proyectos, recurso);

  const cambiarApertura = (valor: boolean) => {
    setAbierto(valor);
    setDestino("");
    datos.limpiarError();
  };

  const compartir = async () => {
    if (await datos.compartir(recurso.id, destino)) cambiarApertura(false);
  };

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => cambiarApertura(true)}>
        <Share2 />
        Compartir con otro proyecto
      </Button>
      <Dialog
        open={abierto}
        onOpenChange={cambiarApertura}
        title={`Compartir ${recurso.nombre}`}
        description="El otro proyecto se conecta a la misma base y recibe sus variables en su siguiente despliegue."
        footer={
          <>
            <Button variant="ghost" onClick={() => cambiarApertura(false)} disabled={datos.ocupado}>
              Cancelar
            </Button>
            <Button onClick={() => void compartir()} disabled={datos.ocupado || !destino}>
              <Share2 />
              Compartir
            </Button>
          </>
        }
      >
        {candidatos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes otros proyectos con los que compartirla.</p>
        ) : (
          <Field id="compartir-destino" label="Proyecto" error={datos.error && abierto ? datos.error.titulo : undefined}>
            <Select id="compartir-destino" value={destino} onChange={(e) => setDestino(e.target.value)}>
              <option value="">Elige un proyecto</option>
              {candidatos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </Dialog>
    </>
  );
}

/** Eliminar (19b aplicado a un recurso): escribir el tipo; se borran contenedor y volumen. */
export function EliminarRecurso({ recurso, datos }: { recurso: VistaRecursoDatos; datos: DatosProyecto }) {
  const [abierto, setAbierto] = useState(false);
  const [escrito, setEscrito] = useState("");

  const cambiarApertura = (valor: boolean) => {
    setAbierto(valor);
    setEscrito("");
    datos.limpiarError();
  };

  const confirmar = async () => {
    if (await datos.eliminar(recurso.id, recurso.tipo)) cambiarApertura(false);
  };

  const error = abierto && datos.error ? datos.error.mensaje : undefined;
  return (
    <>
      <Button type="button" variant="destructive-outline" size="sm" onClick={() => cambiarApertura(true)}>
        <Trash2 />
        Eliminar
      </Button>
      <Dialog
        open={abierto}
        onOpenChange={cambiarApertura}
        title={
          <span className="flex items-center gap-2">
            <Trash2 className="size-[18px] text-destructive" aria-hidden />
            Eliminar {recurso.nombre}
          </span>
        }
        description="Borra el contenedor y su volumen. Los datos se pierden para siempre y no se puede deshacer."
        footer={
          <>
            <Button variant="ghost" onClick={() => cambiarApertura(false)} disabled={datos.ocupado}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => void confirmar()} disabled={datos.ocupado || !confirmacionRecursoCoincide(recurso.tipo, escrito)}>
              <Trash2 />
              Eliminar para siempre
            </Button>
          </>
        }
      >
        {recurso.compartidoCon.length > 0 ? (
          <Banner variant="warn" title="También se desconecta de los proyectos con los que la compartes">
            {recurso.compartidoCon.map((p) => p.nombre).join(", ")}
          </Banner>
        ) : null}
        <Field
          id={`confirmar-eliminar-${recurso.id}`}
          label={
            <>
              Escribe <span className="font-mono">{recurso.tipo}</span> para confirmar
            </>
          }
          error={error}
        >
          <Input
            id={`confirmar-eliminar-${recurso.id}`}
            className="font-mono"
            value={escrito}
            onChange={(e) => setEscrito(e.target.value)}
            autoComplete="off"
            aria-invalid={!!error}
            aria-describedby={error ? `confirmar-eliminar-${recurso.id}-msg` : undefined}
          />
        </Field>
      </Dialog>
    </>
  );
}

/** Recurso compartido (`esDueno=false`): este proyecto solo puede desconectarse; los datos siguen en el dueño. */
export function DesconectarRecurso({ recurso, datos }: { recurso: VistaRecursoDatos; datos: DatosProyecto }) {
  const [abierto, setAbierto] = useState(false);

  const cambiarApertura = (valor: boolean) => {
    setAbierto(valor);
    datos.limpiarError();
  };

  const confirmar = async () => {
    if (await datos.eliminar(recurso.id, recurso.tipo)) cambiarApertura(false);
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => cambiarApertura(true)}>
        <Unlink />
        Desconectar
      </Button>
      <Dialog
        open={abierto}
        onOpenChange={cambiarApertura}
        title={`Desconectar ${recurso.nombre}`}
        description={`Pertenece a ${recurso.proyectoDueno.nombre}: sus datos no se borran. Este proyecto deja de recibir sus variables en el siguiente despliegue.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => cambiarApertura(false)} disabled={datos.ocupado}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={() => void confirmar()} disabled={datos.ocupado}>
              <Unlink />
              Desconectar
            </Button>
          </>
        }
      >
        {abierto && datos.error ? <Banner variant="bad" title={datos.error.mensaje} /> : null}
      </Dialog>
    </>
  );
}
