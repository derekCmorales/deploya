# Kit visual → movido a `docs/diseno/`

El kit visual monocromático quedó reemplazado por el **design system Deploya v4.1**, que es la fuente madre de toda la UI:

- Principios, tokens, componentes y reglas: [diseno/README.md](diseno/README.md)
- Cómo construir una pantalla (y prompt para agentes): [diseno/guia-construccion.md](diseno/guia-construccion.md)
- Una ficha por pantalla: [diseno/pantallas/](diseno/pantallas/)
- Código: `apps/web/src/app/globals.css` y `apps/web/src/components` (catálogo vivo en `/sistema`)

Cambios frente al kit anterior: claro por defecto, neutros cálidos, acento Señal solo para lo que está en curso, estados `ok` / `warn` / `bad`, header de 56px con la marca `deploya`, riel de cinco etapas y componentes propios (`RielEtapas`, `Bitacora`, `EstadoDespliegue`, `EstadoSuscripcion`, `Pasos`…).

Este archivo se conserva para no romper enlaces viejos.
