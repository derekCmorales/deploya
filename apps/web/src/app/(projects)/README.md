# Projects (Eduardo)

Panel de proyectos. Dueño: @Portillo17e. Kit: [docs/diseno/README.md](../../../../../docs/diseno/README.md).

Pantallas del canvas v4.1 que viven aquí: 10 Proyectos, 11 Nuevo proyecto, 12 Despliegue, 13 Resumen, 14 Despliegues, 17 Variables, 19 Configuración. Estados del sistema (28) van en `not-found.tsx` y componentes compartidos. Alcance: [docs/alcance.md](../../../../../docs/alcance.md). 

## Avance 1 (M3-01, M3-02)

| Ruta | Pantallas | Piezas |
|---|---|---|
| `/projects` | 10 lista + detalle, 10b primer proyecto | `PanelProyectos` (container) · `ListaProyectos`, `DetalleProyecto`, `PrimerProyecto` |
| `/projects/nuevo` | 11a Repositorio, 11d Revisar, 11e errores | `AsistenteAlta` (container) · `LateralAlta`, `PasoRepositorio`, `PasoRevisar` |

- Datos: `lib/api.ts` (único `fetch`, `credentials: "include"`) y los hooks `useProyectos` (sondeo cada 3 s mientras algo está en curso), `useDespliegue` y `useAltaProyecto`.
- Lógica pura en `lib/proyectos.ts`, probada en `test/proyectos.test.mjs`.
- El paso *Variables* está deshabilitado hasta M3-03 (Avance 2).
