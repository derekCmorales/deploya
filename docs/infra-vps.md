# VPS: puesta en marcha (M6-02)

Guía operativa de `docker-compose.vps.yml`. Las decisiones están en [ADR 0005](adr/0005-traefik-proveedor-de-archivo.md) y [ADR 0007](adr/0007-certificado-comodin-por-dns-01.md); el diagrama, en [despliegue-infraestructura.mmd](diagramas/compartido/despliegue-infraestructura.mmd). Lo de este documento **se verifica a mano en el servidor**: las pruebas unitarias no tocan DNS, certificados ni correo ([ingenieria.md §5.5](ingenieria.md)).

## 1. Una sola vez

| Qué | Cómo |
|---|---|
| Servidor | Ubuntu 24.04, 2 vCPU y 4 GB, Docker Engine y Compose 2.24 o más, usuario sin root en el grupo `docker`, firewall con 22, 80 y 443 |
| DNS | Registro A de `<dominio>` y de `*.<dominio>` hacia la IP del servidor |
| Token DNS | Cloudflare: *API Token* con `Zone · DNS · Edit` solo sobre la zona. Con otro proveedor, cambia `provider` en [traefik.vps.yml](../infra/traefik/traefik.vps.yml) y el nombre de la variable del token en [docker-compose.vps.yml](../docker-compose.vps.yml) |
| Correo | Resend o Brevo con el dominio verificado (SPF y DKIM). Se configura solo con variables SMTP (ADR 0001) |
| Entorno | `cp .env.vps.example .env.vps` y rellenarlo. Es un archivo del servidor: **nunca se sube** |

## 2. Cada publicación

```bash
scripts/desplegar-vps.sh            # rama main
RAMA=Entrega-85% scripts/desplegar-vps.sh
```

El script hace `git pull --ff-only`, genera `infra/traefik/plataforma.generada.yml` con el dominio, corre `docker compose --env-file .env.vps -f docker-compose.yml -f docker-compose.vps.yml up -d --build`, repite las migraciones y el seed (idempotentes) y espera a que la API responda.

## 3. Cómo saber que quedó

```bash
curl -I https://api.<dominio>/health          # 200 con el certificado *.<dominio>
curl -I https://algo.<dominio>                # 404 de Traefik, pero con el certificado *.<dominio>
curl -I http://hola-deploya.<dominio>         # 301 hacia https
echo | openssl s_client -connect <dominio>:443 -servername x.<dominio> 2>/dev/null | openssl x509 -noout -subject -enddate
```

Con el recorrido completo: registro con correo real, alta de `hola-deploya` y `https://hola-deploya.<dominio>` con candado. En 12b, «Certificado hasta …» sale de `acme.json`.

## 4. Si algo falla

| Síntoma | Qué mirar |
|---|---|
| Traefik sirve su certificado por defecto | `docker compose … logs traefik`: errores de ACME. Token sin permiso, registros A sin propagar o límite de Let's Encrypt |
| `certificado: null` en 12b con TLS activo | `acme.json` vacío (aún no se emitió) o la API sin el volumen `traefik_acme` en solo lectura |
| 502 al abrir un proyecto | El contenedor no está en la red del proyecto: mira el log del worker |
| El correo no llega | `SMTP_*` y el dominio verificado en el proveedor; la API registra el fallo de envío |
| La web llama a `localhost:3001` | La imagen de la web se construyó sin `build.args`: `up -d --build web` con `.env.vps` |

Los secretos (`CF_DNS_API_TOKEN`, `SMTP_CLAVE`, `ADMIN_CLAVE`, `POSTGRES_PASSWORD`, `CLAVE_CIFRADO_VARIABLES`) solo viven en `.env.vps` del servidor.
