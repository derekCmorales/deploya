# 0009 — Piloto en una EC2 de AWS creada con Terraform

- **Estado:** Aceptado
- **Fecha:** 2026-11-12
- **Autor:** @derekCmorales · **Módulos:** M5, M6, transversal (infraestructura)
- **Change de OpenSpec:** `chore/infra-terraform-aws` (infraestructura; no cambia requisitos de ningún módulo)

## Contexto

La presentación final es el 13 de noviembre de 2026 y después sigue un piloto con usuarios reales. Hasta hoy el entorno de nube era «un VPS» creado a mano: los pasos vivían en [infra-vps.md](../infra-vps.md) y en el [manual técnico §3](../entrega-final/manual-tecnico.md#3-vps-de-la-nube-producción), y nada garantizaba que dos servidores quedaran iguales. Tenemos **150 USD de créditos de AWS**.

Fuerzas:

- **Tiempo:** un día. Lo que ya funciona (los compose, `scripts/desplegar-vps.sh`, el certificado comodín del [ADR 0007](0007-certificado-comodin-por-dns-01.md), el cron de respaldos) no se toca.
- **Arquitectura:** la API no habla con Docker; el worker es el único con `docker.sock` ([ADR 0002](0002-cola-bullmq-y-trabajador-aparte.md)) y Traefik lee rutas de un volumen compartido ([ADR 0005](0005-traefik-proveedor-de-archivo.md)). Las dos cosas suponen **un solo nodo con Docker**.
- **Seguridad:** el servidor corre código de terceros (las apps de los usuarios). Los contenedores ya llevan límites del plan, `CapDrop ALL` y `no-new-privileges`, pero el host tiene que cerrar lo demás: credenciales de AWS al alcance de un contenedor, SSH abierto, secretos en el estado de Terraform.
- **Reproducibilidad:** el servidor debe poder recrearse con un comando, y el costo debe estar vigilado.

## Decisión

Creamos el servidor con **Terraform** ([infra/terraform/](../../infra/terraform/)): **una EC2 `t3.large`** (2 vCPU, 8 GB) en **us-east-1** con Ubuntu 24.04 que corre **toda la plataforma** con los compose existentes (`docker-compose.yml` + `docker-compose.vps.yml`, el compose de producción; «vps» es solo el nombre histórico del archivo). Terraform crea la red (VPC propia, subred pública, sin NAT), el grupo de seguridad (80/443; 22 solo desde `cidr_administracion`), el perfil de instancia con solo `AmazonSSMManagedInstanceCore`, la EC2 con IMDSv2 de un salto y disco gp3 cifrado, la Elastic IP y un presupuesto de AWS Budgets. cloud-init deja Docker, el usuario `deploya`, el clon, el cron y las imágenes base listos. Los **secretos** (`.env.vps`) **nunca pasan por Terraform ni por user_data**: se copian a mano por SSM, y la publicación sigue siendo `scripts/desplegar-vps.sh`.

## Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| **EC2 + compose con Terraform** (elegida) | Cero cambios de código; el mismo compose de desarrollo; IaC revisable en el PR; SSM, IMDSv2 y Budgets de AWS; entra en los créditos | Un solo nodo: si cae, cae todo; escalar es vertical |
| ECS/Fargate ahora | Escala horizontal, sin servidor que parchar | Exige los adaptadores nuevos del [ADR 0010](0010-escala-con-ecs-y-construcciones-en-fargate.md) (ECS, ECR, Traefik con proveedor ECS, construcción remota): semanas, no un día. Fargate 24/7 por app no es rentable |
| EKS | Estándar de la industria | ~73 USD/mes solo por el plano de control, la mitad de los créditos; otra capa de operación para un equipo de cuatro |
| Lightsail (2 vCPU, 8 GB, ~44 USD/mes aprox.) | Más barato, IPv4 y transferencia incluidas | Red fuera de la VPC (sin camino directo al ADR 0010), sin perfil de instancia ni SSM de primera clase, menos control por Terraform |
| Otro VPS (Hetzner, DigitalOcean) | Mucho más barato por GB de RAM | Fuera de los créditos; sin IAM, SSM ni Budgets; la escala del ADR 0010 sería otra migración |

## Consecuencias

**Costos del piloto** (us-east-1, bajo demanda, aprox.; verificar en la calculadora de AWS):

| Concepto | USD/mes |
|---|---|
| EC2 `t3.large` (0.0832 USD/h × 730 h) | 60.74 |
| gp3 40 GB (0.08 USD/GB-mes; 3000 IOPS y 125 MB/s incluidos) | 3.20 |
| IPv4 pública / Elastic IP (0.005 USD/h) | 3.65 |
| Salida a internet (primeros 100 GB gratis) | 0 |
| SSM Session Manager, AWS Budgets (2 presupuestos gratis), cifrado con `aws/ebs` | 0 |
| **Total base** | **≈ 67.6** |

- **Ráfagas de CPU (`t3` en `unlimited`):** la línea base de un `t3.large` es 30 % por vCPU (0.6 vCPU sostenida) y acumula créditos mientras está por debajo. Un `docker build` usa las dos vCPU unos minutos y lo pagan los créditos acumulados. Solo si la CPU pasa la línea base **de forma sostenida** se cobra el excedente a 0.05 USD por vCPU-hora: el peor caso (2 vCPU al 100 % todo el mes) suma ≈ 1.4 × 730 × 0.05 = **51.10 USD**. `creditos_cpu = "standard"` lo elimina a cambio de frenar la CPU al agotar créditos (mala idea en plena demo).
- **Créditos:** con 150 USD alcanzan ≈ 2 meses de piloto. El tope por defecto del presupuesto (40 USD) avisa a mitad de mes (50 % ≈ día 9, 100 % ≈ día 18, y el pronóstico antes): está pensado para la demo y las primeras semanas; para un mes completo, `tope_presupuesto_usd = 70`. El presupuesto mide el costo **bruto** (sin créditos); si no, los avisos nunca llegarían.
- **Capacidad estimada** con 8 GB: la plataforma (PostgreSQL, Redis, API, worker, web, Traefik) usa ≈ 1.5 GB y el sistema ≈ 0.5 GB; quedan ≈ 6 GB para apps. Una app pequeña real usa ≈ 128 MB (el límite del plan es un techo, 256 MB a 2 GB, no una reserva): **≈ 45 apps pequeñas**. La CPU es el límite antes que la memoria si varias apps tienen carga. Las 4 GB de swap son para los picos de construcción; los contenedores de usuarios no lo usan (`MemorySwap = Memory`).
- **`TRABAJADOR_CONCURRENCIA` se queda en 1:** un build ya ocupa las dos vCPU; con dos a la vez las apps pierden CPU y el excedente se cobra. Se sube con 4 vCPU o más ([.env.vps.example](../../.env.vps.example)).
- **Seguridad:** sin puerto 22 por defecto (SSM sale por 443); sshd sin contraseñas ni root; IMDSv2 obligatorio con `http_put_response_hop_limit = 1`, de modo que un contenedor en una red bridge (un salto más) no obtiene el token ni las credenciales del perfil; el perfil solo permite SSM; disco cifrado; unattended-upgrades sin reinicio automático. `docker.sock` en el worker sigue siendo el riesgo mayor del host: lo elimina el ADR 0010.
- **Operación:** `daemon.json` rota los logs de **todo** contenedor (también los de usuarios, que el worker crea sin `LogConfig`) y amplía los rangos de red de Docker a 4096 redes `/24` (los de fábrica se agotan hacia las 30 redes, una por proyecto). `live-restore` evita que reiniciar Docker tumbe las apps. El cron del manual §3.5 queda instalado, más la poda semanal de la caché de BuildKit.
- **Deuda aceptada:** un solo nodo y una sola zona; PostgreSQL y los respaldos en el mismo disco (copiarlos fuera es parte de la operación); estado de Terraform local; DNS en Cloudflare a mano (dos registros que no cambian, para no sumar otro token al operador). La salida es el ADR 0010.
- **SOLID:** nada cambia en el código. El servidor es otro lugar donde corren los mismos adaptadores reales (`ContenedorDocker`, `EnrutamientoTraefikArchivo`): la infraestructura es configuración, no un `if` (OCP).
