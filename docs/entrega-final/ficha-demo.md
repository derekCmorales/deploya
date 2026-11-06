# Ficha interna · demo del viernes (8–10 min)

> Solo para el equipo. No es guion ni presentación: es **qué mostrar, con qué entrada, qué tiene que salir** y qué hacer si algo falla. Cada quien lo cuenta con sus palabras.
> **Todo en local** (`docker compose up`): web en `localhost:3000`, correos en Mailpit (`localhost:8025`), apps en `<proyecto>.localhost`. Probado de punta a punta el 6 de noviembre con `derekCmorales/hola-deploya`.

## La idea en una línea

Un usuario nuevo llega, paga, pega un repo **sin `Dockerfile`**, Deploya lo reconoce, lo publica, se observa, se revierte en un segundo y el admin lo suspende y lo reactiva. Una sola historia continua, sin diapositivas.

**Frase de arranque (Derek, ~30 s):** gracias; desde el 30 % cerramos el núcleo y además metimos un sprint que estaba fuera de alcance (correos de avisos, métricas, bitácoras, reactivar cuenta, infraestructura, autoalojado). Les mostramos un flujo real, no grabado.

**Qué ya se vio en el 30 % (pasar rápido):** registro, verificar correo, iniciar sesión, crear un proyecto con `Dockerfile` y verlo Saludable.
**Lo nuevo que hay que remarcar:** pasarela de pago, detección de stack, riel de cinco etapas con bitácora, reversión sin reconstruir, correos de avisos, métricas/bitácoras/tiempos, suspender y reactivar.

## Recorrido

| # | Quién · tiempo | Entrada | Salida esperada | Qué decir a grandes rasgos |
|---|---|---|---|---|
| 1 | Eddy · 1 min | `/registro` con un correo nuevo (p. ej. `demo1@…`) y `Deploya-Demo-2026!` | «Cuenta creada · Pendiente de verificación» → correo «Confirma tu correo en deploya» → «Cuenta activada» → `/projects` vacío con Sandbox «0 de 1 proyecto» | Ilustraciones de acceso con movimiento; el correo llega a Mailpit por SMTP (en producción, el mismo código con otro proveedor); contraseña fuerte; arranca en Sandbox sin tarjeta |
| 2 | Javier · 1.5 min | `Planes` → Starter 30 días → tarjeta `4000 0000 0000 0002`, luego `4242 4242 4242 4242` (12/29, 123) | «Pago rechazado · Fondos insuficientes (simulado)» y después «Pago aprobado · Starter activo»; en **Suscripción**: vigencia, consumo y **Ritmo de construcciones** (08c); en **Historial de pagos** los dos intentos | Pasarela simulada detrás de un puerto; cuotas aplicadas al instante; ritmo y proyección del mes (sprint) |
| 3 | Derek · 2.5 min | `Nuevo proyecto`: `https://github.com/derekCmorales/hola-deploya`, rama **`sin-dockerfile`** → Continuar; variable `SALUDO` (opcional) → Revisar → **Desplegar** | «Accesible · 3 ramas» y **«Stack detectado: Node.js 22 · receta Deploya»**, puerto 8080; riel Recepción → Construcción → Ejecución → Enrutamiento → Operación en **~5–10 s**; versión #1 **Saludable**; «Visitar» abre `http://hola-deploya.localhost`; en Mailpit llega «hola-deploya está en línea» | Detección de stack (volvió al núcleo); bitácora por línea; límites del plan (0.5 vCPU · 512 MB) aplicados con Docker |
| 4 | Derek · 1 min | En el proyecto, **Desplegar** otra vez (#2). Luego `Despliegues` → fila #1 → **Revertir** → confirmar | #2 Saludable; la reversión crea #3 en **~1 s** con la bitácora «Imagen … reutilizada · sin reconstruir» y «Contenedor #2 detenido · #3 atiende el tráfico» | Revertir no gasta construcciones ni reconstruye; la versión vieja sigue en línea hasta que la nueva pasa la salud |
| 5 | Eduardo · 1.5 min | Pestañas del proyecto: Resumen, Métricas, Bitácoras; arriba de Despliegues la tarjeta de tiempos | Resumen con «Últimas 24 h» (13c); **Métricas** CPU/memoria con chips `#1 #2 #3` y zona de aviso (16); **Bitácoras** «hola-deploya escuchando en :8080» cada 3 s con pausa y descarga (15); **Tiempo por etapa** con mediana, fallos y «Reversión, sin construir» (14c) | Todo es del sprint fuera de alcance; datos que ya guardaba el motor |
| 6 | Javier · 1 min | Otra ventana ya con sesión de `admin@deploya.app` → **Administración** → el usuario de la demo → **Suspender cuenta** (motivo «Uso abusivo…») → luego **Reactivar cuenta**; de paso, **Infraestructura** | Al suspender: la app deja de responder y el inicio de sesión dice «suspendida por administración». Al reactivar: el contenedor vuelve (~10 s) y la URL responde. Infraestructura: CPU, memoria, disco y cola BullMQ | Suspender conserva datos y deja registro; reactivar es del sprint; infraestructura de solo lectura |
| 7 | Derek · 30 s | — | — | Cierre: código abierto y autoalojable (`instalar.sh` + asistente); calidad: 1069 pruebas de API y 273 de web en verde, un `it` por escenario, changes archivados |

Total ≈ 9 min. Si vamos tarde, se recorta en este orden: Infraestructura (6), Bitácoras (5), el pago rechazado (2).

## Antes de empezar (checklist, 15 min antes)

- [ ] `git pull` de `main` **con** el arreglo de esta rama (ver «Errores conocidos») y `docker compose up -d --build`; `pnpm test:smoke` dice `smoke e2e ok`.
- [ ] En `.env`: `ADMIN_CLAVE` puesta y **`GITHUB_TOKEN`** con un token sin permisos (sin token, GitHub da 60 peticiones/hora por IP y cada «Continuar» del paso 1 gasta varias: en la red de la U se agota).
- [ ] `docker pull node:22-alpine` para que el primer build no descargue la imagen en vivo.
- [ ] Abiertas: la web (`localhost:3000`), Mailpit (`localhost:8025`) y una **segunda ventana (privada) con la sesión de admin**.
- [ ] Correo nuevo listo para el registro (cada ensayo usa uno distinto).
- [ ] Plan B: una cuenta ya creada con Starter y `hola-deploya` Saludable, por si el registro o GitHub fallan.

## Errores conocidos y cómo esquivarlos

| Qué | Efecto en la demo | Qué hacer |
|---|---|---|
| En Saludable decía «Tu versión #N sigue sirviendo tráfico» (solo va en Fallido, 12c) | Justo al revertir se contradecía con la bitácora | **Arreglado** en `claude/inspiring-johnson-qwdyza`; mergear antes de la demo |
| `docker-compose.yml` local no pasaba `GITHUB_TOKEN` a la API | Paso 1 falla con «no pudimos acceder…» si se agota el límite | **Arreglado** en la misma rama; poner el token en `.env` |
| El repo publicado `hola-deploya` no lee `SALUDO` (la copia en `ejemplos/` sí) | Cambiar la variable no cambia el título de la página | No prometerlo; o subir `ejemplos/hola-deploya/server.js` a las ramas `main` y `sin-dockerfile` del repo (1 min) |
| Si la #1 falló, el chip del encabezado sigue en «Fallido» mientras la siguiente pasa a Saludable | Se ve raro en vivo | No empezar con la rama `roto`; si pasa, recargar |
| El encabezado dice «Dockerfile» aunque se construyó con receta | Detalle visual | No señalarlo; el chip y la bitácora dicen «receta node» |
| `feat/m1-limite-intentos` (Eddy) y `feat/web-lanzamiento` (Eduardo) **no están en `main`**; la limpieza diaria (Javier) no tiene rama | El límite de intentos (429) y la limpieza en 32 no existen todavía | No mostrarlos; no mergear nada el día de la demo sin ensayarlo |
| `/admin/instalacion` da 404 en modo nube | — | Es correcto: solo existe en autoalojado |
