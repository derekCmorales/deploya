# Design

## Context

Reutiliza lo del Avance 1: `TokenCuenta` (tipo `recuperacion`), `GeneradorToken` (token y huella), `HashContrasena` (scrypt), `PoliticaContrasena`, `RepositorioSesiones`, `CorreoPuerto` y `Reloj`. La recuperación es un caso de uso aparte del registro y del login: va en su propio servicio.

**Orden de archivo:** el delta de `notificaciones` parte del texto de `feat/m10-correo-verificacion`; se archiva después.

## Goals / Non-Goals

**Goals:** respuesta neutra, token de 30 minutos y un uso, cerrar las demás sesiones, correo con enlace en texto plano.

**Non-Goals:** rate limit por IP, recuperar cuentas no activas, cambio de contraseña con sesión (ver proposal).

## Decisions

1. **Respuesta neutra sin canal lateral.** El controlador responde 202 con el mismo cuerpo en todos los casos. El servicio no lanza error si el correo no existe; solo retorna. Un fallo de envío (`CorreoNoEnviado`) se registra y **no** cambia la respuesta.
2. **Un solo token vivo.** Antes de crear uno nuevo, `RepositorioTokensCuenta.invalidarVigentes(usuarioId, "recuperacion", ahora)` marca como usados los anteriores. Así un enlace viejo deja de servir en cuanto se pide otro.
3. **Restablecer en una sola operación del servicio:** validar política → buscar por huella → comprobar `expira > ahora` y `usadoEn = null` con `Reloj` → `cambiarHash` → `marcarUsado` → `revocarTodasDe`. La web vuelve a `/ingresar` con el aviso «Contraseña actualizada».
4. **Constante con nombre:** `VIGENCIA_RECUPERACION_MS = 30 * 60 * 1000` junto a la de verificación (24 h).
5. **Controlador aparte** (`RecuperacionController`, `identidad/recuperacion`), con el mismo `ErroresIdentidadFilter`; la confirmación se compara en el borde, como en el registro.
6. **Restablecer exige una cuenta Activa**: si se suspendió después de pedir el enlace, responde el mismo 410 `TokenNoValido` y la contraseña no cambia.
7. **Layout:** patrón A (acceso partido) de `docs/diseno/guia-construccion.md`, como 01 y 03; las tarjetas de estado del artboard viven en la columna del formulario, como 01b.
8. **El paso 2 no muestra «Para <correo>»** del artboard: exigiría un endpoint que diga a quién pertenece un token, y eso revela datos a quien tenga un enlace viejo. La web vuelve a `/ingresar?restablecida=1` y ahí se ve «Contraseña actualizada».

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `RecuperacionService` | Service Layer | S | Un caso de uso; `IdentidadService` (registro) y `SesionService` (login) no crecen |
| `RepositorioTokensCuenta`, `RepositorioUsuarios`, `RepositorioSesiones` | Repository | D, I | Un método nuevo por necesidad (`invalidarVigentes`, `cambiarHash`, `revocarTodasDe`), con adaptador Prisma y memoria |
| `PlantillaRecuperacion` | Template Method (misma base que `PlantillaVerificacion`) | O | Un correo nuevo es una plantilla nueva, sin `if` en el adaptador SMTP |
| `CorreoPuerto` | Adapter | D | El servicio no sabe si sale por Mailpit, consola o el proveedor del VPS |
| `Reloj` | — | D | Vencimiento probable con reloj falso |

Cambios para `clases-unificado.mmd`: `RecuperacionService`; métodos nuevos de los tres repositorios; `PlantillaRecuperacion`.

## Risks / Trade-offs

- **Enumeración por tiempo de respuesta:** con correo existente se hace más trabajo. Mitigación barata: el envío no se espera (`void` + registro del error); el resto es del orden de milisegundos.
- **Revocar sesiones** incluye la del dispositivo que restablece: es lo que pide la ficha 04 («cierra tus otras sesiones») y el usuario no tiene sesión en ese momento.

## Open Questions

- ¿Avisar por correo «tu contraseña cambió»? Propuesta: no en el núcleo (queda en *Fuera de alcance* de M10).
