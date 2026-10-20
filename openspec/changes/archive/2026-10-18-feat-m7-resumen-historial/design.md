# Design

## Context

M4 guarda despliegues, etapas con `iniciada` / `terminada`, líneas de bitácora y artefactos; M3 guarda el proyecto y `despliegueActivoId`. El layout `/projects/[proyecto]` con `MarcoProyecto` (cabecera y pestañas) entró con M7-01. La vista de despliegue (`vista-despliegue.ts`) ya traduce un `Despliegue` al cuerpo de `GET /despliegues/:id`.

## Goals / Non-Goals

**Goals:** 13 y 14 con datos reales y las acciones de M4-02 y M5-04 conectadas.

**Non-Goals:** métricas en vivo, actividad de 12 semanas (M7-03).

## Decisions

### 1. M7 es un modelo de lectura

`ResumenProyectoService` (en `observabilidad/`) compone puertos de lectura que ya exportan M3 (`ProyectosLecturaPuerto`), M4 (`RepositorioDespliegues`) y M2 (`CuotaPlanPuerto` para el nombre del plan). No escribe nada. El historial vive en `DesplieguesController` porque es una lista de la tabla de M4 con su propio repositorio.

### 2. Paginación por cursor

`antesDe=<numero>` en vez de `page`: el número de despliegue es consecutivo por proyecto y no cambia, así que «Cargar más» no repite filas aunque entren despliegues nuevos.

### 3. Acciones por fila como función pura en la web

`accionDeFila(fila, activoId)` devuelve `"revertir" | "redesplegar" | "reintentar" | "imagen-retirada" | "version-activa"`. La tabla no tiene `if` por estado: pinta lo que dice la función. Revertir y redesplegar piden confirmación con `Dialog` y llevan a 12 del despliegue nuevo.

### 4. Línea de tiempo sin texto de Docker

`LineaTiempoDespliegue.de(despliegue, etapas)` produce los cuatro hitos con textos fijos de la ficha 13 y datos del despliegue (commit, tamaño de imagen, recursos, número anterior). Si una etapa no terminó, el hito no aparece.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `ResumenProyectoService` | Facade de lectura (CQRS ligero) | S, D | Compone puertos de otros módulos sin conocer sus tablas |
| `LineaTiempoDespliegue` | Función pura (Builder) | S | Textos de la ficha en un solo lugar, probados sin base |
| `RepositorioDespliegues.historialDe` | Repository | I | Una consulta paginada; memoria y Prisma con el mismo contrato (L) |
| `accionDeFila` (web) | Tabla de decisión | O | Una acción nueva es un caso, no un `if` en la tabla |
| `PanelResumen` / `TablaHistorial` | Container / Presentational | S | La página pide datos; los componentes solo pintan |

Cambios de clases: `ResumenProyectoService`, `LineaTiempoDespliegue`, `RepositorioDespliegues.historialDe` → `clases-unificado.mmd`.

## Risks / Trade-offs

- **Consulta del historial:** índice `[proyectoId, creado]` ya existe; con `antesDe` por número se agrega `ORDER BY numero DESC LIMIT 21`.
