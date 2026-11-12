-- feat/m5-recursos-datos: bases administradas por proyecto (Postgres + pgvector, Redis, S3) con volumen
-- persistente, límites del plan y Proyecto.comandoInicio. Estados del recurso ≠ despliegue y suscripción.

-- CreateEnum
CREATE TYPE "TipoRecursoDatos" AS ENUM ('postgres', 'redis', 's3');

-- CreateEnum
CREATE TYPE "EstadoRecursoDatos" AS ENUM ('creando', 'disponible', 'detenido', 'error');

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "discoDatosMb" INTEGER NOT NULL DEFAULT 512,
ADD COLUMN     "maxRecursosDatos" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Proyecto" ADD COLUMN     "comandoInicio" VARCHAR(512);

-- CreateTable
CREATE TABLE "RecursoDatos" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "tipo" "TipoRecursoDatos" NOT NULL,
    "estado" "EstadoRecursoDatos" NOT NULL DEFAULT 'creando',
    "detalle" TEXT,
    "contenedor" TEXT NOT NULL,
    "volumen" TEXT NOT NULL,
    "contrasenaCifrada" TEXT NOT NULL,
    "usoDiscoMb" INTEGER,
    "medidoEn" TIMESTAMP(3),
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecursoDatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecursoDatosCompartido" (
    "recursoId" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecursoDatosCompartido_pkey" PRIMARY KEY ("recursoId","proyectoId")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecursoDatos_proyectoId_tipo_key" ON "RecursoDatos"("proyectoId", "tipo");

-- CreateIndex
CREATE INDEX "RecursoDatosCompartido_proyectoId_idx" ON "RecursoDatosCompartido"("proyectoId");

-- AddForeignKey
ALTER TABLE "RecursoDatos" ADD CONSTRAINT "RecursoDatos_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecursoDatosCompartido" ADD CONSTRAINT "RecursoDatosCompartido_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoDatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecursoDatosCompartido" ADD CONSTRAINT "RecursoDatosCompartido_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Límites del contrato recursos-datos.md en los planes que ya existen (el seed los mantiene).
UPDATE "Plan" SET "maxRecursosDatos" = 1, "discoDatosMb" = 512 WHERE "codigo" = 'sandbox';
UPDATE "Plan" SET "maxRecursosDatos" = 3, "discoDatosMb" = 2048 WHERE "codigo" = 'starter';
UPDATE "Plan" SET "maxRecursosDatos" = 10, "discoDatosMb" = 10240 WHERE "codigo" = 'pro';
UPDATE "Plan" SET "maxRecursosDatos" = 25, "discoDatosMb" = 25600 WHERE "codigo" = 'business';
UPDATE "Plan" SET "maxRecursosDatos" = 0, "discoDatosMb" = 25600 WHERE "codigo" = 'autoalojado';
