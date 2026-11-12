output "ip_publica" {
  description = "Elastic IP de la EC2: destino del registro A de *.<dominio> (app., api. y las apps)."
  value       = aws_eip.servidor.public_ip
}

output "id_instancia" {
  description = "ID de la EC2 (destino de SSM Session Manager)."
  value       = aws_instance.servidor.id
}

output "comando_ssm" {
  description = "Abre una consola en el servidor sin puerto 22 (requiere AWS CLI y el plugin de Session Manager)."
  value       = "aws ssm start-session --region ${var.region} --target ${aws_instance.servidor.id}"
}

output "comando_ssh" {
  description = "SSH directo (solo si se definió cidr_administracion) o por el túnel de SSM (solo con clave_publica_ssh)."
  value = (
    var.cidr_administracion != null ? "ssh deploya@${aws_eip.servidor.public_ip}" :
    var.clave_publica_ssh != null ? "ssh -o ProxyCommand='aws ssm start-session --region ${var.region} --target %h --document-name AWS-StartSSHSession --parameters portNumber=%p' deploya@${aws_instance.servidor.id}" :
    "Sin SSH: usa comando_ssm (define clave_publica_ssh para ssh/scp por el túnel de SSM)"
  )
}

output "registros_dns" {
  description = "Registros que se crean a mano en Cloudflare, en modo «Solo DNS» (nube gris). <dominio> y www van a la landing; el comodín cubre app., api. y las apps."
  value = {
    "*.${var.dominio}"   = "A     ${aws_eip.servidor.public_ip}"
    (var.dominio)        = "CNAME ${aws_cloudfront_distribution.landing.domain_name}"
    "www.${var.dominio}" = "CNAME ${aws_cloudfront_distribution.landing.domain_name}"
  }
}

output "registros_dns_validacion_landing" {
  description = "CNAME que ACM pide para emitir el certificado de la landing. Créalos en Cloudflare (Solo DNS) antes del apply completo."
  value       = { for o in aws_acm_certificate.landing.domain_validation_options : o.resource_record_name => "CNAME ${o.resource_record_value}" }
}

output "landing_bucket" {
  description = "Bucket privado donde scripts/desplegar-aws.sh de deploya_landing sube dist/ (LANDING_BUCKET)."
  value       = aws_s3_bucket.landing.id
}

output "landing_distribucion" {
  description = "ID de la distribución de CloudFront de la landing (LANDING_DISTRIBUCION, para invalidar la caché)."
  value       = aws_cloudfront_distribution.landing.id
}

output "siguientes_pasos" {
  description = "Lo que falta tras el apply, en orden."
  value       = <<-PASOS
    1. Cloudflare → DNS, todo en «Solo DNS» (nube gris): terraform output registros_dns
         *.${var.dominio}   A     ${aws_eip.servidor.public_ip}   (app., api. y las apps)
         ${var.dominio}     CNAME ${aws_cloudfront_distribution.landing.domain_name}   (landing)
         www.${var.dominio} CNAME ${aws_cloudfront_distribution.landing.domain_name}
       Si ${var.dominio} tenía un registro A hacia la EC2, bórralo antes de crear el CNAME.
    2. Confirma la suscripción a los avisos del presupuesto en el correo que envía AWS Budgets.
    3. Espera a cloud-init (5–10 min):
         aws ssm start-session --region ${var.region} --target ${aws_instance.servidor.id}
         cloud-init status --wait && cat /var/lib/deploya/preparado
    4. Copia .env.vps sin que pase por Terraform ni por el chat, dentro de la sesión de SSM:
         sudo -iu deploya
         cd /srv/deploya && umask 077 && cat > .env.vps    # pega el archivo y termina con Ctrl-D
         chmod 600 .env.vps
       (con clave_publica_ssh, también: scp por el túnel de SSM; ver infra/terraform/README.md)
    5. Publica: RAMA=main scripts/desplegar-vps.sh
    6. Publica la landing desde el repo deploya_landing:
         LANDING_BUCKET=${aws_s3_bucket.landing.id} LANDING_DISTRIBUCION=${aws_cloudfront_distribution.landing.id} pnpm deploy:aws
    7. Comprueba desde tu equipo (Node 22): curl -I https://${var.dominio} && curl -I https://app.${var.dominio} && curl -I https://api.${var.dominio}/health
         API_URL=https://api.${var.dominio} CORREO=<correo de cliente> CLAVE='<CLIENTE_CLAVE>' PROYECTO=hola-deploya node e2e/vps.mjs
    8. Guarda CLAVE_CIFRADO_VARIABLES fuera del servidor y copia /var/backups/deploya a otro lado.
  PASOS
}

output "politica_snapshots" {
  description = "ID de la política de DLM que toma el snapshot diario del disco (null si snapshots_diarios = false)."
  value       = var.snapshots_diarios ? aws_dlm_lifecycle_policy.diario[0].id : null
}
