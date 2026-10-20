# Design

## Context

`MapaActividad` ya es SVG/HTML a mano con tokens. El design system reserva Señal para lo que está en curso y prohíbe gradientes.

## Decisions

### 1. Sin librería de gráficas

Tres gráficas con pocas variantes; a mano quedan con los tokens exactos y sin dependencias (regla del sprint).

### 2. Los despliegues como eventos

El chip `#14` sobre la gráfica responde la pregunta de qué cambió; es la identidad de Deploya en las gráficas.

### 3. Señal solo en el punto «ahora»

Es dato en vivo: cumple la regla de Señal = en curso.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `GraficaUso`, `GraficaEtapas`, `GraficaRitmo` | Componente de presentación + composición | S, O | Dibujan; comparten piezas en vez de copiarlas |
| `escalaLineal`, `puntosDeSerie`, `tonoDeUso` | Funciones puras | S | Se prueban sin DOM |
| `MetricasProyecto` (página) | Container | S | Pide datos y se los pasa a las gráficas |

Cambios de clases y puertos: ninguno en la API (la lectura es de `feat-m5-muestreo-metricas`); componentes web nuevos → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Accesibilidad de SVG:** se cubre con `role="img"`, resumen, tabla y teclado.
- **Dependencia del día 3:** hasta tener la API, se trabaja con datos del canvas.
