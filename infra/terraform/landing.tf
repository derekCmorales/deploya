# Landing pública (repo deploya_landing, Astro estático) en S3 + CloudFront: ADR 0011.
#
# - <dominio> y www.<dominio> → CloudFront → bucket S3 privado (solo CloudFront lo lee, con OAC).
# - app.<dominio>, api.<dominio> y *.<dominio> siguen en la EC2 (Traefik); ver plataforma.vps.yml.
#
# S3 y CloudFront no viven en la VPC: no llevan grupos de seguridad ni ACL de red. El acceso se
# cierra con el bloqueo de acceso público del bucket y su política, que solo admite a esta
# distribución. El certificado de CloudFront tiene que estar en us-east-1, sea cual sea var.region.

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Proyecto      = "deploya"
      Entorno       = var.entorno
      GestionadoPor = "terraform"
      Repositorio   = "github.com/derekCmorales/deploya"
    }
  }
}

locals {
  landing_dominios = [var.dominio, "www.${var.dominio}"]
  # Políticas administradas de CloudFront (IDs fijos de AWS).
  politica_cache_optimizada = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Managed-CachingOptimized
}

# ───────── Bucket privado con los archivos de dist/ ─────────

resource "aws_s3_bucket" "landing" {
  bucket_prefix = "deploya-landing-${var.entorno}-"
  # Solo guarda la salida de `astro build`: se vuelve a subir con el script de la landing.
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "landing" {
  bucket                  = aws_s3_bucket.landing.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "landing" {
  bucket = aws_s3_bucket.landing.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "landing" {
  bucket = aws_s3_bucket.landing.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

data "aws_iam_policy_document" "landing_solo_cloudfront" {
  statement {
    sid       = "SoloLaDistribucionDeLaLanding"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.landing.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.landing.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "landing" {
  bucket = aws_s3_bucket.landing.id
  policy = data.aws_iam_policy_document.landing_solo_cloudfront.json

  depends_on = [aws_s3_bucket_public_access_block.landing]
}

# ───────── Certificado (us-east-1, validado por DNS en Cloudflare) ─────────

resource "aws_acm_certificate" "landing" {
  provider                  = aws.us_east_1
  domain_name               = var.dominio
  subject_alternative_names = ["www.${var.dominio}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Espera a que los CNAME de validación (output registros_dns_validacion_landing) estén en
# Cloudflare. Por eso el primer apply va en dos pasos: README.md § Landing.
resource "aws_acm_certificate_validation" "landing" {
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.landing.arn
}

# ───────── CloudFront ─────────

resource "aws_cloudfront_origin_access_control" "landing" {
  name                              = "deploya-landing-${var.entorno}"
  description                       = "Solo CloudFront lee el bucket de la landing"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# www → raíz, y /ruta/ → /ruta/index.html (S3 privado no resuelve índices de carpetas).
resource "aws_cloudfront_function" "landing_rutas" {
  name    = "deploya-landing-rutas-${var.entorno}"
  runtime = "cloudfront-js-2.0"
  comment = "Redirige www a la raiz y resuelve index.html de cada carpeta"
  publish = true
  code    = <<-JS
    function handler(event) {
      var req = event.request;
      var host = req.headers.host ? req.headers.host.value : "";
      if (host.indexOf("www.") === 0) {
        return {
          statusCode: 301,
          statusDescription: "Moved Permanently",
          headers: { location: { value: "https://" + host.substring(4) + req.uri } }
        };
      }
      var uri = req.uri;
      if (uri.endsWith("/")) {
        req.uri = uri + "index.html";
      } else if (uri.split("/").pop().indexOf(".") === -1) {
        req.uri = uri + "/index.html";
      }
      return req;
    }
  JS
}

resource "aws_cloudfront_response_headers_policy" "landing" {
  name    = "deploya-landing-cabeceras-${var.entorno}"
  comment = "Cabeceras de seguridad de la landing (las mismas que public/_headers)"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = false
      preload                    = false
      override                   = true
    }
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "SAMEORIGIN"
      override     = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
  }

  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      value    = "camera=(), microphone=(), geolocation=()"
      override = true
    }
  }
}

resource "aws_cloudfront_distribution" "landing" {
  enabled             = true
  is_ipv6_enabled     = true
  http_version        = "http2and3"
  comment             = "deploya · landing (${var.entorno})"
  aliases             = local.landing_dominios
  default_root_object = "index.html"
  # Norteamérica y Europa: lo más barato; el resto del mundo se sirve igual desde esos bordes.
  price_class = "PriceClass_100"

  origin {
    origin_id                = "s3-landing"
    domain_name              = aws_s3_bucket.landing.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.landing.id
  }

  default_cache_behavior {
    target_origin_id           = "s3-landing"
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = local.politica_cache_optimizada
    response_headers_policy_id = aws_cloudfront_response_headers_policy.landing.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.landing_rutas.arn
    }
  }

  # Un objeto que no existe en un bucket privado responde 403: ambos van a la 404 propia.
  dynamic "custom_error_response" {
    for_each = [403, 404]
    content {
      error_code            = custom_error_response.value
      response_code         = 404
      response_page_path    = "/404.html"
      error_caching_min_ttl = 60
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.landing.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
