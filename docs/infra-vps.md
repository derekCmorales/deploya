# VPS: puesta en marcha (M6-02)

Guía operativa de `docker-compose.vps.yml`. Las decisiones están en [ADR 0005](adr/0005-traefik-proveedor-de-archivo.md) y [ADR 0007](adr/0007-certificado-comodin-por-dns-01.md); el diagrama, en [despliegue-infraestructura.mmd](diagramas/compartido/despliegue-infraestructura.mmd). Manual completo (variables, cron de respaldos y salud, problemas comunes): [entrega-final/manual-tecnico.md](entrega-final/manual-tecnico.md#3-vps-de-la-nube-producción). Lo de este documento **se verifica a mano en el servidor**: las pruebas unitarias no tocan DNS, certificados ni correo ([ingenieria.md §5.5](ingenieria.md)).

## 0. Crear el servidor en AWS con Terraform

El servidor es una **EC2 `t3.large` en AWS** (us-east-1, Ubuntu 24.04) creada con [infra/terraform/](../infra/terraform/README.md) ([ADR 0009](adr/0009-piloto-en-aws-ec2-con-terraform.md)). `docker-compose.vps.yml` es el compose de producción: «vps» es solo el nombre del archivo. Terraform deja listo lo de «Servidor» de la tabla de §1 (Docker y Compose oficiales, usuario `deploya`, clon en `/srv/deploya`, 80/443 abiertos y administración por SSM sin puerto 22) y además el cron de [§3.5 del manual](entrega-final/manual-tecnico.md#35-operación-diaria-cron-del-servidor). **No** lleva secretos: `.env.vps` se copia a mano.

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # dominio y correos del presupuesto
terraform init && terraform apply
terraform output siguientes_pasos               # DNS, cloud-init, .env.vps, desplegar
```

Luego: registros A en Cloudflare en «Solo DNS» hacia `ip_publica`, `cloud-init status --wait` por `terraform output -raw comando_ssm`, `.env.vps` con `chmod 600` y §2. El resto de §1 (DNS, token, correo, entorno) sigue igual.

## 1. Una sola vez

| Qué | Cómo |
|---|---|
| Servidor | Lo crea Terraform (§0). A mano en otro proveedor: Ubuntu 24.04, 2 vCPU y 4 GB o más, Docker Engine y Compose 2.24 o más, usuario sin root en el grupo `docker`, firewall con 80 y 443 (y 22 solo desde tu IP) |
| DNS | Registro A de `<dominio>` y de `*.<dominio>` hacia la IP del servidor |
| Token DNS | Cloudflare: *API Token* con `Zone · DNS · Edit` solo sobre la zona. Con otro proveedor, cambia `provider` en [traefik.vps.yml](../infra/traefik/traefik.vps.yml) y el nombre de la variable del token en [docker-compose.vps.yml](../docker-compose.vps.yml) |
| Correo | Resend con el dominio verificado (SPF, DKIM y DMARC). Se configura solo con variables SMTP (ADR 0001): pasos en [correo-produccion.md](correo-produccion.md) |
| Entorno | `cp .env.vps.example .env.vps` y rellenarlo. Es un archivo del servidor: **nunca se sube** |

## 2. Cada publicación

```bash
scripts/desplegar-vps.sh            # rama main
RAMA=Entrega-85% scripts/desplegar-vps.sh
```

El script hace `git pull --ff-only`, genera `infra/traefik/plataforma.generada.yml` con el dominio, corre `docker compose --env-file .env.vps -f docker-compose.yml -f docker-compose.vps.yml up -d --build` (todos los servicios con `restart: unless-stopped` y logs rotados), repite las migraciones y el seed (idempotentes) y espera a que la API responda.

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
| El correo no llega | `SMTP_*` y el dominio verificado en Resend; la API registra el fallo de envío. Tabla completa en [correo-produccion.md §5](correo-produccion.md#5-si-algo-falla) |
| La web llama a `localhost:3001` | La imagen de la web se construyó sin `build.args`: `up -d --build web` con `.env.vps` |

Los secretos (`CF_DNS_API_TOKEN`, `SMTP_CLAVE`, `ADMIN_CLAVE`, `POSTGRES_PASSWORD`, `CLAVE_CIFRADO_VARIABLES`) solo viven en `.env.vps` del servidor.
