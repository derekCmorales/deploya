import { Card } from "@/components/ui/card";
import { fechaLarga, subtituloOperacion, textoMonto, type Cotizacion } from "@/lib/suscripcion";

/** Tarjeta «Resumen» de 07: lo calcula la API con la misma política que el cobro. */
export function ResumenOrden({ cotizacion }: { cotizacion: Cotizacion }) {
  const filas: [string, string][] = [
    ["Plan", cotizacion.plan.nombre],
    ["Vigencia", `${cotizacion.vigenciaDias} días`],
    ["Inicio", fechaLarga(cotizacion.inicio)],
    ["Fin", fechaLarga(cotizacion.vence)],
    ["Cuota", "se aplica al aprobar"],
  ];

  return (
    <Card className="flex flex-col gap-4 p-6">
      <p className="text-[13px] font-medium text-muted-foreground">Resumen</p>
      <div className="flex flex-col gap-1">
        <h2 className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em]">{cotizacion.plan.nombre}</h2>
        <p className="text-muted-foreground">{subtituloOperacion(cotizacion)}</p>
      </div>
      <dl className="flex flex-col gap-3">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">{etiqueta}</dt>
            <span aria-hidden className="flex-1 -translate-y-1 border-b border-dotted border-border-stronger" />
            <dd className="font-mono text-[13px]">{valor}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-dashed border-border-stronger" />
      <div className="flex items-baseline justify-between">
        <span className="font-medium">Total</span>
        <span className="text-2xl font-semibold tracking-[-0.03em]">{textoMonto(cotizacion.monto, cotizacion.moneda)}</span>
      </div>
      <p className="text-[13px] text-muted-foreground">Sin renovación automática: renuevas cuando quieras desde Mi suscripción.</p>
    </Card>
  );
}
