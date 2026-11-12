# Perfil de instancia mínimo: solo lo que pide el agente de SSM para Session Manager. La EC2 no
# necesita leer S3, ECR ni ningún otro servicio de AWS para correr la plataforma.

data "aws_iam_policy_document" "asumir_ec2" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "servidor" {
  name               = "${local.nombre}-servidor"
  description        = "EC2 de Deploya: administracion por SSM Session Manager"
  assume_role_policy = data.aws_iam_policy_document.asumir_ec2.json
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.servidor.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "servidor" {
  name = "${local.nombre}-servidor"
  role = aws_iam_role.servidor.name
}
