"use client";

import { Ban, CirclePause } from "lucide-react";
import { useState } from "react";

import { EstadoDespliegue } from "@/components/deploya/estado-despliegue";
import { EstadoSuscripcion } from "@/components/deploya/estado-suscripcion";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Sondeo } from "@/hooks/use-sondeo";
import { conceptoPagoAdmin, fechaAdmin, inicialesDe, sePuedeSuspender, textoAlta, textoSuspension, type DetalleUsuario } from "@/lib/admin-usuarios";
import { textoMonto } from "@/lib/suscripcion";

import { DialogoSuspender } from "./dialogo-suspender";

/** Panel derecho de 25: cuenta, suscripción, proyectos con su despliegue activo y pagos. */
export function PanelDetalleUsuario({ detalle, ahora, alSuspender }: { detalle: Sondeo<DetalleUsuario>; ahora: Date; alSuspender: () => void }) {
  const [suspendiendo, setSuspendiendo] = useState(false);
  if (detalle.error) {
    return (
      <Banner variant="bad" title="No pudimos cargar la cuenta.">
        {detalle.error.message}
      </Banner>
    );
  }
  const d = detalle.datos;
  if (!d) {
    return (
      <Card className="flex flex-col gap-4 p-5" aria-busy="true" aria-label="Cargando la cuenta">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-5 p-5 lg:sticky lg:top-6">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full border border-border-strong bg-muted text-sm font-semibold tracking-[0.02em]"
        >
          {inicialesDe(d.nombre, d.correo)}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="truncate text-base font-semibold tracking-[-0.01em]">{d.nombre}</h2>
          <p className="truncate font-mono text-[13px] text-muted-foreground">{d.correo}</p>
          <p className="text-[13px] text-muted-foreground">{textoAlta(d, ahora)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {d.plan ? <Badge variant="muted">{d.plan}</Badge> : null}
        {d.suscripcion ? <EstadoSuscripcion estado={d.suscripcion} /> : null}
        {d.vence ? <span className="text-[13px] text-muted-foreground">vence {fechaAdmin(d.vence)}</span> : null}
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
        <Button variant="destructive-outline" className="self-start" onClick={() => setSuspendiendo(true)}>
          <Ban />
          Suspender cuenta
        </Button>
      ) : null}

      <Separator />

      <section className="flex flex-col gap-2.5">
        <h3 className="flex items-center justify-between text-[13px] font-medium text-muted-foreground">
          Proyectos · estado de despliegue
          <span className="font-mono tabular-nums">{d.proyectos.length}</span>
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

      <Separator />

      <section className="flex flex-col gap-2.5">
        <h3 className="text-[13px] font-medium text-muted-foreground">Pagos</h3>
        {d.pagos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin pagos.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {d.pagos.map((p) => (
              <li key={p.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 text-sm">
                <span className="text-muted-foreground tabular-nums">{fechaAdmin(p.fecha)}</span>
                <span className="truncate">{conceptoPagoAdmin(p)}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[13px] tabular-nums">{textoMonto(p.monto, p.moneda)}</span>
                  <Badge variant={p.estado === "aprobado" ? "ok" : "bad"}>{p.estado === "aprobado" ? "Aprobado" : "Rechazado"}</Badge>
                </span>
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
    </Card>
  );
}
