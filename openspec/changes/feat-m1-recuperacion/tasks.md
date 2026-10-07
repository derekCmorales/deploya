# Tasks

Cada tarea de código tiene su tarea de pruebas. Sin SMTP, base ni reloj reales. Nombre de cada `it(...)` = nombre del escenario.

## 1. Correo (M10-02)

- [x] 1.1 `PlantillaRecuperacion` (asunto, botón, enlace en texto plano, «caduca en 30 minutos y sirve una sola vez»); exportarla en `notificaciones/index.ts`
- [x] 1.2 Pruebas: «Correo de recuperación» (botón y enlace en texto plano, mismo kit visual que verificación)

## 2. Dominio y repositorios (M1-05)

- [x] 2.1 `VIGENCIA_RECUPERACION_MS`; `invalidarVigentes`, `cambiarHash`, `revocarTodasDe` en los puertos y en sus adaptadores Prisma y memoria
- [x] 2.2 Pruebas de los adaptadores en memoria y Prisma doble (los tres métodos)

## 3. Servicio y controlador

- [x] 3.1 `RecuperacionService.solicitar(correo)` y `restablecer(token, contrasena, confirmacion)`; rutas `POST /identidad/recuperacion` y `POST /identidad/recuperacion/restablecer`
- [x] 3.2 Pruebas: «Solicitud con correo registrado», «Solicitud con correo no registrado», «Token de recuperación vigente», «Token de recuperación vencido», «Token de recuperación usado», «Nueva solicitud invalida la anterior», «Contraseña débil al restablecer»; un fallo de `CorreoPuerto` no cambia la respuesta 202
- [x] 3.3 Prueba del controlador: 202 con el mismo cuerpo en ambos casos, 204 y 410

## 4. Web (pantalla 04)

- [x] 4.1 `/recuperar` (paso 1 y confirmación neutra) y `/restablecer?token=` (paso 2, `RequisitosContrasena`, estado de enlace inválido); «Olvidé mi contraseña» en 03 apunta a `/recuperar`; aviso «Contraseña actualizada» en `/ingresar`
- [x] 4.2 Pruebas `node --test`: validación del formulario y textos de la ficha; sin `fetch` directo ni colores de Tailwind
- [x] 4.3 Revisión contra el artboard `04-Recuperar` en claro y oscuro (sin la línea «Para <correo>» del paso 2: la API no expone el correo del token; ver design.md)

## 5. Cierre

- [x] 5.1 `clases-unificado.mmd` y `pnpm diagramas:sync`; `m1-actividad-recuperacion-contrasena.mmd` con el flujo real (sin auditoría)
- [x] 5.2 `pnpm check` en verde; cobertura ≥ 80 % en `identidad/` y `notificaciones/dominio`
- [x] 5.3 Demo en compose: pedir enlace → Mailpit → nueva contraseña → la sesión de otro navegador queda cerrada (Playwright con dos navegadores contra Postgres y Mailpit: la otra sesión pasa de 200 a 401, el enlace reusado muestra «Este enlace ya no sirve», la clave vieja da 401)
- [ ] 5.4 `/opsx-archive` después del merge
