# Tasks

Cada tarea de código tiene su tarea de pruebas. Pruebas sin Docker, red, base ni reloj reales (stubs de los puertos, `Reloj` falso). Nombre de cada `it(...)` = nombre del escenario.

## 1. ENG-01 · Compose y ejemplo (lunes)

- [x] 1.1 `docker-compose.yml`: servicio `worker` (misma imagen, `command: node dist/trabajador.js`, `docker.sock`, volumen `traefik_dinamico`, `MOTOR_ADAPTADORES=docker`), `traefik:v3` (proveedor de archivo en `/traefik/dinamico`, `:80`), `mailpit` (`1025`, `8025`); `container_name` fijos para `deploya-traefik` y `deploya-worker`
- [x] 1.2 `Dockerfile.api`: `apk add --no-cache git` en la etapa final; `infra/traefik/traefik.yml`
- [x] 1.3 `.env.example` con `MOTOR_ADAPTADORES`, `DOMINIO_APPS`, `ESQUEMA_APPS`, `TRAEFIK_DINAMICO`, `TRAEFIK_CONTENEDOR`, `TRABAJADOR_CONTENEDOR`, `TRABAJADOR_CONCURRENCIA`
- [x] 1.4 Publicado: https://github.com/derekCmorales/hola-deploya (ramas `main`, `roto`, `sin-dockerfile`; `ClonadorGit` probado contra las tres)
- [x] 1.5 Verificar: `docker compose up --build` levanta los 7 servicios (probado; smoke de CI en el PR)

## 2. Dominio del motor (lunes)

- [x] 2.1 `construccion/dominio/`: `EstadoDespliegue`, `Etapa`, `EstadoEtapa`, `TransicionesDespliegue.transicionar(de, a)` y `etapaDe(estado)`, errores de dominio, `motor.constantes.ts`
- [x] 2.2 Pruebas: «Transición válida», «Transición inválida» y una tabla con todas las transiciones del diagrama de estados
- [x] 2.3 `compartido/reloj.ts` (`Reloj`, `RelojSistema`, `RelojFijo` para pruebas)

## 3. Puertos, stubs y binding (lunes)

- [x] 3.1 Puertos con la firma del design §3; mover `ColaConstruccionStub` a `ColaMemoria` detrás de `ColaConstruccionPuerto`; stubs con la misma firma para cada puerto
- [x] 3.2 `AdaptersModule.forRoot()` con `MOTOR_ADAPTADORES`
- [x] 3.3 Pruebas: el binding elige stub o real según la variable; cada stub cumple su puerto (misma forma de resultado y mismos errores)
- [x] 3.4 Actualizar `apps/api/src/adapters/README.md`

## 4. M4-01 · API de despliegues (lunes–martes)

- [x] 4.1 `ConstruccionService.crearDespliegue`, `consultar`, `bitacoraDesde` + `DesplieguesController` con las tres rutas del contrato v1 y el mapeo de errores
- [x] 4.2 Pruebas: «Encolar», «Números consecutivos», «Proyecto ajeno», «Etapas en curso», «Leer desde una posición», «Despliegue terminado»
- [x] 4.3 `RepositorioDesplieguesMemoria` y `RepositorioDesplieguesPrisma` (en `main` con `feat/m1-sesion`); traducción `en_curso` ↔ `en-curso`
- [x] 4.4 Prueba del repositorio en memoria: `lineasDesde` respeta `desde` y `limite`

## 5. M4-01 · Trabajador y construcción (martes)

- [x] 5.1 `trabajador.ts`, `TrabajadorModule`, `ProcesadorDespliegues`, `PipelineDespliegue`, `PasoRecepcion`, `PasoConstruccion`, `BitacoraEnLotes`
- [x] 5.2 `ColaBullMq`, `ClonadorGit`, `ConstructorDocker`
- [x] 5.3 Pruebas del pipeline con stubs: «Construcción exitosa», «Construcción fallida» (código 127), «Tiempo de construcción agotado», «Repositorio que no se puede clonar», «Rama sin Dockerfile»; la bitácora se escribe en lotes

## 6. M5-01 · Ejecución y salud (martes)

- [x] 6.1 `OrquestacionService.aprovisionar`, `LimitesContenedor`, `PasoEjecucion`, `PasoOperacion`; `ContenedorDocker` y `VerificacionHttp`
- [x] 6.2 Pruebas: «Arranque con cuota» (los valores de `cuotaDe` llegan a `ContenedorPuerto.crear`), «Sin privilegios y en su red», «Contenedor saludable», «Contenedor que no responde» (con `Reloj` falso)

## 7. Ruta local (martes, si llega)

- [x] 7.1 `EnrutamientoService`, `PasoEnrutamiento`, `EnrutamientoTraefikArchivo`
- [x] 7.2 Pruebas: «Publicación» (el stub recibe subdominio, host y puerto; la URL se guarda), «Renombrar no cambia la URL»

## 8. Cierre (martes 20:00)

- [x] 8.1 `pnpm check` en verde; cobertura ≥ 80 % en `construccion/`, `orquestacion/`, `enrutamiento/` (dominio y servicios)
- [ ] 8.2 En compose limpio (**parcial**: build, límites, salud, ruta y app en `hola-deploya.localhost` probados dentro del worker; `roto` → 127 probado; falta el recorrido desde la API, que espera Prisma y el repo público): `hola-deploya` (rama `main`) termina Saludable y responde en `hola-deploya.localhost`; rama `roto` termina Fallido con código 127; `docker inspect` muestra `NanoCpus` y `Memory`
- [ ] 8.3 ADR 0002, 0005 y 0006 pasan a Aceptado al mergear
- [ ] 8.4 `/opsx-archive` tras el merge

## Notas de implementación

- Se agregaron `ProyectosLecturaPuerto` y `CuotaPlanPuerto` (puertos estrechos hacia M3 y M2) para no bloquearse; design §11.
- `@UsuarioSolicitante()` responde 401 sin sesión hasta que llegue `@UsuarioActual()` de M1 (martes).
- `ioredis` es dependencia explícita (BullMQ 6 la necesita).
