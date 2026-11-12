# 0010 — Escala con ECS sobre EC2 y construcciones en Fargate Spot

- **Estado:** Propuesto
- **Fecha:** 2026-11-12
- **Autor:** @derekCmorales · **Módulos:** M4, M5, M6, M7, transversal (infraestructura)
- **Change de OpenSpec:** pendiente (`feat/m5-contenedor-ecs` y `feat/m4-construccion-fargate` cuando se apruebe)

## Contexto

El piloto corre en una sola EC2 ([ADR 0009](0009-piloto-en-aws-ec2-con-terraform.md)). Esa EC2 tiene tres techos: memoria (≈ 45 apps pequeñas), CPU compartida entre construcciones y apps, y un único punto de falla. Además el worker monta `docker.sock`, el riesgo mayor del host. La pregunta es cómo crecer **sin Kubernetes** (EKS cuesta ≈ 73 USD/mes solo por el plano de control) y **sin reescribir el núcleo**.

Restricción económica: el ingreso por proyecto es bajo. Starter cobra 5 USD por 3 proyectos (≈ 1.67 USD por proyecto), Pro 15 USD por 10 (≈ 1.50) y Business 40 USD por 25 (≈ 1.60). Cualquier arquitectura que cueste más de ≈ 1.5 USD por app encendida 24/7 pierde dinero.

Cifras de referencia (us-east-1, bajo demanda, aprox.; **verificar en la calculadora de AWS** antes de decidir):

| Recurso | Precio |
|---|---|
| Fargate x86 | 0.04048 USD/vCPU-h y 0.004445 USD/GB-h; Spot ≈ 69 % menos. Memoria mínima por vCPU: 0.25 → 0.5 GB, 0.5 → 1 GB, 1 → 2 GB, 2 → 4 GB |
| EC2 `t3.medium` / `t3.large` | 0.0416 USD/h (30.37/mes) / 0.0832 USD/h (60.74/mes; Spot ≈ 0.031–0.036 USD/h) |
| gp3 · IPv4 pública | 0.08 USD/GB-mes · 0.005 USD/h (3.65/mes) |
| NLB o ALB | 0.0225 USD/h + LCU (≈ 16.43/mes de piso) |
| NAT Gateway | 0.045 USD/h + 0.045 USD/GB (≈ 32.85/mes de piso) |
| RDS `db.t4g.small` · ElastiCache Valkey `t4g.micro` | 0.032 USD/h · 0.0128 USD/h |
| ECR · CloudWatch Logs | 0.10 USD/GB-mes · 0.50 USD/GB ingerido |
| Salida a internet | 100 GB/mes gratis; luego ≈ 0.09 USD/GB |

**Fargate 24/7 por proyecto**, con el mínimo de memoria de su vCPU: Starter (0.5 vCPU, 1 GB) ≈ 18.02 USD/mes, Pro (1 vCPU, 2 GB) ≈ 36.04, Business (2 vCPU, 4 GB) ≈ 72.08. Frente a ≈ 1.5–1.7 USD de ingreso por proyecto, **Fargate no es viable para las apps**. En cambio, **una construcción** en Fargate Spot (2 vCPU, 4 GB, 3 min) cuesta ≈ 0.0015 USD: **ideal para builds**, que son cortos, intermitentes y los que más CPU queman.

## Decisión

Proponemos, como fase 1 de la escala:

```text
Cloudflare (DNS) → NLB → Traefik (servicio ECS, proveedor ECS)
                          ├→ apps de clientes: tareas ECS sobre EC2
                          │    (ASG como capacity provider, 50 % Spot, bin-packing por memoria)
                          └→ web y API: tareas ECS
worker(s): tareas ECS, N réplicas (BullMQ ya reparte los trabajos)
PostgreSQL → RDS · Redis → ElastiCache Valkey
construcción → tarea Fargate Spot (BuildKit sin root) → imagen en ECR
revertir sin reconstruir → apuntar el servicio al tag anterior en ECR
```

- **Apps de clientes en ECS sobre EC2, no en Fargate:** se empacan muchas apps pequeñas en nodos `t3.large` (≈ 7.3 GB útiles, ≈ 57 apps de 128 MB). Estrategia `binpack` por memoria; el capacity provider escala el ASG. Mezcla 50 % Spot: Sandbox y Starter pueden ir en Spot (una interrupción reprograma la tarea en ≈ 2 min); Pro y Business en bajo demanda.
- **Construcción en Fargate Spot:** una tarea efímera por despliegue clona, construye con BuildKit sin root y empuja a ECR. Deja de haber `docker build` en los nodos de apps y **desaparece `docker.sock`** del host: el worker solo llama a las API de ECS.
- **Sin NAT Gateway:** nodos y tareas de construcción en subredes públicas con el grupo de seguridad cerrado a la entrada; se ahorran ≈ 32.85 USD/mes.
- **TLS:** el comodín de Let's Encrypt sigue en Traefik (una réplica con `acme.json` en EFS) o pasa a un listener TLS del NLB con un certificado comodín de ACM (gratis) y Proxy Protocol v2 hacia Traefik para conservar la IP real (`PROXIES_DE_CONFIANZA`).

## Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| **ECS sobre EC2 + builds en Fargate Spot** (propuesta) | Empaque denso para apps pequeñas; builds aislados y casi gratis; sin `docker.sock`; sin plano de control que pagar; solo adaptadores nuevos | Hay nodos que parchar y un ASG que dimensionar; Spot interrumpe |
| Todo en Fargate | Cero servidores | 18–72 USD/mes por proyecto frente a ≈ 1.6 de ingreso |
| EKS | Ecosistema estándar, Karpenter | ≈ 73 USD/mes de plano de control más los nodos; operación de Kubernetes para un equipo de cuatro |
| ALB con una regla por app | TLS y enrutamiento administrados | 100 reglas por listener por defecto: no llega a cientos de apps; perderíamos la conmutación sin corte del [ADR 0005](0005-traefik-proveedor-de-archivo.md) |
| EC2 más grande (vertical) | Cero cambios | Sigue siendo un punto único de falla y con `docker.sock`; el precio crece lineal |

## Consecuencias

**Costo fijo de la fase 1 ≈ 91 USD/mes:** NLB 16.43 + RDS `db.t4g.small` 23.36 (+ ≈ 2.30 de almacenamiento) + Valkey `t4g.micro` 9.34 + un nodo `t3.medium` para web, API, Traefik y workers 30.37 (+ disco 2.40) + IPv4 3.65 + ECR ≈ 1 + CloudWatch Logs ≈ 2.50.

**Costo por app en EC2 empacado ≈ 1.17–1.25 USD/mes:** nodo `t3.large` bajo demanda con su disco (≈ 63.14 USD) entre 57 apps con un empaque real de 89–95 %. Con 50 % Spot baja.

**Margen por cliente** con la comisión de Recurrente (4.5 % + ≈ 0.26 USD por cobro) y un uso supuesto de 1.5, 4 y 10 apps encendidas a 1.25 USD:

| Plan | Precio | Comisión | Costo de apps | Margen |
|---|---|---|---|---|
| Starter | 5.00 | 0.49 | 1.88 | **2.63 (53 %)** |
| Pro | 15.00 | 0.94 | 5.00 | **9.06 (60 %)** |
| Business | 40.00 | 2.06 | 12.50 | **25.44 (64 %)** |

**Equilibrio ≈ 58 registrados (≈ 17 de pago).** Ejemplo: 10 Starter + 6 Pro + 1 Business dan ≈ 106 USD de margen, que cubren los 91 fijos más 41 Sandbox dormidos ≈ 70 % del tiempo (≈ 0.37 USD cada uno).

**Riesgo del peor caso:** los límites del plan son techos, no reservas. Si todos llenan sus cupos (Business: 25 proyectos × 2 GB = 50 GB), un cliente de 40 USD ocuparía ≈ 7 nodos. Salvaguardas: los **límites duros que ya existen** (`Memory`, `NanoCpus` y `maxProyectos` por plan, M5); **dormir los Sandbox** sin tráfico; una **política de uso justo**; y un **fondo de memoria por plan** (la memoria se reparte entre los proyectos del cliente en vez de multiplicarse por cada uno).

**Qué cambia en el código: solo adaptadores nuevos de puertos que ya existen**, elegidos en `apps/api/src/adapters/adapters.module.ts` según la configuración (Factory + Strategy):

| Puerto | Hoy | Fase 1 |
|---|---|---|
| `ContenedorPuerto` | `ContenedorDocker` | `ContenedorEcs` (servicio o tarea por versión, límites del plan en la definición de tarea) |
| `ConstructorImagenPuerto` | `ConstructorDocker` | construcción en Fargate Spot con BuildKit sin root |
| `RepositorioArtefactos` (imágenes) | imágenes locales `deploya/<proyecto>:<n>` | tags en ECR; revertir = tag anterior, sin reconstruir ([ADR 0004](0004-versionado-y-reversion-sin-reconstruir.md)) |
| `EnrutamientoPuerto` | `EnrutamientoTraefikArchivo` | Traefik con proveedor ECS (etiquetas en la tarea): el volumen compartido `traefik_dinamico` no sirve entre nodos |
| `SalidaContenedorPuerto`, `MetricasContenedorPuerto` | Docker logs y `docker stats` | CloudWatch Logs y métricas de ECS |

- **OCP:** el núcleo (servicios, dominio, pipeline) no se toca; se agregan implementaciones. **DIP:** los servicios ya dependen de los puertos. **LSP:** los adaptadores nuevos pasan las mismas pruebas de contrato que los de Docker y los dobles.
- **Nota honesta (ISP):** `EspecContenedor.red` usa vocabulario de Docker (una red bridge por proyecto). En ECS el aislamiento es por grupo de seguridad o `awsvpc`: hay que generalizarlo (p. ej. «zona de aislamiento») en un change pequeño antes del adaptador.
- **Seguridad:** las construcciones en Fargate eliminan `docker.sock` del host; cada build corre aislado, sin credenciales de la plataforma, y con un rol que solo empuja a su repositorio de ECR.
- **Operación:** BullMQ ya desacopla API y worker ([ADR 0002](0002-cola-bullmq-y-trabajador-aparte.md)): varios workers en ECS reparten la cola sin cambios. Falta un candado por proyecto en la cola para que dos despliegues del mismo proyecto no corran a la vez.
- **Cuándo:** al acercarse a ≈ 40 apps en la EC2 del piloto, o antes si la CPU de las construcciones degrada las apps.
