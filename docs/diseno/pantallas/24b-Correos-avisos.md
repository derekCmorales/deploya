# 24b · Correos de avisos

| | |
|---|---|
| Ruta | — (plantillas M10) |
| Dueño | Eddy (SP-02; ganchos: Derek SP-08, Javier SP-04) |
| Historias | SP-02 · SP-04 · SP-08 |
| Entrega | Sprint fuera de alcance |
| Diseño | Canvas Deploya v4.1, página «Sprint · fuera de alcance», artboard `24b-Correos-avisos` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |
| Datos | [avisos.md](../../contratos/avisos.md) · `AvisosPuerto` |

## Qué es

Cuatro plantillas nuevas con el mismo marco que 24: despliegue saludable, despliegue fallido, plan por vencer (7 días) y suscripción suspendida. Precios del plan v4.1, sin dominios y sin enlace de preferencias.

## Componentes

- `PlantillaCorreo` (Template Method) en `notificaciones/dominio`

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`); las gráficas nuevas entran ahí con `feat-m7-metricas`. Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas, valores de las gráficas) son de ejemplo: vienen de la API.

```text
Despliegue saludable
deploy
a
Despliegue
api-tienda está en línea
La versión #14 pasó la verificación de salud y ya recibe tráfico.
5 / 5 · Saludable
Versión
#14 · a1b2c3d
Duración
2 min 41 s
URL
api-tienda.deploya.app
Abrir api-tienda
¿El botón no funciona? Copia este enlace:
https://deploya.app/…
Recibes este correo porque tienes una cuenta en deploya.
deploya · soporte@deploya.app
Despliegue fallido
deploy
a
Despliegue
Falló el despliegue #15 de api-tienda
Se detuvo en
Construcción
. La versión #14 sigue activa; tu servicio no se interrumpió.
13 sh: 1: tsc: not found
14 ERROR: el paso [5/5] terminó con código 127
Ver bitácora
¿El botón no funciona? Copia este enlace:
https://deploya.app/…
Recibes este correo porque tienes una cuenta en deploya.
deploya · soporte@deploya.app
Plan por vencer · 7 días
deploy
a
Suscripción
Tu plan Starter vence en 7 días
La vigencia termina el
03 nov 2026
. Si no renuevas, al vencer se bloquean los despliegues y tus servicios siguen en línea 5 días de gracia.
Plan
Starter · 30 días
Vence
03 nov 2026
Renovación
USD 5.00
Renovar plan
¿El botón no funciona? Copia este enlace:
https://deploya.app/…
Recibes este correo porque tienes una cuenta en deploya.
deploya · soporte@deploya.app
Suscripción suspendida
deploy
a
Suscripción
Tu suscripción está suspendida
Terminó el período de gracia y detuvimos los 3 contenedores de tu cuenta.
Conservamos tu código, tus variables y tus versiones durante 30 días. Al renovar, vuelven a arrancar.
Renovar y reactivar
¿El botón no funciona? Copia este enlace:
https://deploya.app/…
Recibes este correo porque tienes una cuenta en deploya.
deploya · soporte@deploya.app
```
