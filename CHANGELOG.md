# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versiones con [SemVer](https://semver.org/lang/es/). Cada historia entró con su change de OpenSpec, archivado en [openspec/changes/archive/](openspec/changes/archive/).

## [1.0.0] · 2026-11-08

Entrega final: núcleo v4.1 completo (145 de 145 puntos), sprint fuera de alcance y endurecimiento para el público.

### Agregado

**Identidad y correo (M1, M10)**
- Registro con contraseña fuerte, verificación por enlace de 24 h con reenvío, inicio y cierre de sesión, roles Cliente y Administrador, recuperación de contraseña, Mi cuenta con «Último cambio» y cierre de todas las sesiones.
- Correo por SMTP configurable (Mailpit en desarrollo) con plantillas de verificación, recuperación y avisos: despliegue Saludable o Fallido, plan por vencer y suscripción suspendida.
- Ilustraciones de acceso con movimiento.
- **Límite de intentos** (EST-01a): 5 fallos de contraseña por IP y correo en 15 min, 10 registros por IP por hora y 3 correos por cuenta por hora; 429 con `Retry-After` y aviso con los minutos en 01 y 03.

**Suscripciones y pagos (M2)**
- Catálogo de cuatro planes (Sandbox, Starter, Pro, Business) a 30 y 365 días; Sandbox automático al registrarse.
- Contratación, renovación y cambio de plan con pasarela simulada; historial de pagos con comprobante PDF; cuotas aplicadas al instante.
- Ciclo de vida §4.4 (vence, gracia, suspende, cancela) en una tarea diaria a las 00:05 UTC.

**Proyectos (M3)**
- Alta desde un repositorio público de GitHub con validación de repositorio, rama y último commit; variables de entorno cifradas con AES-256-GCM; configuración y eliminación con confirmación.

**Motor: construcción, orquestación y enrutamiento (M4, M5, M6)**
- Pipeline de cinco etapas con bitácora en vivo, cancelar y reintentar.
- Construcción con el `Dockerfile` del repositorio o con **receta por stack detectado** (Node, Python, Go, estático).
- Contenedores sin privilegios con la CPU y la memoria del plan, una red por proyecto y verificación de salud.
- Versionado inmutable y **reversión sin reconstruir**; redesplegar, reiniciar y detener sin cortar el servicio.
- Subdominio automático por proyecto con HTTPS comodín (Traefik y Let's Encrypt DNS-01).

**Observabilidad (M7)**
- Vista del despliegue, resumen, historial, consumo del período, últimas 24 h, métricas de CPU y memoria, tiempo por etapa, ritmo de construcciones y bitácoras de ejecución.

**Administración (M9)**
- Usuarios con búsqueda y filtros, suspender y reactivar con motivo y registro de la acción, infraestructura del servidor.
- **Limpieza diaria** (EST-01b) de tokens, sesiones e invitaciones vencidas a las 00:35 UTC y a mano con `POST /admin/limpieza/ejecutar`; la última corrida en Admin · Instalación.

**Autoalojado y código abierto**
- Modo de instalación (nube o autoalojado), instalador por etapas `scripts/instalar.sh`, asistente de primera configuración, Admin · Instalación (registro abierto, con invitación o cerrado; límites; respaldos), `actualizar.sh` con respaldo previo y `--volver`, `respaldar.sh` con retención de 7.

**Web (EST-01c)**
- Límites de error con «Reintentar» en cada grupo de rutas y `global-error`, esqueletos de carga, cabeceras de seguridad, título por pestaña e ícono.

**Calidad y operación**
- Una prueba unitaria por escenario de cada spec; CI con build y pruebas, gitleaks, shellcheck y «Smoke compose».
- **Recorrido e2e** de la API en CI (QA-01, `e2e/recorrido.mjs`) y recorrido del motor en el VPS (`e2e/vps.mjs`).
- Documentación final en [docs/entrega-final/](docs/entrega-final/): requisitos, manual de usuario, guion de demo, accesibilidad, diseño final, manual técnico y lanzamiento.

### Cambiado
- `docker-compose.vps.yml`: todos los servicios con `restart: unless-stopped` y rotación de logs.
- `respaldar.sh` y `actualizar.sh` aceptan `DEPLOYA_ARCHIVOS_COMPOSE` para respaldar el VPS de la nube.

### Corregido
- Accesibilidad: un `<main>` por pantalla, banner duplicado en el proyecto, nombre de los medidores y bitácora con teclado.
- Admin · Usuarios: con el detalle abierto, la tabla se desplaza en vez de pisar el panel.

[1.0.0]: https://github.com/derekCmorales/deploya/releases/tag/v1.0.0
