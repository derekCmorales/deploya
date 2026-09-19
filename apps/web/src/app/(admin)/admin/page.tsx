import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminPage() {
  return (
    <main className="p-6">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Administración</CardTitle>
          <CardDescription>
            Placeholder del panel M9 (Javier): usuarios, planes,
            infraestructura. Sin lógica de administración real.
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
