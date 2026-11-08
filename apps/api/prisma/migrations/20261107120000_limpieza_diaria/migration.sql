-- EST-01b: limpieza diaria. Cuándo corrió por última vez y cuántas filas borró (pantalla 32).
ALTER TABLE "ConfiguracionInstalacion" ADD COLUMN "ultimaLimpieza" TIMESTAMP(3),
ADD COLUMN "filasLimpiadas" INTEGER;
