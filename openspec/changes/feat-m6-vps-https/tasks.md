# Tasks

Sin red, Docker ni archivos reales en las pruebas unitarias. Lo de infraestructura se verifica a mano y queda en el manual técnico.

## 1. Infraestructura (primer día)

- [ ] 1.1 Dominio `deploya.app` (o el que se compre) con registros A para la raíz y `*`; VPS con Docker y usuario sin root
- [x] 1.2 `docker-compose.vps.yml`, `infra/traefik/traefik.vps.yml` con el resolvedor DNS-01, `.env.vps.example` sin secretos
- [ ] 1.3 Proveedor de correo con el dominio verificado (SPF y DKIM); variables SMTP en `.env.vps`

## 2. Enrutamiento

- [x] 2.1 `ConfiguracionEnrutamiento` (`DOMINIO_BASE`, `ESQUEMA_PUBLICO`, `CERT_RESOLVER`); `EnrutamientoTraefikArchivo` agrega `tls` cuando corresponde
- [x] 2.2 Pruebas: «Certificado comodín» (la ruta del VPS lleva `tls.certResolver` y `Host(\`x.deploya.app\`)`), «Desarrollo sin TLS» (igual que hoy), la URL del despliegue usa el esquema y el dominio de la configuración
- [x] 2.3 `CertificadoPuerto`, `CertificadoAcmeArchivo`, `CertificadoAusente`; campo `certificado` en la vista de despliegue
- [x] 2.4 Pruebas: «Vencimiento visible» con un `acme.json` de ejemplo en memoria; sin TLS → `null`

## 3. Publicar

- [x] 3.1 `scripts/desplegar-vps.sh` idempotente (escrito y revisado con `bash -n`; falta correrlo en el VPS: tarea 3.2)
- [ ] 3.2 Recorrido en el VPS: registro con correo real, alta de `hola-deploya`, `https://hola-deploya.deploya.app` con candado; 80 redirige a 443

## 4. ADR y diagramas

- [x] 4.1 ADR 0007 «Certificado comodín por DNS-01»; 0002, 0003, 0005 y 0006 a Aceptado; índice actualizado
- [x] 4.2 `despliegue-infraestructura.mmd` y `clases-unificado.mmd`; `pnpm diagramas:sync`

## 5. Cierre

- [x] 5.1 `pnpm check` en verde; cobertura ≥ 80 % en `enrutamiento/`
- [ ] 5.2 `/opsx-archive` después del merge
