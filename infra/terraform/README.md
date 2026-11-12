# Terraform: el servidor de Deploya en AWS

Crea una **EC2 `m7i-flex.large` (2 vCPU, 8 GB) en us-east-2** (Ubuntu 24.04) que corre toda la plataforma con los compose existentes. `docker-compose.vps.yml` es el compose de producción: el nombre «vps» es histórico y el servidor es esta EC2. Decisión y costos: [ADR 0009](../../docs/adr/0009-piloto-en-aws-ec2-con-terraform.md); ruta de escala: [ADR 0010](../../docs/adr/0010-escala-con-ecs-y-construcciones-en-fargate.md). Operación diaria: [docs/infra-vps.md](../../docs/infra-vps.md).

| Archivo | Qué crea |
|---|---|
| `red.tf` | VPC propia, subred pública, Internet Gateway (sin NAT) y grupo de seguridad con 80/443; el 22 solo con `cidr_administracion` |
| `iam.tf` | Perfil de instancia con solo `AmazonSSMManagedInstanceCore` (Session Manager) |
| `main.tf` | EC2 con IMDSv2 de un salto, disco gp3 cifrado, Elastic IP y presupuesto de AWS Budgets |
| `respaldos.tf` | Snapshot diario del disco con Data Lifecycle Manager (7 días) y su rol IAM: respaldo mínimo de la base y de los volúmenes de los recursos de datos ([ADR 0012](../../docs/adr/0012-recursos-de-datos-en-el-nodo.md)) |
| `landing.tf` | Landing pública: bucket S3 privado, CloudFront con OAC, certificado de ACM en us-east-1, función de rutas y cabeceras de seguridad ([ADR 0011](../../docs/adr/0011-landing-en-s3-y-cloudfront.md)) |
| `cloud-init.yml` + `preparar-servidor.sh` | Primer arranque: Docker CE y Compose oficiales, `daemon.json`, swap, sysctl, sshd sin contraseñas, unattended-upgrades, usuario `deploya`, clon en `/srv/deploya`, cron del manual §3.5 e imágenes base descargadas |

**Ningún secreto pasa por Terraform.** El estado y el user_data son texto plano: `.env.vps` se copia a mano al servidor.

## Flujo

Requisitos: Terraform ≥ 1.9, AWS CLI v2 con el [plugin de Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html) y credenciales de la cuenta.

### Credenciales

Si entras con **`aws login`** (el perfil de `~/.aws/config` tiene `login_session`), el proveedor de AWS de Terraform no sabe leer esa sesión: falla con `No valid credential sources found` y un error de `ec2imds`. Pásale las credenciales con la CLI. Lo más cómodo es un perfil aparte que las pide y las renueva solo:

```ini
# ~/.aws/config
[profile deploya-tf]
region = us-east-2
credential_process = aws configure export-credentials --profile <tu-perfil-de-aws-login> --format process
```

```bash
export AWS_PROFILE=deploya-tf
aws sts get-caller-identity   # comprueba la cuenta antes de crear nada
```

Tiene que ser un perfil nuevo: con `credential_process` dentro del mismo perfil, la CLI se llama a sí misma. Para una sola terminal también sirve `eval "$(aws configure export-credentials --profile <perfil> --format env)"`, pero esas credenciales caducan y hay que repetirlo si aparece `ExpiredToken`. Con `aws configure` (claves de acceso) o SSO no hace falta nada de esto.

### Plan gratuito de AWS

Las cuentas creadas desde julio de 2025 empiezan en el **plan gratuito**: todo se paga con los créditos y AWS **no cobra a la tarjeta** (si los créditos se acaban, cierra la cuenta en vez de cobrar). A cambio, solo deja lanzar tipos elegibles; `t3.large` no lo es y el apply falla con `InvalidParameterCombination: ... not eligible for Free Tier`. Por eso el tipo por defecto es **`m7i-flex.large`**: el único x86 elegible con 8 GB. Para ver la lista de tu región:

```bash
aws ec2 describe-instance-types --region us-east-2 --filters Name=free-tier-eligible,Values=true \
  --query 'InstanceTypes[].[InstanceType,MemoryInfo.SizeInMiB]' --output text
```

Con la cuenta en plan de pago puedes volver a `tipo_instancia = "t3.large"` (más barato por hora, con créditos de CPU).

### Crear

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # dominio y correos del presupuesto
terraform init
terraform plan -out=piloto.tfplan
terraform apply piloto.tfplan
terraform output siguientes_pasos
```

**Si el apply se queda a medias** (por ejemplo, falla la EC2 y lo demás sí se creó), no borres nada ni empieces de cero: lo creado ya está en `terraform.tfstate`. Corrige la causa y repite `terraform plan -out=piloto.tfplan` y `terraform apply piloto.tfplan`: el plan solo trae lo que falta (`Plan: 2 to add, 0 to change, 0 to destroy` si faltaba la EC2: la instancia y la asociación de su Elastic IP). Un plan guardado viejo no sirve después de un apply: Terraform lo rechaza por estar desactualizado.

Después, en orden (el output `siguientes_pasos` los imprime con la IP y el ID reales):

1. **DNS en Cloudflare**, a mano y en **Solo DNS** (nube gris), con lo que imprime `terraform output registros_dns`: A `*.<dominio>` hacia `ip_publica` (cubre `app.`, `api.` y las apps) y CNAME `<dominio>` y `www.<dominio>` hacia CloudFront (la landing). Con el proxy naranja, Cloudflare termina TLS y agrega un salto que `PROXIES_DE_CONFIANZA=1` no espera.
2. **Confirmar** la suscripción del correo de AWS Budgets.
3. **Esperar a cloud-init** (5 a 10 min): `terraform output -raw comando_ssm`, y dentro, `cloud-init status --wait && cat /var/lib/deploya/preparado`.
4. **Copiar `.env.vps`** (de `.env.vps.example`, variables en el [manual técnico §3.2](../../docs/entrega-final/manual-tecnico.md#32-variables-de-envvps)). Dentro de la sesión de SSM:
   ```bash
   sudo -iu deploya
   cd /srv/deploya && umask 077 && cat > .env.vps   # pegar y terminar con Ctrl-D
   chmod 600 .env.vps
   ```
   Con `clave_publica_ssh`, también sirve `scp` por el túnel de SSM, sin abrir el 22:
   ```bash
   scp -o ProxyCommand="aws ssm start-session --region us-east-2 --target %h --document-name AWS-StartSSHSession --parameters portNumber=%p" .env.vps deploya@<id_instancia>:/srv/deploya/.env.vps
   ```
5. **Publicar**, como `deploya` en `/srv/deploya`: `scripts/desplegar-vps.sh` (o `RAMA=… scripts/desplegar-vps.sh`). Con `HOST_WEB=app.<dominio>` y `URL_LANDING=https://<dominio>` en `.env.vps`, la web queda en `app.` y la raíz es la landing.
6. **Publicar la landing** desde el repo `deploya_landing` (sección siguiente).
7. **Comprobar** desde tu equipo: `curl -I https://<dominio>`, `curl -I https://app.<dominio>`, `curl -I https://api.<dominio>/health` y `node e2e/vps.mjs` ([manual §3.4](../../docs/entrega-final/manual-tecnico.md#34-comprobar)).

## Landing (S3 + CloudFront)

La raíz `<dominio>` y `www.<dominio>` sirven la landing estática desde CloudFront; la web está en `app.<dominio>` ([ADR 0011](../../docs/adr/0011-landing-en-s3-y-cloudfront.md)). S3 y CloudFront no viven en la VPC: no hay grupos de seguridad que abrir. El bucket es privado y solo lo lee la distribución (Origin Access Control).

**Primera vez** (ACM no emite el certificado hasta ver la validación en el DNS):

```bash
terraform apply -target=aws_acm_certificate.landing
terraform output registros_dns_validacion_landing   # crear esos CNAME en Cloudflare (Solo DNS)
terraform plan -out=piloto.tfplan && terraform apply piloto.tfplan   # espera la validación y crea CloudFront
terraform output registros_dns                      # CNAME de <dominio> y www hacia CloudFront
```

Si `<dominio>` ya tenía un registro A hacia la EC2, bórralo antes de crear el CNAME. Los CNAME de validación se quedan: ACM los usa para renovar solo.

**Publicar o actualizar la landing**, desde el repo `deploya_landing` con AWS CLI y credenciales de la cuenta:

```bash
LANDING_BUCKET=$(terraform -chdir=../deploya/infra/terraform output -raw landing_bucket) \
LANDING_DISTRIBUCION=$(terraform -chdir=../deploya/infra/terraform output -raw landing_distribucion) \
pnpm deploy:aws
```

Costo: la capa gratuita de CloudFront (1 TB de transferencia y 10 millones de peticiones al mes) cubre la landing; S3 son centavos por unos MB; el certificado de ACM es gratis.

## Decisiones que conviene saber

- **Sin puerto 22 por defecto.** La consola va por SSM (sale por 443 desde la EC2). `cidr_administracion` abre el 22 solo a ese CIDR, nunca a `0.0.0.0/0` (lo valida `variables.tf`), y exige `clave_publica_ssh`: sshd no acepta contraseñas ni root.
- **IMDSv2 con `http_put_response_hop_limit = 1`.** Los contenedores de los usuarios corren en redes bridge, un salto más allá del host: no alcanzan el token y, por tanto, tampoco las credenciales del perfil de instancia.
- **`default-address-pools` en `daemon.json`.** Cada proyecto tiene su red; los rangos por defecto de Docker se acaban hacia las 30 redes. Con `172.16.0.0/12` en `/24` caben 4096. Por eso `cidr_vpc` no puede ser `172.x`.
- **`ignore_changes = [ami, user_data]`.** Una AMI nueva o un cambio en cloud-init no recrean el servidor (perdería la base). Para reconstruirlo a propósito: respaldo y `terraform apply -replace=aws_instance.servidor`.
- **DNS a mano y no con el proveedor de Cloudflare.** Son pocos registros que no cambian (la IP es fija y el dominio de CloudFront también). El proveedor exige un token configurado aunque no cree nada, y ese token terminaría en una variable del operador; el de Traefik ya es sensible (ADR 0007) y no conviene sumar otro.
- **Créditos de CPU solo en la familia t.** `credit_specification` se agrega solo si `tipo_instancia` empieza con `t`; con `m7i-flex` AWS lo rechazaría, y ese tipo no tiene ráfagas que cobrar.
- **Presupuesto sobre el costo bruto** (`include_credit = false`): con los créditos de AWS el costo neto se ve en 0 y los avisos no llegarían.
- **`.terraform.lock.hcl` versionado**, con las sumas `zh:` de Linux, macOS y Windows (amd64 y arm64) de `hashicorp/aws` 5.80.0: todos instalan exactamente el mismo proveedor.
- **Estado local.** Un solo operador para el piloto. No se versiona. Con más personas, backend S3 cifrado con bloqueo (`use_lockfile`).

## Costo y destruir

Con `m7i-flex.large` (0.09576 USD/h), disco de 80 GB, IPv4 y snapshots: **≈ 13.5 USD por 5 días** y ≈ 82 USD por un mes completo, descontados de los créditos. Con `m7i-flex.xlarge` para el piloto con Nimbo: ≈ 25 USD por 5 días y ≈ 152 USD por mes. Modelo completo: [docs/costos.md](../../docs/costos.md). La Elastic IP cobra aunque la EC2 no exista, así que no dejes un apply a medias por días: termínalo o destrúyelo.

`terraform destroy` borra **todo** lo que creó Terraform, también la EC2 **con su disco** (base y respaldos locales incluidos). Antes: `scripts/respaldar.sh`, copiar `/var/backups/deploya` fuera y guardar `CLAVE_CIFRADO_VARIABLES`. Con `proteccion_terminacion = true`, primero ponla en `false` y aplica. Los **snapshots de DLM no se borran** con el destroy (son la última copia): bórralos a mano cuando ya no hagan falta (`aws ec2 describe-snapshots --owner-ids self --filters Name=tag:CreadoPor,Values=dlm`), porque siguen cobrando 0.05 USD/GB-mes. Al final, `terraform state list` debe salir vacío.
