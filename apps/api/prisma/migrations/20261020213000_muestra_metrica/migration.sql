-- CreateTable
CREATE TABLE "MuestraMetrica" (
    "despliegueId" TEXT NOT NULL,
    "tomada" TIMESTAMP(3) NOT NULL,
    "cpu" DECIMAL(6,3) NOT NULL,
    "memoriaMb" INTEGER NOT NULL,

    CONSTRAINT "MuestraMetrica_pkey" PRIMARY KEY ("despliegueId","tomada")
);

-- CreateIndex
CREATE INDEX "MuestraMetrica_tomada_idx" ON "MuestraMetrica"("tomada");

-- AddForeignKey
ALTER TABLE "MuestraMetrica" ADD CONSTRAINT "MuestraMetrica_despliegueId_fkey" FOREIGN KEY ("despliegueId") REFERENCES "Despliegue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
