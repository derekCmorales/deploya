# Una sola EC2 que corre toda la plataforma con los compose existentes (ADR 0009):
# docker-compose.yml + docker-compose.vps.yml, el compose de producción (el nombre «vps» es
# histórico: el servidor es esta EC2). La publica scripts/desplegar-vps.sh, a mano, con .env.vps.

# Ubuntu 24.04 LTS oficial de Canonical. Trae el agente de SSM preinstalado (snap).
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

locals {
  # Sin secretos: el user_data se lee desde la consola y la API de EC2, y queda en el estado.
  cloud_init = templatefile("${path.module}/cloud-init.yml", {
    dominio           = var.dominio
    repositorio       = var.repositorio
    rama              = var.rama
    clave_publica_ssh = var.clave_publica_ssh == null ? "" : trimspace(var.clave_publica_ssh)
    preparar          = file("${path.module}/preparar-servidor.sh")
  })
}

resource "aws_key_pair" "administracion" {
  count = var.clave_publica_ssh == null ? 0 : 1

  key_name   = "${local.nombre}-administracion"
  public_key = trimspace(var.clave_publica_ssh)
}

resource "aws_instance" "servidor" {
  ami                     = data.aws_ami.ubuntu.id
  instance_type           = var.tipo_instancia
  subnet_id               = aws_subnet.publica.id
  vpc_security_group_ids  = [aws_security_group.servidor.id]
  iam_instance_profile    = aws_iam_instance_profile.servidor.name
  key_name                = var.clave_publica_ssh == null ? null : aws_key_pair.administracion[0].key_name
  disable_api_termination = var.proteccion_terminacion
  monitoring              = false # Métricas básicas de 5 min, gratis; las detalladas cuestan por métrica.

  user_data                   = local.cloud_init
  user_data_replace_on_change = false

  # IMDSv2 obligatorio y con un solo salto. La respuesta al PUT del token sale con TTL de IP = 1:
  # el host la recibe, pero un contenedor en una red bridge de Docker está a un salto más (el
  # bridge reenvía y resta 1), así que el paquete muere antes de llegar. Los contenedores de los
  # usuarios no pueden sacar un token ni, con él, las credenciales del perfil de instancia; e
  # IMDSv1 (sin token) queda apagado. Docker y el agente de SSM corren en el host y no se afectan.
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "disabled"
  }

  # t3 en unlimited: las ráfagas (docker build) no se frenan al agotar créditos, y el excedente
  # sobre la línea base (30 % por vCPU en t3.large) se cobra a 0.05 USD por vCPU-hora. Ver ADR 0009.
  credit_specification {
    cpu_credits = var.creditos_cpu
  }

  # Toda la plataforma (PostgreSQL incluido) vive en este disco; los respaldos diarios también
  # (/var/backups/deploya): copiarlos fuera del servidor es parte de la operación (manual §3.5).
  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.tamano_disco_gb
    iops                  = 3000 # Línea base de gp3, incluida en el precio.
    throughput            = 125  # MB/s, también incluido.
    encrypted             = true # Con la clave administrada por AWS (aws/ebs): sin costo de KMS.
    delete_on_termination = true
    tags                  = { Name = "${local.nombre}-raiz" }
  }

  tags = { Name = local.nombre }

  lifecycle {
    # Una AMI nueva de Canonical o un cambio en cloud-init NO recrean el servidor (perdería la
    # base). cloud-init solo corre en el primer arranque; para reconstruir, `terraform apply
    # -replace=aws_instance.servidor` a sabiendas, con un respaldo hecho.
    ignore_changes = [ami, user_data]
  }
}

# IP fija: los registros A de Cloudflare no cambian si la EC2 se detiene y vuelve a arrancar.
resource "aws_eip" "servidor" {
  domain = "vpc"

  tags = { Name = local.nombre }

  depends_on = [aws_internet_gateway.principal]
}

resource "aws_eip_association" "servidor" {
  instance_id   = aws_instance.servidor.id
  allocation_id = aws_eip.servidor.id
}

# Presupuesto mensual con avisos por correo. Cuenta el costo BRUTO (sin créditos ni reembolsos):
# con los 150 USD de créditos el costo neto se ve en 0 y los avisos nunca llegarían a tiempo.
resource "aws_budgets_budget" "mensual" {
  name         = "${local.nombre}-mensual"
  budget_type  = "COST"
  limit_amount = format("%.2f", var.tope_presupuesto_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_types {
    include_credit = false
    include_refund = false
  }

  dynamic "notification" {
    for_each = [50, 80, 100]

    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = notification.value
      threshold_type             = "PERCENTAGE"
      notification_type          = "ACTUAL"
      subscriber_email_addresses = var.correos_presupuesto
    }
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.correos_presupuesto
  }
}
