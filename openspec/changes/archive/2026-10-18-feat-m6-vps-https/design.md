# Design

## Context

Traefik v3 ya enruta por proveedor de archivo (ADR 0005): `EnrutamientoPuerto` escribe un `.yml` por proyecto y la conmutación sin corte cambia el servicio de la ruta. El correo ya es SMTP configurable (ADR 0001). Falta llevarlo a un dominio real con TLS.

## Goals / Non-Goals

**Goals:** cualquier proyecto publicado responde en `https://<subdominio>.deploya.app` con un solo certificado comodín, sin emitir uno por proyecto.

**Non-Goals:** multinodo, dominios propios, CI/CD.

## Decisions

### 1. DNS-01 y un solo certificado

HTTP-01 emitiría un certificado por subdominio y choca con los límites de Let's Encrypt cuando se crean y borran proyectos en la demo. DNS-01 permite `*.deploya.app` una vez cada 90 días. El resolvedor se declara en la configuración estática de Traefik; las rutas dinámicas solo nombran `certResolver` y `domains`.

### 2. El dominio es configuración, no código

`ConfiguracionEnrutamiento { dominioBase, esquema, certResolver | null }` se lee una vez en `enrutamiento.module.ts`. `EnrutamientoTraefikArchivo` arma la regla `Host(\`<subdominio>.<dominioBase>\`)` y agrega `tls` solo si hay `certResolver`. En desarrollo nada cambia.

### 3. Vencimiento por puerto

`CertificadoPuerto.venceEl(dominio)`: `CertificadoAcmeArchivo` lee `acme.json` (montado de solo lectura en la API) y decodifica la fecha `notAfter`; `CertificadoAusente` devuelve `null` en desarrollo.

### 4. Publicar `main`

`scripts/desplegar-vps.sh` es idempotente: `git pull`, `docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --build`, `prisma migrate deploy`, seed. Los secretos viven en `.env.vps` en el VPS, nunca en el repo.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `ConfiguracionEnrutamiento` | Objeto de configuración | O | Local y VPS con el mismo código |
| `EnrutamientoTraefikArchivo` (existente) | Adapter | S, D | Solo cambia cómo arma la regla |
| `CertificadoPuerto` → `CertificadoAcmeArchivo` / `CertificadoAusente` | Adapter + Null Object | D, L | 12b no sabe si hay TLS; el doble cumple el contrato |
| `CorreoPuerto` (existente) | Adapter | O | Cambiar de Mailpit al proveedor es cambiar variables |

Cambios de clases: `ConfiguracionEnrutamiento`, `CertificadoPuerto` → `clases-unificado.mmd`; `despliegue-infraestructura.mmd` con el VPS. ADR 0007.

## Risks / Trade-offs

- **Propagación de DNS:** se registra el dominio y los registros A el primer día del avance.
- **Token del proveedor DNS en el VPS:** permiso mínimo (solo la zona `deploya.app`), en `.env.vps`.
- **Un solo VPS:** si cae, cae todo; se acepta (alcance: un único VPS). Plan B de la demo: compose local.
