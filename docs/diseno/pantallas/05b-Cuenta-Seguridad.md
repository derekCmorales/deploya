# 05b · Mi cuenta · Seguridad

| | |
|---|---|
| Ruta | `/cuenta/seguridad` |
| Dueño | Eddy |
| Historias | M1-07 |
| Entrega | A3 |
| Diseño | Canvas Deploya v4.1, artboard `05b-Cuenta-Seguridad` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Cambiar contraseña con la actual; cerrar sesión en todos los dispositivos.

**Sprint fuera de alcance:** «Último cambio: …» sale de `Usuario.contrasenaCambiadaEn`; si es nulo, «Nunca la has cambiado» (sprint fuera de alcance, SP-03).

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Field`
- `Input`
- `TabsNav` (rutas) o `Tabs`
- `Card`
- `Avatar`
- chip de plan (markup local, con `Badge`)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Cuenta
Mi cuenta
Derek Calderón · derek@tiendademo.com
Perfil
Seguridad
Contraseña
Al cambiarla cerramos tus sesiones en otros dispositivos.
Contraseña actual
••••••••••••••
Nueva contraseña
Mínimo 12 caracteres
Confirmar
Repite la nueva
Último cambio: 22 sep 2026
Cambiar contraseña
Sesiones
Si perdiste un dispositivo o dejaste tu cuenta abierta en otro lado.
Cerrar sesión en todos los dispositivos
Invalida todas tus sesiones, incluida esta. Tendrás que volver a iniciar sesión.
Cerrar todas
```

## Nota de implementación

«Último cambio: 22 sep 2026» va a la izquierda de «Cambiar contraseña», en el pie de la tarjeta (SP-03, change `feat-m1-ultimo-cambio-contrasena`). Sale de `contrasenaCambiadaEn` de `GET /identidad/cuenta`; si es nula, «Nunca la has cambiado». Se vuelve a leer después de cambiarla. Si la lectura falla, la línea no aparece y el formulario funciona igual.

Textos de los estados que no salen en el canvas (change `feat-m1-cuenta`):

```text
Estado · Contraseña cambiada
Contraseña actualizada
Cerramos tus sesiones en otros dispositivos; esta sigue abierta.
Estado · Confirmar «Cerrar todas» (diálogo)
Cerrar sesión en todos los dispositivos
Invalida todas tus sesiones, incluida esta. Tendrás que volver a iniciar sesión.
Cancelar
Cerrar todas
Errores del formulario
La contraseña actual no es correcta.
La nueva contraseña debe ser distinta de la actual.
Las contraseñas no coinciden.
```
