-- SP-18 · invitaciones de registro de una instalación autoalojada (un solo uso, 7 días)
CREATE TABLE "Invitacion" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "hashToken" TEXT NOT NULL,
    "vence" TIMESTAMP(3) NOT NULL,
    "usada" TIMESTAMP(3),
    "revocada" TIMESTAMP(3),
    "creadaPor" TEXT NOT NULL,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitacion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invitacion_hashToken_key" ON "Invitacion"("hashToken");
CREATE INDEX "Invitacion_vence_idx" ON "Invitacion"("vence");
