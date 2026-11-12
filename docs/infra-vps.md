# VPS: puesta en marcha (M6-02)

Guía operativa de `docker-compose.vps.yml`. Las decisiones están en [ADR 0005](adr/0005-traefik-proveedor-de-archivo.md), [ADR 0007](adr/0007-certificado-comodin-por-dns-01.md) y, para los recursos de datos, [ADR 0012](adr/0012-recursos-de-datos-en-el-nodo.md); los costos, en [costos.md](costos.md); el diagrama, en [despliegue-infraestructura.mmd](diagramas/compartido/despliegue-infraestructura.mmd). Manual completo (variables, cron de respaldos y salud, problemas comunes): [entrega-final/manual-tecnico.md](entrega-final/manual-tecnico.md#3-vps-de-la-nube-producción). Lo de este documento **se verifica a mano en el servidor**: las pruebas unitarias no tocan DNS, certificados ni correo ([ingenieria.md §5.5](ingenieria.md)).

## 0. Crear el servidor en AWS con Terraform

El servidor es una **EC2 `m7i-flex.large` en AWS** (2 vCPU, 8 GB; us-east-2, Ubuntu 24.04) creada con [infra/terraform/](../infra/terraform/README.md) ([ADR 0009](adr/0009-piloto-en-aws-ec2-con-terraform.md)). `docker-compose.vps.yml` es el compose de producción: «vps» es solo el nombre del archivo. Terraform deja listo lo de «Servidor» de la tabla de §1 (Docker y Compose oficiales, usuario `deploya`, clon en `/srv/deploya`, 80/443 abiertos y administración por SSM sin puerto 22) y además el cron de [§3.5 del manual](entrega-final/manual-tecnico.md#35-operación-diaria-cron-del-servidor). **No** lleva secretos: `.env.vps` se copia a mano.

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
| Disco por encima del 80 % | Volúmenes de datos e imágenes: §5.1 |
| La web llama a `localhost:3001` | La imagen de la web se construyó sin `build.args`: `up -d --build web` con `.env.vps` |

Los secretos (`CF_DNS_API_TOKEN`, `SMTP_CLAVE`, `ADMIN_CLAVE`, `POSTGRES_PASSWORD`, `CLAVE_CIFRADO_VARIABLES`) solo viven en `.env.vps` del servidor.

## 5. Recursos de datos: respaldo, restauración y disco

Los recursos de datos de los usuarios (PostgreSQL + pgvector, Redis, S3) son contenedores con un volumen Docker en este mismo disco ([ADR 0012](adr/0012-recursos-de-datos-en-el-nodo.md), [contrato](contratos/recursos-datos.md)). Contenedor y volumen se llaman igual: `deploya-datos-<subdominio-dueño>-<tipo>` (p. ej. `deploya-datos-nimbo-api-postgres`). El respaldo automático es el **snapshot diario del disco** con DLM (04:00 UTC, 7 días, [respaldos.tf](../infra/terraform/respaldos.tf)); lo de abajo es el respaldo y la restauración **manual**, por recurso. Todo como `deploya` en el servidor (está en el grupo `docker`); `sudo` solo donde se indica.

### 5.1 Ver el uso de disco

```bash
df -h /                                                 # disco raíz (80 GB): avisar por encima de 80 %
docker system df                                        # imágenes, contenedores, volúmenes y caché de BuildKit
docker system df -v | grep -E '^VOLUME NAME|deploya-datos-'   # tamaño de cada volumen de datos
docker volume ls --filter name=deploya-datos-           # qué recursos hay
sudo du -sh /var/lib/docker/volumes/deploya-datos-*/_data | sort -h   # lo mismo, medido en el sistema de archivos
```

Si el disco pasa el 80 %: primero `docker builder prune -f` y `docker image prune -f` (las 5 versiones guardadas por proyecto tienen etiqueta y no se borran); después, ver qué volumen creció con el `du` y avisar al dueño (el límite `discoDatosMb` se avisa, no se corta). Si hace falta más disco: subir `tamano_disco_gb` en Terraform y `terraform apply` (en sitio, sin recrear la EC2), y en el servidor `sudo growpart /dev/nvme0n1 1 && sudo resize2fs /dev/nvme0n1p1`. AWS permite una modificación del volumen cada 6 horas.

### 5.2 Respaldo de un volumen (copia en frío, cualquier tipo)

Detiene el recurso unos segundos para que la copia sea consistente; las apps conectadas pierden la conexión mientras tanto (avisa al dueño).

```bash
VOL=deploya-datos-nimbo-api-postgres          # contenedor y volumen tienen el mismo nombre
DESTINO=/var/backups/deploya/datos && mkdir -p "$DESTINO" && cd "$DESTINO"
docker stop "$VOL"
docker run --rm -v "$VOL":/v:ro -v "$PWD":/b alpine tar czf "/b/$VOL-$(date +%F).tar.gz" -C /v .
docker start "$VOL"
ls -lh "$VOL"-*.tar.gz
```

### 5.3 Respaldo lógico de PostgreSQL (sin detenerlo)

`pg_dump` dentro del contenedor, por el socket local (usuario `deploya`, base `app`, según el contrato):

```bash
C=deploya-datos-nimbo-api-postgres
docker exec "$C" pg_dump -U deploya -d app -Fc > "/var/backups/deploya/datos/$C-$(date +%F).dump"
docker exec "$C" psql -U deploya -d app -c '\dx'      # extensiones (vector) que necesitará la restauración
```

Restaurar el dump sobre el mismo recurso (o sobre uno nuevo del mismo usuario):

```bash
docker exec -i "$C" pg_restore -U deploya -d app --clean --if-exists --no-owner < /var/backups/deploya/datos/<archivo>.dump
```

Redis (con AOF) y S3 se respaldan con la copia en frío de §5.2. Copia los archivos de `/var/backups/deploya/datos` fuera del servidor igual que los respaldos de la plataforma: el disco es el mismo.

### 5.4 Restaurar un volumen desde un `.tar.gz`

```bash
VOL=deploya-datos-nimbo-api-postgres
docker stop "$VOL"
docker run --rm -v "$VOL":/v -v /var/backups/deploya/datos:/b:ro alpine \
  sh -c 'find /v -mindepth 1 -delete && tar xzf "/b/'"$VOL"'-AAAA-MM-DD.tar.gz" -C /v'
docker start "$VOL" && docker logs --tail 20 "$VOL"
```

### 5.5 Restaurar un volumen desde un snapshot de DLM

Sirve si el volumen se borró o se dañó y no hay `.tar.gz`. Desde un equipo con AWS CLI (la zona es la de la EC2):

```bash
aws ec2 describe-snapshots --owner-ids self --filters Name=tag:CreadoPor,Values=dlm \
  --query 'reverse(sort_by(Snapshots,&StartTime))[].[SnapshotId,StartTime]' --output text
AZ=$(aws ec2 describe-instances --instance-ids <id_instancia> --query 'Reservations[0].Instances[0].Placement.AvailabilityZone' --output text)
aws ec2 create-volume --snapshot-id <snap-…> --availability-zone "$AZ" --volume-type gp3 --encrypted
aws ec2 attach-volume --volume-id <vol-…> --instance-id <id_instancia> --device /dev/sdf
```

En el servidor (el disco restaurado aparece como `nvme1n1`; ext4 permite montarlo aunque comparta UUID con la raíz):

```bash
lsblk
sudo mkdir -p /mnt/snapshot && sudo mount -o ro /dev/nvme1n1p1 /mnt/snapshot
VOL=deploya-datos-nimbo-api-postgres
docker stop "$VOL"
sudo rsync -a --delete "/mnt/snapshot/var/lib/docker/volumes/$VOL/_data/" "/var/lib/docker/volumes/$VOL/_data/"
docker start "$VOL"
sudo umount /mnt/snapshot
```

Al final, `aws ec2 detach-volume --volume-id <vol-…>` y `aws ec2 delete-volume --volume-id <vol-…>` (el volumen temporal cobra 0.08 USD/GB-mes mientras exista). Si el volumen de Docker ya no existe (el recurso se eliminó), recrea el recurso desde la pestaña *Datos* del mismo proyecto dueño (vuelve el mismo nombre de contenedor y volumen, con contraseña nueva) y copia con el mismo `rsync`. En PostgreSQL el directorio copiado trae la contraseña vieja del rol `deploya`: tras `docker start`, ajústala a la nueva (la de `GET /proyectos/:id/datos/:recursoId/conexion`) con `docker exec -it "$VOL" psql -U deploya -d app -c '\password deploya'`, que la pide sin dejarla en el historial.

## 6. Actualizar AWS y publicar la versión con recursos de datos (Nimbo)

Orden único, la primera vez que se publica `feat/m5-recursos-datos`. **Ruta normal: §6.1 → §6.2 → §6.4 → §6.5, en el nodo de 8 GB y con la cuenta en el plan gratuito**; §6.3 es el plan B. Cada paso dice **qué** se hace y **por qué**; las cifras salen de [costos.md](costos.md) y la decisión, del [ADR 0012](adr/0012-recursos-de-datos-en-el-nodo.md). Todo lo de Terraform se corre desde tu equipo, en `infra/terraform`, con las credenciales exportadas (Terraform no lee la sesión de `aws login`):

```bash
cd infra/terraform
eval "$(aws configure export-credentials --profile <perfil> --format env)"
```

### 6.1 Qué cambia en AWS y por qué

`terraform plan` contra el piloto en línea (12-nov-2026) da **`3 to add, 1 to change, 0 to destroy`**: nada se recrea ni se borra, y todo funciona en el plan gratuito.

| Recurso | Cambio | Por qué | Costo |
|---|---|---|---|
| `aws_instance.servidor` → disco raíz | 70 → **80 GB**, en sitio (`ModifyVolume`), y etiqueta `Respaldo=dlm-diario-<entorno>` | Los volúmenes de los recursos de datos viven en `/var/lib/docker/volumes` del mismo disco; la cuenta de [variables.tf](../infra/terraform/variables.tf) da ≈ 57 GB comprometidos y el resto es colchón, porque el disco de datos se mide y se avisa, no se corta. La etiqueta es la que busca DLM | +0.80 USD/mes |
| `aws_iam_role.dlm` + adjunto | Nuevo rol que asume `dlm.amazonaws.com` con la política administrada `AWSDataLifecycleManagerServiceRole` | DLM necesita permiso para crear, etiquetar y borrar snapshots. Se usa la política administrada de AWS: solo snapshots de EBS, nada más (mínimo privilegio sin escribir JSON propio) | 0 |
| `aws_dlm_lifecycle_policy.diario` | Snapshot diario 04:00 UTC, guarda 7 | El nodo ahora guarda **datos de clientes**: perder el disco ya no es «redesplegar». Es el respaldo mínimo **fuera del nodo** (vive en S3 de AWS, sobrevive a un disco dañado y a `terraform destroy`). 04:00 va después del `pg_dump` de las 03:00, así el snapshot ya lo incluye | ≈ 2 USD/mes (incremental) |
| `tipo_instancia` | **No cambia: se queda en `m7i-flex.large` (8 GB)**. El xlarge es solo plan B (§6.3) | Nimbo se usa para la presentación, solo en el nodo. En uso **real** el peor momento es ≈ 6.5 de 8 GB (sistema y plataforma ≈ 2, Nimbo ≈ 2.5, una construcción ≈ 2) más 4 GB de swap para construir. El 88 % de memoria **comprometida** solo es un problema con otros clientes compartiendo el nodo. Y es el tipo más grande que deja el plan gratuito (consultado: `free-tier-eligible` llega a 8 GB) | 0 (≈ 13.5 USD por 5 días, como hoy) |

Lo que **no** cambia: VPC, grupo de seguridad (sigue sin puerto 22 ni puertos de bases: los recursos de datos no publican puertos en el host), Elastic IP, IAM de SSM, landing (S3 + CloudFront) y presupuesto. No se usa RDS ni ElastiCache: ≈ 23 USD por proyecto contra ≈ 1.5 USD de ingreso (ADR 0012, alternativas).

### 6.2 Disco y snapshots (sirve en el plan gratuito)

```bash
terraform plan -out=datos.tfplan        # debe decir 3 to add, 1 to change, 0 to destroy
terraform apply datos.tfplan
terraform output politica_snapshots     # policy-…
aws dlm get-lifecycle-policies --region us-east-2 --query 'Policies[].[PolicyId,State,Description]' --output table
```

Luego, en el servidor (`terraform output -raw comando_ssm`), crecer la partición y el sistema de archivos, porque AWS agranda el volumen pero no la partición:

```bash
lsblk                                                  # nvme0n1 ya muestra 80G
sudo growpart /dev/nvme0n1 1 && sudo resize2fs /dev/nvme0n1p1
df -h /                                                # ≈ 78G
```

**Por qué separado del cambio de tipo:** esto funciona con la cuenta en el plan gratuito; el xlarge no. Si van juntos y la cuenta sigue en plan gratuito, el apply queda a medias con `InvalidParameterCombination`. AWS permite una modificación del volumen cada 6 horas: no repitas el paso si algo falla después, sigue desde aquí.

### 6.3 Plan B: permitir el `m7i-flex.xlarge`

**No es parte de la ruta normal.** Úsalo solo si, con Nimbo en marcha, `free -h` muestra el swap lleno o `docker stats` muestra reinicios por falta de memoria (OOM). Mientras tanto la cuenta se queda en el plan gratuito.


Al 12-nov-2026 la cuenta está en **plan gratuito, activo, con 120 USD de crédito** (vence el 12-may-2027): `aws freetier get-account-plan-state --region us-east-1`. Ese plan **no deja lanzar ningún tipo de 16 GB**. Para permitirlo hay que pasar la cuenta a **plan de pago**:

1. Consola de AWS → *Billing and Cost Management* → *Free Tier* (o el aviso «Upgrade plan» del panel) → **Upgrade to paid plan**. Lo hace el dueño de la cuenta (usuario raíz o alguien con permisos de facturación); no hay API ni recurso de Terraform para esto, a propósito.
2. Comprobar: `aws freetier get-account-plan-state --region us-east-1` → `"accountPlanType": "PAID"`.

**Por qué es aceptable:**

- Los **créditos se conservan**: 5 días en xlarge (≈ 25 USD) salen de los 120 y quedan ≈ 95.
- El presupuesto de 70 USD (`tope_presupuesto_usd`, avisos al 50, 80 y 100 % reales y al 100 % pronosticado) **sigue activo** y avisa por correo antes de que el gasto se salga de lo previsto. No hace falta subirlo para 5 días.
- Se elige `m7i-flex.xlarge` y no `t3.xlarge` (18 USD/mes más barato) porque no tiene créditos de CPU que agotar ni excedente que cobrar: el peor caso de `t3.xlarge` en `unlimited` suma 87.60 USD/mes, justo lo que no queremos en una cuenta que ya cobra a tarjeta.

**Riesgo y cómo se acota:** en plan de pago, cuando los créditos se acaban **AWS cobra a la tarjeta en lugar de cerrar la cuenta**, y **no se puede volver** al plan gratuito. Se acota con (a) el presupuesto de 70 USD, (b) volver a `m7i-flex.large` al terminar el piloto (§6.6) y (c) la fecha de destrucción del piloto. Un mes entero en xlarge (≈ 152 USD) pasa del tope y de los créditos: **no dejarlo encendido así**.

Cambio de tipo (≈ 2 minutos de corte; la Elastic IP, el disco y los volúmenes de datos se conservan, los contenedores vuelven solos por su `restart: unless-stopped`):

```bash
# en terraform.tfvars:
#   tipo_instancia = "m7i-flex.xlarge"
terraform plan -out=xlarge.tfplan       # solo instance_type: "m7i-flex.large" -> "m7i-flex.xlarge"
terraform apply xlarge.tfplan
```

### 6.4 Servidor y publicación

| # | Paso | Cómo | Por qué |
|---|---|---|---|
| 1 | Entorno | En `.env.vps`: `MOTOR_TIEMPO_MAXIMO_CONSTRUCCION_MIN=20` y `TRABAJADOR_CONCURRENCIA=1` (el valor por defecto; `2` solo con el xlarge) | Los cuatro proyectos de Nimbo (Next.js y NestJS) tardan más que el tope por defecto. En 8 GB, una construcción a la vez es lo que deja margen de memoria a Nimbo en marcha; con 4 vCPU cabrían dos. `DOMINIO_BASE` ya existe y ahora también lo lee la API (URL pública del S3) |
| 2 | Imágenes de datos | `docker pull pgvector/pgvector:pg17 redis:7-alpine pgsty/silo` | Que el primer «Crear» no espere la descarga y no choque con el tiempo de espera del trabajador |
| 3 | Publicar | `scripts/desplegar-vps.sh` | Aplica la migración `20261112120000_recursos_datos` (tablas nuevas, `Plan.maxRecursosDatos`, `Plan.discoDatosMb`, `Proyecto.comandoInicio`) y el seed con los límites por plan; ambos son idempotentes |
| 4 | Landing | En `deploya_landing`: `pnpm deploy:aws` | La sección *Datos y precios* anuncia bases y disco; sin esto la landing promete menos de lo que hay |

### 6.5 Comprobación

```bash
curl -s https://api.<dominio>/datos/health                 # {"status":"ok"} o equivalente
curl -s https://api.<dominio>/suscripciones/planes | grep -c maxRecursosDatos
free -h                                                    # con Nimbo en marcha: swap casi libre fuera de las construcciones
docker stats --no-stream --format '{{.Name}} {{.MemUsage}}' | sort
```

En la web: un proyecto → pestaña **Datos** → *Crear PostgreSQL* → pasa a **Disponible** → *Desplegar* → la bitácora de Ejecución dice «Recursos conectados: postgres · N variables». `docker ps --filter name=deploya-datos-` lista el contenedor y `docker volume ls --filter name=deploya-datos-` su volumen. Al día siguiente, `aws ec2 describe-snapshots --owner-ids self --filters Name=tag:CreadoPor,Values=dlm` muestra el primer snapshot. Recorrido automatizado: `e2e/` (ver su README).

Para desplegar Nimbo: guía `docs/operations/deploya.md` en su repo (4 proyectos en una cuenta **Pro** o **Business**, recursos en el proyecto `nimbo-api` compartidos con los workers).

### 6.6 Al terminar el piloto con Nimbo

Despliega los 4 proyectos de Nimbo **uno por uno** (primero `nimbo-api` con sus recursos) y no subas otras apps pesadas mientras dure la presentación.

- **Si el nodo sigue y se abre a más usuarios:** detén o borra los proyectos y recursos de Nimbo: sus límites (5.25 GB) no dejan sitio a otros clientes en 8 GB. Si usaste el plan B, vuelve con `tipo_instancia = "m7i-flex.large"` (o borra la línea), `terraform apply` y `TRABAJADOR_CONCURRENCIA=1`. El disco de 80 GB **no se puede achicar**; se queda.
- **Si el piloto se destruye:** `scripts/respaldar.sh`, copiar `/var/backups/deploya` fuera, guardar `CLAVE_CIFRADO_VARIABLES`, `terraform destroy` y luego borrar a mano los snapshots de DLM (sobreviven al destroy y cobran 0.05 USD/GB-mes) y el token de Cloudflare. Detalle en [infra/terraform/README.md](../infra/terraform/README.md).
