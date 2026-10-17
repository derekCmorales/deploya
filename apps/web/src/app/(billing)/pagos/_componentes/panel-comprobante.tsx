import { Check, Download, FlaskConical, ReceiptText, X } from "lucide-react";

import { Wordmark } from "@/components/deploya/wordmark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { URL_API } from "@/lib/api";
import { fechaHoraPago, LEYENDA_COMPROBANTE, metodoPago, montoPago, rutaComprobantePdf, textoVigenciaPago, type FilaPago } from "@/lib/pagos";

/** Panel lateral «Comprobante» de 09: el mismo contenido que el PDF que arma la API. */
export function PanelComprobante({ pago, alCerrar }: { pago: FilaPago; alCerrar: () => void }) {
  const pdf = `${URL_API}${rutaComprobantePdf(pago.id)}`;
  const total = montoPago(pago.monto, pago.moneda);
  return (
    <aside className="flex w-full flex-col border-t border-border bg-card lg:w-[440px] lg:border-t-0 lg:border-l" aria-label="Comprobante">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <ReceiptText className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="flex-1 text-sm font-semibold">Comprobante</h2>
        {pago.vigencia ? (
          <Button asChild size="icon-sm" variant="ghost" aria-label="Descargar PDF">
            <a href={pdf} download>
              <Download />
            </a>
          </Button>
        ) : null}
        <Button size="icon-sm" variant="ghost" aria-label="Cerrar" onClick={alCerrar}>
          <X />
        </Button>
      </div>
      {pago.estado !== "aprobado" || !pago.vigencia ? (
        <p className="p-6 text-sm text-muted-foreground">Los pagos rechazados no generan comprobante.</p>
      ) : (
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border-strong bg-sunken p-5">
            <div className="flex items-center justify-between">
              <Wordmark size={22} />
              <span className="font-mono text-xs text-muted-foreground">{pago.comprobante}</span>
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <span className="text-xs text-muted-foreground">Total pagado</span>
              <span className="text-[32px] leading-9 font-semibold tracking-[-0.03em] tabular-nums">{total}</span>
              <Badge variant="ok">
                <Check aria-hidden />
                Aprobado
              </Badge>
            </div>
            <dl className="grid grid-cols-[120px_1fr] gap-y-2.5 border-t border-dashed border-border-strong pt-4 text-sm">
              <dt className="text-muted-foreground">Fecha</dt>
              <dd className="tabular-nums">{fechaHoraPago(pago.fecha)}</dd>
              <dt className="text-muted-foreground">Concepto</dt>
              <dd>Plan {pago.plan}</dd>
              <dt className="text-muted-foreground">Vigencia</dt>
              <dd className="tabular-nums">{textoVigenciaPago(pago.vigencia)}</dd>
              <dt className="text-muted-foreground">Método</dt>
              <dd>{metodoPago(pago.tarjeta)}</dd>
              <dt className="text-muted-foreground">Titular</dt>
              <dd>{pago.titular}</dd>
            </dl>
            <dl className="flex flex-col gap-2.5 border-t border-dashed border-border-strong pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{total}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{total}</dd>
              </div>
            </dl>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FlaskConical className="size-3.5" aria-hidden />
            {LEYENDA_COMPROBANTE}
          </p>
          <Button asChild variant="outline" className="w-full">
            <a href={pdf} download>
              <Download />
              Descargar PDF
            </a>
          </Button>
        </div>
      )}
    </aside>
  );
}
