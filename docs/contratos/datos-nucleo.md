# Contrato · Datos del núcleo v4.1 (schema Prisma)

Versión 1 · 2026-09-27 · firma: Derek (arquitectura, segundo owner de `prisma/`) · dueño del schema: Javier (DB-01) · consumidores: Eddy (M1, M10), Eduardo (M3, M7), Derek (M4, M5, M6), Javier (M2, M9).

Este documento **firma** el modelo de datos del núcleo para que DB-01 salga el lunes sin idas y vueltas. Javier lo implementa en `apps/api/prisma/schema.prisma` y el seed; cualquier campo nuevo o renombrado pasa por aquí y se avisa a los consumidores antes de mergear (regla de [AGENTS.md](../../AGENTS.md)). Diagrama: [erd-unificado.mmd](../diagramas/compartido/erd-unificado.mmd).

## Reglas

1. **Un dueño por tabla, un solo escritor.** Otros módulos leen por el servicio que exporta el dueño, no con `prisma.<tabla>` directo.

   | Tablas | Dueño (escribe) | Lo exporta como |
   |---|---|---|
   | `Usuario`, `TokenCuenta`, `Sesion` | M1 · Eddy | `SesionGuard`, `@UsuarioActual()`, `IdentidadService` |
   | `Plan`, `Suscripcion`, `Pago` | M2 · Javier | `SuscripcionesService.asignarSandbox`, `cuotaDe` |
   | `AccionAdministrativa` (y `Usuario.estadoCuenta` al suspender) | M9 · Javier | `AdministracionService` |
   | `Proyecto`, `VariableEntorno` | M3 · Eduardo | `ProyectosService` |
   | `Despliegue`, `EtapaDespliegue`, `LineaBitacora`, `Artefacto`, `Proyecto.despliegueActivoId`, `Proyecto.receta` | M4/M5 · Derek | `ConstruccionService`, `RepositorioDespliegues` |

2. **Ids** `uuid` en texto. **Fechas** `DateTime` UTC. **Dinero** `Decimal(10,2)`, nunca `Float`.
3. **Enums de Postgres** con nombres en minúscula. Donde el valor de la API lleva guion (`por-vencer`, `en-curso`, `cambio-plan`) el enum de Prisma usa `_` y `@map("…-…")`; el repositorio traduce en el borde (`valor.replaceAll("_", "-")`). Los valores de la API son los de `apps/web/src/components/deploya/estados.ts`.
4. **Secretos:** contraseñas y tokens solo como hash; variables de entorno cifradas (AES-256-GCM, formato `v1:<iv>:<tag>:<cifrado>` en base64, clave en `CLAVE_CIFRADO_VARIABLES`); de la tarjeta solo los últimos 4 dígitos.
5. **Sin tablas fuera del núcleo:** nada de espacios de trabajo, miembros, complementos, dominios personalizados, métricas ni notificaciones persistidas. El ERD de la propuesta completa queda en el historial de git.

## Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ───────────── M1 Identidad (Eddy) ─────────────

enum Rol {
  cliente
  administrador
}

enum EstadoCuenta {
  pendiente
  activa
  suspendida
}

enum TipoTokenCuenta {
  verificacion
  recuperacion
}

model Usuario {
  id               String       @id @default(uuid())
  correo           String       @unique // normalizado en minúsculas
  nombre           String       @db.VarChar(64)
  hashContrasena   String
  rol              Rol          @default(cliente)
  estadoCuenta     EstadoCuenta @default(pendiente)
  motivoSuspension String? // lo muestra 03b; lo escribe M9
  creado           DateTime     @default(now())
  actualizado      DateTime     @updatedAt

  tokens             TokenCuenta[]
  sesiones           Sesion[]
  suscripcion        Suscripcion?
  pagos              Pago[]
  proyectos          Proyecto[]
  accionesEjecutadas AccionAdministrativa[] @relation("AdminEjecuta")
  accionesRecibidas  AccionAdministrativa[] @relation("UsuarioAfectado")
}

model TokenCuenta {
  id        String          @id @default(uuid())
  usuarioId String
  usuario   Usuario         @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  tipo      TipoTokenCuenta
  hashToken String          @unique // sha256 del token del enlace
  expira    DateTime // verificación 24 h, recuperación 30 min
  usadoEn   DateTime? // un solo uso
  creado    DateTime        @default(now())

  @@index([usuarioId, tipo])
}

model Sesion {
  id              String    @id @default(uuid())
  usuarioId       String
  usuario         Usuario   @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  hashToken       String    @unique // sha256 del valor de la cookie
  creada          DateTime  @default(now())
  ultimaActividad DateTime  @default(now()) // expira a los 7 días sin actividad
  revocadaEn      DateTime?
  agenteUsuario   String?

  @@index([usuarioId])
}

// ───────────── M2 Suscripciones (Javier) ─────────────

enum EstadoSuscripcion {
  activa
  por_vencer @map("por-vencer")
  vencida
  suspendida
  cancelada
}

enum ConceptoPago {
  contratacion
  renovacion
  cambio_plan  @map("cambio-plan")
}

enum EstadoPago {
  aprobado
  rechazado
}

model Plan {
  id                String   @id @default(uuid())
  codigo            String   @unique // sandbox | starter | pro | business
  nombre            String
  descripcion       String
  precio30          Decimal  @db.Decimal(10, 2)
  precio365         Decimal? @db.Decimal(10, 2) // null: no se vende anual (Sandbox)
  maxProyectos      Int
  cpus              Decimal  @db.Decimal(4, 2) // vCPU por proyecto
  memoriaMb         Int // por proyecto
  construccionesMes Int
  orden             Int
  activo            Boolean  @default(true)

  suscripciones        Suscripcion[] @relation("PlanActual")
  descensosProgramados Suscripcion[] @relation("PlanSiguiente")
  pagos                Pago[]
}

model Suscripcion {
  id              String            @id @default(uuid())
  usuarioId       String            @unique // una suscripción por cuenta; cambia de plan y de estado
  usuario         Usuario           @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  planId          String
  plan            Plan              @relation("PlanActual", fields: [planId], references: [id])
  estado          EstadoSuscripcion @default(activa)
  estadoDesde     DateTime          @default(now()) // gracia de 5 días y 30 días suspendida
  vigenciaDias    Int? // 30 | 365; null en Sandbox
  inicio          DateTime          @default(now())
  vence           DateTime? // null: no vence (Sandbox)
  planSiguienteId String? // descenso programado al terminar la vigencia
  planSiguiente   Plan?             @relation("PlanSiguiente", fields: [planSiguienteId], references: [id])
  creado          DateTime          @default(now())
  actualizado     DateTime          @updatedAt

  pagos Pago[]

  @@index([estado, vence])
}

model Pago {
  id                String       @id @default(uuid())
  usuarioId         String
  usuario           Usuario      @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  suscripcionId     String
  suscripcion       Suscripcion  @relation(fields: [suscripcionId], references: [id], onDelete: Cascade)
  planId            String
  plan              Plan         @relation(fields: [planId], references: [id])
  concepto          ConceptoPago
  vigenciaDias      Int
  monto             Decimal      @db.Decimal(10, 2)
  moneda            String       @default("USD") @db.Char(3)
  estado            EstadoPago
  motivoRechazo     String?
  tarjetaUltimos4   String       @db.Char(4)
  numeroComprobante String?      @unique // solo aprobados, p. ej. DPY-2026-000123
  creado            DateTime     @default(now())

  @@index([usuarioId, creado])
}

// ───────────── M9 Administración (Javier) ─────────────

model AccionAdministrativa {
  id                String   @id @default(uuid())
  adminId           String
  admin             Usuario  @relation("AdminEjecuta", fields: [adminId], references: [id])
  usuarioAfectadoId String
  usuarioAfectado   Usuario  @relation("UsuarioAfectado", fields: [usuarioAfectadoId], references: [id], onDelete: Cascade)
  accion            String // "suspender-cuenta" (única acción del núcleo)
  motivo            String
  detalle           String?
  creado            DateTime @default(now())

  @@index([usuarioAfectadoId])
}

// ───────────── M3 Proyectos (Eduardo) ─────────────

enum RecetaConstruccion {
  dockerfile
  node
  python
  go
  estatica
}

model Proyecto {
  id                 String             @id @default(uuid())
  usuarioId          String
  usuario            Usuario            @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  nombre             String             @db.VarChar(64)
  subdominio         String             @unique @db.VarChar(63) // etiqueta DNS; no cambia al renombrar
  urlRepositorio     String
  rama               String             @default("main")
  rutaDockerfile     String             @default("Dockerfile")
  puertoInterno      Int                @default(8080)
  receta             RecetaConstruccion @default(dockerfile) // la última que detectó M4
  despliegueActivoId String?            @unique // el que atiende tráfico; lo escribe M5
  despliegueActivo   Despliegue?        @relation("DespliegueActivo", fields: [despliegueActivoId], references: [id], onDelete: SetNull)
  creado             DateTime           @default(now())
  actualizado        DateTime           @updatedAt

  variables   VariableEntorno[]
  despliegues Despliegue[]      @relation("DesplieguesDelProyecto")
  artefactos  Artefacto[]

  @@unique([usuarioId, nombre])
}

model VariableEntorno {
  id           String   @id @default(uuid())
  proyectoId   String
  proyecto     Proyecto @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  clave        String   @db.VarChar(128)
  valorCifrado String
  creado       DateTime @default(now())
  actualizado  DateTime @updatedAt

  @@unique([proyectoId, clave])
}

// ───────────── M4 · M5 · M6 Motor (Derek) ─────────────

enum EstadoDespliegue {
  encolado
  construyendo
  aprovisionando
  publicando
  saludable
  fallido
  cancelado
  detenido
  revirtiendo
}

enum DisparadorDespliegue {
  alta // despliegue #1 desde el paso Revisar
  manual // botón Desplegar / Redesplegar el último commit
  reintento // reintentar un fallido (mismo commit)
  redespliegue // redesplegar un commit anterior (reconstruye)
  reversion // volver a un artefacto sin reconstruir; no consume construcciones
  variables // guardar y desplegar variables
}

enum Etapa {
  recepcion
  construccion
  ejecucion
  enrutamiento
  operacion
}

enum EstadoEtapa {
  pendiente
  en_curso   @map("en-curso")
  completada
  fallida
  omitida // recepción y construcción en una reversión
}

enum NivelBitacora {
  info
  aviso
  error
}

model Artefacto {
  id          String             @id @default(uuid())
  proyectoId  String
  proyecto    Proyecto           @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  numero      Int // = número del despliegue que lo construyó (#n)
  imagen      String // deploya/<subdominio>:<n>
  digest      String // sha256:…
  tamanoBytes BigInt
  commitSha   String             @db.VarChar(40)
  receta      RecetaConstruccion
  disponible  Boolean            @default(true) // false cuando la retención borra la imagen
  creado      DateTime           @default(now())

  despliegues Despliegue[]

  @@unique([proyectoId, numero])
}

model Despliegue {
  id            String               @id @default(uuid())
  proyectoId    String
  proyecto      Proyecto             @relation("DesplieguesDelProyecto", fields: [proyectoId], references: [id], onDelete: Cascade)
  numero        Int // #n por proyecto, consecutivo
  estado        EstadoDespliegue     @default(encolado)
  disparador    DisparadorDespliegue @default(manual)
  rama          String
  commitSha     String?              @db.VarChar(40)
  commitMensaje String?
  commitAutor   String?
  artefactoId   String? // el que construyó, o el que reusa una reversión
  artefacto     Artefacto?           @relation(fields: [artefactoId], references: [id], onDelete: SetNull)
  contenedorId  String?
  url           String?
  cpus          Decimal?             @db.Decimal(4, 2) // límites aplicados (pantalla 13)
  memoriaMb     Int?
  codigoSalida  Int?
  motivoFallo   String?
  creado        DateTime             @default(now())
  iniciado      DateTime?
  terminado     DateTime?
  actualizado   DateTime             @updatedAt

  proyectoActivo Proyecto?         @relation("DespliegueActivo")
  etapas         EtapaDespliegue[]
  lineas         LineaBitacora[]

  @@unique([proyectoId, numero])
  @@index([proyectoId, creado])
}

model EtapaDespliegue {
  despliegueId String
  despliegue   Despliegue  @relation(fields: [despliegueId], references: [id], onDelete: Cascade)
  etapa        Etapa
  estado       EstadoEtapa @default(pendiente)
  iniciada     DateTime?
  terminada    DateTime?

  @@id([despliegueId, etapa])
}

model LineaBitacora {
  despliegueId String
  despliegue   Despliegue    @relation(fields: [despliegueId], references: [id], onDelete: Cascade)
  n            Int // 1, 2, 3… por despliegue; `?desde=` filtra n > desde
  marca        DateTime
  etapa        Etapa
  nivel        NivelBitacora @default(info)
  texto        String

  @@id([despliegueId, n])
}
```

## Invariantes (las cumple el servicio dueño; las pruebas unitarias las cubren)

| # | Invariante | Dueño |
|---|---|---|
| I1 | Toda cuenta tiene exactamente una `Suscripcion`; al registrarse es Sandbox Activa con `vence = null` (`asignarSandbox`, idempotente) | M2 |
| I2 | `Pago.numeroComprobante` solo existe si `estado = aprobado` | M2 |
| I3 | Un `Proyecto` cuenta contra `Plan.maxProyectos` de la suscripción vigente | M3 (con `cuotaDe`) |
| I4 | `Despliegue.numero` = máximo del proyecto + 1, en una transacción (la `@@unique` evita carreras) | M4 |
| I5 | Cada despliegue tiene sus 5 filas de `EtapaDespliegue` desde que se crea (el contrato siempre devuelve las cinco) | M4 |
| I6 | `LineaBitacora.n` es consecutivo por despliegue y nunca se reescribe | M4 |
| I7 | Construcciones del mes = despliegues del usuario con `disparador ≠ reversion` creados desde el día 1 del mes (UTC) | M4 |
| I8 | Se conservan los 5 `Artefacto` más recientes con `disponible = true` por proyecto más el activo; al resto se le borra la imagen y pasa a `disponible = false` | M5 |
| I9 | `Proyecto.despliegueActivoId` solo apunta a un despliegue `saludable`; cambia **después** de que el nuevo pasa la salud y Traefik apunta a él | M5 |
| I10 | `Proyecto.subdominio` no cambia al renombrar | M3 |

## Seed (idempotente, `upsert` por clave natural)

| `codigo` | `nombre` | `precio30` | `precio365` | `maxProyectos` | `cpus` | `memoriaMb` | `construccionesMes` | `orden` |
|---|---|---|---|---|---|---|---|---|
| `sandbox` | Sandbox | 0.00 | — | 1 | 0.25 | 256 | 30 | 1 |
| `starter` | Starter | 5.00 | 50.00 | 3 | 0.50 | 512 | 150 | 2 |
| `pro` | Pro | 15.00 | 150.00 | 10 | 1.00 | 1024 | 500 | 3 |
| `business` | Business | 40.00 | 400.00 | 25 | 2.00 | 2048 | 2000 | 4 |

- Precio de 365 días: propuesta 10 × el mensual (dos meses gratis). Lo decide Javier; si cambia, solo cambia esta tabla.
- Administrador: `ADMIN_CORREO` (por defecto `admin@deploya.app`) y `ADMIN_CLAVE` (obligatoria, sin valor por defecto), `rol = administrador`, `estadoCuenta = activa`, con Sandbox.
- Cliente de demostración para Eduardo hasta que llegue el guard: `cliente@deploya.app`, `activa`, con Sandbox.
- Avance 2 (M5-03): `vencida@deploya.app` y `suspendida@deploya.app` en **Starter** de 30 días con `vence` en el pasado, para demostrar los bloqueos antes del ciclo §4.4 (M2-05). `vencida@`: `vence` = hace 2 días, **Vencida** desde `vence`. `suspendida@`: `vence` = hace 10 días, **Suspendida** desde `vence` + 5 días (gracia). En ambas `inicio` = `vence` − 30 días y sin descenso pendiente. Solo se escriben si la cuenta sigue con la Sandbox recién asignada (`vence` nulo), así una segunda corrida no las toca. Misma contraseña de demo que `cliente@deploya.app`.
- El hash de contraseña del seed usa la **misma** función que M1: scrypt de `node:crypto`, formato `scrypt:<sal>:<hash>` en hex (`HashContrasenaScrypt`).

## Servicios que se exportan sobre estos datos

```ts
// M2 → M1 (registro), M3, M4, M5
export type EstadoSuscripcionValor = "activa" | "por-vencer" | "vencida" | "suspendida" | "cancelada";

export interface Cuota {
  plan: { codigo: string; nombre: string };
  estado: EstadoSuscripcionValor;
  vence: Date | null;
  maxProyectos: number;
  cpus: number; // 0.25 | 0.5 | 1 | 2
  memoriaMb: number; // 256 | 512 | 1024 | 2048
  construccionesMes: number;
}

SuscripcionesService.asignarSandbox(usuarioId: string): Promise<void>; // idempotente
SuscripcionesService.cuotaDe(usuarioId: string): Promise<Cuota>; // lanza SuscripcionNoEncontrada

// M4 → M3 y web: docs/contratos/despliegues.md
```

## Cambios frente al schema de arranque

| Antes | Ahora | Por qué |
|---|---|---|
| `Usuario.fechaAlta` | `creado` / `actualizado` | Misma convención en todas las tablas |
| `Plan.precio`, `vigenciaDias` | `precio30`, `precio365`, límites como columnas | Solo hay 4 recursos fijos (alcance v4.1); columnas tipadas en vez de filas `LimitePlan` |
| `Proyecto.tipoFuente`, `recetaConstruccion` (texto), `comandoArranque`, `puertoHttp` | `receta` (enum), `rama`, `rutaDockerfile`, `puertoInterno`, `subdominio` | Solo repo público; la receta la detecta M4 |
| `Despliegue.estado = "Encolado"` (texto) | enum en minúscula, `numero`, commit, artefacto, límites, código de salida | Contrato de despliegues y pantallas 12–14 |
| — | `EtapaDespliegue`, `LineaBitacora`, `Artefacto` | Riel de cinco etapas, bitácora con `desde=`, versionado y reversión |

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1 | 2026-09-27 | Firma inicial para DB-01 (incluye detección de stack y reversión, que volvieron al núcleo) |
| 1.1 | 2026-10-02 | Seed: cuentas de demo Vencida y Suspendida para M5-03. Sin cambios de tablas en el Avance 2 |
| 1.2 | 2026-10-06 | Seed: las cuentas Vencida y Suspendida quedan en Starter de 30 días con `vence` en el pasado (gracia de 5 días); el hash del seed es scrypt, igual que M1. Sin cambios de tablas |
