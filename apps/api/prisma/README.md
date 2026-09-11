# Prisma — Javier (@Javier-r04), review Derek

Schema mínimo de bootstrap: `Usuario`, `Plan`, `Proyecto`, `Despliegue`. ERD completo: `docs/diagramas/compartido/erd-unificado.mmd`.

```bash
pnpm --filter @deploya/api prisma:generate
# con DATABASE_URL:
pnpm --filter @deploya/api exec prisma db push
pnpm --filter @deploya/api prisma:seed
```
