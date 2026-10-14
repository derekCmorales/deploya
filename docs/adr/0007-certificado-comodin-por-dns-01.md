# 0007 — Certificado comodín por DNS-01 en el VPS

- **Estado:** Propuesto
- **Fecha:** 2026-10-14
- **Autor:** @derekCmorales · **Módulos:** M5, M6
- **Change de OpenSpec:** `feat/m6-vps-https`

## Contexto

Desde el Avance 3 el entorno de pruebas es un VPS con `https://<proyecto>.deploya.app`. Cada alta y cada baja de un proyecto crea o borra un subdominio, y en la demo se hacen decenas. Let's Encrypt limita cuántos certificados se emiten por dominio y por semana, y un desafío HTTP-01 solo prueba **un** nombre: con él, cada proyecto nuevo pediría su propio certificado y esperaría a que el desafío pase antes de responder.

## Decisión

Usamos **un certificado comodín** (`deploya.app` + `*.deploya.app`) emitido por **DNS-01** con el resolvedor `letsencrypt` de Traefik. Traefik lo emite una vez, lo renueva solo (cada 60 días) y lo guarda en `acme.json`. Las rutas dinámicas que escribe `EnrutamientoTraefikArchivo` solo nombran el resolvedor y los dominios (`tls.certResolver`, `domains`); no hay un certificado por proyecto. El dominio, el esquema y el resolvedor son configuración (`DOMINIO_BASE`, `ESQUEMA_PUBLICO`, `CERT_RESOLVER`), de modo que en desarrollo la misma clase publica `http://<proyecto>.localhost` sin TLS. El token del proveedor DNS tiene permiso **solo sobre la zona** y vive en `.env.vps` del servidor; nunca en el repositorio.

## Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| **Comodín por DNS-01** (elegida) | Un certificado para todos los proyectos; alta de proyecto sin esperar al emisor; fuera de los límites por dominio | Exige un token del proveedor DNS en el servidor |
| HTTP-01 por proyecto | Sin token de DNS | Un certificado por subdominio: límites de Let's Encrypt, el primer acceso espera la emisión y falla si el DNS aún no propaga |
| Certificado autofirmado | Sin cuentas externas | Advertencia en el navegador: no sirve para la demo |
| Caddy con TLS bajo demanda | Emisión automática | Segundo enrutador de borde: rompe el ADR 0005 (rutas como archivo y conmutación sin corte) |
| Terminar TLS en un CDN | Cero certificados propios | Una dependencia externa más y la conmutación sin corte pasa por un tercero |

## Consecuencias

- **OCP/DIP:** local y VPS son el mismo código con otra configuración; `CertificadoPuerto` (`CertificadoAcmeArchivo` / `CertificadoAusente`, un Null Object) permite que 12b muestre el vencimiento sin saber si hay TLS.
- **Seguridad:** el token DNS es el secreto más delicado del servidor. Se limita a la zona, no se versiona y se rota si el servidor se compromete. Un proyecto no puede llamarse `api`, `www` ni cualquier nombre reservado: su ruta chocaría con la de la plataforma.
- **Operación:** si Traefik no logra renovar, el panel lo muestra (fecha de vencimiento en 12b) antes de que el navegador avise. Un solo VPS: si cae, cae todo; el plan B de la demo es compose local.
- **Dependencia externa:** Let's Encrypt y la API del proveedor DNS. Mientras el certificado no exista, `acme.json` está vacío y la vista de despliegue dice `certificado: null`, no falla.
