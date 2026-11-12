output "ip_publica" {
  description = "Elastic IP de la EC2: destino de los registros A de <dominio> y *.<dominio>."
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
  description = "Registros A que se crean a mano en Cloudflare, en modo «Solo DNS» (nube gris)."
  value = {
    (var.dominio)      = aws_eip.servidor.public_ip
    "*.${var.dominio}" = aws_eip.servidor.public_ip
  }
}

output "siguientes_pasos" {
  description = "Lo que falta tras el apply, en orden."
  value       = <<-PASOS
    1. Cloudflare → DNS de ${var.dominio}: registros A «${var.dominio}» y «*.${var.dominio}» → ${aws_eip.servidor.public_ip}, en «Solo DNS» (nube gris).
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
    6. Comprueba desde tu equipo (Node 22): curl -I https://api.${var.dominio}/health
         API_URL=https://api.${var.dominio} CORREO=cliente@deploya.app CLAVE='<CLIENTE_CLAVE>' PROYECTO=hola-deploya node e2e/vps.mjs
    7. Guarda CLAVE_CIFRADO_VARIABLES fuera del servidor y copia /var/backups/deploya a otro lado.
  PASOS
}
