-- SP-03 · fecha del último cambio de contraseña; null = nunca la ha cambiado
ALTER TABLE "Usuario" ADD COLUMN "contrasenaCambiadaEn" TIMESTAMP(3);
