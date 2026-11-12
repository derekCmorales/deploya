# 0011 — Landing pública en S3 + CloudFront y la app en `app.<dominio>`

- **Estado:** Aceptado
- **Fecha:** 2026-11-12
- **Autor:** @derekCmorales · **Módulos:** transversal (infraestructura), web
- **Change de OpenSpec:** no aplica (infraestructura y navegación; no cambia requisitos de ningún módulo)

## Contexto

La raíz del dominio (`deploya.larasolutions.dev`, porque `deploya.app` ya estaba tomado) servía la web de Next.js, y su portada era una página de andamiaje con un enlace al catálogo del design system. Para el piloto con usuarios reales, la raíz tiene que ser la **landing** del producto (repo `deploya_landing`, Astro 100 % estático) y llevar al registro, al inicio de sesión y, después, al panel.

Fuerzas:

- La landing es la cara del producto: tiene que seguir arriba aunque la EC2 del [ADR 0009](0009-piloto-en-aws-ec2-con-terraform.md) se caiga o se esté redesplegando.
- La EC2 ya va justa con los contenedores de los usuarios; servir archivos estáticos ahí no le aporta nada.
- El comodín `*.<dominio>` ya apunta a la EC2 y `app`, `www` y `api` están en `SUBDOMINIOS_DE_PLATAFORMA`: ningún proyecto puede tomarlos.
- El DNS vive en Cloudflare («Solo DNS») y el certificado comodín de Traefik se emite por DNS-01 ([ADR 0007](0007-certificado-comodin-por-dns-01.md)), así que no depende de a dónde apunte la raíz.

## Decisión

| Dominio | Qué sirve | Dónde |
|---|---|---|
| `<dominio>`, `www.<dominio>` | Landing | CloudFront → S3 privado |
| `app.<dominio>` | Web (Next.js) | EC2 · Traefik |
| `api.<dominio>` | API | EC2 · Traefik |
| `<proyecto>.<dominio>` | Apps de los usuarios | EC2 · Traefik |

- **Terraform** ([infra/terraform/landing.tf](../../infra/terraform/landing.tf)): bucket S3 privado (bloqueo de acceso público, cifrado, `BucketOwnerEnforced`) que solo lee la distribución por **Origin Access Control**; certificado de **ACM en us-east-1** validado por DNS; una **CloudFront Function** que redirige `www` a la raíz y resuelve `index.html` por carpeta; cabeceras de seguridad (HSTS, `nosniff`, `SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`); `PriceClass_100`. S3 y CloudFront no viven en la VPC: no llevan grupos de seguridad ni ACL de red.
- **Publicación de la landing**: `pnpm deploy:aws` en `deploya_landing` (`aws s3 sync` + invalidación de CloudFront).
- **Web**: el host sale de `HOST_WEB` (`app.<dominio>` en la nube; sin él, la raíz, como en autoalojado). `URL_WEB` de la API (CORS y enlaces de correo) lo sigue. `NEXT_PUBLIC_URL_LANDING` (de `URL_LANDING`) le dice a la web a dónde mandar a quien llega a `/` sin sesión.
- **Navegación**: `/` con sesión es el panel de **Inicio** (resumen de proyectos, consumo, plan y actividad); sin sesión, la landing (o `/ingresar` sin landing). Tras iniciar sesión se vuelve a Inicio. El catálogo `/sistema` sale del menú y no existe en producción salvo `NEXT_PUBLIC_MOSTRAR_CATALOGO=1`.

## Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| **S3 + CloudFront** (elegida) | Sigue arriba si cae la EC2; CDN global; capa gratuita de CloudFront (1 TB y 10 M de peticiones al mes); bucket privado con OAC; IaC en el mismo Terraform | Certificado en us-east-1; primer apply en dos pasos por la validación DNS en Cloudflare |
| Servir la landing desde la EC2 con Traefik | Cero servicios nuevos | Cae con la EC2 y con cada redespliegue; consume recursos del nodo de los usuarios |
| Cloudflare Pages / Workers | `wrangler.jsonc` ya está en el repo de la landing; gratis | Otro proveedor de cómputo fuera de AWS y de Terraform para el piloto |
| Landing dentro de Next.js | Un solo sitio | Mezcla marketing y panel en el mismo despliegue; la landing ya existe en Astro y es estática |

## Consecuencias

- **Positivas:** la raíz es un producto, no un andamiaje; la landing no depende de la EC2; el panel tiene un Inicio real.
- **Negativas / riesgos:** el registro de la raíz pasa de A (EC2) a CNAME (CloudFront): hay que borrar el A antes. Las cookies de sesión las pone `api.<dominio>` y la web está en `app.<dominio>`; es el mismo sitio registrable, igual que antes con la raíz.
- **Autoalojado:** sin cambios; el instalador deja la web en la raíz y sin landing.

## Validación

- `terraform validate` con `landing.tf`; `curl -I https://<dominio>` responde desde CloudFront y `https://app.<dominio>` desde Traefik.
- Pruebas de la web: `apps/web/test/inicio.test.mjs` (destino de la raíz sin sesión, marca, resumen, actividad) y `home.test.mjs` (sin enlace al catálogo).
