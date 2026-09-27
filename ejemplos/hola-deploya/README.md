# hola-deploya

App HTTP mínima para la demo de Deploya. Escucha en `PORT` (8080 por defecto) y responde en `/` y `/health`.

Se publica como repositorio **público** `derekCmorales/hola-deploya` con tres ramas, una por caso de la demo:

| Rama | Qué pasa en Deploya | Pantalla |
|---|---|---|
| `main` | `Dockerfile` propio → Saludable en `hola-deploya.localhost` | 12 → 12b |
| `roto` | `RUN npm run build` llama a `tsc`, que no está instalado → Fallido con código 127 | 12c |
| `sin-dockerfile` | Sin `Dockerfile`: la detección de stack reconoce Node (`package.json` con `start`) → Saludable con receta `node` (desde el Avance 2) | 11a, 12 |

Publicarlo (una vez, con `gh` autenticado): `scripts/publicar-hola-deploya.sh` desde la raíz del repo de Deploya.
