# 30 · Deploya autoalojado · instalación

| | |
|---|---|
| Ruta | — (`scripts/instalar.sh`) |
| Dueño | Derek (SP-16, SP-19; modo: Javier SP-06) |
| Historias | SP-06 · SP-16 |
| Entrega | Sprint fuera de alcance |
| Diseño | Canvas Deploya v4.1, página «Sprint · fuera de alcance», artboard `30-Modo-autoalojado` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |
| Datos | [instalacion.md](../../contratos/instalacion.md) · [ADR 0008](../../adr/0008-autoalojado-y-codigo-abierto.md) |

## Qué es

Referencia del instalador por etapas (Requisitos → Dominio → Certificado → Servicios → Administrador), su salida correcta y con error (el DNS no apunta), lo que comprueba, qué cambia frente a la nube y el encabezado en cada modo (autoalojado: sin Suscripción, chip con el dominio).

## Componentes

- Salida de terminal (no es UI web)
- `AppShell` en los dos modos
- `Table`

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`); las gráficas nuevas entran ahí con `feat-m7-metricas`. Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas, valores de las gráficas) son de ejemplo: vienen de la API.

```text
30 · Deploya autoalojado · instalación
Un comando, cinco etapas
El instalador sigue el mismo riel que un despliegue: dice en qué etapa va, comprueba antes de cambiar nada y, si algo falla, explica qué hacer y sigue donde quedó.
Instalación correcta
$
./scripts/instalar.sh
deploya · instalador autoalojado · v1.0.0
[1/5]
Requisitos
✓
Docker 27.3 · Compose v2 · 3.8 GB de RAM · 61 GB libres
✓
Puertos 80 y 443 libres
[2/5]
Dominio
?
Dominio base:
apps.miempresa.com
✓
*.apps.miempresa.com → 203.0.113.10 (esta máquina)
[3/5]
Certificado
?
Proveedor DNS:
cloudflare
· token solo de la zona: ••••
✓
Comodín emitido por Let’s Encrypt · vence 18 ene 2027
[4/5]
Servicios
✓
postgres · redis · api · web · trabajador · traefik
[5/5]
Administrador
→ Abre
https://apps.miempresa.com/configurar
Código de configuración:
7F3K-92QD
(vence en 30 min)
Error con salida · el DNS no apunta
$
./scripts/instalar.sh
deploya · instalador autoalojado · v1.0.0
[1/5]
Requisitos
✓
Docker 27.3 · Compose v2 · 3.8 GB de RAM · 61 GB libres
[2/5]
Dominio
✗
*.apps.miempresa.com apunta a 198.51.100.7, no a esta máquina (203.0.113.10).
Qué hacer
1. En tu proveedor DNS crea un registro A:
*.apps → 203.0.113.10
2. Espera a que propague (normalmente minutos) 3. Sigue donde quedó:
./scripts/instalar.sh --continuar
No se instaló nada todavía. Bitácora: ~/.deploya/instalacion.log
Qué comprueba
Docker y Compose v2, RAM (mínimo 2 GB) y disco (mínimo 20 GB).
Puertos 80 y 443 libres; si no, dice qué proceso los usa.
El comodín del dominio apunta a esta máquina, antes de pedir el certificado.
Si el proveedor DNS no está soportado, ofrece certificados por proyecto (HTTP-01).
Genera los secretos (sesión y clave de cifrado de variables) y los guarda en .env con permisos 600.
Termina con un código de configuración de un solo uso: nadie más puede reclamar la cuenta de administrador.
Qué cambia frente a la nube
Nube · deploya.app
Autoalojado
Planes y cobro
Sandbox, Starter, Pro y Business con la pasarela simulada
Un plan «Autoalojado», sin cobro ni vencimiento
Límites
Los del plan
Los fija el administrador en Instalación
Administrador
Por seed
Quien tenga el código de configuración
Registro
Abierto
Abierto, con invitación o cerrado
Correo
Proveedor SMTP de deploya
Tu SMTP, o sin correo
Actualizar
Lo hace el equipo
./scripts/actualizar.sh
con respaldo previo
Encabezado · nube y autoalojado
Nube: Proyectos, Suscripción y Cuenta; el chip muestra plan y días.
Autoalojado: sin Suscripción; el chip muestra el dominio de la instalación. El administrador entra a Admin desde su menú.
```
