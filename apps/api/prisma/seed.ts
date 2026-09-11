import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const planes = [
    { nombre: "Sandbox", descripcion: "Entorno de evaluación", precio: 0, vigenciaDias: 30 },
    { nombre: "Starter", descripcion: "Sitios personales", precio: 5, vigenciaDias: 30 },
    { nombre: "Pro", descripcion: "Varios proyectos en producción", precio: 15, vigenciaDias: 30 },
    { nombre: "Business", descripcion: "Equipos y retención extendida", precio: 40, vigenciaDias: 30 },
  ];
  for (const plan of planes) {
    await prisma.plan.upsert({
      where: { nombre: plan.nombre },
      update: plan,
      create: plan,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
