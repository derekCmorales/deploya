# Respaldo mínimo fuera del servidor (ADR 0012): un snapshot diario del disco raíz con Data
# Lifecycle Manager. El disco tiene la base de la plataforma, sus respaldos lógicos
# (/var/backups/deploya) y los volúmenes de los recursos de datos de los usuarios
# (/var/lib/docker/volumes). Los snapshots viven en S3 de AWS, no en el nodo: sobreviven a un disco
# dañado, a un `rm` por error y a `terraform destroy` (se borran a mano; ver README).
#
# Son copias consistentes ante caídas (crash-consistent), no en frío: PostgreSQL y Redis (AOF)
# arrancan desde ellas como tras un corte de luz. El respaldo lógico sigue siendo pg_dump
# (docs/infra-vps.md §5). DLM no cuesta; se paga el almacenamiento incremental (0.05 USD/GB-mes).

locals {
  # Valor propio del entorno: la política no toma volúmenes de otros entornos de la misma cuenta.
  etiqueta_respaldo = "dlm-diario-${local.nombre}"
}

data "aws_iam_policy_document" "asumir_dlm" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["dlm.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "dlm" {
  count = var.snapshots_diarios ? 1 : 0

  name               = "${local.nombre}-dlm"
  description        = "Data Lifecycle Manager de Deploya: snapshots diarios del disco del servidor"
  assume_role_policy = data.aws_iam_policy_document.asumir_dlm.json
}

# Política administrada de AWS para DLM: crear, etiquetar y borrar snapshots de EBS. Nada más.
resource "aws_iam_role_policy_attachment" "dlm" {
  count = var.snapshots_diarios ? 1 : 0

  role       = aws_iam_role.dlm[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSDataLifecycleManagerServiceRole"
}

resource "aws_dlm_lifecycle_policy" "diario" {
  count = var.snapshots_diarios ? 1 : 0

  # DLM solo acepta letras, dígitos, espacios, guiones y guiones bajos en la descripción.
  description        = "${local.nombre} snapshot diario del disco ${var.retencion_snapshots} dias"
  execution_role_arn = aws_iam_role.dlm[0].arn
  state              = "ENABLED"

  policy_details {
    resource_types = ["VOLUME"]
    target_tags    = { Respaldo = local.etiqueta_respaldo }

    schedule {
      name      = "diario-${replace(var.hora_snapshot_utc, ":", "h")}-utc"
      copy_tags = true

      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = [var.hora_snapshot_utc]
      }

      retain_rule {
        count = var.retencion_snapshots
      }

      tags_to_add = {
        CreadoPor = "dlm"
      }
    }
  }

  tags = { Name = "${local.nombre}-snapshots" }

  depends_on = [aws_iam_role_policy_attachment.dlm]
}
