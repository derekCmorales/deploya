import { Check, ReceiptText, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fechaPago, montoPago, type FilaPago } from "@/lib/pagos";

/** Tabla de 09: la fila abierta lleva `data-activa`; solo los aprobados tienen comprobante. */
export function TablaPagos({ filas, seleccion, alSeleccionar }: { filas: FilaPago[]; seleccion: string | null; alSeleccionar: (id: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Concepto</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filas.map((f) => (
          <TableRow key={f.id} data-activa={f.id === seleccion} aria-selected={f.id === seleccion} className="data-[activa=true]:bg-muted">
            <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">{fechaPago(f.fecha)}</TableCell>
            <TableCell>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{f.concepto}</span>
                {f.comprobante ? <span className="font-mono text-xs text-muted-foreground">{f.comprobante}</span> : null}
              </div>
            </TableCell>
            <TableCell className="tabular-nums">{montoPago(f.monto, f.moneda)}</TableCell>
            <TableCell>
              {f.estado === "aprobado" ? (
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
            </TableCell>
            <TableCell className="text-right">
              {f.estado === "aprobado" ? (
                <Button size="xs" variant="ghost" onClick={() => alSeleccionar(f.id)}>
                  <ReceiptText />
                  Ver comprobante
                </Button>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
