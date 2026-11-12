# Red propia del piloto: una VPC con una subred pública y salida directa por el Internet Gateway.
# Sin NAT Gateway (~32.85 USD/mes) ni subredes privadas: hay una sola EC2 y PostgreSQL y Redis no
# salen de la red interna de Docker (docker-compose.vps.yml les quita los puertos).

data "aws_availability_zones" "disponibles" {
  state = "available"
}

locals {
  nombre = "deploya-${var.entorno}"
  # La primera zona disponible: una sola EC2 no gana nada repartida en varias.
  zona = data.aws_availability_zones.disponibles.names[0]
}

resource "aws_vpc" "principal" {
  cidr_block           = var.cidr_vpc
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = local.nombre }
}

resource "aws_internet_gateway" "principal" {
  vpc_id = aws_vpc.principal.id

  tags = { Name = local.nombre }
}

resource "aws_subnet" "publica" {
  vpc_id            = aws_vpc.principal.id
  cidr_block        = cidrsubnet(var.cidr_vpc, 8, 1)
  availability_zone = local.zona
  # IP pública automática al arrancar: cloud-init instala Docker antes de que se asocie la
  # Elastic IP, y sin NAT esa es la única salida. Al asociarse la EIP, AWS libera la automática.
  map_public_ip_on_launch = true

  tags = { Name = "${local.nombre}-publica" }
}

resource "aws_route_table" "publica" {
  vpc_id = aws_vpc.principal.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.principal.id
  }

  tags = { Name = "${local.nombre}-publica" }
}

resource "aws_route_table_association" "publica" {
  subnet_id      = aws_subnet.publica.id
  route_table_id = aws_route_table.publica.id
}

# El grupo por defecto de la VPC queda sin reglas: nada lo usa y así no abre nada por descuido.
resource "aws_default_security_group" "cerrado" {
  vpc_id = aws_vpc.principal.id

  tags = { Name = "${local.nombre}-por-defecto-cerrado" }
}

# Entrada: solo 80 y 443 (Traefik; el 80 redirige a 443). El 22 solo existe si se define
# cidr_administracion; la vía normal de administración es SSM Session Manager, que sale por 443.
resource "aws_security_group" "servidor" {
  name        = "${local.nombre}-servidor"
  description = "Deploya: HTTP y HTTPS publicos; SSH solo desde cidr_administracion"
  vpc_id      = aws_vpc.principal.id

  tags = { Name = "${local.nombre}-servidor" }
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.servidor.id
  description       = "HTTP (Traefik redirige a HTTPS)"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "https" {
  security_group_id = aws_security_group.servidor.id
  description       = "HTTPS (Traefik: web, API y proyectos)"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  count = var.cidr_administracion == null ? 0 : 1

  security_group_id = aws_security_group.servidor.id
  description       = "SSH de administracion, solo desde cidr_administracion"
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = var.cidr_administracion
}

# Salida abierta: GitHub (clonar repos de usuarios), Docker Hub y gcr.io (imágenes base), Let's
# Encrypt y la API de Cloudflare (DNS-01), Resend por 465/587, SSM y los espejos de Ubuntu.
# El 25 lo bloquea AWS por defecto; el correo no lo usa.
resource "aws_vpc_security_group_egress_rule" "todo" {
  security_group_id = aws_security_group.servidor.id
  description       = "Salida a internet"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}
