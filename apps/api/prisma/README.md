# Prisma — Javier (@Javier-r04), review Derek

Schema del núcleo v4.1, copia exacta del contrato [datos-nucleo.md](../../../docs/contratos/datos-nucleo.md) (DB-01). Cambiarlo exige avisar a los consumidores antes de mergear. ERD: [erd-unificado.mmd](../../../docs/diagramas/compartido/erd-unificado.mmd).

```bash
docker compose up -d postgres
export DATABASE_URL=postgresql://deploya:deploya@localhost:5432/deploya
pnpm --filter @deploya/api exec prisma migrate dev          # aplica prisma/migrations
ADMIN_CLAVE=... pnpm --filter @deploya/api prisma:seed      # idempotente: se puede correr varias veces
```

El seed crea los cuatro planes, el administrador (`ADMIN_CORREO`, `ADMIN_CLAVE`) y `cliente@deploya.app` (`CLIENTE_CLAVE`, o la del admin), ambos con Sandbox. La lógica está en `src/modules/suscripciones/semilla/` y tiene pruebas unitarias.
