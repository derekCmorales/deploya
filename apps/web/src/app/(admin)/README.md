# Admin (Javier)

Panel administrativo (rol Administrador). Dueño: @Javier-r04. Kit: [docs/diseno/README.md](../../../../../docs/diseno/README.md).

Pantallas del canvas v4.1 que viven aquí: 25 Usuarios y 25b Suspender cuenta. Gestión de planes y estado de infraestructura quedan fuera de alcance ([docs/alcance.md](../../../../../docs/alcance.md)). Hoy `/admin` es un stub.

Acceso (M1-04, Eddy): `layout.tsx` exige sesión (`RequiereSesion`) y pregunta a `GET /administracion/acceso` (`RolGuard` + `@Roles("administrador")` en la API) antes de mostrar cualquier pantalla del grupo. Un Cliente ve el 403 de la pantalla 28 (`components/estados/sin-permisos.tsx`). Las pantallas nuevas de M9 quedan protegidas solas: no hace falta repetir la comprobación.
