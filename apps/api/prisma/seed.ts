import "reflect-metadata";
import { RelojSistema } from "../src/compartido/reloj";
import { PrismaService } from "../src/compartido/prisma/prisma.service";
import { RepositorioPlanesPrisma } from "../src/modules/suscripciones/adaptadores/repositorio-planes.prisma";
import { RepositorioSuscripcionesPrisma } from "../src/modules/suscripciones/adaptadores/repositorio-suscripciones.prisma";
import { hashSemilla } from "../src/modules/suscripciones/semilla/hash-semilla";
import { DestinoSemillaPrisma } from "../src/modules/suscripciones/semilla/destino-semilla.prisma";
import { sembrar } from "../src/modules/suscripciones/semilla/sembrar";
import { CatalogoAutoalojado, CatalogoNube } from "../src/modules/suscripciones/modo/catalogos";
import { CuotasDelPlan } from "../src/modules/suscripciones/modo/cuotas";
import { modoInstalacionDesde } from "../src/modules/suscripciones/modo/modo-instalacion";
import { SuscripcionesService } from "../src/modules/suscripciones/suscripciones.service";

const CATALOGO_POR_MODO = { nube: CatalogoNube, autoalojado: CatalogoAutoalojado } as const;

async function main(): Promise<void> {
  const prisma = new PrismaService();
  const planes = new RepositorioPlanesPrisma(prisma);
  const repositorioSuscripciones = new RepositorioSuscripcionesPrisma(prisma);
  const reloj = new RelojSistema();
  const modo = modoInstalacionDesde(process.env);
  // El seed solo asigna el plan inicial: la cuota no se lee aquí, así que basta la del plan.
  const suscripciones = new SuscripcionesService(new CATALOGO_POR_MODO[modo](planes), repositorioSuscripciones, new CuotasDelPlan(), reloj);
  try {
    await sembrar(new DestinoSemillaPrisma(prisma), suscripciones, hashSemilla, process.env, {
      suscripciones: repositorioSuscripciones,
      planes,
      reloj,
    });
    console.log(
      modo === "autoalojado"
        ? "Seed listo: plan Autoalojado; sin administrador ni cuentas de demo (autoalojado)"
        : "Seed listo: 4 planes, administrador, cliente@ y demo@ con Sandbox; vencida@ y suspendida@ en Starter (Vencida y Suspendida)",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
