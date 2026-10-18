# Proposal

Change: `feat/m6-vps-https`. Módulo dueño: **enrutamiento (M6)** y transversal — Derek. Spec tocada: `enrutamiento`. Historias: **M6-02** VPS con `*.deploya.app`, HTTPS comodín y SMTP del proveedor (5 pts) y **ADR** (2 pts), Avance 3.

## Why

Hasta ahora todo corre en `<proyecto>.localhost`. El alcance pide la plataforma en un VPS con `https://<proyecto>.deploya.app` y correo real; METODOLOGIA dice que desde el Avance 3 el entorno de pruebas es el VPS. Es lo que más riesgo externo tiene (DNS, certificados, proveedor de correo), así que se arranca el primer día.

## What Changes

- **Infraestructura:** un VPS (2 vCPU, 4 GB, Ubuntu 24.04) con Docker; `docker-compose.vps.yml` que extiende el de desarrollo: Traefik en 80/443, web en `deploya.app`, API en `api.deploya.app`, Mailpit fuera.
- **DNS:** `deploya.app` y `*.deploya.app` → IP del VPS (registros A).
- **HTTPS comodín:** Traefik con `certificatesResolvers` de Let's Encrypt por **DNS-01** (token del proveedor DNS en una variable), certificado `*.deploya.app` + `deploya.app`; redirección 80 → 443.
- **`EnrutamientoPuerto`:** `DOMINIO_BASE` (`localhost` en desarrollo, `deploya.app` en el VPS) y `ESQUEMA_PUBLICO` (`http` / `https`) por configuración; la ruta dinámica de cada proyecto declara `tls.certResolver` solo cuando hay TLS. `url` del despliegue pasa a `https://<subdominio>.deploya.app`.
- **Vencimiento del certificado en 12b:** `CertificadoPuerto.venceEl()` lee `acme.json` (adaptador) y la API lo expone en `GET /despliegues/:id` como `certificado: { vence } | null`.
- **Correo:** variables SMTP del proveedor (Resend o Brevo), dominio verificado con SPF y DKIM; `CORREO_ADAPTADOR=smtp`. Sin código nuevo (ADR 0001).
- **Publicar `main` en el VPS:** `scripts/desplegar-vps.sh` (pull, `docker compose -f … up -d --build`, migraciones y seed) documentado en el manual técnico.
- **ADR:** 0007 «Certificado comodín por DNS-01 en el VPS»; 0002, 0003, 0005 y 0006 pasan a Aceptado; 0004 al archivar la reversión.

## Non-goals

- Varios nodos, CDN, dominios personalizados (fuera de alcance siempre o punto 7).
- CI/CD automático a producción: el despliegue al VPS es un script que corre Derek.
- Copias de seguridad automáticas de la base.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `enrutamiento`: «HTTPS» con el certificado comodín, la redirección y el vencimiento visible en 12b.

## Impact

- Infra: `docker-compose.vps.yml`, `infra/traefik/traefik.vps.yml`, `.env.vps.example`, `scripts/desplegar-vps.sh`.
- Código: configuración de `EnrutamientoTraefikArchivo`, `CertificadoPuerto` (+ adaptador y doble), campo `certificado` en la vista de despliegue.
- Contrato: `docs/contratos/despliegues.md` v3 (`certificado`).
- Docs: ADR 0007, `docs/diagramas/compartido/despliegue-infraestructura.mmd`.
