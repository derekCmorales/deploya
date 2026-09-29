# Auth (Eddy)

Rutas de cuenta. Dueño: @EddyPoroj106. Kit: [docs/diseno/README.md](../../../../../docs/diseno/README.md).

Pantallas del canvas v4.1 que viven aquí: 01 Registro, 02 Verifica tu correo, 03 Iniciar sesión, 04 Recuperar contraseña, 05 Mi cuenta (Perfil y Seguridad). Alcance: [docs/alcance.md](../../../../../docs/alcance.md). Hechas: `/registro` (01, 01b) y `/verificar` (02, sin reenvío: A2). Lógica pura en `src/lib/cuenta.ts`, llamadas en `src/lib/api-identidad.ts`.

Todo lo que vive en este grupo recibe el header público (Planes · tema · Iniciar sesión) desde `components/shell/marco-app.tsx`, sin la navegación del panel.

Enlaces que todavía dan 404 porque su pantalla aún no existe:

| Enlace | Dónde aparece | Llega con |
|---|---|---|
| `/ingresar` | «Ya tengo cuenta» e «Iniciar sesión» (01, 01b, header), «Iniciar sesión» (02 b) y «Volver a iniciar sesión» (02 c) | M1-03 |
| `/recuperar` | «recuperar contraseña» (01b) | M1-05 |
