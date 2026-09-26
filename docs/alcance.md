# Alcance del proyecto — núcleo v4.1

**Fuente de verdad del alcance.** Reemplaza lo comprometido en [propuesta.md](propuesta.md) §4.2, §4.3, §6.1 y §11.2 donde choquen. La propuesta se conserva como documento histórico.

Por indicación del curso, el alcance se limita a lo **más core**, que es lo que se califica. Lo que se diseñó en la propuesta y ya no entra queda abajo en [Fuera de alcance · solo si da el tiempo](#fuera-de-alcance--solo-si-da-el-tiempo): no se borra, se pospone.

Referencia visual: canvas **Deploya v4.1** en Claude Design (34 pantallas, <https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT>). Para construir se usa su traducción al repo: [diseno/](diseno/README.md) (design system, guía y una ficha por pantalla). Si una pantalla y un documento no coinciden, **manda la pantalla** y se corrige el documento.

## En una frase

Un cliente se registra, verifica su correo, contrata un plan con pago simulado, pega la URL de un **repositorio público de GitHub con `Dockerfile`**, y la plataforma lo construye, lo corre en un contenedor con los límites de su plan y lo publica en `https://<proyecto>.deploya.app`. Un administrador puede ver usuarios y suspender cuentas.

## Recorrido que se evalúa

1. Registro → verificación de correo → inicio de sesión (arranca en Sandbox, sin tarjeta).
2. Ver planes → contratar con la pasarela simulada (aprobado / rechazado).
3. Crear proyecto: repositorio, variables, revisar → **Desplegar**.
4. Ver el despliegue avanzar por las cinco etapas con su bitácora → Saludable → abrir la URL HTTPS.
5. Operar: redesplegar, reiniciar, detener, cambiar variables o rama, eliminar.
6. Ciclo de la suscripción: vence → bloquea despliegues → suspende (contenedores detenidos).
7. Administración: listar usuarios y suspender una cuenta.

## Mapa de pantallas v4.1 → módulo → dueño

| # | Pantalla | Módulo | Dueño |
|---|---|---|---|
| 01, 01b | Registro y estados (correo ya registrado, enviando, pendiente de verificación) | M1 | Eddy |
| 02 | Verifica tu correo (bandeja, token válido, token expirado; reenviar con cuenta atrás) | M1 + M10 | Eddy |
| 03, 03b | Iniciar sesión y estados (credenciales incorrectas, sin verificar, suspendida por admin) | M1 | Eddy |
| 04 | Recuperar contraseña (solicitar, confirmación neutra, nueva contraseña, token usado) | M1 + M10 | Eddy |
| 05, 05b | Mi cuenta: Perfil y Seguridad | M1 | Eddy |
| 24 | Correos del sistema: verificación y recuperación | M10 | Eddy |
| 06 | Planes (30 / 365 días, tabla de recursos) | M2 | Javier |
| 07, 07b | Contratar plan y resultados (procesando, aprobado, rechazado) | M2 | Javier |
| 08 | Mi suscripción (vigencia, consumo, renovar, cambiar plan) | M2 (+ consumo de M7) | Javier |
| 09, 09b | Historial de pagos, comprobante y vacío | M2 | Javier |
| 25, 25b | Admin · Usuarios y Suspender cuenta | M9 | Javier |
| 10, 10b, 10c | Proyectos: lista, primer proyecto, suscripción vencida | M3 | Eduardo |
| 11a, 11c, 11d, 11e | Nuevo proyecto: Repositorio, Variables, Revisar, errores | M3 | Eduardo |
| 13 | Proyecto · Resumen | M7 | Eduardo |
| 14 | Proyecto · Despliegues | M7 (+ M4) | Eduardo |
| 17 | Proyecto · Variables de entorno | M3 | Eduardo |
| 19, 19b | Proyecto · Configuración y eliminar | M3 (+ M5) | Eduardo |
| 12, 12b, 12c | Despliegue en curso, Saludable, Fallido | UI: Eduardo · motor: Derek | Eduardo + Derek |
| 28 | Estados del sistema (404, 403, sesión expirada, suscripción suspendida, error de API, carga) | transversal web | Eduardo (+ Javier: suspendida) |
| Main | Identidad visual v4.1 → migrada a [diseno/](diseno/README.md) y `apps/web/src/components` | design system | Eduardo (hecho) |

Las pantallas no tienen UI propia para M4, M5 y M6: el motor de Derek es lo que hace **reales** las pantallas 10–14 y 19. La numeración tiene huecos (15, 16, 18, 20–23, 26, 27): son pantallas que se recortaron con el alcance.

## Alcance por módulo

**Debe** = imprescindible para aprobar. **Debería** = core, pero se hace al final si el tiempo aprieta.

### M1 Identidad y acceso — Eddy

| Prioridad | Qué | Pantalla |
|---|---|---|
| Debe | Registro con correo único y contraseña (mín. 12, mayúsculas y minúsculas, número, símbolo); cuenta *pendiente de verificación*; suscripción Sandbox automática | 01, 01b |
| Debe | Verificación por enlace (24 h, un solo uso); reenviar con cuenta atrás | 02 |
| Debe | Iniciar y cerrar sesión; estados: credenciales incorrectas, sin verificar, suspendida (muestra motivo) | 03, 03b |
| Debe | Roles **Cliente** y **Administrador** (admin por seed); guard de rol → 403 | 28 |
| Debe | Sesión expira tras 7 días sin actividad | 28 |
| Debería | Recuperar contraseña (enlace 30 min, un solo uso, confirmación neutra, cierra otras sesiones) | 04 |
| Debería | Mi cuenta: editar nombre (≤ 64), correo y rol de solo lectura | 05 |
| Debería | Seguridad: cambiar contraseña, cerrar sesión en todos los dispositivos | 05b |

### M10 Notificaciones — Eddy

| Prioridad | Qué | Pantalla |
|---|---|---|
| Debe | `CorreoPuerto` con adaptador SMTP elegido por configuración: Mailpit en desarrollo, proveedor externo (Resend, Brevo…) en el VPS; más un adaptador de consola para pruebas. Cambiar de proveedor = cambiar variables, no código ([ADR 0001](adr/0001-correo-por-smtp-configurable.md)) | — |
| Debe | Correo de verificación de cuenta | 24 |
| Debería | Correo de recuperación de contraseña | 24 |

### M2 Suscripciones y pagos — Javier

| Prioridad | Qué | Pantalla |
|---|---|---|
| Debe | Catálogo fijo por seed: Sandbox, Starter, Pro, Business ([tabla abajo](#planes-y-recursos-v41)) | 06 |
| Debe | Contratación con `PasarelaPago` simulada; tarjetas de prueba `4242…` aprueba, `…0002` rechaza, `…3220` tarda 5 s | 07, 07b |
| Debe | Suscripción Activa al aprobar; cuotas disponibles para M3/M4/M5 | 07b |
| Debe | Estados §4.4: Activa → Por vencer (≤ 7 días) → Vencida (gracia 5 días, bloquea despliegues y altas) → Suspendida (contenedores detenidos) → Cancelada (30 días suspendida) | 10c, 28 |
| Debe | Límites aplicados: proyectos por plan y construcciones por mes | 08, 10 |
| Debería | Mi suscripción: vigencia, consumo del período, **renovar ahora** (manual) | 08 |
| Debería | Cambiar plan: ascenso inmediato (pagas el plan completo y arrancan 30 días nuevos); descenso al terminar la vigencia | 08 |
| Debería | Historial de pagos con comprobante y descarga PDF; estado vacío | 09, 09b |

### M9 Administración — Javier

| Prioridad | Qué | Pantalla |
|---|---|---|
| Debe | Lista de usuarios: buscar por correo, filtrar por estado de suscripción, detalle (suscripción, proyectos con estado, pagos) | 25 |
| Debe | Suspender cuenta con motivo y detalle: no inicia sesión, contenedores detenidos, datos conservados; queda registro de la acción | 25b, 03b |

### M3 Proyectos y fuentes — Eduardo

| Prioridad | Qué | Pantalla |
|---|---|---|
| Debe | Lista de proyectos con búsqueda y contador frente al límite del plan; estado vacío | 10, 10b |
| Debe | Alta paso 1: URL de repo **público de GitHub**, rama, nombre (define el subdominio), puerto tomado de `EXPOSE`, `Dockerfile` detectado | 11a |
| Debe | Errores de alta: repo no accesible, falta `Dockerfile` (con ejemplo) | 11e |
| Debe | Variables de entorno cifradas en reposo (paso 2, opcional) | 11c |
| Debe | Revisar y **Desplegar** (crea el despliegue #1) | 11d |
| Debe | Bloqueo de alta si se alcanzó el límite o la suscripción está Vencida | 10, 10c |
| Debería | Variables del proyecto: agregar, mostrar/ocultar, guardar o guardar y desplegar | 17 |
| Debería | Configuración: nombre, repositorio, rama, ruta del `Dockerfile`, puerto; eliminar con confirmación escrita | 19, 19b |

### M7 Observabilidad — Eduardo

| Prioridad | Qué | Pantalla |
|---|---|---|
| Debe | Vista de despliegue: riel de cinco etapas con duración, estado y bitácora de construcción (polling cada 3 s, copiar) | 12, 12b, 12c |
| Debe | Resumen del proyecto: estado actual, URL, versión activa, imagen, recursos aplicados | 13 |
| Debe | Historial de despliegues con filtros (todos / saludables / fallidos) | 14 |
| Debería | Consumo del período (proyectos y construcciones) para Mi suscripción | 08 |
| Debería | Actividad de despliegues de 12 semanas | 13 |

### M4 Motor de construcción — Derek

| Prioridad | Qué |
|---|---|
| Debe | Cola en Redis (BullMQ) y trabajador fuera del ciclo HTTP |
| Debe | Recepción: clonar la rama, registrar commit |
| Debe | Construcción: `docker build` con el `Dockerfile` del repo; tiempo máximo; artefacto versionado (`#n`, digest, tamaño) |
| Debe | Bitácora de construcción persistida por líneas |
| Debería | Cancelar despliegue en curso; reintentar un fallido; redesplegar un commit anterior (**reconstruye**) |

### M5 Orquestación y ejecución — Derek

| Prioridad | Qué |
|---|---|
| Debe | Correr la imagen vía `ContenedorPuerto` con `--cpus` y `--memory` del plan, sin privilegios, red propia |
| Debe | Verificación de salud HTTP al puerto interno antes de publicar |
| Debe | Si falla, la versión anterior sigue sirviendo |
| Debe | Detener contenedores cuando la suscripción pasa a Suspendida o se suspende la cuenta |
| Debería | Reiniciar y detener desde el panel; eliminar contenedor e imágenes al borrar el proyecto |

### M6 Enrutamiento y TLS — Derek

| Prioridad | Qué |
|---|---|
| Debe | Subdominio automático `<proyecto>.deploya.app` vía `EnrutamientoPuerto` (Traefik); en local `<proyecto>.localhost` |
| Debe | HTTPS con certificado comodín en el VPS |
| Debe | Conmutación sin corte: el nuevo contenedor recibe tráfico antes de detener el anterior |

### M8 Asistente e integración

**Fuera de alcance completo.** No hay pantallas. El módulo queda como stub con `health`.

### Transversal — Derek

| Prioridad | Qué |
|---|---|
| Debe | Compose con Postgres, Redis, API, web, trabajador, Traefik y Mailpit |
| Debe | Plataforma desplegada en el VPS con dominio comodín (entrega final) |
| Debe | ADR de las decisiones grandes (Dockerfile obligatorio, polling, Traefik, BullMQ) |

## Planes y recursos v4.1

Sustituye la tabla §4.2 de la propuesta. Solo se aplican estos cuatro recursos.

| Recurso | Sandbox | Starter | Pro | Business |
|---|---|---|---|---|
| Precio | Sin costo | USD 5.00 / 30 días | USD 15.00 / 30 días | USD 40.00 / 30 días |
| Vigencia | sin vencimiento | 30 o 365 días | 30 o 365 días | 30 o 365 días |
| Proyectos | 1 | 3 | 10 | 25 |
| CPU por proyecto | 0.25 vCPU | 0.5 vCPU | 1 vCPU | 2 vCPU |
| Memoria por proyecto | 256 MB | 512 MB | 1 GB | 2 GB |
| Construcciones / mes | 30 | 150 | 500 | 2 000 |

- Precio de 365 días: lo fija Javier en el seed (propuesta: precio reducido).
- Todos los proyectos corren en un único VPS y se publican en `*.deploya.app` con HTTPS.
- Sandbox no vence, para no bloquear a un usuario nuevo; se decide así para simplificar §4.4.

## Estados

**Despliegue** (≠ suscripción): Encolado, Construyendo, Aprovisionando, Publicando, Saludable, Fallido, Cancelado, Detenido. *Revirtiendo* queda fuera junto con la reversión instantánea.

**Suscripción** (§4.4): Activa, Por vencer, Vencida, Suspendida, Cancelada.

**Cuenta**: Pendiente de verificación, Activa, Suspendida.

## Fuera de alcance · solo si da el tiempo

Nada de esta lista se empieza hasta que todo lo **Debe** de tu módulo esté terminado y presentado. Cada punto entra con su propio change de OpenSpec. Orden = prioridad sugerida.

| # | Qué | Módulo | Por qué salió |
|---|---|---|---|
| 1 | Reactivar una cuenta suspendida desde admin | M9 | Sin pantalla; se hace por seed/SQL en la demo |
| 2 | Métricas de CPU y memoria en vivo (`docker stats`) | M7 | No hay pantalla de métricas en v4.1 |
| 3 | Bitácoras de ejecución del contenedor (runtime) | M7 | Solo se muestra la bitácora de construcción |
| 4 | Correos de resultado de despliegue y de vencimiento de plan | M10 | v4.1 solo diseña verificación y recuperación |
| 5 | Renovación automática | M2 | v4.1 solo muestra renovación manual |
| 6 | Reversión instantánea sin reconstruir (estado Revirtiendo) | M4 M5 | v4.1 redespliega reconstruyendo el commit |
| 7 | Dominios personalizados | M6 | Sin pantalla |
| 8 | Carga por archivo comprimido | M3 | Solo repositorio público |
| 9 | Repositorios privados (OAuth de GitHub) | M3 | Solo repositorio público |
| 10 | Detección de stack sin `Dockerfile` (recetas, buildpacks) | M4 | `Dockerfile` en la raíz es requisito |
| 11 | Transmisión en vivo por WebSocket/SSE | M7 | Polling cada 3 s alcanza |
| 12 | Prorrateo al cambiar de plan | M2 | Ascenso paga completo; descenso al vencer |
| 13 | Complementos (§4.3) | M2 | Sin pantalla |
| 14 | Gestión de planes desde admin (crear, editar, descontinuar) | M9 | Catálogo fijo por seed |
| 15 | Estado de la infraestructura en admin | M9 | Sin pantalla |
| 16 | Bitácora de auditoría completa de cuenta | M1 | Solo se registra la suspensión (M9) |
| 17 | Roles Operador de infraestructura y Soporte | M1 | Solo Cliente y Administrador |
| 18 | Cancelación por el cliente y exportar datos | M2 | Cancelada solo llega por el ciclo §4.4 |
| 19 | Almacenamiento, transferencia, retención de bitácoras y miembros por espacio de trabajo como límites | M2 M5 | Solo proyectos, CPU, memoria y construcciones |
| 20 | Cambiar correo, segundo factor | M1 | "Por ahora no se puede cambiar" (pantalla 05) |
| 21 | Asistente de diagnóstico y servidor de integración (M8 completo) | M8 | Sin pantalla; mayor riesgo |

Fuera de alcance **siempre** (ya excluido en la propuesta §6.2): varios nodos y escalado horizontal, servidor de correo propio, CDN y multirregión, app de escritorio y CLI, cobro con dinero real, entornos de vista previa por PR.

## Cambios frente a la propuesta

| Propuesta | Ahora |
|---|---|
| Repositorio público **o** zip; detección de stack | Solo repo público de GitHub con `Dockerfile` |
| Reversión inmediata sin reconstruir | Redesplegar un commit anterior (reconstruye) |
| Límites: 12 recursos por plan | 4 recursos: proyectos, CPU, memoria, construcciones |
| Pro 2 GB, Business 4 GB y 30 proyectos | Pro 1 GB, Business 2 GB y 25 proyectos |
| Construcciones 20 / 100 / sin límite | 30 / 150 / 500 / 2 000 |
| Renovación manual o automática; prorrateo | Solo manual; sin prorrateo |
| Cuatro roles | Cliente y Administrador |
| M8 asistente + integración | Fuera |
| Métricas CPU/memoria/transferencia en vivo | Estado, etapas, bitácora de construcción y consumo del plan |
| Dominios personalizados | Solo subdominio automático |

Plan de entregas y reparto por persona: [plan-avances.md](plan-avances.md).
