# Ningún valor de este archivo es secreto: el estado de Terraform y el user_data son texto plano.
# Los secretos de la plataforma viven solo en .env.vps del servidor (docs/infra-vps.md).

variable "region" {
  description = "Región de AWS. Las cifras del ADR 0009 son de us-east-1."
  type        = string
  default     = "us-east-1"

  validation {
    condition     = can(regex("^[a-z]{2}(-[a-z]+)+-[0-9]$", var.region))
    error_message = "La región debe tener la forma de AWS, p. ej. us-east-1."
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
  description = "Dominio base de la plataforma (DOMINIO_BASE de .env.vps). Solo se usa para el cron de salud y los siguientes pasos."
  type        = string

  validation {
    condition     = can(regex("^([a-z0-9]([a-z0-9-]*[a-z0-9])?\\.)+[a-z]{2,}$", var.dominio))
    error_message = "El dominio va en minúsculas y sin esquema ni barra final, p. ej. deploya.app."
  }
}

variable "tipo_instancia" {
  description = "Tipo de la EC2. Decisión del dueño: t3.large (2 vCPU, 8 GB). Ver ADR 0009."
  type        = string
  default     = "t3.large"

  validation {
    condition     = can(regex("^(t3|t3a|m6i|m7i)\\.(medium|large|xlarge|2xlarge)$", var.tipo_instancia))
    error_message = "Usa un tipo x86 de propósito general (t3, t3a, m6i o m7i) de medium a 2xlarge: las recetas construyen imágenes amd64."
  }
}

variable "creditos_cpu" {
  description = "Modo de créditos de CPU de la familia t: unlimited (no se frena en ráfagas, pero cobra el excedente) o standard (se frena al agotar créditos, sin costo extra)."
  type        = string
  default     = "unlimited"

  validation {
    condition     = contains(["standard", "unlimited"], var.creditos_cpu)
    error_message = "creditos_cpu debe ser standard o unlimited."
  }
}

variable "tamano_disco_gb" {
  description = "Disco raíz gp3 cifrado: sistema, imágenes de Docker (plataforma, proyectos y 5 versiones guardadas por proyecto), PostgreSQL y respaldos."
  type        = number
  default     = 40

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
  default     = 40

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
