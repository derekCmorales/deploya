-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('cliente', 'administrador');

-- CreateEnum
CREATE TYPE "EstadoCuenta" AS ENUM ('pendiente', 'activa', 'suspendida');

-- CreateEnum
CREATE TYPE "TipoTokenCuenta" AS ENUM ('verificacion', 'recuperacion');

-- CreateEnum
CREATE TYPE "EstadoSuscripcion" AS ENUM ('activa', 'por-vencer', 'vencida', 'suspendida', 'cancelada');

-- CreateEnum
CREATE TYPE "ConceptoPago" AS ENUM ('contratacion', 'renovacion', 'cambio-plan');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('aprobado', 'rechazado');

-- CreateEnum
CREATE TYPE "RecetaConstruccion" AS ENUM ('dockerfile', 'node', 'python', 'go', 'estatica');

-- CreateEnum
CREATE TYPE "EstadoDespliegue" AS ENUM ('encolado', 'construyendo', 'aprovisionando', 'publicando', 'saludable', 'fallido', 'cancelado', 'detenido', 'revirtiendo');

-- CreateEnum
CREATE TYPE "DisparadorDespliegue" AS ENUM ('alta', 'manual', 'reintento', 'redespliegue', 'reversion', 'variables');

-- CreateEnum
CREATE TYPE "Etapa" AS ENUM ('recepcion', 'construccion', 'ejecucion', 'enrutamiento', 'operacion');

-- CreateEnum
CREATE TYPE "EstadoEtapa" AS ENUM ('pendiente', 'en-curso', 'completada', 'fallida', 'omitida');

-- CreateEnum
CREATE TYPE "NivelBitacora" AS ENUM ('info', 'aviso', 'error');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "nombre" VARCHAR(64) NOT NULL,
    "hashContrasena" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'cliente',
    "estadoCuenta" "EstadoCuenta" NOT NULL DEFAULT 'pendiente',
    "motivoSuspension" TEXT,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenCuenta" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoTokenCuenta" NOT NULL,
    "hashToken" TEXT NOT NULL,
    "expira" TIMESTAMP(3) NOT NULL,
    "usadoEn" TIMESTAMP(3),
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenCuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sesion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "hashToken" TEXT NOT NULL,
    "creada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaActividad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revocadaEn" TIMESTAMP(3),
    "agenteUsuario" TEXT,

    CONSTRAINT "Sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio30" DECIMAL(10,2) NOT NULL,
    "precio365" DECIMAL(10,2),
    "maxProyectos" INTEGER NOT NULL,
    "cpus" DECIMAL(4,2) NOT NULL,
    "memoriaMb" INTEGER NOT NULL,
    "construccionesMes" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suscripcion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "estado" "EstadoSuscripcion" NOT NULL DEFAULT 'activa',
    "estadoDesde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigenciaDias" INTEGER,
    "inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vence" TIMESTAMP(3),
    "planSiguienteId" TEXT,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "suscripcionId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "concepto" "ConceptoPago" NOT NULL,
    "vigenciaDias" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "moneda" CHAR(3) NOT NULL DEFAULT 'USD',
    "estado" "EstadoPago" NOT NULL,
    "motivoRechazo" TEXT,
    "tarjetaUltimos4" CHAR(4) NOT NULL,
    "numeroComprobante" TEXT,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccionAdministrativa" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "usuarioAfectadoId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "detalle" TEXT,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccionAdministrativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proyecto" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombre" VARCHAR(64) NOT NULL,
    "subdominio" VARCHAR(63) NOT NULL,
    "urlRepositorio" TEXT NOT NULL,
    "rama" TEXT NOT NULL DEFAULT 'main',
    "rutaDockerfile" TEXT NOT NULL DEFAULT 'Dockerfile',
    "puertoInterno" INTEGER NOT NULL DEFAULT 8080,
    "receta" "RecetaConstruccion" NOT NULL DEFAULT 'dockerfile',
    "despliegueActivoId" TEXT,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariableEntorno" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "clave" VARCHAR(128) NOT NULL,
    "valorCifrado" TEXT NOT NULL,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VariableEntorno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artefacto" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "imagen" TEXT NOT NULL,
    "digest" TEXT NOT NULL,
    "tamanoBytes" BIGINT NOT NULL,
    "commitSha" VARCHAR(40) NOT NULL,
    "receta" "RecetaConstruccion" NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Artefacto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Despliegue" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "estado" "EstadoDespliegue" NOT NULL DEFAULT 'encolado',
    "disparador" "DisparadorDespliegue" NOT NULL DEFAULT 'manual',
    "rama" TEXT NOT NULL,
    "commitSha" VARCHAR(40),
    "commitMensaje" TEXT,
    "commitAutor" TEXT,
    "artefactoId" TEXT,
    "contenedorId" TEXT,
    "url" TEXT,
    "cpus" DECIMAL(4,2),
    "memoriaMb" INTEGER,
    "codigoSalida" INTEGER,
    "motivoFallo" TEXT,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "iniciado" TIMESTAMP(3),
    "terminado" TIMESTAMP(3),
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Despliegue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtapaDespliegue" (
    "despliegueId" TEXT NOT NULL,
    "etapa" "Etapa" NOT NULL,
    "estado" "EstadoEtapa" NOT NULL DEFAULT 'pendiente',
    "iniciada" TIMESTAMP(3),
    "terminada" TIMESTAMP(3),

    CONSTRAINT "EtapaDespliegue_pkey" PRIMARY KEY ("despliegueId","etapa")
);

-- CreateTable
CREATE TABLE "LineaBitacora" (
    "despliegueId" TEXT NOT NULL,
    "n" INTEGER NOT NULL,
    "marca" TIMESTAMP(3) NOT NULL,
    "etapa" "Etapa" NOT NULL,
    "nivel" "NivelBitacora" NOT NULL DEFAULT 'info',
    "texto" TEXT NOT NULL,

    CONSTRAINT "LineaBitacora_pkey" PRIMARY KEY ("despliegueId","n")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "TokenCuenta_hashToken_key" ON "TokenCuenta"("hashToken");

-- CreateIndex
CREATE INDEX "TokenCuenta_usuarioId_tipo_idx" ON "TokenCuenta"("usuarioId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Sesion_hashToken_key" ON "Sesion"("hashToken");

-- CreateIndex
CREATE INDEX "Sesion_usuarioId_idx" ON "Sesion"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_codigo_key" ON "Plan"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Suscripcion_usuarioId_key" ON "Suscripcion"("usuarioId");

-- CreateIndex
CREATE INDEX "Suscripcion_estado_vence_idx" ON "Suscripcion"("estado", "vence");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_numeroComprobante_key" ON "Pago"("numeroComprobante");

-- CreateIndex
CREATE INDEX "Pago_usuarioId_creado_idx" ON "Pago"("usuarioId", "creado");

-- CreateIndex
CREATE INDEX "AccionAdministrativa_usuarioAfectadoId_idx" ON "AccionAdministrativa"("usuarioAfectadoId");

-- CreateIndex
CREATE UNIQUE INDEX "Proyecto_subdominio_key" ON "Proyecto"("subdominio");

-- CreateIndex
CREATE UNIQUE INDEX "Proyecto_despliegueActivoId_key" ON "Proyecto"("despliegueActivoId");

-- CreateIndex
CREATE UNIQUE INDEX "Proyecto_usuarioId_nombre_key" ON "Proyecto"("usuarioId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "VariableEntorno_proyectoId_clave_key" ON "VariableEntorno"("proyectoId", "clave");

-- CreateIndex
CREATE UNIQUE INDEX "Artefacto_proyectoId_numero_key" ON "Artefacto"("proyectoId", "numero");

-- CreateIndex
CREATE INDEX "Despliegue_proyectoId_creado_idx" ON "Despliegue"("proyectoId", "creado");

-- CreateIndex
CREATE UNIQUE INDEX "Despliegue_proyectoId_numero_key" ON "Despliegue"("proyectoId", "numero");

-- AddForeignKey
ALTER TABLE "TokenCuenta" ADD CONSTRAINT "TokenCuenta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suscripcion" ADD CONSTRAINT "Suscripcion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suscripcion" ADD CONSTRAINT "Suscripcion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suscripcion" ADD CONSTRAINT "Suscripcion_planSiguienteId_fkey" FOREIGN KEY ("planSiguienteId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_suscripcionId_fkey" FOREIGN KEY ("suscripcionId") REFERENCES "Suscripcion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccionAdministrativa" ADD CONSTRAINT "AccionAdministrativa_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccionAdministrativa" ADD CONSTRAINT "AccionAdministrativa_usuarioAfectadoId_fkey" FOREIGN KEY ("usuarioAfectadoId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_despliegueActivoId_fkey" FOREIGN KEY ("despliegueActivoId") REFERENCES "Despliegue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariableEntorno" ADD CONSTRAINT "VariableEntorno_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artefacto" ADD CONSTRAINT "Artefacto_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despliegue" ADD CONSTRAINT "Despliegue_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despliegue" ADD CONSTRAINT "Despliegue_artefactoId_fkey" FOREIGN KEY ("artefactoId") REFERENCES "Artefacto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtapaDespliegue" ADD CONSTRAINT "EtapaDespliegue_despliegueId_fkey" FOREIGN KEY ("despliegueId") REFERENCES "Despliegue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaBitacora" ADD CONSTRAINT "LineaBitacora_despliegueId_fkey" FOREIGN KEY ("despliegueId") REFERENCES "Despliegue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
