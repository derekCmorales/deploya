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
  const suscripciones = new SuscripcionesService(
    new RepositorioPlanesPrisma(prisma),
    new RepositorioSuscripcionesPrisma(prisma),
    new RelojSistema(),
  );
  try {
    await sembrar(new DestinoSemillaPrisma(prisma), suscripciones, hashSemilla, process.env);
    console.log("Seed listo: 4 planes, administrador y cliente de demostración con Sandbox");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
