import Link from "next/link";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { bloqueoDespliegue } from "@/lib/proyectos";
import { RUTA_SUSCRIPCION } from "@/lib/suscripcion";

/** 11d y 17: 409 de M5 con «Renovar» o «Cambiar de plan». */
export function BannerBloqueo({ codigo, mensaje }: { codigo: string; mensaje: string }) {
  const bloqueo = bloqueoDespliegue(codigo, mensaje);
  if (!bloqueo) return null;
  return (
    <Banner
      variant="bad"
      title={bloqueo.titulo}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href={RUTA_SUSCRIPCION}>{bloqueo.accion}</Link>
        </Button>
      }
    >
      {bloqueo.titulo === mensaje ? null : mensaje}
    </Banner>
  );
}
