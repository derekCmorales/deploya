# Contrato · API de despliegues (M4 → web, M3 → M4)

Versión 2 · dueño: Derek · consumidores: Eduardo (web, M3). Cambiarlo exige avisar antes de mergear. Specs: [motor-construccion](../../openspec/specs/motor-construccion/spec.md), [orquestacion](../../openspec/specs/orquestacion/spec.md). Datos: [datos-nucleo.md](datos-nucleo.md).

**v1 no cambia para el Avance 1.** La v2 solo **agrega**: detección de stack (A2), acciones (A2–A3), artefactos y reversión (A3), y el estado `revirtiendo`. Nada de v1 se renombra ni se quita.

## Servicio interno (M3 → M4)

```ts
// v1 · A1
ConstruccionService.crearDespliegue(
  proyectoId: string,
  disparador: "alta" | "manual" | "variables" = "manual",
): Promise<{ id: string; numero: number; estado: "encolado" }>

// v2 · A2 — M3 lo usa en el paso 11a para mostrar «Dockerfile detectado» o «Stack detectado»
DeteccionStackService.detectar(fuente: LectorFuente): Promise<ResultadoDeteccion>

export abstract class LectorFuente {          // M3 lo implementa sobre la API pública de GitHub
  abstract existe(ruta: string): Promise<boolean>;
  abstract leer(ruta: string): Promise<string | null>;   // null si no existe
}

export interface ResultadoDeteccion {
  receta: "dockerfile" | "node" | "python" | "go" | "estatica";
  descripcion: string;        // «Dockerfile en la raíz» · «Node.js 22 · package.json con script start»
  puertoSugerido: number;     // EXPOSE del Dockerfile o el de la receta (8080)
  evidencia: string[];        // archivos que decidieron: ["package.json", "package-lock.json"]
}
// Sin Dockerfile ni stack reconocido: lanza StackNoReconocido → 11e «falta Dockerfile y no se reconoce el stack»
```

`POST /proyectos` de M3 llama a `crearDespliegue(id, "alta")` después de persistir el proyecto. Rechaza con **409** si la suscripción está Vencida o Suspendida o se agotaron las construcciones del mes (A2, M5-03), con cuerpo `{ codigo: "suscripcion-no-permite" | "cuota-construcciones-agotada", mensaje }`.

## HTTP (requiere sesión; solo el dueño del proyecto; si no, 404)

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
POST /proyectos/:id/reiniciar           (A2, M5-02) → 202 {}                             · reinicia el contenedor activo
POST /proyectos/:id/detener             (A2, M5-02) → 200 { estado: "detenido" }

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
| `estados.ts` | Agregar `"revirtiendo"` a `ESTADOS_DESPLIEGUE` y su insignia (mismo tono que *Construyendo*) | A3 |
| 11a / 11e | Mostrar `ResultadoDeteccion.descripcion`; nuevo texto de error cuando `StackNoReconocido` | A2 |
| 12 | Riel con etapas `omitida` en una reversión (el componente ya soporta `omitida`) | A3 |
| 14 | Por fila, «Revertir a esta versión» si el artefacto está `disponible` y no es el activo | A3 |

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1 | 2026-09-20 | Contrato del Avance 1 |
| 2 | 2026-09-27 | Solo agrega: detección de stack, acciones, artefactos, reversión y `revirtiendo`; campos `disparador`, `recursos`, `motivoFallo`, `imagen.numero`, `imagen.receta` |
