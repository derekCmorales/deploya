# Costos de Deploya en AWS

Modelo de costos del producto: cuánto cuesta el nodo del piloto, cuántos clientes caben, cuánto deja cada plan y qué cambia con Nimbo y con la escala del [ADR 0010](adr/0010-escala-con-ecs-y-construcciones-en-fargate.md). Decisiones relacionadas: [ADR 0009](adr/0009-piloto-en-aws-ec2-con-terraform.md) (piloto en EC2), [ADR 0011](adr/0011-landing-en-s3-y-cloudfront.md) (landing), [ADR 0012](adr/0012-recursos-de-datos-en-el-nodo.md) (recursos de datos). Infraestructura: [infra/terraform/](../infra/terraform/README.md).

> **Fecha de las cifras:** 12 de noviembre de 2026 para AWS; **13 de noviembre de 2026** para los precios de los planes (tarifa de lanzamiento: Starter 6, Pro 19, Business 49, la misma de la landing, la semilla de planes y [alcance.md](alcance.md#planes-y-recursos-v41)). Todo en USD, bajo demanda, sin impuestos, mes de 730 h.

## 1. Precios unitarios

**Fuente:** AWS Price List API (`pricing.us-east-1.amazonaws.com/offers/v1.0/aws/…`), publicación del **10-nov-2026**, vigente desde el 1-nov-2026, consultada el 12-nov-2026. Para todo lo de esta tabla, **us-east-2 (Ohio) y us-east-1 (N. Virginia) tienen el mismo precio**. Las filas marcadas «*» no se pudieron consultar desde aquí (sin red hacia el sitio del proveedor) y son las conocidas: verificarlas antes de citarlas fuera.

| Concepto | Precio | Por mes |
|---|---|---|
| EC2 `t3.medium` (2 vCPU, 4 GB) | 0.0416 /h | 30.37 |
| EC2 `t3.large` (2 vCPU, 8 GB; créditos, línea base 30 %/vCPU) | 0.0832 /h | 60.74 |
| EC2 `m7i-flex.large` (2 vCPU, 8 GB; **elegible en el plan gratuito**) | 0.09576 /h | 69.90 |
| EC2 `t3.xlarge` (4 vCPU, 16 GB; créditos, línea base 40 %/vCPU) | 0.1664 /h | 121.47 |
| EC2 `m7i-flex.xlarge` (4 vCPU, 16 GB; sin créditos) | 0.19152 /h | 139.81 |
| Excedente de CPU de `t3` en `unlimited` | 0.05 /vCPU-h | peor caso `t3.xlarge`: (4 − 1.6) × 730 × 0.05 = 87.60 |
| EBS gp3 (3000 IOPS y 125 MB/s incluidos) | 0.08 /GB-mes | 80 GB: 6.40 |
| Snapshots de EBS (incrementales) | 0.05 /GB-mes | ≈ 2.00 (ver nota) |
| IPv4 pública / Elastic IP, en uso u ociosa | 0.005 /h | 3.65 |
| Salida a internet | primeros 100 GB/mes gratis (en toda la cuenta); luego 0.09 /GB hasta 10 TB | 0 en el piloto |
| S3 Standard | 0.023 /GB-mes | landing: < 0.01 |
| CloudFront * | capa gratuita permanente: 1 TB y 10 M de peticiones al mes ([ADR 0011](adr/0011-landing-en-s3-y-cloudfront.md)) | 0 |
| ACM, SSM Session Manager, AWS Budgets (2 presupuestos), DLM | gratis | 0 |
| Fargate x86 | 0.04048 /vCPU-h y 0.004445 /GB-h | 0.5 vCPU + 1 GB: 18.02 |
| RDS PostgreSQL `db.t4g.micro` / `db.t4g.small` (Single-AZ) | 0.016 / 0.032 /h; gp3 0.115 /GB-mes | 11.68 / 23.36 (+ 2.30 por 20 GB) |
| ElastiCache Valkey `cache.t4g.micro` / `small` | 0.0128 / 0.0256 /h | 9.34 / 18.69 |
| NLB · NAT Gateway * | 0.0225 /h + LCU · 0.045 /h + 0.045 /GB | 16.43 · 32.85 de piso (cifras del ADR 0010) |
| Resend (correo) * | plan gratis: 3 000 correos/mes, 100/día, 1 dominio; Pro: 20 /mes por 50 000 | 0 en el piloto |
| Dominio * | `deploya.larasolutions.dev` es un subdominio de un `.dev` ya pagado (≈ 12–15 /año); DNS en Cloudflare gratis | ≈ 1.10 prorrateado; 0 incremental |
| Cobro con Recurrente * | 4.5 % + ≈ 0.26 por cobro (ADR 0010) | Starter 0.53 · Pro 1.12 · Business 2.47 |

**Nota sobre snapshots.** DLM toma uno diario del disco de 80 GB y guarda 7 ([respaldos.tf](../infra/terraform/respaldos.tf)). El primero cuenta solo los bloques escritos (≈ 30 GB al inicio) y los siguientes solo lo que cambió (≈ 1–2 GB/día de imágenes nuevas y datos): ≈ 30 + 7 × 1.5 ≈ 40 GB × 0.05 ≈ **2 USD/mes** (rango 1.5–3).

## 2. Costo mensual del nodo

Nodo = EC2 + gp3 de 80 GB + IPv4 + snapshots. La landing (S3 + CloudFront), Resend, Budgets y SSM suman ≈ 0.

| Configuración | EC2 | Disco + IPv4 + snapshots | **Mes** | **5 días** | Días que cubren 70 USD |
|---|---|---|---|---|---|
| Piloto **tal como está desplegado** (`m7i-flex.large`, 70 GB, sin snapshots) | 69.90 | 5.60 + 3.65 | **79.15** | 13.01 | 26.9 |
| Piloto **con este cambio** (`m7i-flex.large`, 80 GB, DLM) | 69.90 | 6.40 + 3.65 + 2.00 | **81.95** | 13.47 | 26.0 |
| `t3.large` (solo plan de pago) | 60.74 | 12.05 | 72.79 (+ excedente de CPU) | 11.96 | 29.3 |
| `t3.xlarge` (solo plan de pago) | 121.47 | 12.05 | 133.52 (+ hasta 87.60 de excedente) | 21.95 | 15.9 |
| **`m7i-flex.xlarge`** (solo plan de pago) | 139.81 | 12.05 | **151.86** | **24.96** | 14.0 |

- El tope de 70 USD del presupuesto **ya no cubre un mes entero** del nodo de 8 GB (≈ 82): cubre los 5 días del piloto con mucha holgura y avisa por pronóstico hacia el día 20 si el nodo se queda encendido. Está bien así: el aviso es la intención.
- El plan gratuito de AWS solo deja lanzar `m7i-flex.large` entre los de 8 GB; **ningún tipo de 16 GB es elegible**. Pasar a plan de pago conserva los créditos, pero al agotarse AWS cobra a la tarjeta en vez de cerrar la cuenta.

## 3. Capacidad por nodo

**Memoria disponible para apps y datos:** 8 GB − plataforma (PostgreSQL, Redis, API, worker, web, Traefik ≈ 1.5 GB) − sistema (≈ 0.5 GB) = **6 GB**; con 16 GB, **14 GB**. Las 4 GB de swap son para las construcciones; los contenedores de usuarios no lo usan (`MemorySwap = Memory`).

**Dos reglas de llenado:**

1. **Memoria real ≤ 80 %** de la disponible (4.8 GB en 8 GB; 11.2 GB en 16 GB): el 20 % restante es para picos y para la construcción en curso.
2. **Memoria comprometida (suma de límites) ≤ 3 ×** la disponible. Los límites del plan son techos, no reservas; una app pequeña real usa ≈ 128 MB aunque su límite sea 256 MB o 2 GB (ADR 0009). 3 × es una sobreasignación razonable para apps pequeñas e inactivas la mayor parte del día; más allá, un pico simultáneo de varias apps lleva al OOM del host.

**Cliente típico por plan** (supuestos, como en el ADR 0010; recursos de datos según el contrato: Postgres 512 MB, Redis 256 MB, S3 512 MB de límite, ≈ 128, 16 y 128 MB reales). Desde la tarifa de lanzamiento **Sandbox no trae recursos de datos** (usa su propia URL) y **Starter no incluye bases**: las compra como complemento ([§7](#7-costos-que-ve-el-cliente)). Solo Pro (PostgreSQL + Redis) y Business (+ S3) las traen incluidas:

| Plan | Perfil típico | Comprometida | Real | Caben en 8 GB (real / comp. 3 × / **final**) | Caben en 16 GB |
|---|---|---|---|---|---|
| Sandbox | 1 app de 256 MB, sin base | 256 MB | 128 MB | 37 / 72 / **37** | **87** |
| Starter | 1.5 apps de 512 MB, sin base | 768 MB | 192 MB | 25 / 24 / **24** | **56** |
| Pro | 4 apps de 1 GB + Postgres + Redis | 4 864 MB | 656 MB | 7 / 3 / **3** | **8** |
| Business | 10 apps de 2 GB + Postgres + Redis + S3 | 21 760 MB | 1 552 MB | 3 / 0 / **0** (un solo cliente ya es 3.6 ×) | **1** |

- La **CPU** se agota antes que la memoria si varias apps tienen carga: 2 vCPU para todo en 8 GB, y una construcción usa las dos. Con 4 vCPU, `TRABAJADOR_CONCURRENCIA` puede subir a 2.
- **Disco** (80 GB): ≈ 57 GB comprometidos con ≈ 30 proyectos y Nimbo (cuenta en [variables.tf](../infra/terraform/variables.tf)); `discoDatosMb` se mide y se avisa, no se reserva.
- **Business no cabe con 3 × en un nodo de 8 GB:** sus límites suman 21 GB. Hasta tener el «fondo de memoria por plan» del ADR 0010 (la memoria del plan se reparte entre sus proyectos), un cliente Business pide el nodo de 16 GB o un nodo propio.

## 4. Margen por plan

**Costo prorrateado** = costo mensual del nodo ÷ memoria real útil (80 % de la disponible) × memoria real del cliente. Incluye la plataforma y el sistema (costo completo, no marginal) y supone el nodo **lleno al 80 %**: con el nodo medio vacío cada cliente carga más costo fijo.

| Nodo | USD por MB real | USD por app pequeña (128 MB) |
|---|---|---|
| `m7i-flex.large` (piloto) | 0.01667 | 2.13 |
| `t3.xlarge` | 0.01164 | 1.49 |
| `m7i-flex.xlarge` | 0.01324 | 1.69 |
| ECS sobre EC2, apps empacadas (ADR 0010, sin el fijo de 91) | 0.00977 | 1.25 |

**Margen = precio − comisión de Recurrente − costo prorrateado** (USD por cliente y mes, pago de 30 días, sin complementos):

| Plan | Precio | Comisión | `m7i-flex.large` | `m7i-flex.xlarge` | `t3.xlarge` | ECS (ADR 0010) |
|---|---|---|---|---|---|---|
| Sandbox | 0 | 0 | −2.13 | −1.69 | −1.49 | −1.25 |
| Starter | 6.00 | 0.53 | 2.27 (38 %) | 2.93 (49 %) | 3.23 (54 %) | 3.59 (60 %) |
| Pro | 19.00 | 1.12 | 6.94 (37 %) | 9.19 (48 %) | 10.24 (54 %) | 11.47 (60 %) |
| Business | 49.00 | 2.47 | 20.65 (42 %) | 25.98 (53 %) | 28.46 (58 %) | 31.37 (64 %) |

**Pago anual** (365 días = 10 × el mensual, dos meses gratis; se cobra una vez, así que la comisión fija de 0.26 se reparte en 12): el ingreso equivale a 5.00, 15.83 y 40.83 USD por mes.

| Plan | Pago | Equivale a / mes | Comisión / mes | `m7i-flex.large` | ECS (ADR 0010) |
|---|---|---|---|---|---|
| Starter | 60 | 5.00 | 0.25 | 1.55 (31 %) | 2.88 (58 %) |
| Pro | 190 | 15.83 | 0.73 | 4.16 (26 %) | 8.69 (55 %) |
| Business | 490 | 40.83 | 1.86 | 13.10 (32 %) | 23.82 (58 %) |

Lectura:

- **Con la tarifa de lanzamiento los tres planes de pago dejan margen ya en el nodo del piloto** (8 GB, plataforma incluida): Starter 38 %, Pro 37 %, Business 42 %. Con los precios anteriores (5, 15 y 40) Starter perdía 0.82 USD por cliente. Cada Sandbox sigue costando ≈ 2.13 USD/mes (el ≈ 25 % de la memoria del nodo es de Deploya).
- Con 16 GB el costo por MB baja ≈ 20–30 % (la plataforma se reparte entre más clientes) y los márgenes suben a 49–53 %. Con ECS empacado (ADR 0010) llegan a ≈ 60–64 %, pero sobre un fijo de ≈ 91 USD/mes.
- **Starter es rentable porque no incluye bases**: un Postgres real (≈ 128 MB) cuesta lo mismo que una app pequeña. Si se hubieran incluido Postgres, Redis y S3 en todos los planes, Starter quedaba en −0.82 USD. Pro y Business sí las traen: su costo prorrateado ya las incluye, y por eso el margen de Pro (60 % en ECS) es menor que el de apps solas del ADR 0010 (68 %).
- **El pago anual baja el margen** (Pro 26 % en el nodo del piloto) a cambio de caja por adelantado: el cliente paga 10 meses por 12.
- Palancas: dormir los Sandbox sin tráfico (ADR 0010), el fondo de memoria por plan, los complementos de datos y empujar el pago mensual en Pro.

**Complementos de datos** (por 30 días, sobre el plan; margen = precio − 4.5 % de comisión − memoria real prorrateada − disco ≈ 0.08 USD/GB más snapshots; la comisión fija de 0.26 va en el cobro del plan):

| Complemento | Precio | Memoria real | Margen `m7i-flex.large` | Margen ECS |
|---|---|---|---|---|
| PostgreSQL + pgvector · 2 GB | 5.00 | ≈ 128 MB | 2.44 (49 %) | 3.33 (66 %) |
| Redis | 2.00 | ≈ 16 MB | 1.64 (82 %) | 1.75 (88 %) |
| S3 · 10 GB | 4.00 | ≈ 128 MB | 0.69 (17 %) | 1.57 (39 %) |
| + 10 GB de disco | 2.00 | 0 | 0.91 (45 %) | 0.91 (45 %) |

El S3 de 10 GB es el complemento más delgado en el piloto: su disco pesa más que su precio. Se revisa si el piloto muestra uso alto.

## 5. Escenario «piloto con Nimbo»

**Consumo de Nimbo** (cuatro proyectos de un mismo usuario: `api`, `worker`, `optimizer`, `web`; el Postgres, el Redis y el S3 los crea `api` y los comparte con los demás, [contrato](contratos/recursos-datos.md)):

| | Comprometida (límites) | Real estimada |
|---|---|---|
| 4 contenedores de ≈ 1 GB | 4 096 MB | ≈ 1.5–2 GB (`optimizer` es el más incierto) |
| Postgres 17 + pgvector | 512 MB | ≈ 128–256 MB |
| Redis 7 | 256 MB | ≈ 16–64 MB |
| S3 (`pgsty/silo`) | 512 MB | ≈ 128–200 MB |
| **Total** | **5 376 MB (5.25 GB)** | **≈ 2.5 GB** |
| Construcciones | 4 proyectos Node (Next.js y NestJS): pico de ≈ 1.5–2 GB por construcción, una a la vez | |
| Disco | ≈ 8 GB de imágenes (4 × 5 versiones) + datos | |

Por memoria es un cliente **Pro** (4 de 10 proyectos de 1 GB; 3 de 10 recursos), pero consume como un **Business** pequeño.

**¿Cabe en el nodo actual (`m7i-flex.large`, 6 GB)?** Por límites, Nimbo solo ya compromete el **88 %** de la memoria disponible; por uso real deja ≈ 2.3 GB del 80 % útil para todos los demás (≈ 12 clientes Sandbox, o 7 Starter). Una construcción de Nimbo (≈ 2 GB) en el momento en que su `optimizer` llega a su límite empuja el host al swap y a las apps de todos al OOM. **No conviene.**

> **Decisión del piloto (12-nov-2026):** Nimbo se usa **solo para la presentación**, sin otros clientes en el nodo, así que se queda en `m7i-flex.large` (8 GB, plan gratuito): en uso real el peor momento es ≈ 6.5 de 8 GB más 4 GB de swap. Lo de abajo aplica si Nimbo convive con otros clientes, y es el plan B de [infra-vps.md §6.3](infra-vps.md#63-plan-b-permitir-el-m7i-flexxlarge).

**Instancia recomendada:** **`m7i-flex.xlarge`** (4 vCPU, 16 GB) **solo mientras dure el piloto con Nimbo**, y de vuelta a `m7i-flex.large` al terminar. Nimbo usa 5.25 de 14 GB comprometidos (38 %) y ≈ 2.5 de 11.2 GB reales útiles; quedan ≈ 8.7 GB reales para el resto (≈ 45 Sandbox o ≈ 27 Starter). Se elige `m7i-flex` y no `t3.xlarge` (18 USD/mes más barato) porque no tiene créditos que agotar ni excedente que cobrar (peor caso de `t3.xlarge`: + 87.60 USD/mes); con presupuesto ajustado y carga baja, `t3.xlarge` con `creditos_cpu = "standard"` también sirve.

| | 5 días | 14 días | Mes completo |
|---|---|---|---|
| `m7i-flex.xlarge` + 80 GB + IPv4 + snapshots | **24.96** | 69.90 | **151.86** |
| Contra el tope de 70 USD | 36 % | ≈ 100 % | **217 %** |
| Contra los 120 USD de créditos (saldo al 12-nov) | 17 % | 47 % | 101 % |

- **El piloto de 5 días con Nimbo cabe holgado** en el tope de 70 USD (≈ 25 USD). **Un mes completo no** (≈ 152 USD): o se vuelve a `m7i-flex.large` al terminar, o se sube `tope_presupuesto_usd` a 160 sabiendo que se agotan los créditos.
- Requiere pasar la cuenta a **plan de pago** (ningún xlarge es elegible en el gratuito).
- Cambio en sitio: `tipo_instancia = "m7i-flex.xlarge"` y `terraform apply` (≈ 2 min de corte; IP, disco y volúmenes se conservan). Detalle en [variables.tf](../infra/terraform/variables.tf).
- **Costo atribuible a Nimbo:** ≈ 2.5 GB × 0.01324 USD/MB ≈ **33.90 USD/mes** en `m7i-flex.xlarge` (≈ 42.70 en el nodo de 8 GB) frente a 19 USD de un plan Pro: para el piloto es una inversión; como cliente estable debería ir en Business (49 USD; margen ≈ 12.63 USD en `m7i-flex.xlarge` y ≈ 3.83 en el nodo de 8 GB, ya con la comisión de 2.47).

## 6. Escenario de escala: ECS/Fargate + RDS (ADR 0010)

**Fijo de la fase 1 ≈ 91 USD/mes** (NLB 16.43, RDS `db.t4g.small` 23.36 + 2.30, Valkey `t4g.micro` 9.34, nodo `t3.medium` de plataforma 30.37 + 2.40, IPv4 3.65, ECR ≈ 1, CloudWatch Logs ≈ 2.50). Construcciones en Fargate Spot: ≈ 0.0015 USD cada una.

| Nimbo en… | Apps | Datos | **Mes** |
|---|---|---|---|
| Nodo del piloto `m7i-flex.xlarge` (prorrateado) | ≈ 2.1 GB reales | ≈ 0.4 GB reales en el nodo | **≈ 34** |
| ECS sobre EC2 + RDS y Valkey compartidos | ≈ 17 «apps de 128 MB» × 1.25 = 21 | parte de RDS/Valkey compartidos ≈ 2–3 | **≈ 24** (+ su parte del fijo) |
| Todo Fargate + RDS y ElastiCache propios | 4 × 18.02 = 72.08 (0.5 vCPU, 1 GB) | RDS `db.t4g.micro` 11.68 + 2.30, Valkey `t4g.micro` 9.34, S3 ≈ 0.25 | **≈ 95.65** |

- **Fargate y servicios administrados por proyecto no son viables** con precios de 6–49 USD (ADR 0010, [ADR 0012](adr/0012-recursos-de-datos-en-el-nodo.md)). La escala sensata es ECS sobre EC2 para las apps y **una** instancia RDS (y un Valkey) compartida con una base por recurso.
- **Equilibrio de la fase 1:** ≈ 45 registrados (≈ 13 de pago), con la tarifa de lanzamiento y la mezcla del ADR 0010 (10 Starter + 6 Pro + 1 Business ≈ 136 USD de margen en ECS, frente a 91 fijos + 41 Sandbox dormidos ≈ 15). Con los precios anteriores eran ≈ 58 (≈ 17 de pago). Por debajo de eso conviene el nodo único: la fase 1 con un nodo `t3.large` de apps cuesta ≈ 154 USD/mes por ≈ 7.3 GB para apps, y un `m7i-flex.xlarge` ≈ 152 USD por ≈ 14 GB (con la plataforma adentro, pero sin alta disponibilidad).
- **Cuándo migrar:** al acercarse a ≈ 40 apps en un nodo, cuando la CPU de las construcciones degrade las apps, o cuando haya un cliente que pida alta disponibilidad para sus datos.

## 7. Costos que ve el cliente

Tarifa de lanzamiento, en USD. Precio de 30 días; el de 365 días es 10 × el mensual (dos meses gratis), como en la semilla de planes.

| | **Sandbox** | **Starter** | **Pro** | **Business** |
|---|---|---|---|---|
| Precio por 30 días | **Gratis**, sin tarjeta y sin vencimiento | **6** | **19** | **49** |
| Precio por 365 días | — | **60** | **190** | **490** |
| Proyectos | 1 | 3 | 10 | 25 |
| CPU por proyecto | 0.25 vCPU | 0.5 vCPU | 1 vCPU | 2 vCPU |
| Memoria por proyecto | 256 MB | 512 MB | 1 GB | 2 GB |
| Construcciones al mes | 30 | 150 | 500 | 2 000 |
| Recursos de datos (por cuenta) | 0 | 3 | 10 | 25 |
| Disco por base | — | 2 GB | 5 GB | 20 GB |
| Bases incluidas | ninguna: trae tu propia URL | aparte, desde USD 2 | PostgreSQL + Redis | PostgreSQL + Redis + S3 |

**Complementos de datos** (por 30 días, sobre el plan): PostgreSQL + pgvector 2 GB USD 5, Redis USD 2, S3 10 GB USD 4, +10 GB de disco USD 2.

Los recursos de datos:

- **PostgreSQL 17 con pgvector, Redis 7 y almacenamiento compatible con S3**, creados con un clic: incluidos en Pro (PostgreSQL + Redis) y Business (+ S3); en Starter, como complementos. Las variables de conexión (`DATABASE_URL`, `REDIS_URL`, `S3_*`) se inyectan solas en el siguiente despliegue, y una base se puede **compartir entre tus proyectos**. Memoria de cada recurso: PostgreSQL 512 MB, Redis 256 MB, S3 512 MB, aparte de la de tus proyectos.
- El S3 tiene dirección pública propia (`https://<proyecto>-s3.<dominio>`) para descargar archivos desde el navegador; las bases no tienen acceso desde internet.
- El disco de cada recurso **se mide y se avisa** al acercarse al límite del plan; no se corta.
- HTTPS con certificado incluido en `https://<proyecto>.deploya.larasolutions.dev`, reversión a una de las 5 versiones anteriores sin reconstruir, y bitácoras de construcción.
- Respaldo: copia diaria del servidor, guardada 7 días. La restauración es manual, con soporte.
- Sin costos por transferencia ni por peticiones durante el piloto.

Para citar con honestidad: todo corre en **un solo servidor** en AWS (us-east-2); no hay alta disponibilidad ni respaldo por base que puedas restaurar tú mismo todavía.
