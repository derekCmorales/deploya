# Design

## Context

`/suscripciones/mia` ya devuelve `estado` y `vence` (M2-03); `banner-bloqueo.tsx` ya existe para 11d y 17; el kit trae `Banner`, `Skeleton`, `Card` y `Button`.

## Goals / Non-Goals

**Goals:** que la lista avise del vencimiento y que ninguna pantalla del panel quede en blanco por un 404, un fallo de red o una carga lenta.

**Non-Goals:** errores por módulo, lógica de bloqueo.

## Decisions

### 1. Funciones puras para los textos y los tiempos

`finDeGracia(vence)` (vence + 5 días) y `textoVencida(plan, vence)` para el banner; `esperaDeReintento(intento)` → 8, 16, 30, 30… segundos.

### 2. Un componente por estado

`ErrorApi`, `EsqueletoProyectos` y la página 404 viven en `components/estados/` junto a `sin-permisos.tsx` (de Eddy), para que cualquier pantalla los use igual.

## Diseño: SOLID y patrones

| Pieza | Patrón | Principio | Por qué |
|---|---|---|---|
| `finDeGracia`, `textoVencida`, `esperaDeReintento` | Funciones puras | S | Se prueban sin navegador ni reloj |
| `ErrorApi`, `EsqueletoProyectos` | Presentational | S, O | Se reutilizan; un estado nuevo es un componente nuevo |
| `BannerBloqueo` (existente) | Reutilización | — | El mismo aviso en 10c, 11d y 17 |

Sin cambios de clases de la API.

## Risks / Trade-offs

- **Reintento infinito:** se limita a 30 s entre intentos y se detiene al desmontar la pantalla.
