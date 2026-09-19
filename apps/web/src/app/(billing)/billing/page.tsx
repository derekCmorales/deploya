import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BillingPage() {
  return (
    <main className="p-6">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Planes</CardTitle>
          <CardDescription>
            Placeholder del catálogo y contratación (M2, Javier). Pago
            simulado; no hay cobro real.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
