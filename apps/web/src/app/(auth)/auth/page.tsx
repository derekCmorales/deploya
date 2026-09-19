import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthPage() {
  return (
    <main className="p-6">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Cuenta</CardTitle>
          <CardDescription>
            Placeholder de registro e inicio de sesión (M1, Eddy). No hay
            autenticación real en este PR.
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
