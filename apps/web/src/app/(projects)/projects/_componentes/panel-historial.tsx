"use client";

import { Info, Radio, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { EstadoDespliegue } from "@/components/deploya/estado-despliegue";
import type { EstadoDespliegueValor } from "@/components/deploya/estados";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorApi, pedirApi } from "@/lib/api";
import { rutaDespliegue } from "@/lib/despliegues";
import {
  FILTROS_HISTORIAL,
  accionDeFila,
  consultaHistorial,
  digestCorto,
  duracionFila,
  fechaFila,
  fusionarPaginas,
  peticionDeAccion,
  puedeRedesplegar,
  type AccionEjecutable,
  type FilaHistorial,
  type FiltroHistorial,
  type PaginaHistorial,
} from "@/lib/historial";
import { shaCorto } from "@/lib/proyectos";

interface Confirmacion {
  accion: Extract<AccionEjecutable, "revertir" | "redesplegar">;
  fila: FilaHistorial;
}

/** Pantalla 14: historial paginado con filtros y la acción que corresponde a cada versión. */
export function PanelHistorial({ proyectoId }: { proyectoId: string }) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<FiltroHistorial>("todos");
  const [filas, setFilas] = useState<FilaHistorial[]>([]);
  const [siguiente, setSiguiente] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);
  const [avisoAccion, setAvisoAccion] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(
    async (antesDe: number | null, previas: FilaHistorial[]) => {
      setCargando(true);
      setError(null);
      try {
        const pagina = await pedirApi<PaginaHistorial>(consultaHistorial(proyectoId, filtro, antesDe));
        setFilas(fusionarPaginas(previas, pagina.despliegues));
        setSiguiente(pagina.siguiente);
      } catch (e) {
        setError(e instanceof ErrorApi ? e.message : "No pudimos cargar los despliegues.");
      } finally {
        setCargando(false);
      }
    },
    [proyectoId, filtro],
  );

  useEffect(() => {
    void cargar(null, []);
  }, [cargar]);

  const ejecutar = async (accion: AccionEjecutable, fila: FilaHistorial) => {
    setOcupado(true);
    setAvisoAccion(null);
    try {
      const { ruta, cuerpo } = peticionDeAccion(accion, fila, proyectoId);
      const creado = await pedirApi<{ numero: number }>(ruta, { metodo: "POST", cuerpo });
      router.push(rutaDespliegue(proyectoId, creado.numero));
    } catch (e) {
      setAvisoAccion(e instanceof ErrorApi ? e.message : "No pudimos completar la acción.");
      setOcupado(false);
    }
  };

  const confirmar = async () => {
    if (confirmacion) await ejecutar(confirmacion.accion, confirmacion.fila);
  };

  return (
    <div className="flex flex-col gap-5 px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          aria-label="Filtrar despliegues"
          value={filtro}
          onValueChange={setFiltro}
          options={FILTROS_HISTORIAL.map((f) => ({ value: f.value, label: f.label }))}
        />
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="size-3.5" aria-hidden />
          Redesplegar vuelve a construir ese commit desde su Dockerfile
        </p>
      </div>
      {error ? <Banner variant="bad" title="No pudimos cargar los despliegues">{error}</Banner> : null}
      {avisoAccion ? <Banner variant="bad" title="No pudimos completar la acción">{avisoAccion}</Banner> : null}
      <Tabla
        proyectoId={proyectoId}
        filas={filas}
        cargando={cargando}
        ocupado={ocupado}
        alReintentar={(fila) => void ejecutar("reintentar", fila)}
        alConfirmar={setConfirmacion}
        pie={<Pie filas={filas.length} hayMas={siguiente !== null} cargando={cargando} alCargarMas={() => void cargar(siguiente, filas)} />}
      />
      <DialogoConfirmacion
        confirmacion={confirmacion}
        ocupado={ocupado}
        alCerrar={() => setConfirmacion(null)}
        alConfirmar={confirmar}
      />
    </div>
  );
}

function Tabla({
  proyectoId,
  filas,
  cargando,
  ocupado,
  alReintentar,
  alConfirmar,
  pie,
}: {
  proyectoId: string;
  filas: FilaHistorial[];
  cargando: boolean;
  ocupado: boolean;
  alReintentar: (fila: FilaHistorial) => void;
  alConfirmar: (confirmacion: Confirmacion) => void;
  pie: React.ReactNode;
}) {
  const ahora = new Date();
  if (cargando && filas.length === 0) return <Skeleton className="h-64 w-full" aria-busy="true" aria-label="Cargando despliegues" />;
  if (filas.length === 0) return <p className="text-sm text-muted-foreground">Todavía no hay despliegues con este filtro.</p>;
  return (
    <Table footer={pie}>
      <TableHeader>
        <TableRow>
          <TableHead>Versión</TableHead>
          <TableHead>Commit</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Duración</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Imagen (digest)</TableHead>
          <TableHead className="text-right">
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filas.map((fila) => (
          <TableRow key={fila.id} data-activa={fila.activo}>
            <TableCell className="font-medium">
              <Link href={rutaDespliegue(proyectoId, fila.numero)} className="font-mono text-[13px] hover:underline">
                #{fila.numero}
              </Link>
            </TableCell>
            <TableCell>
              {fila.commit ? (
                <div className="flex flex-col gap-0.5">
                  <span>{fila.commit.mensaje}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {shaCorto(fila.commit.sha)} · {fila.commit.rama}
                  </span>
                </div>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">{fechaFila(fila.creado, ahora)}</TableCell>
            <TableCell className="tnum text-muted-foreground">{duracionFila(fila.duracionMs)}</TableCell>
            <TableCell>
              <EstadoDespliegue estado={fila.estado as EstadoDespliegueValor} />
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{fila.imagen ? digestCorto(fila.imagen.digest) : "—"}</TableCell>
            <TableCell className="text-right">
              <AccionesDeFila fila={fila} ocupado={ocupado} alReintentar={alReintentar} alConfirmar={alConfirmar} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Pinta lo que dice `accionDeFila`; la tabla no decide por estado. */
function AccionesDeFila({
  fila,
  ocupado,
  alReintentar,
  alConfirmar,
}: {
  fila: FilaHistorial;
  ocupado: boolean;
  alReintentar: (fila: FilaHistorial) => void;
  alConfirmar: (confirmacion: Confirmacion) => void;
}) {
  const accion = accionDeFila(fila);
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {accion === "version-activa" ? (
        <Badge variant="signal">
          <Radio aria-hidden />
          Versión activa
        </Badge>
      ) : null}
      {accion === "revertir" ? (
        <Button type="button" variant="outline" size="xs" disabled={ocupado} onClick={() => alConfirmar({ accion: "revertir", fila })}>
          <RotateCcw />
          Revertir
        </Button>
      ) : null}
      {accion === "imagen-retirada" ? (
        <Button type="button" variant="outline" size="xs" disabled title="La retención ya borró la imagen de esta versión">
          <RotateCcw />
          Imagen retirada
        </Button>
      ) : null}
      {accion === "reintentar" ? (
        <Button type="button" variant="outline" size="xs" disabled={ocupado} onClick={() => alReintentar(fila)}>
          <RotateCcw />
          Reintentar
        </Button>
      ) : null}
      {puedeRedesplegar(fila) ? (
        <Button type="button" variant="outline" size="xs" disabled={ocupado} onClick={() => alConfirmar({ accion: "redesplegar", fila })}>
          <RotateCcw />
          Redesplegar
        </Button>
      ) : null}
    </div>
  );
}

function Pie({ filas, hayMas, cargando, alCargarMas }: { filas: number; hayMas: boolean; cargando: boolean; alCargarMas: () => void }) {
  if (filas === 0) return null;
  return (
    <>
      <span className="grow text-xs text-muted-foreground">
        {filas === 1 ? "Se muestra el último despliegue del proyecto." : `Se muestran los últimos ${filas} despliegues del proyecto.`}
      </span>
      {hayMas ? (
        <Button type="button" variant="ghost" size="xs" disabled={cargando} onClick={alCargarMas}>
          Cargar más
        </Button>
      ) : null}
    </>
  );
}

function DialogoConfirmacion({
  confirmacion,
  ocupado,
  alCerrar,
  alConfirmar,
}: {
  confirmacion: Confirmacion | null;
  ocupado: boolean;
  alCerrar: () => void;
  alConfirmar: () => void;
}) {
  const fila = confirmacion?.fila;
  const revertir = confirmacion?.accion === "revertir";
  return (
    <Dialog
      open={confirmacion !== null}
      onOpenChange={(abierto) => {
        if (!abierto) alCerrar();
      }}
      title={revertir ? `Revertir a la versión #${fila?.numero}` : `Redesplegar la versión #${fila?.numero}`}
      description={
        revertir
          ? "Volvemos a la imagen que ya construimos: sin reconstruir y sin gastar construcciones. Tu versión actual sigue en línea hasta que esta pase la verificación de salud."
          : `Vuelve a construir el commit ${fila?.commit ? shaCorto(fila.commit.sha) : ""} desde su Dockerfile. Consume una construcción de tu plan.`
      }
      footer={
        <>
          <Button variant="outline" onClick={alCerrar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button onClick={alConfirmar} disabled={ocupado}>
            {revertir ? "Revertir" : "Redesplegar"}
          </Button>
        </>
      }
    />
  );
}
