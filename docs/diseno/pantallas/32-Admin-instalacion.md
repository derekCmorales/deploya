# 32 · Admin · Instalación

| | |
|---|---|
| Ruta | `/admin/instalacion` (solo autoalojado) |
| Dueño | Javier (SP-18; scripts: Derek SP-19) |
| Historias | SP-18 · SP-19 |
| Entrega | Sprint fuera de alcance |
| Diseño | Canvas Deploya v4.1, página «Sprint · fuera de alcance», artboard `32-Admin-instalacion` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |
| Datos | [instalacion.md](../../contratos/instalacion.md) · `GET /admin/instalacion` |

## Qué es

Ajustes de la instalación en bloques como 05b: Estado (Docker, DNS, certificado, disco, correo), Versión (con `actualizar.sh`), Registro (abierto · con invitación · cerrado, invitaciones), Límites por proyecto (con cuántos caben en el servidor) y Respaldos (con el aviso de guardar `CLAVE_CIFRADO_VARIABLES` fuera del servidor).

## Componentes

- `AppShell` admin
- `Card`
- `Segmented`
- `Banner` (`muted`, `warn`)
- `Badge`
- `Input`
- `Button`

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`); las gráficas nuevas entran ahí con `feat-m7-metricas`. Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas, valores de las gráficas) son de ejemplo: vienen de la API.

```text
Administración
Instalación
apps.miempresa.com · autoalojado
Estado
Lo que deploya necesita para funcionar. Se comprueba cada 10 minutos.
Comprobado hace 1 min
Volver a comprobar
Docker
27.3 · 6 contenedores de deploya en marcha
Dominio comodín
*.apps.miempresa.com → 203.0.113.10
Certificado
Comodín · vence 18 ene 2027 (en 89 días) · se renueva solo
Disco
31 de 80 GB · imágenes y artefactos
Correo
El último envío falló hace 2 h: el servidor rechazó el usuario (535)
Revisar SMTP
Versión
Actualizar hace un respaldo antes y no corta las apps publicadas.
v1.0.0
instalada el 20 oct 2026
v1.1.0 disponible
Notas de la versión
$
./scripts/actualizar.sh
✓
Respaldo previo · /var/backups/deploya/2026-10-20.tar.gz
✓
v1.1.0 descargada · migraciones aplicadas
✓
api, web y trabajador reiniciados · las apps publicadas no se cortan
Si algo sale mal,
./scripts/actualizar.sh --volver
restaura el respaldo previo.
Registro
Quién puede crear una cuenta en esta instalación.
Abierto
Con invitación
Cerrado
Invitaciones activas
Crear invitación
ana@miempresa.com
vence en 6 días
Copiar enlace
Revocar
luis@miempresa.com
vence mañana
Copiar enlace
Revocar
Límites por proyecto
Reemplazan a los planes: lo mismo para todos los usuarios.
CPU por proyecto
0.5 vCPU
1 vCPU
2 vCPU
Memoria por proyecto
512 MB
1 GB
2 GB
Proyectos por usuario
Sin límite
En este servidor caben unos 3 proyectos activos con 1 GB cada uno
Quedan 4 GB en total y deploya usa cerca de 1 GB. Aplica en el próximo despliegue de cada proyecto.
Guardar límites
Respaldos
Base de datos, variables cifradas y configuración.
Último respaldo
hoy, 03:00
Tamaño
412 MB
Dónde
/var/backups/deploya
Diario · guarda 7
Guarda la clave de cifrado fuera de este servidor
Sin
CLAVE_CIFRADO_VARIABLES
, un respaldo restaura los proyectos pero no puede leer sus variables de entorno.
Ya la guardé
Restaurar:
./scripts/respaldar.sh --restaurar 2026-10-20
```
