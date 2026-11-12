# Versiones fijas: el mismo `terraform apply` hoy y dentro de un mes produce la misma infraestructura.
# Las validaciones de variables.tf que comparan dos variables exigen Terraform 1.9 o más.
terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"
    }
  }

  # Estado local a propósito para el piloto (un solo operador). No se versiona (.gitignore) y es
  # texto plano: por eso aquí no entra ningún secreto. Para un equipo, pasar a un backend S3
  # cifrado con bloqueo; ver README.md.
}

provider "aws" {
  region = var.region

  # Etiquetas en todo lo que se cree: así el presupuesto y la factura se leen por proyecto.
  default_tags {
    tags = {
      Proyecto      = "deploya"
      Entorno       = var.entorno
      GestionadoPor = "terraform"
      Repositorio   = "github.com/derekCmorales/deploya"
    }
  }
}
