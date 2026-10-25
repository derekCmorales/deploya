-- SP-17: correo de la instalación (asistente 31). La clave del SMTP se guarda cifrada.
ALTER TABLE "ConfiguracionInstalacion" ADD COLUMN "smtpHost" TEXT,
ADD COLUMN "smtpPuerto" INTEGER,
ADD COLUMN "smtpUsuario" TEXT,
ADD COLUMN "smtpClaveCifrada" TEXT,
ADD COLUMN "smtpRemitente" TEXT,
ADD COLUMN "sinCorreo" BOOLEAN NOT NULL DEFAULT false;
