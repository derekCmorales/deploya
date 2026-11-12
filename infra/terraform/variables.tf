# Ningún valor de este archivo es secreto: el estado de Terraform y el user_data son texto plano.
# Los secretos de la plataforma viven solo en .env.vps del servidor (docs/infra-vps.md).

variable "region" {
  description = "Región de AWS. Las cifras del ADR 0009 son de us-east-2."
  type        = string
  default     = "us-east-2"

  validation {
    condition     = can(regex("^[a-z]{2}(-[a-z]+)+-[0-9]$", var.region))
    error_message = "La región debe tener la forma de AWS, p. ej. us-east-2."
  }
}

variable "entorno" {
  description = "Nombre del entorno; va en las etiquetas y en los nombres de los recursos."
  type        = string
  default     = "piloto"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,19}$", var.entorno))
    error_message = "El entorno va en minúsculas, con letras, dígitos o guiones (2 a 20 caracteres)."
  }
}

variable "dominio" {
  description = "Dominio base de la plataforma (DOMINIO_BASE de .env.vps): la landing va en la raíz (CloudFront), la app en app., la API en api. y las apps en *. (EC2)."
  type        = string

  validation {
    condition     = can(regex("^([a-z0-9]([a-z0-9-]*[a-z0-9])?\\.)+[a-z]{2,}$", var.dominio))
    error_message = "El dominio va en minúsculas y sin esquema ni barra final, p. ej. deploya.larasolutions.dev."
  }
}

# Escalar a 16 GB para el piloto con Nimbo (ADR 0012, docs/costos.md):
#   tipo_instancia = "m7i-flex.xlarge"   # 4 vCPU, 16 GB, 0.19152 USD/h ≈ 139.81 USD/mes, sin créditos de CPU
#   tipo_instancia = "t3.xlarge"         # 4 vCPU, 16 GB, 0.1664 USD/h ≈ 121.47 USD/mes, con créditos (línea base 40 %)
# El default se queda en m7i-flex.large a propósito:
#   1. Ninguno de los dos xlarge es elegible en el plan gratuito de AWS: el apply falla con
#      InvalidParameterCombination hasta pasar la cuenta a plan de pago (los créditos se conservan,
#      pero al agotarse AWS cobra a la tarjeta en vez de cerrar la cuenta).
#   2. Un mes completo en xlarge (≈ 152 USD con disco, IPv4 y snapshots) rompe el tope de 70 USD del
#      presupuesto; el piloto de 5 días con Nimbo (≈ 25 USD) sí cabe. 70 USD alcanzan ≈ 14 días.
# El cambio de tipo es en sitio: Terraform detiene la EC2, cambia el tipo y la arranca (≈ 2 min de
# corte; la Elastic IP, el disco y los volúmenes de datos se conservan; los contenedores vuelven por
# su RestartPolicy). Con 4 vCPU se puede subir TRABAJADOR_CONCURRENCIA a 2. Al terminar el piloto,
# volver a m7i-flex.large de la misma forma. Si se mantiene xlarge, subir tope_presupuesto_usd a 160.
variable "tipo_instancia" {
  description = "Tipo de la EC2. m7i-flex.large (2 vCPU, 8 GB) es el único x86 con 8 GB que admite el plan gratuito de AWS; con plan de pago, t3.large también sirve. Para el piloto con Nimbo, m7i-flex.xlarge o t3.xlarge (16 GB, solo plan de pago); ver el comentario de arriba, ADR 0009 y ADR 0012."
  type        = string
  default     = "m7i-flex.large"

  validation {
    condition     = can(regex("^((t3|t3a|m6i|m7i)\\.(medium|large|xlarge|2xlarge)|m7i-flex\\.(large|xlarge|2xlarge))$", var.tipo_instancia))
    error_message = "Usa un tipo x86 de propósito general (t3, t3a, m6i, m7i o m7i-flex) de medium a 2xlarge: las recetas construyen imágenes amd64."
  }
}

variable "creditos_cpu" {
  description = "Modo de créditos de CPU; solo aplica a la familia t (con m7i-flex se ignora): unlimited (no se frena en ráfagas, pero cobra el excedente) o standard (se frena al agotar créditos, sin costo extra)."
  type        = string
  default     = "unlimited"

  validation {
    condition     = contains(["standard", "unlimited"], var.creditos_cpu)
    error_message = "creditos_cpu debe ser standard o unlimited."
  }
}

# 80 GB (antes 70) por los recursos de datos de ADR 0012, que viven en /var/lib/docker/volumes del
# mismo disco. Cuenta aproximada: sistema y logs 6 + plataforma (imágenes, su PostgreSQL y 7 respaldos)
# 5 + caché de BuildKit (poda semanal) 10 + imágenes de proyectos (≈ 30 × 5 versiones × 150 MB) 22 +
# Nimbo (4 × 5 versiones × 400 MB) 8 + imágenes de datos 1 + volúmenes de datos 5 ≈ 57 GB, y el resto
# es colchón para que un volumen que crece no llene el disco antes del aviso (ADR 0012 mide y avisa,
# no corta). +10 GB = +0.80 USD/mes. Subirlo en un servidor ya creado es en sitio (ModifyVolume, sin
# recrear la EC2); después, en el servidor: `sudo growpart /dev/nvme0n1 1 && sudo resize2fs /dev/nvme0n1p1`
# (docs/infra-vps.md §5). Un disco EBS no se puede achicar.
variable "tamano_disco_gb" {
  description = "Disco raíz gp3 cifrado: sistema, imágenes de Docker (plataforma, proyectos y 5 versiones guardadas por proyecto), PostgreSQL de la plataforma, respaldos y los volúmenes de los recursos de datos (ADR 0012)."
  type        = number
  default     = 80

  validation {
    condition     = var.tamano_disco_gb >= 30 && var.tamano_disco_gb <= 500
    error_message = "El disco debe tener entre 30 y 500 GB (por debajo de 30 GB las imágenes llenan el disco)."
  }
}

variable "cidr_vpc" {
  description = "Bloque de la VPC propia. No debe cruzarse con 172.16.0.0/12, el rango de las redes de Docker (daemon.json)."
  type        = string
  default     = "10.20.0.0/16"

  validation {
    condition     = can(cidrhost(var.cidr_vpc, 0)) && !startswith(var.cidr_vpc, "172.")
    error_message = "Usa un bloque CIDR válido fuera de 172.x (reservado para las redes de Docker), p. ej. 10.20.0.0/16."
  }
}

variable "cidr_administracion" {
  description = "Opcional. CIDR desde el que se permite SSH (puerto 22), p. ej. 203.0.113.7/32. Sin valor, no hay puerto 22: la administración va por SSM Session Manager."
  type        = string
  default     = null

  validation {
    # Ternario y no `||`: Terraform evalúa ambos lados y contains() falla con null.
    condition     = var.cidr_administracion == null ? true : (can(cidrhost(var.cidr_administracion, 0)) && !contains(["0.0.0.0/0", "::/0"], var.cidr_administracion))
    error_message = "cidr_administracion debe ser un CIDR válido y acotado (p. ej. tu IP con /32), nunca 0.0.0.0/0."
  }
}

variable "clave_publica_ssh" {
  description = "Opcional. Clave pública SSH (ssh-ed25519 o ssh-rsa) para los usuarios ubuntu y deploya. Necesaria si se define cidr_administracion; también sirve para scp por el túnel de SSM."
  type        = string
  default     = null

  validation {
    condition     = var.clave_publica_ssh == null ? true : can(regex("^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp(256|384|521)) [A-Za-z0-9+/=]+", var.clave_publica_ssh))
    error_message = "clave_publica_ssh debe ser una clave pública OpenSSH (ssh-ed25519 …), no la privada."
  }

  validation {
    condition     = var.cidr_administracion == null ? true : var.clave_publica_ssh != null
    error_message = "Con cidr_administracion hace falta clave_publica_ssh: el servidor no acepta contraseñas."
  }
}

variable "repositorio" {
  description = "Repositorio público que se clona en /srv/deploya."
  type        = string
  default     = "https://github.com/derekCmorales/deploya.git"

  validation {
    condition     = can(regex("^https://[^\\s@]+\\.git$", var.repositorio))
    error_message = "El repositorio va por HTTPS, sin credenciales en la URL, y termina en .git."
  }
}

variable "rama" {
  description = "Rama que se deja en checkout al crear el servidor. scripts/desplegar-vps.sh publica main o RAMA=…"
  type        = string
  default     = "main"

  validation {
    condition     = can(regex("^[A-Za-z0-9._/%-]+$", var.rama))
    error_message = "Nombre de rama no válido."
  }
}

variable "proteccion_terminacion" {
  description = "Activa la protección contra terminación de la EC2: un destroy por error no borra la base. Desactívala antes de destruir."
  type        = bool
  default     = false
}

variable "tope_presupuesto_usd" {
  description = "Tope mensual de AWS Budgets en USD (costo bruto, sin descontar créditos)."
  type        = number
  default     = 70

  validation {
    condition     = var.tope_presupuesto_usd > 0 && var.tope_presupuesto_usd <= 1000
    error_message = "El tope debe estar entre 1 y 1000 USD."
  }
}

variable "correos_presupuesto" {
  description = "Correos que reciben los avisos del presupuesto (50, 80 y 100 % real; 100 % pronosticado)."
  type        = list(string)

  validation {
    condition     = length(var.correos_presupuesto) > 0 && alltrue([for c in var.correos_presupuesto : can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", c))])
    error_message = "Indica al menos un correo válido para los avisos del presupuesto."
  }
}

variable "snapshots_diarios" {
  description = "Crea la política de Data Lifecycle Manager que toma un snapshot diario del disco raíz (base de la plataforma, respaldos y volúmenes de datos). Es el respaldo mínimo fuera del servidor (ADR 0012)."
  type        = bool
  default     = true
}

variable "retencion_snapshots" {
  description = "Cuántos snapshots diarios guarda DLM (uno por día). Son incrementales: ≈ 2 USD/mes con 7 a 0.05 USD/GB-mes (docs/costos.md)."
  type        = number
  default     = 7

  validation {
    condition     = var.retencion_snapshots >= 1 && var.retencion_snapshots <= 30 && floor(var.retencion_snapshots) == var.retencion_snapshots
    error_message = "retencion_snapshots es un entero entre 1 y 30."
  }
}

variable "hora_snapshot_utc" {
  description = "Hora UTC (HH:MM) del snapshot diario. Por defecto 04:00: después del respaldo lógico de las 03:00 (cron del servidor), para que el snapshot ya lo incluya."
  type        = string
  default     = "04:00"

  validation {
    condition     = can(regex("^([01][0-9]|2[0-3]):[0-5][0-9]$", var.hora_snapshot_utc))
    error_message = "hora_snapshot_utc va en formato HH:MM de 24 horas, p. ej. 04:00."
  }
}
