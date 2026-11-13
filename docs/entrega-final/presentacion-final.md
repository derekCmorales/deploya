# Guion y transcripción del equipo

> Versión del 13 de noviembre de 2026. Sin diapositivas: el pitch se hace sobre la landing y la demo sobre la app. El dossier impreso para la terna (4 páginas) y esta transcripción están en Claude Design; la documentación técnica, en [docs/sitio/](../sitio/README.md).

Solo para nosotros: no se entrega a la terna. Es la transcripción completa de lo que dice cada uno; léanla en voz alta dos veces y después díganla con sus palabras, respetando los tiempos. Meta: pitch en 1:40 y demo en 3:50, es decir 5:30, con 30 s de colchón antes de los 4 minutos de defensa. Ritmo: unas 150 palabras por minuto.

| Bloque | Quién | Empieza | Dura | Pantalla |
|---|---|---|---|---|
| Problema y cliente | Eduardo | 0:00 | 0:30 | Landing, portada |
| Producto y código abierto | Eddy | 0:30 | 0:30 | Landing, funciones |
| Planes y negocio | Javier | 1:00 | 0:30 | Landing, precios |
| Nimbo y transición | Derek | 1:30 | 0:10 | Landing → app |
| Lanzar el despliegue | Derek | 1:40 | 0:20 | 1 · cliente@ |
| Registro y sesión | Eddy | 2:00 | 0:40 | 2 · ventana privada y correo |
| Contratar y pagar | Javier | 2:40 | 0:40 | 2 · la cuenta recién creada |
| Cinco etapas y la app | Derek | 3:20 | 0:45 | 1 · cliente@ |
| Nimbo por dentro | Eduardo | 4:05 | 0:45 | 3 · cuenta de Nimbo |
| Administración y cierre | Javier | 4:50 | 0:40 | 4 · admin@ |
| Defensa | quien elija la terna | 5:30 | 4:00 | El dossier impreso |

## Antes de empezar (30 minutos antes)

- `https://api.deploya.larasolutions.dev/health` responde 200; la landing, la app y `docs.deploya.larasolutions.dev` cargan.
- Los 4 proyectos de Nimbo en Saludable y nada pesado construyéndose. Una construcción previa del repo del juego deja las capas en caché.
- Ventanas: (0) landing; (1) app con `cliente@`; (2) ventana privada en `/registro` y la bandeja del correo nuevo; (3) cuenta de Nimbo con sesión; (4) ventana privada con `admin@`; (5) video de respaldo en el segundo 0.
- Correo nuevo para el registro y tarjeta de prueba `4242 4242 4242 4242`, 12/29, 123. Contraseñas solo en el chat del equipo.
- Precios: si la app aún muestra 5 / 15 / 40, Javier lo dice: «la app del piloto aún cobra la tarifa anterior; esta es la de lanzamiento».
- Cuatro dossiers impresos (tres para la terna y uno de reserva). Cronómetro visible; quien no habla hace la seña a los 30 s de cada cambio.

## A. Transcripción completa, en orden

### Eduardo · 0:00 a 0:30 · el problema y el cliente

*En la portada de la landing. Baja despacio hasta el problema.*

> Buenas tardes, somos Deploya. Hoy, publicar una aplicación exige cuatro oficios: escribir un Dockerfile, rentar y asegurar un servidor, configurar el DNS y renovar certificados. Lo vivimos en este mismo curso: cada equipo perdió días con puertos y certificados antes de mostrar su primera pantalla. Nuestro cliente es el estudiante, el freelancer y la pyme de Latinoamérica que paga en dólares con presupuesto fijo. Solo en Guatemala hay más de cien mil desarrolladores en GitHub.

### Eddy · 0:30 a 1:00 · el producto y el código abierto

*Sección de funciones de la landing.*

> Deploya lo resuelve en un paso: pegas la URL de tu repositorio y en minutos tu app está en línea con HTTPS. No necesitas Dockerfile: reconocemos Node, Python, Go o un sitio estático. Con un clic agregas PostgreSQL con pgvector, Redis o almacenamiento S3, y la conexión llega sola. Si una versión falla, vuelves a la anterior en segundos. Y algo que nadie ofrece a este precio: Deploya es código abierto. El mismo producto se instala en tu servidor con un script; si un día te vas, te lo llevas.

### Javier · 1:00 a 1:30 · planes y monetización

*Sección de precios de la landing. Señala cada plan al nombrarlo.*

> Cobramos por suscripción de treinta o trescientos sesenta y cinco días; la anual regala dos meses. Sandbox es gratis. Starter cuesta seis dólares por tres apps; Pro, diecinueve, con Postgres y Redis; Business, cuarenta y nueve, con S3. Las bases se cobran aparte porque un Postgres ocupa tanta memoria como una app: así Starter deja treinta y ocho por ciento de margen hoy y sesenta al escalar. Tres apps con su base te cuestan once dólares; en Heroku o Render, veintiséis. Y renovar suma los días al final, sin perder ninguno.

### Derek · 1:30 a 1:40 · la prueba y la transición

*Cambia a la ventana 1.*

> Y no es teoría: Nimbo, un sistema de doce servicios de un compañero, corre completo en Deploya. Vamos a verlo en vivo.

### Derek · 1:40 a 2:00 · lanzar el despliegue

*Ventana 1, `cliente@`: Nuevo proyecto → URL del repo del juego, rama sin Dockerfile → un nombre que no exista → Continuar → Revisar → Desplegar.*

> Esta es la cuenta de un cliente. Pego un repositorio público que no tiene Dockerfile, y Deploya me dice: stack detectado, Node. Desplegar. Mientras se construye, Eddy va a crear una cuenta desde cero.

### Eddy · 2:00 a 2:40 · registro, correo y sesión

*Ventana 2: registro con el correo nuevo y una contraseña fuerte → bandeja → «Confirma tu correo» → clic → Iniciar sesión.*

> Me registro con un correo real. La contraseña pide doce caracteres con mayúscula, número y símbolo, y la API la guarda con scrypt, nunca en claro. Llega el correo: el enlace es de un solo uso y vale veinticuatro horas. La cuenta queda activa e inicio sesión. La sesión es una cookie HttpOnly que vence a los siete días sin uso, y cinco intentos fallidos en quince minutos bloquean a quien esté probando contraseñas.

### Javier · 2:40 a 3:20 · contratar, pagar y renovar

*Misma ventana: Planes → Starter 30 días → tarjeta de prueba → Pagar → abre el comprobante → Mi suscripción → Historial de pagos → señala Renovar.*

> Con esa cuenta nueva contrato Starter. La pasarela es simulada, pero vive detrás de un puerto: conectar Recurrente es escribir un adaptador, sin tocar el servicio. Aprobado, y aquí está el comprobante en PDF. En Mi suscripción veo la vigencia, el consumo, el historial de pagos y el botón Renovar, que suma los días al final de la vigencia actual.

### Derek · 3:20 a 4:05 · las cinco etapas

*Ventana 1: el despliegue → riel de cinco etapas y bitácora → Saludable → Visitar → juega tres segundos. Si va adelantado, revierte una versión en el proyecto precargado.*

> Volvemos al despliegue. Recepción clonó el repositorio; construcción armó la imagen con la receta de Node; ejecución la corre sin privilegios y con la memoria del plan; enrutamiento la publicó en su subdominio con certificado; y operación verificó su salud. Saludable. Y aquí está el juego, en su propia dirección y con candado. Si una versión nueva falla, la anterior sigue atendiendo: solo cambiamos cuando la nueva pasa la salud.

### Eduardo · 4:05 a 4:50 · Nimbo por dentro

*Ventana 3, cuenta de Nimbo: Inicio → Proyectos (los 4 en Saludable) → `nimbo-api` → pestaña Datos → Métricas → abre la web de Nimbo.*

> Esta es la cuenta de quien desplegó Nimbo: un sistema de doce servicios repartido en cuatro proyectos, api, worker, optimizer y web, todos saludables. En la pestaña Datos están su PostgreSQL con pgvector, su Redis y su almacenamiento S3, compartidos entre sus proyectos y sin puertos abiertos a internet; las variables de conexión las inyectó Deploya. Aquí está su consumo de CPU y memoria. Y esta es Nimbo, funcionando, sin que su dueño administre un solo servidor.

### Javier · 4:50 a 5:30 · administración y cierre

*Ventana 4, `admin@`: Administración → Usuarios → busca `demo@` → Suspender con motivo → Reactivar.*

> Del otro lado está el administrador. Veo las cuentas con su rol y su plan. Suspendo esta cuenta con un motivo: sus sesiones se cierran y sus apps se detienen, pero sus datos se conservan. La reactivo y vuelven. Todo esto lo decide el backend: si un cliente llama a esta ruta, recibe 403. Eso es Deploya. En el dossier tienen el QR de la documentación completa. Ahora, sus preguntas.

## B. Transcripción por integrante

*Lo mismo de arriba, reunido por persona, para que cada uno ensaye solo lo suyo.*

### Eduardo · abre el pitch y muestra Nimbo · 1:15 en total

**0:00 · Problema y cliente.** «Buenas tardes, somos Deploya. Hoy, publicar una aplicación exige cuatro oficios: escribir un Dockerfile, rentar y asegurar un servidor, configurar el DNS y renovar certificados. Lo vivimos en este mismo curso: cada equipo perdió días con puertos y certificados antes de mostrar su primera pantalla. Nuestro cliente es el estudiante, el freelancer y la pyme de Latinoamérica que paga en dólares con presupuesto fijo. Solo en Guatemala hay más de cien mil desarrolladores en GitHub.»

**4:05 · Nimbo por dentro.** «Esta es la cuenta de quien desplegó Nimbo: un sistema de doce servicios repartido en cuatro proyectos, api, worker, optimizer y web, todos saludables. En la pestaña Datos están su PostgreSQL con pgvector, su Redis y su almacenamiento S3, compartidos entre sus proyectos y sin puertos abiertos a internet; las variables de conexión las inyectó Deploya. Aquí está su consumo de CPU y memoria. Y esta es Nimbo, funcionando, sin que su dueño administre un solo servidor.»

*Para la defensa domina: patrones de diseño (Strategy y Observer), el design system v4.1 y la validación en la web.*

### Eddy · producto, código abierto y seguridad · 1:10 en total

**0:30 · Producto y código abierto.** «Deploya lo resuelve en un paso: pegas la URL de tu repositorio y en minutos tu app está en línea con HTTPS. No necesitas Dockerfile: reconocemos Node, Python, Go o un sitio estático. Con un clic agregas PostgreSQL con pgvector, Redis o almacenamiento S3, y la conexión llega sola. Si una versión falla, vuelves a la anterior en segundos. Y algo que nadie ofrece a este precio: Deploya es código abierto. El mismo producto se instala en tu servidor con un script; si un día te vas, te lo llevas.»

**2:00 · Registro, correo y sesión.** «Me registro con un correo real. La contraseña pide doce caracteres con mayúscula, número y símbolo, y la API la guarda con scrypt, nunca en claro. Llega el correo: el enlace es de un solo uso y vale veinticuatro horas. La cuenta queda activa e inicio sesión. La sesión es una cookie HttpOnly que vence a los siete días sin uso, y cinco intentos fallidos en quince minutos bloquean a quien esté probando contraseñas.»

*Para la defensa domina: amenazas y mitigaciones, validación de entradas, por qué código abierto y por qué nos compraría un cliente.*

### Javier · negocio, pagos y administración · 1:50 en total

**1:00 · Planes y monetización.** «Cobramos por suscripción de treinta o trescientos sesenta y cinco días; la anual regala dos meses. Sandbox es gratis. Starter cuesta seis dólares por tres apps; Pro, diecinueve, con Postgres y Redis; Business, cuarenta y nueve, con S3. Las bases se cobran aparte porque un Postgres ocupa tanta memoria como una app: así Starter deja treinta y ocho por ciento de margen hoy y sesenta al escalar. Tres apps con su base te cuestan once dólares; en Heroku o Render, veintiséis. Y renovar suma los días al final, sin perder ninguno.»

**2:40 · Contratar, pagar y renovar.** «Con esa cuenta nueva contrato Starter. La pasarela es simulada, pero vive detrás de un puerto: conectar Recurrente es escribir un adaptador, sin tocar el servicio. Aprobado, y aquí está el comprobante en PDF. En Mi suscripción veo la vigencia, el consumo, el historial de pagos y el botón Renovar, que suma los días al final de la vigencia actual.»

**4:50 · Administración y cierre.** «Del otro lado está el administrador. Veo las cuentas con su rol y su plan. Suspendo esta cuenta con un motivo: sus sesiones se cierran y sus apps se detienen, pero sus datos se conservan. La reactivo y vuelven. Todo esto lo decide el backend: si un cliente llama a esta ruta, recibe 403. Eso es Deploya. En el dossier tienen el QR de la documentación completa. Ahora, sus preguntas.»

*Para la defensa domina: costos y márgenes, por qué cambiaron los precios, renovación y ciclo de la suscripción, y SOLID con ejemplos.*

### Derek · el motor · 1:15 en total

**1:30 · Prueba y transición.** «Y no es teoría: Nimbo, un sistema de doce servicios de un compañero, corre completo en Deploya. Vamos a verlo en vivo.»

**1:40 · Lanzar el despliegue.** «Esta es la cuenta de un cliente. Pego un repositorio público que no tiene Dockerfile, y Deploya me dice: stack detectado, Node. Desplegar. Mientras se construye, Eddy va a crear una cuenta desde cero.»

**3:20 · Las cinco etapas.** «Volvemos al despliegue. Recepción clonó el repositorio; construcción armó la imagen con la receta de Node; ejecución la corre sin privilegios y con la memoria del plan; enrutamiento la publicó en su subdominio con certificado; y operación verificó su salud. Saludable. Y aquí está el juego, en su propia dirección y con candado. Si una versión nueva falla, la anterior sigue atendiendo: solo cambiamos cuando la nueva pasa la salud.»

*Para la defensa domina: el estilo de arquitectura frente a microservicios, AWS y la ruta de escala, qué pasa si se cae el servidor y cómo se aíslan las bases.*

## C. Si algo falla

Frase puente: «Esto es en vivo; mientras se recupera, se los muestro en el respaldo». Nunca depurar frente a la terna.

- La construcción no terminó a las 3:20: Derek abre un despliegue Saludable anterior y vuelve al final.
- El correo tarda más de 15 s: Eddy sigue con una cuenta ya verificada y muestra el correo al final.
- GitHub limita la API: se despliega un proyecto ya creado.
- El pago falla: Javier muestra el historial con un pago aprobado.
- El ambiente no responde: video de respaldo desde el bloque que falló y, si hay red, el segundo ambiente local.

## D. Defensa · respuestas de 30 a 40 segundos

*La terna elige quién responde: todos deben poder contestar todas. Entre paréntesis, quién la domina mejor y la página del dossier que la respalda.*

### ¿Por qué un monolito modular y no microservicios? (Derek · pág. 3)

> Por los atributos de calidad que más pesan para un equipo de cuatro: mantenibilidad, testabilidad, costo y operabilidad. Once módulos con fronteras y puertos, un repositorio y un build; mil doscientas cincuenta pruebas de la API corren sin Docker ni red. Descartamos microservicios en Kubernetes: solo el plano de control de EKS cuesta lo que todo nuestro piloto, y no necesitamos escalar por servicio. Aun así, la API y el worker ya son procesos separados.

### ¿Cómo funciona en AWS y cómo escala? (Derek · pág. 3)

> Cloudflare resuelve el DNS. La landing está en un bucket S3 privado detrás de CloudFront. La plataforma corre en una EC2 de ocho gigas creada con Terraform: Traefik con el certificado comodín, la web, la API, el worker, Postgres y Redis, con el disco cifrado y un snapshot diario. Para escalar, el ADR 0010 propone las apps en ECS sobre EC2, las construcciones en Fargate Spot y las bases en RDS. Solo escribimos adaptadores nuevos; los servicios y sus pruebas no cambian.

### ¿Qué amenazas consideraron? (Eddy · pág. 3)

> La mayor: corremos código de desconocidos. Cada contenedor arranca sin capacidades, sin poder escalar privilegios, en su propia red y con la memoria del plan; solo el worker habla con Docker. Para las cuentas: scrypt, cookie HttpOnly con expiración, bloqueo tras cinco fallos y respuestas que no revelan si un correo existe. El rol se valida en el backend. Los secretos viven fuera del repositorio, gitleaks los vigila en cada PR y las variables de los clientes se guardan cifradas.

### Muéstrenme SOLID y dos patrones (Javier y Eduardo · pág. 3)

> Responsabilidad única: la política de contraseña solo decide si una contraseña cumple, y la usan el registro, la recuperación y la cuenta. Abierto y cerrado: un stack o un tipo de base nuevo es una clase más, sin tocar el motor. Inversión de dependencias: el servicio de orquestación recibe el puerto de contenedores por constructor. Patrones: Strategy en las recetas de stack y en los tipos de base de datos; Observer en los oyentes del despliegue, que mandan el correo y guardan versiones sin que el motor los conozca.

### ¿Cómo ganan dinero y por qué cambiaron los precios? (Javier · pág. 2)

> Vendemos suscripciones prepagadas. Una app pequeña nos cuesta unos dos dólares al mes en el piloto y uno con veinticinco al escalar. Cuando incluimos Postgres, Redis y S3 en todos los planes, Starter quedó con margen negativo. Separamos los datos y ajustamos los planes: Starter deja treinta y ocho por ciento hoy y sesenta en escala, y con unos cuarenta y cinco registrados cubrimos el costo fijo.

### Si es código abierto, ¿qué les compran? (Eddy · pág. 1)

> Lo mismo que les compran a GitLab o a Supabase: no tener que operarlo. Nuestra nube resuelve servidores, certificados, respaldos y actualizaciones por seis dólares. El código abierto nos da confianza y adopción: quien lo prueba en su servidor y crece, se pasa a la nube. Y la licencia AGPL obliga a quien lo ofrezca como servicio a publicar sus cambios.

### ¿Qué pasa si se cae el servidor? ¿Dónde viven los datos de Nimbo? (Derek)

> Los contenedores se reinician solos y un despliegue fallido no tumba la versión anterior. Las bases viven en volúmenes del disco cifrado, con un snapshot diario que se guarda siete días: la pérdida máxima es de veinticuatro horas. Es un punto único de falla y lo decimos; la fase de escala lo elimina con RDS y varias instancias.

### ¿Cómo aíslan las bases de distintos clientes? (Derek)

> Cada base vive en la red privada del proyecto dueño, sin puertos publicados a internet. Solo se comparte con proyectos del mismo usuario, y la contraseña es aleatoria, de treinta y dos caracteres, guardada cifrada.

### ¿Por qué nos compraría un cliente? (Eddy · pág. 1 y 2)

> Por tiempo, riesgo y dinero: pega una URL y tiene HTTPS y base de datos; si algo sale mal, revierte en segundos; y paga once dólares por lo que en otros cuesta veintiséis. Además, no queda atado: es código abierto.

### ¿Cómo renueva un cliente? (Javier · pág. 2)

> En Mi suscripción, con Renovar: paga y la vigencia nueva se suma al final de la actual. Una tarea diaria lleva el ciclo: siete días antes pasa a Por vencer y recibe un correo; al vencer tiene cinco días de gracia sin desplegar; después se suspende y sus apps se detienen; renovar la reactiva.

### ¿Cómo validan las entradas? (Eduardo y Eddy)

> La web guía al usuario, por ejemplo con las reglas de contraseña mientras escribe, pero no decide nada. Decide la API: cada controlador valida el cuerpo y el dominio aplica sus reglas con errores con nombre. Nunca confiamos en el navegador.

### ¿Cómo diseñaron la interfaz? (Eduardo)

> Con un design system propio, el v4.1: tokens de color y tipografía, componentes compartidos y una ficha por pantalla. Un solo color para lo que está en curso, los estados siempre con palabra e icono, y modo claro y oscuro. Este dossier y la documentación están hechos con el mismo sistema.
