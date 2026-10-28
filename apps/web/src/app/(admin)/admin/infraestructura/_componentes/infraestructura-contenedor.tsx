"use client";

import { Cpu, HardDrive, MemoryStick } from "lucide-react";
import { useEffect, useState } from "react";

import { EstadoDespliegue } from "@/components/deploya/estado-despliegue";
import { GraficaUso } from "@/components/deploya/graficas/grafica-uso";
import { PuntoVivo } from "@/components/deploya/punto-vivo";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminInfraestructura } from "@/hooks/use-admin-infraestructura";
import {
  tarjetasNodo,
  textoCpuEntorno,
  textoEntornos,
  textoMemoriaEntorno,
  textoNodo,
  textoTrabajo,
  type SerieNodo,
  type TarjetaNodo,
  type VistaInfraestructura,
} from "@/lib/admin-infraestructura";

const MS_POR_SEGUNDO = 1000;
const DIVISIONES = 2;
const ICONO = { cpu: Cpu, memoria: MemoryStick, disco: HardDrive };

function useAhora(): Date {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), MS_POR_SEGUNDO);
    return () => clearInterval(id);
  }, []);
  return ahora;
}

/** Pantalla 27 (SP-13): nodo, cola de construcción y entornos. Solo lectura y solo Administrador. */
export function InfraestructuraContenedor() {
  const { datos, serie, error, leidoEn, recargar } = useAdminInfraestructura();
  const ahora = useAhora();

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-8 pt-7 pb-8">
      <header className="flex flex-col gap-1">
        <p className="text-[13px] text-muted-foreground">Administración</p>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Infraestructura</h1>
          <Badge variant="outline">Solo lectura</Badge>
        </div>
        {datos && leidoEn ? (
          <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <PuntoVivo />
            {textoNodo(datos.nodo, leidoEn, ahora)}
          </p>
        ) : null}
      </header>
      {error ? (
        <Banner
          variant="bad"
          title="No pudimos leer la infraestructura."
          actions={
            <Button type="button" variant="outline" size="sm" onClick={recargar}>
              Reintentar
            </Button>
          }
        >
          {error.message}
        </Banner>
      ) : null}
      {!datos ? (
        error ? null : (
          <div className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando la infraestructura">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {tarjetasNodo(datos.nodo).map((tarjeta) => (
              <TarjetaRecurso key={tarjeta.recurso} tarjeta={tarjeta} serie={serie} />
            ))}
          </div>
          <Cola cola={datos.cola} />
          <Entornos entornos={datos.entornos} total={datos.totalProyectos} />
        </>
      )}
    </main>
  );
}

function TarjetaRecurso({ tarjeta, serie }: { tarjeta: TarjetaNodo; serie: SerieNodo }) {
  const Icono = ICONO[tarjeta.recurso];
  const puntos = serie[tarjeta.recurso];
  return (
    <Card>
      <CardHeader>
        <Icono className="size-4 text-muted-foreground" aria-hidden />
        <CardTitle className="grow">{tarjeta.titulo}</CardTitle>
        <span className="font-mono text-sm tnum">{tarjeta.porcentaje} %</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-xl font-semibold tnum">{tarjeta.cifra}</span>
          <span className="font-mono text-xs tnum text-muted-foreground">{tarjeta.de}</span>
        </div>
        {puntos.length > 0 ? (
          <GraficaUso
            compacta
            titulo={tarjeta.titulo}
            muestras={puntos}
            limite={tarjeta.limite}
            unidad={tarjeta.unidad}
            divisiones={DIVISIONES}
            inicio={puntos[0].tiempo}
            fin={puntos[puntos.length - 1].tiempo}
            rango="1h"
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function Cola({ cola }: { cola: VistaInfraestructura["cola"] }) {
  const cifras = [
    { texto: "En espera", valor: cola.enEspera },
    { texto: "En curso", valor: cola.enCurso },
    { texto: "Fallidas · 24 h", valor: cola.fallidas24h },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="grow">Cola de construcción</CardTitle>
        <Badge variant="muted">BullMQ</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-3 gap-4">
          {cifras.map(({ texto, valor }) => (
            <div key={texto} className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{texto}</dt>
              <dd className="text-2xl font-semibold tnum">{valor}</dd>
            </div>
          ))}
        </dl>
        {cola.trabajos.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border" aria-label="Trabajos en la cola">
            {cola.trabajos.map((trabajo) => (
              <li key={`${trabajo.proyecto}-${trabajo.numero}`} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
                <span className="font-medium">{trabajo.proyecto}</span>
                <span className="font-mono text-xs text-muted-foreground">#{trabajo.numero}</span>
                <EstadoDespliegue estado={trabajo.estado} />
                <span className="ml-auto font-mono text-xs tnum text-muted-foreground">{textoTrabajo(trabajo)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">La cola está vacía.</p>
        )}
      </CardContent>
    </Card>
  );
}

function Entornos({ entornos, total }: { entornos: VistaInfraestructura["entornos"]; total: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="grow">Entornos</CardTitle>
        <span className="font-mono text-xs tnum text-muted-foreground">{textoEntornos(entornos.length, total)}</span>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proyecto · titular</TableHead>
              <TableHead>Despliegue</TableHead>
              <TableHead className="text-right">CPU</TableHead>
              <TableHead className="text-right">Memoria</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entornos.map((entorno) => (
              <TableRow key={entorno.proyecto}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{entorno.proyecto}</span>
                    <span className="text-xs text-muted-foreground">{entorno.titular}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <EstadoDespliegue estado={entorno.estado} />
                </TableCell>
                <TableCell className="text-right font-mono tnum">{textoCpuEntorno(entorno.cpu)}</TableCell>
                <TableCell className="text-right font-mono tnum">{textoMemoriaEntorno(entorno.memoriaMb)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">CPU y memoria: última muestra de cada contenedor (cada minuto).</CardFooter>
    </Card>
  );
}
