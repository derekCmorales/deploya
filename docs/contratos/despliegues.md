# Contrato · API de despliegues (M4 → web, M3 → M4)

Versión 3 · dueño: Derek · consumidores: Eduardo (web, M3). Cambiarlo exige avisar antes de mergear. Specs: [motor-construccion](../../openspec/specs/motor-construccion/spec.md), [orquestacion](../../openspec/specs/orquestacion/spec.md). Datos: [datos-nucleo.md](datos-nucleo.md).

**v1 no cambia para el Avance 1.** La v2 solo **agrega**: detección de stack (A2), acciones (A2–A3), artefactos y reversión (A3), y el estado `revirtiendo`. Nada de v1 se renombra ni se quita.

**v2.1 (Avance 2)** agrega la consulta por número (M7-01), las variables de M3 → M5 (M3-03) y `BloqueosService` (M5-03), y cambia `detener` de 200 a **202**: la API encola la acción y no espera a Docker (M5-02). Changes: `feat-m7-vista-despliegue`, `feat-m3-variables-cifradas`, `feat-m5-acciones-contenedor`, `feat-m5-bloqueos-cuota`.

**v3 (Avance 3)** solo **agrega**: historial y resumen del proyecto (M7-02), códigos de cancelar y redesplegar (M4-02), configuración del proyecto (M3-04), consumo y actividad (M7-03), `certificado` en la vista (M6-02) y el servicio de M5 que detiene y reanuda los contenedores de un cliente (M2-05, M9-02). Changes: `feat-m7-resumen-historial`, `feat-m4-acciones-despliegue`, `feat-m5-reversion-instantanea`, `feat-m3-configuracion-proyecto`, `feat-m7-consumo-actividad`, `feat-m6-vps-https`, `feat-m2-ciclo-suscripcion`, `feat-m9-usuarios-suspension`.

## Servicio interno (M3 → M4)

```ts
// v1 · A1
ConstruccionService.crearDespliegue(
  proyectoId: string,
  disparador: "alta" | "manual" | "variables" = "manual",
): Promise<{ id: string; numero: number; estado: "encolado" }>

// v1 · A1 — para `ultimoDespliegue` de GET /proyectos (pantalla 10). Proyectos sin despliegues no vienen.
ConstruccionService.ultimosDespliegues(proyectoIds: string[]):
  Promise<Record<string, { id; numero; estado; etapas: [{ nombre, estado, duracionMs }]; creado }>>

// v2 · A2 — M3 lo usa en el paso 11a para mostrar «Dockerfile detectado» o «Stack detectado»
DeteccionStackService.detectar(fuente: LectorFuente, rutaDockerfile = "Dockerfile"): Promise<ResultadoDeteccion>

export abstract class LectorFuente {          // M3 lo implementa sobre la API pública de GitHub
  abstract existe(ruta: string): Promise<boolean>;
  abstract leer(ruta: string): Promise<string | null>;   // null si no existe
}

export interface ResultadoDeteccion {
  receta: "dockerfile" | "node" | "python" | "go" | "estatica";
  descripcion: string;        // «Dockerfile en la raíz» · «Node.js 22 · package.json con script start»
  puertoSugerido: number;     // EXPOSE del Dockerfile o el de la receta (8080)
  evidencia: string[];        // archivos que decidieron: ["package.json", "package-lock.json"]
  nombre: string;             // v2.1 · «Node.js 22» (bitácora: «Stack detectado: Node.js 22 · receta Deploya»)
  dockerfile: DockerfileReceta | null;  // v3.4 · base + capas comunes (Decorator); el trabajador agrega etiquetas y lo escribe como Dockerfile.deploya; null si manda el del repo (M3 lo ignora)
}
// Sin Dockerfile ni stack reconocido: lanza StackNoReconocido → 11e «falta Dockerfile y no se reconoce el stack»
// StackNoReconocido.pista: «agrega un script start o un Dockerfile» (Node sin start), etc. M3 la muestra en 11e.
// Exportados por ConstruccionModule: DeteccionStackService; LectorFuente vive en construccion/puertos/lector-fuente.puerto.ts
```

`DELETE /proyectos/:id` de M3 llama a `AccionesProyectoService.pedirEliminacion({ id, subdominio })` (exportado por M5, A2) antes de borrar las filas: el trabajador quita la ruta, los contenedores y las imágenes `deploya/<subdominio>:*`.

`POST /proyectos` de M3 llama a `crearDespliegue(id, "alta")` después de persistir el proyecto. Rechaza con **409** si la suscripción está Vencida o Suspendida o se agotaron las construcciones del mes (A2, M5-03), con cuerpo `{ codigo: "suscripcion-no-permite" | "cuota-construcciones-agotada", mensaje }`.

```ts
// v2.1 · A2 · M5 → M3 y M4 (M5-03). M3 lo llama ANTES de persistir el alta; crearDespliegue lo llama siempre.
BloqueosService.verificar(usuarioId: string): Promise<void>
// lanza SuscripcionNoPermite (Vencida o Suspendida) o CuotaConstruccionesAgotada
// construcciones del mes = invariante I7 de datos-nucleo.md (mes calendario UTC, disparador ≠ reversion)
// Exportado por OrquestacionModule. Sus errores salen como 409 { codigo, mensaje } en CUALQUIER ruta
// (filtro global RechazosOrquestacionFilter): M3 no necesita traducirlos. Bloquean también "cancelada".

// v2.1 · A2 · M3 → M5 (M3-03). M5 lo envuelve con su puerto VariablesEntornoPuerto en PasoEjecucion.
VariablesProyectoService.descifradasDe(proyectoId: string): Promise<Record<string, string>>
// lanza VariableIlegible si un valor fue alterado → el despliegue queda Fallido con motivo «variable ilegible»
// la bitácora registra solo «N variables aplicadas»; PORT la pone el motor con puertoInterno
// M5: VariablesEntornoPuerto.deProyecto(proyectoId). El adaptador sobre descifradasDe traduce
// VariableIlegible (M3) a VariablesIlegibles (FalloDespliegue en Ejecución, motivo «Variable ilegible»)
```

```ts
// v3 · A3 · M5 → M2 (ciclo §4.4) y M9 (suspender cuenta). Exportado por OrquestacionModule.
AccionesProyectoService.detenerTodosDe(usuarioId: string): Promise<{ encolados: number }>
// un trabajo «detener» por proyecto con despliegue activo Saludable; los demás se omiten
AccionesProyectoService.reanudarTodosDe(usuarioId: string): Promise<{ encolados: number }>
// un trabajo «reiniciar» por proyecto con despliegue activo Detenido
// M2 y M9 los ven por ContenedoresClientePuerto { detenerTodos, reanudarTodos }: puerto y adaptador ContenedoresClienteM5
// viven en orquestacion/ y OrquestacionModule exporta el token. Inyéctenlo desde un módulo que importe OrquestacionModule
// (OrquestacionModule ya importa SuscripcionesModule: el ciclo se rompe con un módulo del ciclo que importe a ambos).
```

### Variables de entorno (M3, HTTP · v2.1 · A2)

```text
GET  /proyectos/:id/variables              → 200 [{ clave, actualizado }]          · nunca el valor
GET  /proyectos/:id/variables/:clave       → 200 { clave, valor }                   · «Mostrar», solo el dueño
PUT  /proyectos/:id/variables              body { variables: [{ clave, valor? }], desplegar?: boolean }
                                           → 200 { variables: [{ clave, actualizado }], despliegue: { id, numero, estado } | null }
                                           · reemplaza el conjunto; sin `valor` conserva el guardado
                                           · 400 { codigo: "ClaveInvalida" | "ClaveReservada" | "ValorDemasiadoLargo" | "DemasiadasVariables" }
                                           · con desplegar: true, los mismos 409 que crearDespliegue
POST /proyectos                            body agrega variables?: [{ clave, valor }]   (paso 11c)
```

## HTTP (requiere sesión; solo el dueño del proyecto; si no, 404)

Sesión: las rutas llevan `SesionGuard` de M1 y leen el usuario con `@UsuarioActual("id")`. Sin la cookie `deploya_sesion` de una sesión vigente responden 401 (`codigo: "SinSesion"`). La web manda la cookie con `credentials: "include"`.

### v1 · Avance 1

```text
POST /proyectos/:id/despliegues
  → 201 { id, numero, estado }

GET  /despliegues/:id
  → 200 {
      id, numero, proyectoId,
      estado: "encolado" | "construyendo" | "aprovisionando" | "publicando" | "saludable" | "fallido" | "cancelado" | "detenido"
              | "revirtiendo",                                   // v2
      disparador: "alta" | "manual" | "reintento" | "redespliegue" | "reversion" | "variables",   // v2
      commit: { sha, mensaje, rama, autor } | null,              // null mientras está encolado
      url: string | null,
      imagen: { numero, digest, tamanoBytes, receta } | null,    // numero y receta: v2
      recursos: { cpus, memoriaMb } | null,                      // v2, pantalla 13
      codigoSalida: number | null,
      motivoFallo: string | null,                                // v2, pantalla 12c
      creado, terminado,
      etapas: [
        { nombre: "recepcion" | "construccion" | "ejecucion" | "enrutamiento" | "operacion",
          estado: "pendiente" | "en-curso" | "completada" | "fallida" | "omitida",   // omitida: v2
          duracionMs: number | null }
      ]
    }

GET  /despliegues/:id/bitacora?desde=<n>
  → 200 { lineas: [{ n, marca, etapa, texto, nivel: "info" | "aviso" | "error" }], siguiente: number, terminado: boolean }
```

- `desde` es el último `n` recibido (0 al empezar). El panel pregunta cada 3 s mientras `terminado` sea `false`. Máximo 500 líneas por respuesta; `siguiente` = último `n` devuelto.
- `marca` es ISO 8601 con milisegundos; la web la muestra como `HH:mm:ss.SSS`.
- `etapas` siempre trae las cinco, en orden, para `RielEtapas`.
- Los valores de `estado` coinciden con `components/deploya/estados.ts`. En la base los enums van en minúscula ([datos-nucleo.md](datos-nucleo.md)); el repositorio traduce `en_curso` → `en-curso`.
- Campos marcados v2 pueden llegar antes; la web los ignora si no los usa todavía.

### v2 · Avances 2 y 3

```text
POST /despliegues/:id/cancelar          (A3, M4-02) → 200 { estado: "cancelado" }      · 409 si ya pasó de construyendo
POST /despliegues/:id/reintentar        (A3, M4-02) → 201 { id, numero, estado }       · solo desde "fallido"; mismo commit
POST /proyectos/:id/redespliegues       (A3, M4-02) body { commitSha } → 201 { id, numero, estado }   · reconstruye
POST /proyectos/:id/reiniciar           (A2, M5-02) → 202 {}                             · reinicia el contenedor activo (también si está Detenido)
POST /proyectos/:id/detener             (A2, M5-02) → 202 {}                             · v2.1: antes 200; el estado llega por GET /despliegues/:id
                                        · ambas: 409 { codigo: "sin-despliegue-activo" | "accion-no-permitida" }
                                        · reiniciar: desde Saludable o Detenido; detener: solo desde Saludable
                                        · el estado pasa por detenido → aprovisionando → publicando → saludable (o fallido)

GET  /proyectos/:id/despliegues/:numero (A2, M7-01) → 200 mismo cuerpo que GET /despliegues/:id · 404 si no existe o el proyecto es ajeno
POST /proyectos/:id/despliegues         (A2, M5-03) → además 409 { codigo: "suscripcion-no-permite" | "cuota-construcciones-agotada", mensaje }

GET  /proyectos/:id/artefactos          (A3, M5-04)
  → 200 [{ id, numero, digest, tamanoBytes, receta, commit: { sha, mensaje }, creado, disponible, activo }]
     // los más recientes primero; disponible = la imagen sigue en el nodo

POST /proyectos/:id/reversiones         (A3, M5-04) body { artefactoId }
  → 201 { id, numero, estado: "revirtiendo" }
  → 409 { codigo: "artefacto-no-disponible" | "artefacto-ya-activo" | "despliegue-en-curso" }
```

### v3 · Avance 3

```text
POST /despliegues/:id/cancelar          (M4-02) → además 409 { codigo: "ya-no-se-puede-cancelar" } desde aprovisionando en adelante
                                        · desde encolado sale de la cola; desde construyendo o revirtiendo el trabajador corta en < 5 s
POST /despliegues/:id/reintentar        (M4-02) → 409 { codigo: "solo-se-reintenta-un-fallido" } · mismos 409 de bloqueo que crear
POST /proyectos/:id/redespliegues       (M4-02) → 409 { codigo: "commit-desconocido" } si ese commit nunca se desplegó en el proyecto

GET  /proyectos/:id/despliegues?filtro=todos|saludables|fallidos&antesDe=<numero>     (M7-02, pantalla 14)
  → 200 { despliegues: [{ id, numero, estado, disparador, commit: { sha, mensaje, rama } | null, creado,
                          duracionMs, imagen: { digest, disponible } | null, artefactoId, activo }],
          siguiente: number | null }          // 20 por página, del más reciente al más antiguo; siguiente = antesDe de la próxima

GET  /proyectos/:id/resumen             (M7-02, pantalla 13)
  → 200 { proyecto: { id, nombre, subdominio, url, repositorio, rama, receta, puertoInterno },
          plan: { codigo, nombre },
          activo: <cuerpo de GET /despliegues/:id> | null,
          ultimo: <cuerpo de GET /despliegues/:id> | null,
          recursos: { cpus, memoriaMb } | null,
          lineaTiempo: [{ etapa, titulo, detalle, marca }] }   // Commit recibido · Imagen construida · Contenedor iniciado · Tráfico redirigido

PATCH /proyectos/:id                    (M3-04, pantalla 19) body { nombre?, urlRepositorio?, rama?, rutaDockerfile?, puertoInterno? }
  → 200 { id, nombre, subdominio, urlRepositorio, rama, rutaDockerfile, puertoInterno }   · aplica en el próximo despliegue
  → 400 { codigo: "ruta-invalida" | "puerto-invalido" | "url-invalida" | "datos-invalidos" } · 422 { codigo: "repositorio-no-accesible" | "rama-no-encontrada" | "stack-no-reconocido" }
  → 409 { codigo: "nombre-repetido" } · 404 { codigo: "proyecto-no-encontrado" }   // los códigos son los de M3 (kebab-case), como en el alta

GET  /observabilidad/consumo            (M7-03, pantalla 08)
  → 200 { periodo: { desde, reinicia }, proyectos: { usados, limite }, construcciones: { usadas, limite } }   // mes calendario UTC (I7)

GET  /proyectos/:id/actividad           (M7-03, pantalla 13)
  → 200 { dias: [{ fecha, total, fallidos }], total, fallidos }   // 84 días que terminan hoy (UTC)

GET  /despliegues/:id                   (M6-02) → agrega certificado: { vence } | null   // null en desarrollo (sin TLS)
```

Reversión: crea un despliegue nuevo con `disparador = "reversion"` que **reusa** el artefacto (no clona ni construye). Sus etapas `recepcion` y `construccion` llegan como `omitida`; `ejecucion`, `enrutamiento` y `operacion` avanzan como en cualquier despliegue. No consume construcciones del mes. Si la salud falla, la versión activa no cambia.

## Lista de proyectos (M3)

`GET /proyectos` incluye por proyecto `ultimoDespliegue: { id, numero, estado, etapas, creado } | null` para el riel de 55px de la pantalla 10.

## Qué cambia para la web con v2 y v3

| Dónde | Qué | Cuándo |
|---|---|---|
| 12, 12b, 12c | Ruta `/projects/[proyecto]/despliegues/[n]` con `GET /proyectos/:id/despliegues/:numero`; bitácora con `desde=` | A2 |
| 12b | «Reiniciar» y «Detener» (202; el estado llega por el polling) | A2 |
| 11c, 17 | Variables: `POST /proyectos` con `variables`, `GET`/`PUT /proyectos/:id/variables` | A2 |
| 11d, 17 | Banner con «Renovar» o «Cambiar de plan» ante `suscripcion-no-permite` o `cuota-construcciones-agotada` | A2 |
| `estados.ts` | Agregar `"revirtiendo"` a `ESTADOS_DESPLIEGUE` y su insignia (mismo tono que *Construyendo*) | A3 |
| 11a / 11e | Mostrar `ResultadoDeteccion.descripcion`; nuevo texto de error cuando `StackNoReconocido` | A2 |
| 12 | Riel con etapas `omitida` en una reversión (el componente ya soporta `omitida`) | A3 |
| 14 | Por fila, «Revertir a esta versión» si el artefacto está `disponible` y no es el activo | A3 |
| 13, 14 | `GET /proyectos/:id/resumen` y `GET /proyectos/:id/despliegues?filtro=&antesDe=` | A3 · v3 |
| 12, 12c, 14 | «Cancelar» (Encolado y Construyendo), «Reintentar» (Fallido), «Redesplegar» por fila | A3 · v3 |
| 19 | `PATCH /proyectos/:id` con borrador y «Guardar cambios» | A3 · v3 |
| 08, 13 | `GET /observabilidad/consumo` y `GET /proyectos/:id/actividad` | A3 · v3 |
| 12b | Vencimiento del certificado (`certificado.vence`) en el VPS | A3 · v3 |

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1 | 2026-09-20 | Contrato del Avance 1 |
| 1.1 | 2026-09-27 | Agrega `ultimosDespliegues` (ya estaba prometido en «Lista de proyectos») y `USUARIO_DESARROLLO` |
| 1.2 | 2026-09-29 | M1-03 en `main`: `SesionGuard` y `@UsuarioActual()` reemplazan a `USUARIO_DESARROLLO`, que se borra |
| 2 | 2026-09-27 | Solo agrega: detección de stack, acciones, artefactos, reversión y `revirtiendo`; campos `disparador`, `recursos`, `motivoFallo`, `imagen.numero`, `imagen.receta` |
| 2.1 | 2026-10-02 | Avance 2: consulta por número, variables (HTTP y M3 → M5), `BloqueosService`; `detener` responde 202 |
| 2.1 | 2026-10-06 | Solo agrega: `detectar` acepta `rutaDockerfile`; `ResultadoDeteccion.nombre` y `.dockerfile`; `StackNoReconocido.pista` |
| 3 | 2026-10-11 | Avance 3, solo agrega: historial y resumen (M7-02), códigos de cancelar, reintentar y redesplegar (M4-02), `PATCH /proyectos/:id` (M3-04), consumo y actividad (M7-03), `certificado` (M6-02), `detenerTodosDe` / `reanudarTodosDe` para M2 y M9 |
| 3.1 | 2026-10-14 | Solo aclara: `ContenedoresClientePuerto` y su adaptador `ContenedoresClienteM5` viven en M5 (`orquestacion/`) y `OrquestacionModule` exporta el token; `ProyectosLecturaPuerto.deUsuario` (interno de M4/M5) |
| 3.2 | 2026-10-14 | Solo aclara `PATCH /proyectos/:id`: los códigos de error son los de M3 en kebab-case (`nombre-repetido`, `ruta-invalida`, `puerto-invalido`, `repositorio-no-accesible`, `rama-no-encontrada`), no los nombres de clase; el único consumidor es la pantalla 19 |
| 3.3 | 2026-10-14 | Solo precisa `GET /despliegues/:id`: `certificado` es `{ vence }` (ISO 8601) solo si la `url` es https y Traefik ya emitió el certificado; en cualquier otro caso, `null` |
| 3.4 | 2026-10-23 | Solo cambia un tipo que M3 no lee: `ResultadoDeteccion.dockerfile` pasa de `string \| null` a `DockerfileReceta \| null` (capas del Dockerfile generado, `feat-m4-capas-dockerfile`) |
