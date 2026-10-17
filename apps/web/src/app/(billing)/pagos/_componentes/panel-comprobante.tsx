import { Download } from "lucide-react";

import { Wordmark } from "@/components/deploya/wordmark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { URL_API } from "@/lib/api";
import { fechaHoraPago, LEYENDA_COMPROBANTE, metodoPago, montoPago, rutaComprobantePdf, textoVigenciaPago, type FilaPago } from "@/lib/pagos";

/** Panel «Comprobante» de 09: el mismo contenido que el PDF que arma la API. */
export function PanelComprobante({ pago }: { pago: FilaPago }) {
  if (pago.estado !== "aprobado" || !pago.vigencia) {
    return (
      <Card className="flex flex-col gap-2 p-5">
        <p className="text-[13px] font-medium text-muted-foreground">Comprobante</p>
        <p className="text-sm text-muted-foreground">Los pagos rechazados no generan comprobante.</p>
      </Card>
    );
  }
  const total = montoPago(pago.monto, pago.moneda);
  return (
    <Card className="flex flex-col gap-5 p-5 lg:sticky lg:top-6">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted-foreground">Comprobante</p>
        <span className="font-mono text-xs text-muted-foreground">{pago.comprobante}</span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <Wordmark size={22} />
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs text-muted-foreground">Total pagado</span>
          <span className="font-mono text-2xl font-semibold tracking-[-0.02em] tabular-nums">{total}</span>
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
        <dt className="text-muted-foreground">Fecha</dt>
        <dd className="text-right tabular-nums">{fechaHoraPago(pago.fecha)}</dd>
        <dt className="text-muted-foreground">Concepto</dt>
        <dd className="text-right">Plan {pago.plan}</dd>
        <dt className="text-muted-foreground">Vigencia</dt>
        <dd className="text-right tabular-nums">{textoVigenciaPago(pago.vigencia)}</dd>
        <dt className="text-muted-foreground">Método</dt>
        <dd className="text-right font-mono text-[13px]">{metodoPago(pago.tarjeta)}</dd>
        <dt className="text-muted-foreground">Titular</dt>
        <dd className="text-right">{pago.titular}</dd>
      </dl>
      <Separator />
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="text-right font-mono text-[13px] tabular-nums">{total}</dd>
        <dt className="font-medium">Total</dt>
        <dd className="text-right font-mono text-[13px] font-semibold tabular-nums">{total}</dd>
      </dl>
      <p className="text-xs text-muted-foreground">{LEYENDA_COMPROBANTE}</p>
      <Button asChild variant="outline">
        <a href={`${URL_API}${rutaComprobantePdf(pago.id)}`} download>
          <Download />
          Descargar PDF
        </a>
      </Button>
    </Card>
  );
}
