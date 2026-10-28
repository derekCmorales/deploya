# Entrega final · documentación

Los cuatro documentos que pide el enunciado (§7), escritos en Markdown y generados en PDF con el design system Deploya v4.1 en modo claro.

| # | Documento | Fuente | PDF |
|---|---|---|---|
| 1 | Documento de requisitos: introducción, alcance, actores, 66 RF, 34 RNF, casos de uso, reglas de negocio y trazabilidad con el enunciado | [01-requisitos.md](01-requisitos.md) | [pdf/01-deploya-requisitos.pdf](pdf/01-deploya-requisitos.pdf) |
| 2 | Documento de diseño: arquitectura (C4), hexagonal, motor, UML, SOLID, patrones, modelo entidad-relación, diccionario de datos, seguridad, despliegue y ADR | [02-diseno.md](02-diseno.md) | [pdf/02-deploya-diseno.pdf](pdf/02-deploya-diseno.pdf) |
| 3 | Manual técnico: tecnologías, instalación, configuración, despliegue, autoalojado, operación, pruebas y problemas comunes | [03-manual-tecnico.md](03-manual-tecnico.md) | [pdf/03-deploya-manual-tecnico.pdf](pdf/03-deploya-manual-tecnico.pdf) |
| 4 | Manual de usuario: registro, inicio de sesión, planes y pagos, proyectos, despliegues, reversión, métricas y administración, con capturas reales | [04-manual-usuario.md](04-manual-usuario.md) | [pdf/04-deploya-manual-usuario.pdf](pdf/04-deploya-manual-usuario.pdf) |

## Cómo se construye

```bash
npm ci --prefix docs/entrega-final/generador
pnpm diagramas:sync
node docs/entrega-final/generador/construir.mjs
```

- **Diagramas:** cada bloque `mermaid` va precedido de `<!-- diagrama: docs/diagramas/… -->` y `pnpm diagramas:sync` lo copia del `.mmd`, igual que en `arquitectura.md`. El generador los dibuja con los colores del design system y pasa a página apaisada los que se leen mejor así.
- **Diccionario de datos:** `<!-- diccionario-datos -->` se reemplaza por tablas generadas desde `apps/api/prisma/schema.prisma`.
- **Tokens:** los colores salen de `apps/web/src/app/globals.css` (`:root`, modo claro) y las fuentes Geist del paquete `geist`. Sin hex sueltos en la hoja de estilos.
- **Capturas:** `capturas/` se tomaron con Playwright sobre la plataforma corriendo en local (API, web, PostgreSQL y Redis reales; motor con los adaptadores `stub`).

El generador vive aparte del producto (`generador/package.json` propio): no agrega dependencias a `apps/` ni a la imagen de Docker.

## Antes de entregar

- [ ] Verificar los nombres del equipo en `generador/catalogo.json` (portada).
- [ ] Cuando entren EST-01a, EST-01b y EST-01c, actualizar RNF-10 en `01-requisitos.md` y regenerar.
- [ ] Opcional: reemplazar las capturas locales por capturas del VPS con el mismo nombre de archivo y regenerar.
