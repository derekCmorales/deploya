import "reflect-metadata";
import { RelojSistema } from "../src/compartido/reloj";
import { PrismaService } from "../src/compartido/prisma/prisma.service";
import { RepositorioPlanesPrisma } from "../src/modules/suscripciones/adaptadores/repositorio-planes.prisma";
import { RepositorioSuscripcionesPrisma } from "../src/modules/suscripciones/adaptadores/repositorio-suscripciones.prisma";
import { hashSemilla } from "../src/modules/suscripciones/semilla/hash-semilla";
import { DestinoSemillaPrisma } from "../src/modules/suscripciones/semilla/destino-semilla.prisma";
import { sembrar } from "../src/modules/suscripciones/semilla/sembrar";
import { SuscripcionesService } from "../src/modules/suscripciones/suscripciones.service";

async function main(): Promise<void> {
  const prisma = new PrismaService();
  const planes = new RepositorioPlanesPrisma(prisma);
  const repositorioSuscripciones = new RepositorioSuscripcionesPrisma(prisma);
  const reloj = new RelojSistema();
  const suscripciones = new SuscripcionesService(planes, repositorioSuscripciones, reloj);
  try {
    await sembrar(new DestinoSemillaPrisma(prisma), suscripciones, hashSemilla, process.env, {
      suscripciones: repositorioSuscripciones,
      planes,
      reloj,
    });
    console.log(
      "Seed listo: 4 planes, administrador y cliente@ con Sandbox; vencida@ y suspendida@ en Starter (Vencida y Suspendida)",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
