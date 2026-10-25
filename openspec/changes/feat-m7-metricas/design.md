# Design

## Context

`MapaActividad` ya es SVG/HTML a mano con tokens. El design system reserva Señal para lo que está en curso y prohíbe gradientes.

## Decisions

### 1. Sin librería de gráficas

Una gráfica con pocas variantes; a mano queda con los tokens exactos y sin dependencias (regla del sprint). Las otras dos gráficas de la familia llegan con sus propios changes.

### 2. Los despliegues como eventos

El chip `#14` sobre la gráfica responde la pregunta de qué cambió; es la identidad de Deploya en las gráficas.

### 3. Señal solo en el punto «ahora»

Es dato en vivo: cumple la regla de Señal = en curso.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `GraficaUso` | Componente de presentación + composición | S, O | Dibuja; comparte piezas en vez de copiarlas |
| `escalaLineal`, `puntosDeSerie`, `detallePunto`, `tonoDeUso` | Funciones puras | S | Se prueban sin DOM |
| `MetricasProyecto` (página) | Container | S | Pide datos y se los pasa a las gráficas |

Cambios de clases y puertos: ninguno. La lectura de la API es de `feat-m5-muestreo-metricas` y `clases-unificado.mmd` solo modela la API, así que los componentes web nuevos no lo tocan.

## Risks / Trade-offs

- **Accesibilidad de SVG:** se cubre con `role="group"` y `aria-roledescription="gráfica"`, resumen, tabla, teclado y `aria-live`.
- **Dependencia del día 3:** hasta tener la API, se trabaja con datos del canvas.
