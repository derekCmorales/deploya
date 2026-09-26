# API NestJS — monolito modular

Un módulo Nest por módulo de la propuesta (M1–M10) en `src/modules/<modulo>`; cada uno expone `GET /<modulo>/health` (se mantiene). Reglas de código: [docs/ingenieria.md](../../docs/ingenieria.md).

## Estructura de un módulo

```text
src/modules/<modulo>/
  <modulo>.module.ts        # exporta SOLO su servicio o sus puertos (API pública del módulo)
  <modulo>.controller.ts    # HTTP → DTO → servicio → respuesta; sin Prisma ni adaptadores
  <modulo>.service.ts       # caso de uso: valida, llama al dominio, usa puertos
  dominio/                  # entidades, objetos valor, políticas y máquinas de estado puras
  *.puerto.ts               # abstract class sin prefijo I (repositorios, correo, pasarela…)
  *.spec.ts                 # pruebas unitarias junto al archivo (Jest)
  README.md                 # dueño, alcance y pantallas
src/adapters/               # puertos del motor y sus adaptadores/stubs (Docker, Traefik, cola)
prisma/                     # schema y seed del núcleo (Javier)
```

## Comandos

```bash
pnpm --filter @deploya/api dev        # recarga en caliente (exporta antes las variables de .env)
pnpm --filter @deploya/api test       # pruebas unitarias
pnpm --filter @deploya/api test:cov   # cobertura (meta ≥ 80 % en dominio y servicios tocados)
pnpm --filter @deploya/api build
```
