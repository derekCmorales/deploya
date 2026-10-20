# Design

## Context

M6-02 dejó `docker-compose.vps.yml`, Traefik con DNS-01 y `desplegar-vps.sh`. `ConfiguracionInstalacion` guarda el hash del código (`feat-m2-modo-autoalojado`).

## Decisions

### 1. El riel también en el instalador

Cinco etapas con el mismo vocabulario que un despliegue; cada una comprueba, aplica y registra en `~/.deploya/estado`.

### 2. Sin comodín como salida

Si el proveedor DNS no está soportado, `--sin-comodin` usa certificados por proyecto (HTTP-01).

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| Etapas del instalador | Pipeline | S, O | Cada etapa es una función con comprobar/aplicar |
| `respaldar.sh`, `actualizar.sh` | Command | S | Una operación con su deshacer (`--volver`, `--restaurar`) |

Cambios de clases y puertos: ninguno (scripts) → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Entornos distintos:** se prueba en Ubuntu 24.04 y Debian 12; otros quedan documentados como no probados.
