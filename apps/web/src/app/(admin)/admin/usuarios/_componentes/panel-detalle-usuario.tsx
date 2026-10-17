"use client";

import { Check, CirclePause, ShieldAlert, UserRound, X } from "lucide-react";
import { useState } from "react";

import { EstadoDespliegue } from "@/components/deploya/estado-despliegue";
import { EstadoSuscripcion } from "@/components/deploya/estado-suscripcion";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Sondeo } from "@/hooks/use-sondeo";
import {
  conceptoPagoAdmin,
  fechaAdmin,
  inicialesDe,
  sePuedeSuspender,
  textoAlta,
  textoRol,
  textoSuscripcionAdmin,
  textoSuspension,
  type DetalleUsuario,
} from "@/lib/admin-usuarios";
import { textoMonto } from "@/lib/suscripcion";

import { DialogoSuspender } from "./dialogo-suspender";

const SECCION = "flex flex-col gap-3 border-b border-border px-6 py-5";

/** Panel derecho de 25: cuenta, suscripción, proyectos con su despliegue activo y pagos, por secciones. */
export function PanelDetalleUsuario({ detalle, ahora, alSuspender }: { detalle: Sondeo<DetalleUsuario>; ahora: Date; alSuspender: () => void }) {
  const [suspendiendo, setSuspendiendo] = useState(false);
  if (detalle.error) {
    return (
      <div className="p-6">
        <Banner variant="bad" title="No pudimos cargar la cuenta.">
          {detalle.error.message}
        </Banner>
      </div>
    );
  }
  const d = detalle.datos;
  if (!d) {
    return (
      <div className="flex flex-col gap-4 p-6" aria-busy="true" aria-label="Cargando la cuenta">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <section className={SECCION}>
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-full border border-border-strong bg-muted text-sm font-semibold tracking-[0.02em]"
          >
            {inicialesDe(d.nombre, d.correo)}
          </span>
          <div className="flex min-w-0 flex-col">
            <h2 className="truncate text-lg font-semibold tracking-[-0.02em]">{d.nombre}</h2>
            <p className="truncate text-[13px] text-muted-foreground">{d.correo}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
          <Badge variant="muted" className="border border-border-strong bg-card text-foreground">
            <UserRound aria-hidden />
            {textoRol(d.rol)}
          </Badge>
          {textoAlta(d, ahora)}
        </div>
        {d.suspension ? (
          <div className="flex flex-col gap-1 rounded-lg border border-border bg-sunken p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium text-bad">
              <CirclePause className="size-4" aria-hidden />
              Cuenta suspendida
            </p>
            <p className="text-[13px] text-muted-foreground">{textoSuspension(d.suspension)}</p>
            {d.suspension.motivo ? <p className="text-[13px]">{d.suspension.motivo}</p> : null}
          </div>
        ) : sePuedeSuspender(d) ? (
          <Button variant="destructive-outline" className="self-end" onClick={() => setSuspendiendo(true)}>
            <ShieldAlert />
            Suspender cuenta
          </Button>
        ) : null}
      </section>

      <section className={SECCION}>
        <h3 className="text-[13px] font-medium text-muted-foreground">Suscripción</h3>
        {d.suscripcion ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-medium">{d.plan}</span>
            <EstadoSuscripcion estado={d.suscripcion} />
            <span className="text-[13px] text-muted-foreground">{textoSuscripcionAdmin(d)}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin suscripción.</p>
        )}
      </section>

      <section className={SECCION}>
        <h3 className="flex items-center justify-between text-[13px] font-medium text-muted-foreground">
          Proyectos · estado de despliegue
          <span className="tabular-nums">{d.proyectos.length}</span>
        </h3>
        {d.proyectos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin proyectos.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {d.proyectos.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-mono text-[13px]">{p.nombre}</span>
                {p.despliegue ? <EstadoDespliegue estado={p.despliegue} /> : <span className="text-[13px] text-faint">Sin despliegue</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={SECCION}>
        <h3 className="text-[13px] font-medium text-muted-foreground">Pagos</h3>
        {d.pagos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin pagos.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {d.pagos.map((p) => (
              <li key={p.id} className="grid grid-cols-[96px_1fr_auto_auto] items-center gap-x-3 text-sm">
                <span className="text-muted-foreground tabular-nums">{fechaAdmin(p.fecha)}</span>
                <span className="truncate text-[13px]">{conceptoPagoAdmin(p)}</span>
                <span className="tabular-nums">{textoMonto(p.monto, p.moneda)}</span>
                {p.estado === "aprobado" ? (
                  <Badge variant="ok">
                    <Check aria-hidden />
                    Aprobado
                  </Badge>
                ) : (
                  <Badge variant="bad">
                    <X aria-hidden />
                    Rechazado
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <DialogoSuspender
        usuario={d}
        abierto={suspendiendo}
        alCambiar={setSuspendiendo}
        alSuspender={() => {
          setSuspendiendo(false);
          alSuspender();
        }}
      />
    </div>
  );
}
