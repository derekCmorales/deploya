-- CreateEnum
CREATE TYPE "PoliticaRegistro" AS ENUM ('abierto', 'invitacion', 'cerrado');

-- CreateTable
CREATE TABLE "ConfiguracionInstalacion" (
    "id" TEXT NOT NULL DEFAULT 'instalacion',
    "hashCodigo" TEXT,
    "codigoVence" TIMESTAMP(3),
    "politicaRegistro" "PoliticaRegistro" NOT NULL DEFAULT 'invitacion',
    "cpuPorProyecto" DECIMAL(4,2) NOT NULL DEFAULT 1,
    "memoriaMbPorProyecto" INTEGER NOT NULL DEFAULT 1024,
    "proyectosPorUsuario" INTEGER,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionInstalacion_pkey" PRIMARY KEY ("id")
);
