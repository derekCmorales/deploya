# Tasks

Cada tarea de código tiene su tarea de pruebas. Pruebas sin Docker, red, base ni reloj reales (stubs de los puertos, `Reloj` falso). Nombre de cada `it(...)` = nombre del escenario.

## 1. ENG-01 · Compose y ejemplo (lunes)

- [ ] 1.1 `docker-compose.yml`: servicio `worker` (misma imagen, `command: node dist/trabajador.js`, `docker.sock`, volumen `traefik_dinamico`, `MOTOR_ADAPTADORES=docker`), `traefik:v3` (proveedor de archivo en `/traefik/dinamico`, `:80`), `mailpit` (`1025`, `8025`); `container_name` fijos para `deploya-traefik` y `deploya-worker`
- [ ] 1.2 `Dockerfile.api`: `apk add --no-cache git` en la etapa final; `infra/traefik/traefik.yml`
- [ ] 1.3 `.env.example` con `MOTOR_ADAPTADORES`, `DOMINIO_APPS`, `ESQUEMA_APPS`, `TRAEFIK_DINAMICO`, `TRAEFIK_CONTENEDOR`, `TRABAJADOR_CONTENEDOR`, `TRABAJADOR_CONCURRENCIA`
- [ ] 1.4 Publicar `ejemplos/hola-deploya` con `scripts/publicar-hola-deploya.sh` (ramas `main`, `roto`, `sin-dockerfile`)
- [ ] 1.5 Verificar: `docker compose up --build` levanta los 7 servicios; smoke de CI sigue verde

## 2. Dominio del motor (lunes)

- [ ] 2.1 `construccion/dominio/`: `EstadoDespliegue`, `Etapa`, `EstadoEtapa`, `TransicionesDespliegue.transicionar(de, a)` y `etapaDe(estado)`, errores de dominio, `motor.constantes.ts`
- [ ] 2.2 Pruebas: «Transición válida», «Transición inválida» y una tabla con todas las transiciones del diagrama de estados
- [ ] 2.3 `compartido/reloj.ts` (`Reloj`, `RelojSistema`, `RelojFijo` para pruebas)

## 3. Puertos, stubs y binding (lunes)

- [ ] 3.1 Puertos con la firma del design §3; mover `ColaConstruccionStub` a `ColaMemoria` detrás de `ColaConstruccionPuerto`; stubs con la misma firma para cada puerto
- [ ] 3.2 `AdaptersModule.forRoot()` con `MOTOR_ADAPTADORES`
- [ ] 3.3 Pruebas: el binding elige stub o real según la variable; cada stub cumple su puerto (misma forma de resultado y mismos errores)
- [ ] 3.4 Actualizar `apps/api/src/adapters/README.md`

## 4. M4-01 · API de despliegues (lunes–martes)

- [ ] 4.1 `ConstruccionService.crearDespliegue`, `consultar`, `bitacoraDesde` + `DesplieguesController` con las tres rutas del contrato v1 y el mapeo de errores
- [ ] 4.2 Pruebas: «Encolar», «Números consecutivos», «Proyecto ajeno», «Etapas en curso», «Leer desde una posición», «Despliegue terminado»
- [ ] 4.3 `RepositorioDesplieguesMemoria` (pruebas) y `RepositorioDesplieguesPrisma` (cuando DB-01 esté en `main`); traducción `en_curso` ↔ `en-curso`
- [ ] 4.4 Prueba del repositorio en memoria: `lineasDesde` respeta `desde` y `limite`

## 5. M4-01 · Trabajador y construcción (martes)

- [ ] 5.1 `trabajador.ts`, `TrabajadorModule`, `ProcesadorDespliegues`, `PipelineDespliegue`, `PasoRecepcion`, `PasoConstruccion`, `BitacoraEnLotes`
- [ ] 5.2 `ColaBullMq`, `ClonadorGit`, `ConstructorDocker`
- [ ] 5.3 Pruebas del pipeline con stubs: «Construcción exitosa», «Construcción fallida» (código 127), «Tiempo de construcción agotado», «Repositorio que no se puede clonar», «Rama sin Dockerfile»; la bitácora se escribe en lotes

## 6. M5-01 · Ejecución y salud (martes)

- [ ] 6.1 `OrquestacionService.aprovisionar`, `LimitesContenedor`, `PasoEjecucion`, `PasoOperacion`; `ContenedorDocker` y `VerificacionHttp`
- [ ] 6.2 Pruebas: «Arranque con cuota» (los valores de `cuotaDe` llegan a `ContenedorPuerto.crear`), «Sin privilegios y en su red», «Contenedor saludable», «Contenedor que no responde» (con `Reloj` falso)

## 7. Ruta local (martes, si llega)

- [ ] 7.1 `EnrutamientoService`, `PasoEnrutamiento`, `EnrutamientoTraefikArchivo`
- [ ] 7.2 Pruebas: «Publicación» (el stub recibe subdominio, host y puerto; la URL se guarda), «Renombrar no cambia la URL»

## 8. Cierre (martes 20:00)

- [ ] 8.1 `pnpm check` en verde; cobertura ≥ 80 % en `construccion/`, `orquestacion/`, `enrutamiento/` (dominio y servicios)
- [ ] 8.2 En compose limpio: `hola-deploya` (rama `main`) termina Saludable y responde en `hola-deploya.localhost`; rama `roto` termina Fallido con código 127; `docker inspect` muestra `NanoCpus` y `Memory`
- [ ] 8.3 ADR 0002, 0005 y 0006 pasan a Aceptado al mergear
- [ ] 8.4 `/opsx-archive` tras el merge
