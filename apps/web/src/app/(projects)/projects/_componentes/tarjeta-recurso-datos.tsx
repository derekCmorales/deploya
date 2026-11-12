"use client";

import { FolderGit2, Gauge, Globe, KeyRound, Network, Share2, X } from "lucide-react";
import type { ReactNode } from "react";

import { EstadoRecursoDatos } from "@/components/deploya/estado-recurso-datos";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyField } from "@/components/ui/copy-field";
import { Meter } from "@/components/ui/meter";
import type { DatosProyecto } from "@/hooks/use-datos-proyecto";
import {
  discoCercaDelLimite,
  textoAvisoDisco,
  textoHost,
  textoMb,
  type ProyectoReferencia,
  type VistaRecursoDatos,
} from "@/lib/datos";

import { CompartirRecurso, DesconectarRecurso, EliminarRecurso, VerConexion } from "./dialogos-datos";
import { ICONO_TIPO } from "./iconos-datos";

interface PropsTarjeta {
  proyectoId: string;
  recurso: VistaRecursoDatos;
  datos: DatosProyecto;
  proyectos: readonly ProyectoReferencia[];
  desplegarBloqueado: boolean;
}

/** Un recurso conectado: estado, dónde está, disco, variables y con quién se comparte. */
export function TarjetaRecursoDatos({ proyectoId, recurso, datos, proyectos, desplegarBloqueado }: PropsTarjeta) {
  const Icono = ICONO_TIPO[recurso.tipo];
  return (
    <Card>
      <CardHeader className="flex-wrap">
        <Icono className="size-[18px] text-muted-foreground" aria-hidden />
        <CardTitle className="grow">{recurso.nombre}</CardTitle>
        {recurso.esDueno ? null : <Badge variant="outline">Pertenece a {recurso.proyectoDueno.nombre}</Badge>}
        <EstadoRecursoDatos estado={recurso.estado} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {recurso.estado === "error" && recurso.detalle ? <Banner variant="bad" title="El recurso falló">{recurso.detalle}</Banner> : null}
        {recurso.estado === "detenido" ? (
          <Banner variant="muted" title="Detenido">
            {recurso.detalle ?? "Se detuvo por el estado de la cuenta. El volumen sigue intacto y vuelve al reactivarla."}
          </Banner>
        ) : null}
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Dato titulo="Host interno" icono={<Network aria-hidden />}>
            <span className="font-mono text-[13px]">{textoHost(recurso)}</span>
          </Dato>
          {recurso.urlPublica ? (
            <Dato titulo="URL pública" icono={<Globe aria-hidden />}>
              <CopyField value={recurso.urlPublica} />
            </Dato>
          ) : null}
          <Disco recurso={recurso} />
          <Dato titulo="Variables inyectadas" icono={<KeyRound aria-hidden />}>
            <ul className="flex flex-wrap gap-1.5" aria-label="Variables inyectadas">
              {recurso.variablesInyectadas.map((nombre) => (
                <li key={nombre}>
                  <Badge variant="muted" className="font-mono">
                    {nombre}
                  </Badge>
                </li>
              ))}
            </ul>
          </Dato>
          {recurso.esDueno ? <Compartidos proyectoId={proyectoId} recurso={recurso} datos={datos} /> : null}
        </dl>
      </CardContent>
      <CardFooter className="flex-wrap">
        <VerConexion recurso={recurso} proyectoId={proyectoId} leer={datos.conexion} desplegarBloqueado={desplegarBloqueado} />
        {recurso.esDueno ? <CompartirRecurso recurso={recurso} proyectos={proyectos} datos={datos} /> : null}
        <span className="grow" />
        {recurso.esDueno ? <EliminarRecurso recurso={recurso} datos={datos} /> : <DesconectarRecurso recurso={recurso} datos={datos} />}
      </CardFooter>
    </Card>
  );
}

function Dato({ titulo, icono, children }: { titulo: string; icono: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5">
        {icono}
        {titulo}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function Disco({ recurso }: { recurso: VistaRecursoDatos }) {
  if (recurso.usoDiscoMb === null) {
    return (
      <Dato titulo="Disco" icono={<Gauge aria-hidden />}>
        <span className="text-sm text-muted-foreground">Sin medición todavía · límite {textoMb(recurso.limiteDiscoMb)}</span>
      </Dato>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <Meter
        label="Disco"
        value={recurso.usoDiscoMb}
        max={recurso.limiteDiscoMb}
        valueLabel={`${textoMb(recurso.usoDiscoMb)} / ${textoMb(recurso.limiteDiscoMb)}`}
        tonoAlLimite="warn"
      />
      {discoCercaDelLimite(recurso) ? (
        <p className="text-xs text-warn" role="status">
          {textoAvisoDisco(recurso)}. No cortamos el servicio, pero libera espacio o cambia de plan.
        </p>
      ) : null}
    </div>
  );
}

function Compartidos({ proyectoId, recurso, datos }: { proyectoId: string; recurso: VistaRecursoDatos; datos: DatosProyecto }) {
  return (
    <Dato titulo="Compartido con" icono={<Share2 aria-hidden />}>
      {recurso.compartidoCon.length === 0 ? (
        <span className="text-sm text-muted-foreground">Solo este proyecto</span>
      ) : (
        <ul className="flex flex-col gap-1">
          {recurso.compartidoCon.map((otro) => (
            <li key={otro.id} className="flex items-center gap-2 text-sm">
              <FolderGit2 className="size-3.5 text-muted-foreground" aria-hidden />
              <span className="grow truncate">{otro.nombre}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Dejar de compartir con ${otro.nombre}`}
                disabled={datos.ocupado || otro.id === proyectoId}
                onClick={() => void datos.dejarDeCompartir(recurso.id, otro.id)}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Dato>
  );
}
