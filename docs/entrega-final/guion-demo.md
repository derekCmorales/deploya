# Guion de la demo · entrega final (DOC-02)

Exposición de **≈ 15 min** sobre el VPS (`https://<dominio>`), en vivo. La ficha interna con entradas, salidas y errores conocidos es [ficha-demo.md](ficha-demo.md); este guion es lo que se dice y en qué orden. Plan B al final.

## Antes de empezar (30 min antes)

- [ ] `main` en `v1.0.0` publicado con `scripts/desplegar-vps.sh`; `curl -I https://api.<dominio>/health` da 200 y el candado es `*.<dominio>`.
- [ ] `node e2e/vps.mjs` pasó hoy en el VPS (L7).
- [ ] Ventanas abiertas: la web; una **privada con la sesión de `admin@`**; la bandeja de correo real donde llegan los avisos; la terminal con la grabación de `instalar.sh` (parte 7); GitHub Actions con la última corrida verde (parte 8).
- [ ] Un correo nuevo para el registro (cada ensayo usa otro) y las tarjetas `4000 0000 0000 0002` y `4242 4242 4242 4242` a mano.
- [ ] Las contraseñas de las cuentas de demo solo en el chat del equipo, nunca en pantalla.

## Recorrido

| # | Quién · tiempo | Qué se hace | Qué se ve | Qué decir |
|---|---|---|---|---|
| 1 | Derek · 1 min | Abrir `https://<dominio>` | Portada y candado | Deploya: de un repositorio a un servicio con HTTPS. 145 de 145 puntos del núcleo y el sprint fuera de alcance completo. Código abierto y autoalojable |
| 2 | Eddy · 2 min | `/registro` con el correo nuevo → abrir el correo «Confirma tu correo» en la bandeja real → verificar → iniciar sesión. Luego, en otra pestaña, 6 contraseñas mal | «Cuenta activada»; `/projects` en Sandbox; al sexto intento **«Demasiados intentos. Vuelve a intentar en 15 min.»**; Mi cuenta con «Último cambio» | Correo real por SMTP del proveedor; contraseña fuerte; límite de intentos por IP y correo (EST-01a); ilustraciones de acceso |
| 3 | Javier · 2 min | Planes → Starter 30 días → tarjeta `…0002`, después `…4242`; comprobante PDF. Luego, con `admin@`, **correr el ciclo** | Rechazado y aprobado; «Mi suscripción» con vigencia, consumo y ritmo; en el historial los dos intentos. `vencida@` bloqueada (10c) y el correo «Por vencer» | Pasarela simulada detrás de un puerto; cuotas al instante; ciclo §4.4 vence → bloquea → suspende y renovar reanuda |
| 4 | Derek · 3 min | Nuevo proyecto con `https://github.com/derekCmorales/hola-deploya`, rama **`sin-dockerfile`** → Desplegar. Luego **Revertir a #1** | «Stack detectado: Node.js 22 · receta Deploya»; las cinco etapas en vivo; `https://hola-deploya.<dominio>` con candado; correo «está en línea». La reversión crea otra versión en segundos con «Imagen … reutilizada · sin reconstruir» | Detección de stack; límites del plan aplicados al contenedor; cada versión se guarda y revertir no reconstruye |
| 5 | Eduardo · 2 min | Pestañas Resumen, Métricas, Bitácoras; arriba de Despliegues la tarjeta de tiempos; en Suscripción el ritmo | 13c «Últimas 24 h», 16 con marcas por despliegue, 15 con la salida en vivo, 14c tiempo por etapa, 08c ritmo | Todo es del sprint; datos que ya guardaba el motor. Errores de pantalla con «Reintentar», títulos por pestaña y cabeceras de seguridad (EST-01c) |
| 6 | Javier · 1 min | Con `admin@`: Administración → el usuario de la demo → **Suspender** con motivo → **Reactivar**; Infraestructura | La app deja de responder y el inicio de sesión dice «suspendida por administración»; al reactivar vuelve. CPU, memoria, disco y cola | Suspender conserva datos y deja registro; limpieza diaria de tokens y sesiones vencidas a las 00:35 UTC (EST-01b) |
| 7 | Derek · 2 min | Grabación corta: `./scripts/instalar.sh` en un servidor limpio → asistente `/configurar` → primer despliegue; `actualizar.sh` | Las cinco etapas del instalador y el código de configuración; Admin · Instalación (32) | Modo autoalojado: los mismos compose; respaldo antes de actualizar y `--volver` |
| 8 | Eddy · 2 min | GitHub Actions de `main`; un `openspec/changes/archive/…`; un ADR | Jobs verdes, incluido «Smoke compose» con el recorrido e2e | Una prueba por escenario (1 101 en la API, 282 en la web y 23 de los scripts; 96.9 % de líneas cubiertas), recorrido e2e en CI, 42+ changes archivados, 8 ADR, SOLID y patrones por historia |

Si el tiempo aprieta se recorta en este orden: Infraestructura (6), la grabación de `actualizar.sh` (7), el pago rechazado (3).

## Plan B

| Si falla | Entonces |
|---|---|
| El VPS no responde | Video de respaldo (abajo) y compose local con los mismos datos (`docker compose up -d`, [ficha-demo.md](ficha-demo.md)) |
| El correo tarda | Seguir con una cuenta ya verificada; mostrar el correo después |
| GitHub limita la API | `GITHUB_TOKEN` en `.env.vps`; si ya pasó, usar `hola-deploya` ya creado y solo **Desplegar** |
| La construcción tarda | Mostrar un despliegue anterior en 12b mientras termina |

## Video de respaldo

≤ 15 min, grabado en el VPS siguiendo este mismo recorrido, con la resolución de la pantalla del aula. Se graba en el ensayo 1 (L10) y queda enlazado en el *release* `v1.0.0`; el archivo **no** se sube al repositorio (pesa demasiado).
