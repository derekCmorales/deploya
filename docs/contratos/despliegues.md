# Contrato · API de despliegues (M4 → web, M3 → M4)

Versión 2.1 · dueño: Derek · consumidores: Eduardo (web, M3). Cambiarlo exige avisar antes de mergear. Specs: [motor-construccion](../../openspec/specs/motor-construccion/spec.md), [orquestacion](../../openspec/specs/orquestacion/spec.md). Datos: [datos-nucleo.md](datos-nucleo.md).

**v1 no cambia para el Avance 1.** La v2 solo **agrega**: detección de stack (A2), acciones (A2–A3), artefactos y reversión (A3), y el estado `revirtiendo`. Nada de v1 se renombra ni se quita.

**v2.1 (Avance 2)** agrega la consulta por número (M7-01), las variables de M3 → M5 (M3-03) y `BloqueosService` (M5-03), y cambia `detener` de 200 a **202**: la API encola la acción y no espera a Docker (M5-02). Changes: `feat-m7-vista-despliegue`, `feat-m3-variables-cifradas`, `feat-m5-acciones-contenedor`, `feat-m5-bloqueos-cuota`.

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
  dockerfile: string | null;  // v2.1 · el Dockerfile.deploya de la receta; null si manda el del repo (M3 lo ignora)
}
// Sin Dockerfile ni stack reconocido: lanza StackNoReconocido → 11e «falta Dockerfile y no se reconoce el stack»
// StackNoReconocido.pista: «agrega un script start o un Dockerfile» (Node sin start), etc. M3 la muestra en 11e.
// Exportados por ConstruccionModule: DeteccionStackService; LectorFuente vive en construccion/puertos/lector-fuente.puerto.ts
```

`POST /proyectos` de M3 llama a `crearDespliegue(id, "alta")` después de persistir el proyecto. Rechaza con **409** si la suscripción está Vencida o Suspendida o se agotaron las construcciones del mes (A2, M5-03), con cuerpo `{ codigo: "suscripcion-no-permite" | "cuota-construcciones-agotada", mensaje }`.

```ts
// v2.1 · A2 · M5 → M3 y M4 (M5-03). M3 lo llama ANTES de persistir el alta; crearDespliegue lo llama siempre.
BloqueosService.verificar(usuarioId: string): Promise<void>
// lanza SuscripcionNoPermite (Vencida o Suspendida) o CuotaConstruccionesAgotada
// construcciones del mes = invariante I7 de datos-nucleo.md (mes calendario UTC, disparador ≠ reversion)
// Exportado por OrquestacionModule. Sus errores salen como 409 { codigo, mensaje } en CUALQUIER ruta
// (filtro global BloqueosDespliegueFilter): M3 no necesita traducirlos. Bloquean también "cancelada".

// v2.1 · A2 · M3 → M5 (M3-03). M5 lo envuelve con su puerto VariablesEntornoPuerto en PasoEjecucion.
VariablesProyectoService.descifradasDe(proyectoId: string): Promise<Record<string, string>>
// lanza VariableIlegible si un valor fue alterado → el despliegue queda Fallido con motivo «variable ilegible»
// la bitácora registra solo «N variables aplicadas»; PORT la pone el motor con puertoInterno
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

GET  /proyectos/:id/despliegues/:numero (A2, M7-01) → 200 mismo cuerpo que GET /despliegues/:id · 404 si no existe o el proyecto es ajeno
POST /proyectos/:id/despliegues         (A2, M5-03) → además 409 { codigo: "suscripcion-no-permite" | "cuota-construcciones-agotada", mensaje }

GET  /proyectos/:id/artefactos          (A3, M5-04)
  → 200 [{ id, numero, digest, tamanoBytes, receta, commit: { sha, mensaje }, creado, disponible, activo }]
     // los más recientes primero; disponible = la imagen sigue en el nodo

POST /proyectos/:id/reversiones         (A3, M5-04) body { artefactoId }
  → 201 { id, numero, estado: "revirtiendo" }
  → 409 { codigo: "artefacto-no-disponible" | "artefacto-ya-activo" | "despliegue-en-curso" }
```

Reversión: crea un despliegue nuevo con `disparador = "reversion"` que **reusa** el artefacto (no clona ni construye). Sus etapas `recepcion` y `construccion` llegan como `omitida`; `ejecucion`, `enrutamiento` y `operacion` avanzan como en cualquier despliegue. No consume construcciones del mes. Si la salud falla, la versión activa no cambia.

## Lista de proyectos (M3)

`GET /proyectos` incluye por proyecto `ultimoDespliegue: { id, numero, estado, etapas, creado } | null` para el riel de 55px de la pantalla 10.

## Qué cambia para la web (Eduardo) con v2

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

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1 | 2026-09-20 | Contrato del Avance 1 |
| 1.1 | 2026-09-27 | Agrega `ultimosDespliegues` (ya estaba prometido en «Lista de proyectos») y `USUARIO_DESARROLLO` |
| 1.2 | 2026-09-29 | M1-03 en `main`: `SesionGuard` y `@UsuarioActual()` reemplazan a `USUARIO_DESARROLLO`, que se borra |
| 2 | 2026-09-27 | Solo agrega: detección de stack, acciones, artefactos, reversión y `revirtiendo`; campos `disparador`, `recursos`, `motivoFallo`, `imagen.numero`, `imagen.receta` |
| 2.1 | 2026-10-02 | Avance 2: consulta por número, variables (HTTP y M3 → M5), `BloqueosService`; `detener` responde 202 |
| 2.1 | 2026-10-06 | Solo agrega: `detectar` acepta `rutaDockerfile`; `ResultadoDeteccion.nombre` y `.dockerfile`; `StackNoReconocido.pista` |
