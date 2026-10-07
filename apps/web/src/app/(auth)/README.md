# Auth (Eddy)

Rutas de cuenta. Dueño: @EddyPoroj106. Kit: [docs/diseno/README.md](../../../../../docs/diseno/README.md).

Pantallas del canvas v4.1 que viven aquí: 01 Registro, 02 Verifica tu correo, 03 Iniciar sesión, 04 Recuperar contraseña, 05 Mi cuenta (Perfil y Seguridad). Alcance: [docs/alcance.md](../../../../../docs/alcance.md). Lógica pura en `src/lib/cuenta.ts`, llamadas en `src/lib/api-identidad.ts`.

Todo lo que vive en este grupo recibe el header público (Planes · tema · Iniciar sesión) desde `components/shell/marco-app.tsx`, sin la navegación del panel.

Hechas: `/registro` (01, 01b), `/verificar` (02, sin reenvío: A2) e `/ingresar` (03 y 03b; el motivo de la suspensión llega con M1-04). La sesión vive en `hooks/use-sesion.tsx`; el grupo `(projects)` la exige con `components/shell/requiere-sesion.tsx`.

Enlaces que todavía dan 404 porque su pantalla aún no existe:

| Enlace | Dónde aparece | Llega con |
|---|---|---|
| `/recuperar` | «recuperar contraseña» (01b) y «Olvidé mi contraseña» (03) | M1-05 |
