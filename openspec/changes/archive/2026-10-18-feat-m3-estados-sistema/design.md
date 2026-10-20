# Design

## Context

`/suscripciones/mia` ya devuelve `estado` y `vence` (M2-03); `banner-bloqueo.tsx` ya existe para 11d y 17; el kit trae `Banner`, `Skeleton`, `Card` y `Button`.

## Goals / Non-Goals

**Goals:** que la lista avise del vencimiento y que ninguna pantalla del panel quede en blanco por un 404, un fallo de red o una carga lenta.

**Non-Goals:** errores por módulo, lógica de bloqueo.

## Decisions

### 1. Funciones puras para los textos y los tiempos

`finDeGracia(vence)` (vence + 5 días, `DIAS_GRACIA` espejo del de M2) y `textoVencida(suscripcion)` para el banner viven en `lib/suscripcion.ts`, junto a `fechaCorta`: las pruebas `node --test` no resuelven imports de ejecución entre archivos de `lib`. `esperaDeReintento(intento)` → 8, 16, 30, 30… segundos y `esFalloDeConexion(estado)` (sin conexión o 5xx; un 4xx no se reintenta) en `lib/reintento.ts`.

### 2. Un componente por estado

`ErrorConexionApi` (no `ErrorApi`, para no chocar con la clase de error de `lib/api.ts`), `EsqueletoProyectos` y `PaginaInexistente` viven en `components/estados/` junto a `sin-permisos.tsx` (de Eddy), para que cualquier pantalla los use igual. `app/not-found.tsx` solo monta `PaginaInexistente`; `MarcoProyecto` llama a `notFound()` cuando el proyecto no está en la lista.

### 3. El aviso de Vencida lo pinta el panel

`PanelProyectos` lee `/suscripciones/mia` una vez y se la pasa a `ListaProyectos`; el banner 10c (`warn`, «Ver suscripción» y «Renovar») va arriba de la lista y el aviso genérico de M2-05 queda para Suspendida y Cancelada. «Desplegar» (`BotonDesplegar`) recibe `bloqueado` desde `MarcoProyecto`.

## Diseño: SOLID y patrones

| Pieza | Patrón | Principio | Por qué |
|---|---|---|---|
| `finDeGracia`, `textoVencida`, `esperaDeReintento` | Funciones puras | S | Se prueban sin navegador ni reloj |
| `ErrorConexionApi`, `EsqueletoProyectos`, `PaginaInexistente` | Presentational | S, O | Se reutilizan; un estado nuevo es un componente nuevo |
| `BannerBloqueo` (existente) | Reutilización | — | El mismo aviso en 10c, 11d y 17 |

Sin cambios de clases de la API.

## Risks / Trade-offs

- **Reintento infinito:** se limita a 30 s entre intentos y se detiene al desmontar la pantalla.
