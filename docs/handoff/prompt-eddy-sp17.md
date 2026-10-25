# Prompt · Eddy · SP-17 Asistente de primera configuración

> **Cómo se usa:** copia el bloque como primer mensaje a tu agente dentro de `derekCmorales/deploya`, con `main` actualizado. Antes del bloque, pega «Lo común» de [prompt-sprint-fuera-de-alcance.md](prompt-sprint-fuera-de-alcance.md#lo-común-va-al-principio-de-cada-prompt). Las bases ya están en `main`: no las rehagas. Si algo del contrato no te cuadra, avisa a Derek antes de cambiarlo.

```text
Tu tarea: SP-17, change openspec/changes/feat-m1-asistente-instalacion (ya actualizado con las
decisiones; revísalo con /opsx-update solo si algo no cuadra y luego /opsx-apply).
Rama: feat/m1-asistente-instalacion. Pantalla: docs/diseno/pantallas/31-Autoalojado-asistente.md.
Contrato: docs/contratos/instalacion.md v1.8 (§ Primera configuración y § Correo de la instalación).

Ya existe en main (úsalo, no lo dupliques):
- AltaPrimerUsuario (SuscripcionesModule): validarCodigo(codigo), consumirCodigo(), configurada().
- RepositorioConfiguracionInstalacion (SuscripcionesModule): correo() → entorno | smtp | sin-correo,
  guardarCorreo(...). Las columnas smtp* y sinCorreo ya están migradas.
- CifradorVariables (VariablesModule): cifrar/descifrar con CLAVE_CIFRADO_VARIABLES.
- SesionService.iniciar(...) y cookieSesion(...) de M1: crean la sesión y la cookie del login.
- PATCH /admin/instalacion/registro y /limites (Javier) para el paso 5.
- CorreoConRegistro (M10) anota el último envío para Admin · Instalación.

Decisiones tomadas (no las reabras sin hablar con Derek):
1. POST /instalacion/administrador { codigo, correo, contrasena } vuelve a validar el código
   (validarCodigo), crea el Administrador activo, consume el código y deja la
   sesión iniciada (Set-Cookie como SesionController). No se pide login a mitad del asistente.
2. /instalacion/codigo y /administrador: abiertos sin administrador, 404 con administrador.
   /instalacion/correo/prueba y PATCH /instalacion/correo: SesionGuard + RolGuard("administrador").
   En modo nube, todo 404. /configurar: sin admin → paso 1; con sesión de admin → pasos 3–5;
   sin sesión → 404. La raíz redirige a /configurar mientras configurada sea false.
3. El SMTP se guarda en la base (guardarCorreo) con la contraseña cifrada; la API NUNCA escribe
   el .env. La respuesta nunca devuelve la contraseña. La prueba de correo usa los datos recibidos
   sin guardarlos y responde 502 con el mensaje del servidor SMTP si lo rechaza.
4. En M10, un CorreoPuerto nuevo (CorreoSegunInstalacion) lee correo() en CADA envío:
   smtp → descifra y manda por ese servidor; sin-correo → no manda; entorno → el adaptador de
   SMTP_* de hoy. Va DENTRO de CorreoConRegistro. Strategy por MODO_INSTALACION en el módulo:
   en la nube no cambia nada. El transporte se fabrica con una función inyectada (sin red en pruebas).
5. Fuerza bruta: 5 intentos de código por IP cada 15 min.

Orden sugerido: 1) API de código y administrador con sesión; 2) correo (prueba y guardado);
3) CorreoSegunInstalacion en M10; 4) web /configurar con Pasos vertical y la redirección;
5) pruebas por escenario (identidad y notificaciones), clases-unificado.mmd, pnpm check, PR.

Terminado cuando (plan-avances): en una instalación limpia, el asistente pide el código, crea el
administrador y termina con correo probado o «sin correo».
```
