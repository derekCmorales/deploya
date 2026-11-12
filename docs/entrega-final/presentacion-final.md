# Presentación final · guion hablado (13 de noviembre de 2026)

Guion palabra por palabra de la presentación ante la terna (panel de inversionistas). El deck está en Claude Design (tipo Slides, privado hasta compartirlo); cada diapositiva lleva en sus notas quién habla y cuántos segundos. La demo en vivo detallada y su plan B están en [guion-demo.md](guion-demo.md) y [ficha-demo.md](ficha-demo.md); este documento manda para la presentación de 10 minutos.

## Tiempos

| Bloque | Diapositivas | Quién | Tiempo |
|---|---|---|---|
| Pitch | 1–6 | Derek, Eddy, Eduardo, Javier | 1:50 |
| Transición a la demo | 7 | Derek | 0:10 |
| Demo en vivo | 7 queda de fondo; se cambia a la app | los cuatro | 4:00 |
| Cierre | 8 | Eddy, Derek | 0:20 |
| Defensa | 9–19 (apéndice, solo si preguntan) | quien elija la terna | 3:40 |
| **Total** | | | **10:00** |

Lo hablado con el deck (pitch + transición + cierre) marca **≈ 2:20**. Si el equipo quiere llegar a ~5 min en el ensayo, están las [extensiones opcionales](#extensiones-opcionales), pero eso pasa de los 2 + 4 + 4 minutos de la rúbrica: no usarlas el día de la presentación salvo que la terna dé más tiempo.

Ritmo de referencia: ~150 palabras por minuto. Cronómetro visible para quien no está hablando.

## Antes de empezar (30 min antes)

- [ ] Ambiente desplegado respondiendo: `curl -I https://api.<dominio>/health` da 200 y el candado es `*.<dominio>`.
- [ ] Ventanas: (1) web con la sesión de `cliente@` (Eduardo y Derek); (2) **ventana privada** vacía para el registro (Eddy); (3) **otra ventana privada** con la sesión de `admin@` (Javier); (4) bandeja de correo real; (5) video de respaldo pausado en el segundo 0.
- [ ] `cliente@` en Starter y con `hola-deploya` ya desplegado tres veces (#1, #2, #3): es el proyecto donde se revierte. El proyecto nuevo de la demo se llama distinto (ver [discrepancias](#discrepancias-con-el-repositorio)).
- [ ] Métricas de 24 h precargadas en el proyecto que se mostrará al final.
- [ ] `docker pull node:22-alpine` en el servidor y `GITHUB_TOKEN` configurado.
- [ ] Un correo nuevo para el registro, la tarjeta `4242 4242 4242 4242` (12/29, 123) a mano. Contraseñas solo en el chat del equipo.
- [ ] QR del PDF ya pegado en la diapositiva 8.

---

## A. Pitch (1:50)

### 1 · Portada — Derek · 8 s

> Buenas tardes. Somos Deploya: pegas la URL de un repositorio de GitHub y en minutos tu app está publicada con HTTPS. Soy Derek; conmigo están Eddy, Javier y Eduardo.

### 2 · El problema — Derek · 17 s

> Hoy publicar una app exige cuatro oficios: escribir un Dockerfile, rentar y asegurar un servidor, configurar el DNS y renovar los certificados HTTPS. Las plataformas que lo resuelven cobran unos siete dólares al mes por cada servicio, y cuando te quieres ir, tu configuración no viaja contigo.

### 3 · Cliente objetivo — Eddy · 20 s

> Nuestro cliente es el estudiante, el freelancer y la pyme de Guatemala y Latinoamérica que paga en dólares con un presupuesto fijo. Es un mercado que crece: Octoverse 2024 pone a Latinoamérica entre las regiones con más crecimiento de desarrolladores, y GitHub cuenta más de cien mil solo en Guatemala. Para ellos, siete dólares por cada app es mucho, y una factura que cambia cada mes es peor.

### 4 · Propuesta de valor — Eddy · 22 s

> Deploya lo resuelve con cuatro cosas. Uno: no necesitas Dockerfile; detectamos Node, Python, Go o un sitio estático y lo construimos. Dos: cada versión queda guardada y revertir toma segundos, sin reconstruir. Tres: es código abierto bajo AGPL y se instala en tu propio servidor, así que no te atamos. Cuatro: precio fijo, sin sorpresas por consumo. Por eso nos compraría un cliente: menos oficio, menos riesgo y una cuenta que sabe cuánto va a pagar.

### 5 · Competencia — Eduardo · 18 s

> Frente al mercado: Render y Heroku cobran siete dólares por cada servicio; Railway parte de cinco más consumo; Fly.io y DigitalOcean cobran por cada máquina o contenedor. Con Deploya Starter pagas cinco dólares fijos por tres proyectos: alrededor de un dólar con sesenta y siete por app, con detección de stack, reversión y la opción de llevártelo a tu servidor.

### 6 · Planes y por qué son rentables — Javier · 25 s

> Cuatro planes. Sandbox, gratis y sin vencimiento, para probar sin tarjeta. Starter, cinco dólares cada 30 días; Pro, quince; Business, cuarenta; el plan de 365 días cuesta diez meses: dos gratis. Una app empacada en EC2 nos cuesta cerca de un dólar con veinticinco al mes; con la comisión de cobro, el margen va de 53 por ciento en Starter a 64 en Business. Con unos 58 registrados, 17 de pago, cubrimos el costo fijo. Renovar es un clic: la vigencia nueva se suma al final de la actual.

## B. Transición a la demo (0:10)

### 7 · Demo en vivo — Derek · 10 s

> Ahora, en vivo y en el ambiente desplegado. Ponemos el despliegue al centro: mientras se construye, Eddy registra una cuenta y Javier le cobra. Si algo falla tenemos video y un segundo ambiente.

Se cambia a la ventana 1 (web con `cliente@`). La diapositiva 7 queda lista para volver al cierre.

## Demo en vivo (4:00)

Regla: quien no habla, prepara su ventana. Nadie espera en silencio a que termine la construcción: el registro y el pago llenan ese tiempo.

### 0:00–0:20 · Eduardo · lanzar el despliegue

*Hace:* con `cliente@`, **Nuevo proyecto** → `https://github.com/derekCmorales/hola-deploya`, rama `sin-dockerfile`, nombre del proyecto nuevo → Continuar → Revisar → **Desplegar**.

> Esta es la cuenta de un cliente con plan Starter. Pego un repositorio público de GitHub, elijo la rama sin-dockerfile y Deploya me dice: «Stack detectado: Node.js 22». No escribí ni una línea de Docker. Desplegar. Mientras se construye, Eddy crea una cuenta desde cero.

### 0:20–1:00 · Eddy · registro, correo real y sesión

*Hace:* ventana privada → `/registro` con el correo nuevo y una contraseña fuerte → abre la bandeja → «Confirma tu correo» → clic → **Iniciar sesión**.

> Me registro con un correo real. La contraseña pide doce caracteres, mayúsculas, número y símbolo, y la API la guarda con scrypt, nunca en claro. Llega el correo de verificación: el enlace es de un solo uso y vale 24 horas. Lo abro, la cuenta queda activa e inicio sesión. La sesión va en una cookie HttpOnly que vence a los siete días sin actividad, y si alguien prueba contraseñas, a los cinco fallos en quince minutos lo bloqueamos. La cuenta arranca en Sandbox, sin tarjeta.

### 1:00–1:40 · Javier · contratar y pagar

*Hace:* en la misma ventana (cuenta nueva) → **Planes** → Starter 30 días → tarjeta `4242 4242 4242 4242` → Pagar → abre el comprobante PDF → **Mi suscripción** → **Historial de pagos** → señala **Renovar**.

> Con esa cuenta nueva voy a Planes y elijo Starter por 30 días. Pago con la tarjeta de prueba: la pasarela es simulada, pero está detrás de un puerto, así que conectar una real como Recurrente es un adaptador nuevo. Aprobado: aquí está el comprobante en PDF. En Mi suscripción ya tengo la vigencia, el consumo del período y el historial. Para renovar es este botón: la vigencia nueva se suma al final de la actual, sin perder días.

### 1:40–2:50 · Derek · el motor

*Hace:* vuelve a la ventana 1 → el despliegue del proyecto nuevo → muestra el riel de cinco etapas y la bitácora → **Saludable** → **Visitar** (candado) → abre el proyecto `hola-deploya` precargado → **Despliegues** → fila #1 → **Revertir** → confirmar.

> Volvamos al despliegue de Eduardo. Pasó por las cinco etapas: recepción clona el repo, construcción arma la imagen con la receta de Node, ejecución la corre con los límites del plan, medio vCPU y 512 megas, sin privilegios; enrutamiento la publica y operación verifica su salud. Saludable. Abro la URL: subdominio propio y candado, con certificado comodín. Ahora lo que nadie más hace a este precio: en este proyecto con tres versiones, revierto a la número uno. Fíjense en la bitácora: «imagen reutilizada, sin reconstruir». Un par de segundos, y la versión anterior siguió atendiendo hasta que la nueva pasó la salud.

### 2:50–3:30 · Javier · administración

*Hace:* ventana de `admin@` → **Administración** → busca `cliente@` → **Suspender cuenta** con motivo → recarga la URL de la app (no responde) → **Reactivar cuenta** → la URL vuelve.

> Del otro lado está el administrador. Busco al cliente y suspendo su cuenta con un motivo. La app deja de responder, sus sesiones se cierran y queda registrada la acción, pero sus datos se conservan. Lo reactivo, y en unos segundos el contenedor vuelve y la URL responde otra vez. Todo esto lo decide el backend: un cliente que llame a esta ruta recibe 403.

### 3:30–4:00 · Eduardo · métricas y cierre de la demo

*Hace:* pestaña **Métricas** y **Resumen · Últimas 24 h** del proyecto con datos precargados (ver nota de sesión en [discrepancias](#discrepancias-con-el-repositorio)).

> Para terminar, operación: estas son las métricas reales de CPU y memoria de las últimas 24 horas, con usuarios y tráfico simulados, y una marca por cada despliegue. El cliente ve qué versión cambió su consumo antes de que se convierta en un problema. Eso es Deploya, de punta a punta.

Se vuelve al deck, diapositiva 8.

## C. Cierre (0:20)

### 8 · Probado, documentado y abierto — Eddy · 15 s, Derek · 5 s

> **Eddy:** Todo lo que vieron está probado: mil ciento una pruebas en la API, doscientas ochenta y dos en la web y veintitrés en los scripts, con 96.9 por ciento de líneas cubiertas. El recorrido completo corre en cada PR, y cada historia pasó por OpenSpec, revisión y CI.
>
> **Derek:** La documentación completa está en este QR. Gracias; ahora, sus preguntas.

## Extensiones opcionales

Solo para el ensayo largo o si la terna da más tiempo (+ ~1:30 en total).

- **2 · Problema (Derek, +15 s):** «Lo vimos nosotros mismos: en el curso cada equipo perdió días peleando con certificados y puertos antes de mostrar una sola pantalla.»
- **4 · Propuesta (Eddy, +20 s):** «La reversión es posible porque cada construcción deja una imagen inmutable; guardamos las últimas cinco por proyecto y volver a una no gasta construcciones de tu plan.»
- **5 · Competencia (Eduardo, +15 s):** «Y la diferencia que no está en la tabla: si mañana Deploya no te sirve, instalas el mismo producto en tu servidor con un script.»
- **6 · Planes (Javier, +25 s):** «El ciclo es explícito: a siete días del vencimiento la suscripción pasa a Por vencer y te avisamos por correo; vencida tienes cinco días de gracia sin nuevos despliegues; después se suspende y los contenedores se detienen; renovar la reactiva.»
- **8 · Cierre (Derek, +15 s):** «Diez ADR documentan cada decisión grande, y la arquitectura está lista para escalar en AWS cambiando solo adaptadores.»

## Plan B

| Si falla | Entonces | Quién |
|---|---|---|
| El ambiente desplegado no responde | Video de respaldo desde el minuto de la parte que falló; si hay red, compose local con los mismos datos | Derek |
| El correo tarda más de 15 s | Eddy sigue con una cuenta ya verificada y muestra el correo al final | Eddy |
| GitHub limita la API en el paso 1 | Usar el proyecto ya creado y solo **Desplegar** | Eduardo |
| La construcción tarda | Derek abre un despliegue Saludable anterior mientras termina | Derek |
| El pago falla | Mostrar el historial con un pago aprobado anterior | Javier |
| La reactivación tarda | Seguir con métricas; volver a la URL al final | Javier |

Frase puente si algo falla: «Esto es en vivo; mientras se recupera, se los muestro en el respaldo.» Nunca depurar frente a la terna.

---

## D. Defensa: las 10 preguntas más probables

Cada respuesta cabe en 30–40 s. Si la terna elige a otra persona, esa persona responde con la diapositiva del apéndice abierta (diapositiva 9 = índice).

### 1. ¿Cómo escala? — Derek · diapositiva 17

> Hoy es un nodo; la fase de escala está en el ADR 0010, propuesto. Cloudflare y un balanceador de red delante de Traefik en ECS; las apps de clientes en ECS sobre EC2 con autoescalado, la mitad en Spot; API, web y trabajadores en ECS con RDS y ElastiCache, y N trabajadores sobre la misma cola BullMQ. Las construcciones pasan a Fargate Spot y publican en ECR; revertir es apuntar al tag anterior. Lo clave es que solo escribimos adaptadores nuevos, por ejemplo un `ContenedorEcs` para `ContenedorPuerto`, y se eligen en `apps/api/src/adapters/adapters.module.ts`; los servicios y sus pruebas no cambian. No usamos Kubernetes: EKS cuesta unos 73 dólares al mes solo de plano de control y un equipo de cuatro no lo opera.

### 2. ¿Cuánto cuesta operarlo y cómo es rentable? — Javier · diapositivas 18 y 19

> Una app empacada en una EC2 cuesta entre 1.17 y 1.25 dólares al mes: una t3.large da unos 7.3 GB útiles para unas 57 apps de 128 MB. Con la comisión de cobro, el margen por cliente es de 2.63 dólares en Starter, 9.06 en Pro y 25.44 en Business, entre 53 y 64 por ciento. Por cada cien registrados, con 70 en Sandbox, ingresamos 300 dólares y contribuyen unos 158; con 91 de costo fijo el equilibrio está en unos 58 registrados, 17 de pago. No corremos apps en Fargate porque cobra lo reservado: un Starter costaría unos 18 dólares por proyecto, un Pro 36 y un Business 72. Fargate sí para construir: una décima de centavo por construcción. Riesgo honesto: si un cliente llena todos sus cupos de memoria pierde margen; lo contienen los límites duros que ya existen, y proponemos dormir apps Sandbox inactivas y uso justo.

### 3. ¿Qué amenazas consideraron y cómo las mitigan? — Eddy · diapositivas 14 y 15

> La mayor es que corremos código de desconocidos. Cada contenedor arranca con `Privileged: false`, `CapDrop: ALL`, `no-new-privileges`, red propia por proyecto y la CPU y memoria del plan, en `apps/api/src/adapters/reales/contenedor-docker.ts`; la construcción se corta a los 10 minutos y solo el trabajador toca `docker.sock`. Para cuentas: contraseñas con scrypt, cookie HttpOnly, SameSite Lax y Secure, token guardado como hash, 5 fallos en 15 minutos dan 429, y respuestas neutras para no revelar si un correo existe. Secretos fuera del repo con gitleaks en CI, y cabeceras como X-Frame-Options y nosniff. Pendiente conocido: el límite de intentos vive en memoria y un reinicio lo pone en cero.

### 4. ¿Por qué un monolito modular y no microservicios? — Derek · diapositiva 11

> Por los atributos de calidad que más pesan para cuatro personas. Mantenibilidad: fronteras por módulo con puertos, un repo y un build. Testabilidad: 1 101 pruebas de la API con dobles en memoria, sin Docker, red ni base. Costo: todo el piloto cuesta menos que el plano de control de EKS. Operabilidad: `docker compose up` y un despliegue. La alternativa descartada, microservicios en Kubernetes, nos daría escalado por servicio que hoy no necesitamos a cambio de contratos de red, trazas distribuidas y un clúster que operar. No renunciamos a escalar: la API y el trabajador ya son procesos distintos con la misma imagen (ADR 0002).

### 5. Muéstrenme SOLID y dos patrones en el código — Javier (SOLID) y Eduardo (patrones) · diapositivas 12 y 13

> **Javier:** Responsabilidad única: `apps/api/src/modules/identidad/dominio/politica-contrasena.ts` solo decide si una contraseña cumple, y la reutilizan registro, recuperación y Seguridad. Abierto/cerrado: `construccion/deteccion/recetas-stack.ts` es una lista de `RecetaStack`; un stack nuevo es una clase más, sin `if`. Liskov: `PasarelaSimulada` cumple `PasarelaPago`, y en pruebas `ContenedorStub` sustituye a `ContenedorDocker`. Inversión de dependencias: `OrquestacionService` recibe `ContenedorPuerto` por constructor (`orquestacion/puertos/contenedor.puerto.ts`).
>
> **Eduardo:** Strategy: cada `RecetaStack` sabe reconocer y construir su stack, y el detector las prueba en orden con el Dockerfile propio primero. Observer: al terminar un despliegue, el pipeline avisa a los `OyenteDespliegue` (`construccion/puertos/oyente-despliegue.puerto.ts`): `AvisoDespliegueOyente` manda el correo y `RetencionArtefactos` conserva las últimas cinco imágenes, sin que el motor conozca a notificaciones. También usamos Adapter, State (`construccion/dominio/estados.ts`, `suscripciones/dominio/politica-ciclo.ts`) y Factory (`AdaptersModule.paraApi()` y `paraTrabajador()`).

### 6. ¿Qué pasa si se cae el servidor? — Derek · diapositiva 16

> Los servicios y las apps tienen `restart: unless-stopped` en `docker-compose.vps.yml`, así que vuelven solos al reiniciar. Si un despliegue falla, la versión anterior sigue sirviendo, porque conmutamos solo cuando la nueva pasa la salud. Tenemos respaldo diario con siete días de retención y la restauración está probada (`scripts/respaldar.sh`). Lo honesto: hoy es un único nodo y eso es un punto único de falla; la fase de escala lo elimina con varias instancias detrás del balanceador y la base en RDS. Para la demo, el plan B es video y un segundo ambiente local.

### 7. ¿Por qué me compraría un cliente? — Eddy (o quien elija la terna) · diapositivas 4 y 5

> Por tres razones que puede medir. Tiempo: pega una URL y tiene HTTPS, aunque su repo no tenga Dockerfile. Riesgo: si una versión sale mal, vuelve a la anterior en segundos y sin gastar construcciones. Dinero: cinco dólares fijos por tres proyectos, cuando otros cobran siete por cada uno, y sin factura variable. Y si un día nos deja, se lleva el mismo producto a su servidor porque es código abierto.

### 8. ¿Cómo renueva un cliente? — Javier · diapositiva 6

> En Mi suscripción, con «Renovar ahora»: paga y la vigencia nueva se suma al final de la actual, así no pierde días por renovar antes. El ciclo es automático en una tarea diaria: a siete días del vencimiento pasa a Por vencer y recibe un correo; al vencer tiene cinco días de gracia en los que no puede desplegar; luego se suspende y se detienen sus contenedores; a los 30 días suspendida se cancela. Si renueva una suspendida, se reactiva y sus apps vuelven. La renovación automática está fuera de alcance a propósito: el cobro es simulado.

### 9. ¿Cómo validan las entradas? — Eduardo (web) y Eddy (API)

> **Eduardo:** La web guía al usuario, por ejemplo muestra las reglas de contraseña mientras escribe, pero no decide nada.
>
> **Eddy:** Decide la API. Cada controlador lee el cuerpo con funciones como `textoDe` (`identidad/cuerpo-solicitud.ts`), que responde 400 si falta un campo; el dominio valida lo demás con errores con nombre: `validarAltaProyecto` en `proyectos/dominio/alta-proyecto.ts` revisa nombre, variables y que el puerto sea un entero en rango, y `PoliticaContrasena` aplica las reglas de la contraseña. Nunca confiamos en el navegador.

### 10. ¿Dónde viven los secretos? — Derek

> Nunca en el repositorio. Los del servidor, como la clave SMTP de Resend, el token de Cloudflare para el DNS-01 y `CLAVE_CIFRADO_VARIABLES`, viven en `.env.vps`, que solo existe en el servidor; gitleaks corre en cada PR para atrapar una fuga. Las variables de entorno de los clientes se guardan cifradas con AES-256-GCM (`proyectos/adaptadores/cifrador-aes-gcm.ts`) y no se devuelven en claro sin pedirlas. De los pagos solo guardamos los últimos cuatro dígitos. En la fase de escala esos secretos pasarían a un gestor de secretos de AWS con otro adaptador.

---

## Datos marcados «aprox., verificar»

- Precios de la competencia (Render, Heroku, Railway, Fly.io, DigitalOcean): públicos, sin fuente en el repositorio.
- Mercado: «> 105 mil desarrolladores en Guatemala» (GitHub Innovation Graph 2023) y «LatAm entre las regiones que más crecen» (Octoverse 2024).
- Costos de AWS en us-east-1: EC2 t3.large ~$67/mes y ~$16 la semana de la demo; costo por app $1.17–1.25; Fargate 24/7 por proyecto (~$18 / ~$36 / ~$72, con la memoria mínima que Fargate exige por vCPU: 0.5 vCPU → 1 GB, 1 → 2 GB, 2 → 4 GB); construcción en Fargate Spot ~$0.0015; EKS ~$73/mes.
- Márgenes por plan, mezcla de 100 registrados, contribución ~$158, costo fijo ~$91, equilibrio ~58 registrados y el peor caso (~$13.8/mes por un Starter con 3 apps de 512 MB, calculado como $67 ÷ 7.3 GB × 1.5 GB).
- Comisión de Recurrente (~4.5 % + ~Q2).
- ADR 0010 (escala en AWS): **propuesto**; ADR 0009 (piloto EC2 t3.large con Terraform): aceptado. Los nombres de adaptadores (`ContenedorEcs`, construcción en Fargate) son tentativos.

## Discrepancias con el repositorio

- **Revertir a #1 en un proyecto recién creado no es posible**: la primera construcción es la #1 y no hay versión anterior. Por eso la demo crea un proyecto **nuevo** (rama `sin-dockerfile`) y revierte en `hola-deploya`, el precargado con #1–#3 ([lanzamiento.md §3](lanzamiento.md#3-datos-de-la-demo-l3)). El proyecto nuevo necesita **otro nombre** (el subdominio sale del nombre y `hola-deploya` ya existe en `cliente@`). Starter permite 3 proyectos: alcanza.
- **Suspender a `cliente@` revoca sus sesiones** (`administracion/suspension.service.ts`): a las 3:30 Eduardo ya no tiene sesión. Opciones: volver a iniciar sesión tras reactivar (≈ 5 s con el gestor de contraseñas) o mostrar las métricas con `demo@` en otra ventana.
- **Las métricas son de CPU y memoria**, no de peticiones (el sprint excluyó transferencia y peticiones, [alcance.md](../alcance.md#sprint-fuera-de-alcance)); el tráfico simulado se ve como consumo, no como un contador de visitas.
- **La sesión no dura 24 h**: vence a los 7 días sin actividad (`identidad/dominio/sesion.ts`). Las 24 h son del enlace de verificación; la recuperación dura 30 min.
- **«VPS» en el repositorio** es el nombre del compose de producción (`docker-compose.vps.yml`, `.env.vps`); el piloto es la EC2 t3.large de AWS creada con Terraform (`infra/terraform/`, ADR 0009).
- **Correo real con Resend**: en [lanzamiento.md](lanzamiento.md) el paso L2 (SPF, DKIM y DMARC) figura pendiente al 8 de noviembre; confirmar en el servidor antes de decirlo.
- **Changes archivados**: `openspec/changes/archive/` tiene 45 entradas; [guion-demo.md](guion-demo.md) dice «42+». El deck no da la cifra.
