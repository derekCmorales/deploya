# 00 · Inicio

| | |
|---|---|
| Ruta | `/` (con sesión) |
| Dueño | Derek |
| Historias | — (navegación, [ADR 0011](../../adr/0011-landing-en-s3-y-cloudfront.md)) |
| Entrega | Piloto |
| Diseño | Sin artboard en el canvas: sale de los patrones C (página del panel) y D (lista) de la guía |

## Qué es

El panel al entrar y el destino tras iniciar sesión. Saludo, plan y estado de los proyectos en una línea; tres métricas (proyectos del plan, construcciones del mes y plan); «Tus proyectos» con lo que pide atención primero (en curso, con fallo) y «Actividad reciente» con el último despliegue de cada proyecto. Sin proyectos, una bienvenida en tres pasos con «Crear primer proyecto».

Sin sesión, `/` no se dibuja: lleva a la landing pública (`NEXT_PUBLIC_URL_LANDING`, en la nube) o a `/ingresar` (autoalojado o sin landing). En autoalojado no aparece la métrica de Plan.

## Componentes

- `AppShell`, `NavPrincipal` (Inicio es el primer item)
- `Card`, `Meter` (`tonoAlLimite="warn"` en proyectos), `Banner` (vencida `warn`; suspendida y cancelada `bad`)
- `EstadoDespliegue`, `EstadoSuscripcion`, `RielEtapas`, `PuntoVivo` (solo en lo que está en curso)
- `Button`, `Skeleton`, `ErrorConexionApi`

Lógica: `apps/web/src/lib/inicio.ts` (pruebas en `apps/web/test/inicio.test.mjs`).

## Textos de la pantalla

```text
Inicio
Hola, Derek
Plan Starter · 2 en línea · 1 en curso · 1 con fallo
Ver proyectos
Nuevo proyecto
Proyectos
Del plan
0.5 vCPU · 512 MB por proyecto
Construcciones del mes
Usadas
Se reinicia el 1 dic
Plan
Ver suscripción
Starter · 9 días
USD 5.00 / 30 días · sin renovación automática
Tus proyectos
Ver todos
Sin desplegar
Actividad reciente
Cuando despliegues, aquí verás cada versión.
Tu primer despliegue, en minutos.
Pega la URL de tu repositorio y nosotros nos encargamos del resto.
Conecta un repositorio
Lo construimos
Recibe tu URL
Crear primer proyecto
No pudimos cargar tu panel.
```
