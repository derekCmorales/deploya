# Design

## 1. Contexto

El contrato [datos-nucleo.md](../../../docs/contratos/datos-nucleo.md) fija las tablas, sus dueños y las invariantes I1–I10. Este change lo lleva a código sin cambiarlo. M2 es dueño de `Plan`, `Suscripcion` y `Pago`; otros módulos leen por `SuscripcionesService`, nunca con `prisma.plan` directo.

## 2. Capas de M2

```text
apps/api/src/modules/suscripciones/
  dominio/        plan.ts, suscripcion.ts (Cuota), errores.ts, catalogo.ts (puras), suscripciones.constantes.ts
  puertos/        repositorio-planes.puerto.ts, repositorio-suscripciones.puerto.ts
  adaptadores/    *.prisma.ts, *.memoria.ts, traduccion-prisma.ts
  semilla/        semilla.ts (datos puros), sembrar.ts, destino-semilla.{puerto,prisma,memoria}.ts
  suscripciones.service.ts · suscripciones.controller.ts · suscripciones.module.ts
apps/api/src/compartido/prisma/  PrismaService, PrismaModule (@Global)
apps/api/prisma/seed.ts          solo arma las piezas y llama a sembrar()
```

## 3. Decisiones

- **Traducción en el borde.** Los enums de Prisma usan `_` (`por_vencer`); la API y la web usan `-` (`por-vencer`). Solo `traduccion-prisma.ts` conoce ambos. `Decimal` se convierte a `number` ahí mismo: el catálogo responde `5` y `0.25`, no `"5.00"`.
- **`asignarSandbox` idempotente** con `upsert` por `usuarioId` y `update: {}`: una segunda llamada (reintento del registro o seed repetido) no crea ni modifica nada (I1). `inicio` sale de `Reloj`, no de `now()`.
- **Catálogo filtrado y ordenado en el dominio** (`catalogoDe`), no en la consulta: son 4 filas y así la regla se prueba sin base.
- **Seed probado sin base.** La lógica vive en `sembrar()` detrás del puerto `DestinoSemilla`; `seed.ts` solo conecta Prisma y `hashSemilla` (scrypt con el formato `scrypt:<sal>:<hash>` de `HashContrasenaScrypt` de M1, para que el login acepte las cuentas del seed). El seed valida `ADMIN_CLAVE` antes de escribir. El `upsert` de usuarios no reescribe `hashContrasena`, así dos corridas dejan los mismos registros aunque scrypt use sal aleatoria.
- **Web.** `page.tsx` es server component (metadata); `PlanesContenedor` (cliente) usa el hook `usePlanes` y el `Segmented`; `TablaPlanes` es presentacional y recibe `codigoActual` para marcar «Plan actual» cuando haya sesión. El formato (`USD 5.00`, `0.5 vCPU`, `1 GB`, `2 000`) son funciones puras en `lib/planes.ts`.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `SuscripcionesService` | Facade | S, I | Única puerta de M2 para M1, M3, M4 y M5 (`asignarSandbox`, `cuotaDe`, `catalogo`) |
| `RepositorioPlanes`, `RepositorioSuscripciones` → Prisma / memoria | Repository | D, L | El servicio no conoce Prisma; los dobles en memoria cumplen el mismo contrato en las pruebas |
| `traduccion-prisma.ts` | Adapter (mapper) | S | Un solo lugar traduce enums y `Decimal` |
| `catalogoDe`, `cuotaDeSuscripcion`, `planesSemilla`, `usuariosSemilla` | Funciones puras | S | Reglas y datos probables sin Nest ni base |
| `DestinoSemilla` → Prisma / memoria | Repository | D | El seed se prueba dos veces en memoria |
| `PrismaService` + `PrismaModule` global | Singleton gestionado por Nest | D | Un solo cliente inyectado; nadie hace `new PrismaClient()` en servicios |
| `Reloj` | Inyección de dependencias | D | Sin `new Date()` en el servicio |
| `PlanesContenedor` / `TablaPlanes` + `usePlanes` | Container / Presentational | S | Datos y estado separados del dibujo |

Cambios a clases y puertos: `RepositorioPlanes`, `RepositorioSuscripciones` y sus adaptadores Prisma en `clases-unificado.mmd`. Estados sin cambios.

## Risks / Trade-offs

- **PR tarde frente al plan (lunes 12:00).** Mitigación: el schema es copia exacta del contrato, así que los consumidores pueden escribir sus adaptadores Prisma sin esperar el merge.
- **Prisma en la imagen Alpine.** `PrismaService` conecta al arrancar; se verifica con `docker compose up --build` antes del merge.
- **Hash compartido con M1.** `hashSemilla` replica el formato de `HashContrasenaScrypt` (#10) mientras M1 no esté en `main`; al fusionarse, `seed.ts` usa directamente `new HashContrasenaScrypt().calcular`.
