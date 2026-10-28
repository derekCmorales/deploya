# Manual de usuario

## Antes de empezar

### Qué es Deploya

Deploya publica tu aplicación web a partir de su repositorio de GitHub. Pegas la URL, Deploya la construye, la corre en un contenedor con los recursos de tu plan y te da una dirección propia con HTTPS: `https://<tu-proyecto>.deploya.app`. Cada versión queda guardada y puedes volver a una anterior en segundos.

Este manual sigue a **Lucía**, que tiene una tienda en línea, desde que crea su cuenta hasta que su aplicación está en línea y la opera. Al final hay un capítulo para el **administrador** de la plataforma.

> [!NOTE]
> Las imágenes son capturas reales de Deploya. En ellas la app aparece en `hola-deploya.localhost` porque se tomaron con la plataforma corriendo en local; en el servidor la dirección es `https://hola-deploya.deploya.app`.

### Lo que necesitas

| Necesitas | Detalle |
|---|---|
| Un navegador actualizado | Chrome, Edge, Firefox o Safari |
| Un correo al que tengas acceso | Para verificar tu cuenta y recibir avisos |
| Un repositorio **público** de GitHub | Con un `Dockerfile` en la raíz, o un proyecto Node, Python, Go o un sitio estático |
| Que tu app escuche HTTP | En el puerto que declara tu `Dockerfile` (`EXPOSE`), o en `PORT` (8080) si Deploya construye por ti |

### Cómo está organizado el panel

| Zona | Para qué |
|---|---|
| **Proyectos** | Tus aplicaciones, su estado y cada despliegue |
| **Suscripción** | Tu plan, consumo del mes, planes y pagos |
| **Cuenta** | Tu nombre, tu contraseña y tus sesiones |
| **Administración** e **Infraestructura** | Solo para administradores |
| Luna / sol (arriba a la derecha) | Cambia entre modo claro y oscuro |

Los estados siempre llevan palabra e icono: <span class="estado ok">Saludable</span> <span class="estado curso">Construyendo</span> <span class="estado warn">Por vencer</span> <span class="estado bad">Fallido</span>. El azul solo aparece en lo que está pasando ahora mismo.

## Crear tu cuenta

### Registrarte

1. Entra a Deploya y elige **Crear cuenta**.
2. Escribe tu correo y una contraseña. Mientras escribes, la lista de abajo marca qué reglas ya cumple.
3. Confirma la contraseña y pulsa **Crear cuenta**.

![Registro](capturas/01-registro-politica.png "Registro: la política de contraseña se revisa mientras escribes")

La contraseña debe tener **al menos 12 caracteres**, mayúsculas y minúsculas, un número y un símbolo.

![Registro listo para enviar](capturas/01-registro.png "Registro con una contraseña que cumple todas las reglas")

> [!TIP]
> Toda cuenta nueva empieza en el plan **Sandbox**: sin costo, sin tarjeta y sin vencimiento. Te alcanza para un proyecto.

### Verificar tu correo

Al crear la cuenta queda **Pendiente de verificación** y te enviamos un correo con un botón (y el enlace en texto, por si el botón no funciona).

![Cuenta creada](capturas/02-verifica-tu-correo.png "La cuenta queda pendiente hasta que abras el enlace del correo")

Abre el enlace y tu cuenta pasa a **Activa**.

![Cuenta activada](capturas/02b-correo-verificado.png "Al abrir el enlace, la cuenta queda activa")

| Si… | Qué pasa |
|---|---|
| No te llegó el correo | Revisa spam y pide otro desde la misma pantalla (puedes hacerlo cada 60 segundos) |
| El enlace venció | Vale **24 horas** y una sola vez. Pide otro: el anterior deja de servir |

## Iniciar sesión

Escribe tu correo y tu contraseña en **Iniciar sesión**.

![Iniciar sesión](capturas/03-iniciar-sesion.png "Inicio de sesión")

Si algo no coincide, Deploya no te dice cuál de los dos datos falló, para no revelar qué correos tienen cuenta.

![Credenciales incorrectas](capturas/03b-credenciales-incorrectas.png "Correo o contraseña incorrectos")

| Mensaje | Qué significa y qué hacer |
|---|---|
| Correo o contraseña incorrectos | Revisa ambos; si no recuerdas la contraseña, usa **Olvidé mi contraseña** |
| Cuenta sin verificar | Abre el enlace del correo o pide uno nuevo |
| Cuenta suspendida por administración | Un administrador la suspendió y te muestra el motivo. Escribe a soporte |
| Sesión expirada | Pasaron 7 días sin actividad: vuelve a iniciar sesión |

### Recuperar tu contraseña

1. En **Iniciar sesión**, elige **Olvidé mi contraseña**.
2. Escribe tu correo y envía.
3. Abre el enlace del correo y elige una contraseña nueva.

![Recuperar contraseña](capturas/04-recuperar.png "Pide el enlace con tu correo")

![Enlace enviado](capturas/04b-recuperar-enviado.png "La respuesta es la misma exista o no la cuenta")

> [!IMPORTANT]
> El enlace dura **30 minutos** y sirve una sola vez. Al cambiar la contraseña se **cierran todas tus sesiones** en todos los dispositivos. Si no pediste el correo, ignóralo: tu contraseña no cambia.

## Planes y pagos

### Ver los planes

En **Suscripción → Planes** comparas los cuatro planes. Alterna entre **30 días** y **365 días** para ver el precio de cada vigencia.

![Planes](capturas/06-planes.png "Los cuatro planes con sus recursos por proyecto")

| Plan | Precio | Proyectos | CPU / proyecto | Memoria / proyecto | Construcciones / mes |
|---|---|---|---|---|---|
| Sandbox | Sin costo | 1 | 0.25 vCPU | 256 MB | 30 |
| Starter | USD 5.00 / 30 días | 3 | 0.5 vCPU | 512 MB | 150 |
| Pro | USD 15.00 / 30 días | 10 | 1 vCPU | 1 GB | 500 |
| Business | USD 40.00 / 30 días | 25 | 2 vCPU | 2 GB | 2 000 |

### Contratar un plan

1. En el plan que quieres, pulsa **Contratar**.
2. Revisa el resumen: plan, vigencia, fechas y total.
3. Escribe los datos de la tarjeta y pulsa **Confirmar pago**.

![Contratar](capturas/07-contratar.png "Resumen del plan y datos de la tarjeta")

> [!NOTE]
> Los pagos son **simulados**: no se cobra dinero real. Usa estas tarjetas de prueba (las tienes como atajo debajo del formulario):
>
> - `4242 4242 4242 4242`: el pago se aprueba.
> - `4000 0000 0000 0002`: el pago se rechaza por fondos insuficientes.
> - `4000 0000 0000 3220`: la pasarela tarda 5 segundos y luego aprueba.

![Pago procesando](capturas/07b-pago-procesando.png "La pasarela está procesando: no cierres la ventana")

![Pago aprobado](capturas/07b-pago-aprobado.png "Pago aprobado: el plan queda activo de inmediato y recibes un comprobante")

Si el pago se rechaza, **tu plan no cambia** y puedes intentar con otra tarjeta.

![Pago rechazado](capturas/07b-pago-rechazado.png "Pago rechazado: no se aplica ningún cambio")

### Mi suscripción

En **Suscripción → Mi suscripción** ves tu plan, su estado, los días que quedan, el consumo del mes y el ritmo de tus construcciones.

![Mi suscripción](capturas/08-mi-suscripcion.png "Plan actual, vigencia, consumo del período, ritmo de construcciones y cambio de plan")

| Acción | Qué hace |
|---|---|
| **Renovar ahora** | Paga el plan actual y suma la vigencia al final de la que tienes |
| **Cambiar a un plan mayor** | Pagas el plan completo y arrancan 30 (o 365) días nuevos desde hoy |
| **Cambiar a un plan menor** | No se cobra: el cambio se aplica cuando termina tu vigencia actual |

#### El ciclo de tu suscripción

| Estado | Cuándo | Qué pasa con tus apps |
|---|---|---|
| <span class="estado ok">Activa</span> | Vigencia en curso | Todo funciona |
| <span class="estado warn">Por vencer</span> | Faltan 7 días o menos | Funciona; te avisamos por correo |
| <span class="estado warn">Vencida</span> | Pasó la fecha | Siguen en línea 5 días, pero no puedes desplegar ni crear proyectos |
| <span class="estado bad">Suspendida</span> | Terminaron los 5 días | Tus contenedores se detienen; tus datos se conservan |
| <span class="estado neutro">Cancelada</span> | 30 días suspendida | La suscripción se cierra |

Si renuevas una suscripción Vencida o Suspendida, vuelve a **Activa** y tus apps arrancan solas.

![Suscripción vencida](capturas/10c-suscripcion-vencida.png "Con la suscripción vencida, Proyectos avisa cuándo termina la gracia y bloquea los despliegues")

### Historial de pagos y comprobantes

En **Suscripción → Historial de pagos** ves cada intento de pago, aprobado o rechazado. Los aprobados tienen comprobante: ábrelo con **Ver comprobante** y descárgalo en PDF.

![Historial de pagos](capturas/09-historial-pagos.png "Historial con el comprobante abierto")

![Comprobante PDF](capturas/09c-comprobante-pdf.png "El comprobante PDF que descargas, con su número consecutivo")

## Crear tu primer proyecto

### La lista de proyectos

Sin proyectos, Deploya te muestra qué necesitas. Con proyectos, verás cada uno con el estado de su último despliegue y cuántos llevas frente al límite de tu plan.

![Primer proyecto](capturas/10b-primer-proyecto.png "La guía del primer proyecto")

### Paso 1 · Repositorio

1. Pulsa **Nuevo proyecto** (o **Crear primer proyecto**).
2. Pega la URL de tu repositorio de GitHub y escribe la rama.
3. Pulsa **Continuar**. Deploya revisa el repositorio, lee el último commit y busca cómo construirlo.

![Repositorio con Dockerfile](capturas/11a-repositorio.png "Repositorio accesible con Dockerfile: Deploya propone nombre, URL y puerto")

- El **nombre** define tu dirección: `hola-deploya` → `hola-deploya.deploya.app`. No cambia aunque después renombres el proyecto.
- El **puerto** sale del `EXPOSE` de tu `Dockerfile`. Puedes cambiarlo.

**¿Sin `Dockerfile`?** Si tu repositorio es Node (con un script `start`), Python (`requirements.txt` o `pyproject.toml` con `main.py` o `app.py`), Go (`go.mod`) o un sitio estático (`index.html`), Deploya lo reconoce y lo construye con su propia receta. Tu app debe escuchar en el puerto `PORT` (8080).

![Stack detectado](capturas/11a-stack-detectado.png "Sin Dockerfile: Deploya detecta Node.js 22 y construye con su receta")

| Error | Qué hacer |
|---|---|
| No pudimos acceder al repositorio | Revisa la URL y que el repositorio sea **público** |
| Falta el `Dockerfile` y no se reconoce el stack | Agrega un `Dockerfile` en la raíz (la pantalla trae un ejemplo) |
| La rama no existe | Elige una de las ramas que lista Deploya |
| GitHub no disponible | Es temporal: vuelve a intentar en unos minutos |
| Llegaste al límite de proyectos | Elimina uno o cambia a un plan mayor |

![Repositorio no accesible](capturas/11e-repositorio-no-accesible.png "Error claro con qué revisar y un botón para reintentar")

### Paso 2 · Variables de entorno

Agrega las claves que tu app necesita (contraseñas, *tokens*, configuración). Este paso es opcional.

![Variables](capturas/11c-variables.png "Las variables se guardan cifradas y se pasan al contenedor al arrancar")

- Las claves van en `MAYUSCULAS_Y_GUIONES_BAJOS`.
- No declares `PORT`: Deploya la pone con el puerto del paso anterior.
- Los valores se guardan **cifrados** y nunca aparecen en las bitácoras.

### Paso 3 · Revisar y desplegar

Revisa todo y pulsa **Desplegar**. Empieza el despliegue #1.

![Revisar](capturas/11d-revisar.png "Resumen antes de desplegar, con los recursos del plan y la URL final")

## Desplegar y seguir un despliegue

### Las cinco etapas

Cada despliegue pasa por cinco etapas. La pantalla las muestra con su duración y una bitácora que se actualiza cada 3 segundos.

| Etapa | Qué hace Deploya |
|---|---|
| **Recepción** | Clona tu rama, registra el commit y detecta cómo construir |
| **Construcción** | Construye la imagen con tu `Dockerfile` o con la receta (máximo 10 minutos) |
| **Ejecución** | Arranca el contenedor con la CPU y la memoria de tu plan y verifica que responda |
| **Enrutamiento** | Publica tu dirección con HTTPS; la versión anterior sigue sirviendo hasta este momento |
| **Operación** | El despliegue queda Saludable y es la versión activa |

![Despliegue en curso](capturas/12-despliegue-en-curso.png "La etapa en curso va en azul; la bitácora de construcción aparece en vivo")

Cuando termina, verás **Saludable**, la dirección pública, la imagen y la bitácora completa. Con **Copiar** te llevas la bitácora.

![Despliegue saludable](capturas/12b-despliegue-saludable.png "Despliegue saludable con la URL, la imagen y la bitácora completa")

> [!WARNING]
> Si un despliegue **falla**, la pantalla marca la etapa y la línea del error. **Tu versión anterior sigue en línea**: un fallo nunca tumba lo que ya funciona. Corrige y vuelve a desplegar, o usa **Reintentar**.

Mientras un despliegue está en Encolado o Construyendo puedes **cancelarlo**.

## Operar tu proyecto

Al abrir un proyecto ves seis pestañas.

### Resumen

Estado actual, URL pública, versión activa, imagen, recursos aplicados, el último despliegue paso a paso y el uso de las últimas 24 horas.

![Resumen](capturas/13-resumen.png "Resumen del proyecto con la versión activa y los recursos del plan")

Botones de arriba: **Visitar** abre tu app; **Reiniciar** la vuelve a arrancar sin reconstruir; **Detener** la apaga; **Desplegar** construye el último commit de tu rama.

### Despliegues y reversión

El historial lista cada versión con su commit, fecha, duración, estado e imagen. Arriba, la gráfica **Tiempo por etapa** muestra cuánto tarda cada etapa y la mediana.

![Despliegues](capturas/14-despliegues.png "Historial con el tiempo por etapa y la versión activa")

Por cada fila puedes:

| Acción | Qué hace | ¿Consume construcciones? |
|---|---|---|
| **Revertir** | Vuelve a esa versión **usando la imagen ya construida**. Tarda segundos | **No** |
| **Redesplegar** | Vuelve a construir ese commit desde cero | Sí |
| **Reintentar** (en un Fallido) | Repite el despliegue del mismo commit | Sí |

![Revertir](capturas/14b-revertir-dialogo.png "Revertir explica que no reconstruye ni gasta construcciones")

La reversión crea un despliegue nuevo en estado **Revirtiendo**, salta Recepción y Construcción y queda Saludable en segundos. Se conservan las **5 versiones más recientes** de cada proyecto para revertir.

![Reversión en curso](capturas/12d-reversion-en-curso.png "La reversión salta Recepción y Construcción")

### Métricas

CPU y memoria de tu contenedor en la última hora o en las últimas 24 h, frente al límite de tu plan. Desde el 80 % la gráfica marca la **zona de aviso**, y cada despliegue aparece como un evento. **Ver tabla** muestra los mismos datos en una tabla.

![Métricas](capturas/16-metricas.png "Memoria y CPU de 24 h frente al límite del plan")

### Bitácoras

La salida de tu aplicación en vivo (últimas 500 líneas), con filtro por nivel, búsqueda, pausa y descarga. Deploya no guarda estas líneas: las lee de tu contenedor.

![Bitácoras](capturas/15-bitacoras.png "Bitácora de ejecución con un aviso y un error resaltados")

### Variables

Agrega, edita o borra variables. **Mostrar** revela un valor solo a ti. Puedes **Guardar** (aplica en el próximo despliegue) o **Guardar y desplegar**.

![Variables del proyecto](capturas/17-variables.png "Variables enmascaradas; Mostrar revela un valor")

### Configuración y eliminación

Cambia el nombre, el repositorio, la rama, la ruta del `Dockerfile` o el puerto. Los cambios aplican en el **próximo despliegue**; guardar no despliega.

![Configuración](capturas/19-configuracion.png "Configuración del proyecto")

Para **eliminar** el proyecto, escribe su nombre y confirma. Se borran el contenedor, las imágenes, las variables y el historial, y se libera el cupo de tu plan.

![Eliminar](capturas/19b-eliminar-proyecto.png "Eliminar exige escribir el nombre del proyecto")

### La lista con varios proyectos

![Proyectos](capturas/10-proyectos.png "La lista muestra cada proyecto, su último despliegue y el cupo del plan")

## Tu cuenta

En **Cuenta** cambias tu nombre (hasta 64 caracteres). El correo y el rol se muestran pero no se editan.

![Mi cuenta](capturas/05-mi-cuenta.png "Perfil")

En **Cuenta → Seguridad** cambias tu contraseña (pide la actual; cierra tus otras sesiones) o cierras sesión **en todos los dispositivos**.

![Seguridad](capturas/05b-seguridad.png "Cambiar contraseña y cerrar todas las sesiones")

## Administración

Esta parte solo la ve una cuenta con rol **Administrador**.

### Usuarios

**Administración** lista todas las cuentas. Busca por correo, filtra por estado de suscripción y abre una cuenta para ver su suscripción, sus proyectos con su estado y sus pagos.

![Usuarios](capturas/25-admin-usuarios.png "Lista de usuarios con el detalle de una cuenta")

### Suspender y reactivar una cuenta

1. Abre la cuenta y pulsa **Suspender cuenta**.
2. Elige un **motivo** de la lista y escribe un **detalle** para el registro.
3. Confirma.

![Suspender](capturas/25b-suspender-cuenta.png "Suspender pide motivo y detalle")

La cuenta no podrá iniciar sesión, sus contenedores se detienen y sus datos se conservan. La acción queda registrada con quién, cuándo y por qué. No se puede suspender a otro administrador.

![Cuenta suspendida](capturas/25c-cuenta-suspendida.png "La cuenta queda suspendida y se ofrece reactivarla")

El usuario ve el motivo al intentar entrar:

![Inicio con cuenta suspendida](capturas/03b-cuenta-suspendida.png "Lo que ve el usuario suspendido")

Para deshacerlo, pulsa **Reactivar cuenta** y escribe un detalle. Sus contenedores vuelven a arrancar si su suscripción está vigente.

### Infraestructura

Vista de solo lectura del servidor: CPU, memoria y disco del nodo, la cola de construcción (en espera, en curso, fallidas en 24 h) y la última muestra de cada entorno.

![Infraestructura](capturas/27-admin-infraestructura.png "Estado del nodo, de la cola y de los entornos")

## Preguntas frecuentes

| Pregunta | Respuesta |
|---|---|
| ¿Me cobran dinero real? | No. Los pagos son simulados y el comprobante lo dice |
| ¿Mi app se cae si un despliegue falla? | No. La versión anterior sigue en línea hasta que una nueva pasa la verificación de salud |
| ¿Revertir gasta construcciones? | No. Redesplegar sí, porque vuelve a construir |
| ¿Cuántas versiones puedo revertir? | Las 5 más recientes de cada proyecto |
| ¿Puedo usar un repositorio privado? | No por ahora: solo repositorios públicos de GitHub |
| ¿Puedo usar mi propio dominio? | No por ahora: cada proyecto recibe `<nombre>.deploya.app` con HTTPS |
| ¿Qué pasa con mis datos si mi suscripción se suspende? | Se conservan. Al renovar, tus apps vuelven a arrancar |
| ¿Por qué mi app no pasa la salud? | Debe responder HTTP en el puerto configurado (o en `PORT`) dentro de 60 segundos |
| ¿Puedo instalar Deploya en mi servidor? | Sí: es de código abierto. Mira el capítulo *Modo autoalojado* del manual técnico |
