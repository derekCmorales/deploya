# 02 · Verifica tu correo

| | |
|---|---|
| Ruta | `/verificar?token=` |
| Dueño | Eddy |
| Historias | M1-02 · reenvío M1-04 |
| Entrega | A1 (reenvío con cuenta atrás: A2) |
| Diseño | Canvas Deploya v4.1, artboard `02-Verificar` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

(a) revisa tu bandeja con reenvío deshabilitado y cuenta atrás; (b) token válido → Iniciar sesión; (c) token expirado o usado → Reenviar correo.

## Componentes

- `AppShell` — header de 56px
- `Wordmark`
- `Button`
- `Card`
- `Sunken`

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
(a) Revisa tu bandeja
Revisa tu bandeja
Enviamos un enlace de verificación a
d•••k@t•••••••o.com
. Caduca en 24 horas.
¿No llegó? Revisa spam o promociones.
Reenviar correo ·
0:42
Podrás reenviarlo cuando termine la cuenta atrás.
(b) Token válido
Cuenta activada
Tu correo quedó verificado. Ya puedes iniciar sesión y crear tu primer proyecto.
Iniciar sesión
(c) Token expirado o inválido
El enlace ya no es válido
Caducó o ya se usó. Los enlaces de verificación duran 24 horas y sirven una sola vez.
Reenviar correo
Volver a iniciar sesión
```
