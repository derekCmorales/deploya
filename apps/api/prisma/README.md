# Prisma — Javier (@Javier-r04), review Derek

Schema mínimo de bootstrap: `Usuario`, `Plan`, `Proyecto`, `Despliegue`. El schema del núcleo (con límites de los planes v4.1, admin por seed y Sandbox al registrarse) llega en **DB-01** ([plan-avances.md](../../../docs/plan-avances.md)). ERD completo: [erd-unificado.mmd](../../../docs/diagramas/compartido/erd-unificado.mmd); el núcleo es un subconjunto.

```bash
pnpm --filter @deploya/api prisma:generate
# con DATABASE_URL exportada (ver .env.example):
pnpm --filter @deploya/api exec prisma db push
pnpm --filter @deploya/api prisma:seed
```
