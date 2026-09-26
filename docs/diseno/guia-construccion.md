# Guía de construcción de pantallas

Cómo pasar de una pantalla del canvas Deploya v4.1 a código en `apps/web`, a mano o con un agente. Reglas visuales: [README.md](README.md). Fichas: [pantallas/](pantallas/).

## Antes de empezar

1. Confirma que la pantalla es de tu entrega en [../plan-avances.md](../plan-avances.md) y que no está en *fuera de alcance* de [../alcance.md](../alcance.md).
2. Abre su ficha en [pantallas/](pantallas/): ruta, componentes, estados y texto exacto.
3. Mírala en el canvas (<https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT>), en claro y en oscuro.
4. Abre tu change: `/opsx-propose feat/m<n>-<slug>`. Si tiene UI, el spec delta referencia `docs/diseno/`.
5. Revisa `/sistema` (`pnpm --filter @deploya/web dev`) para ver los componentes que vas a usar.

## Paso a paso

1. **Ruta.** Crea la página en el grupo de tu módulo (tabla de rutas abajo). Server component por defecto; `"use client"` solo en la parte interactiva.
2. **Estructura.** Elige el patrón de layout (abajo) y copia su esqueleto.
3. **Componentes.** Solo los de `@/components/ui`, `@/components/deploya` y `@/components/shell`. Si falta una variante, agrégala al componente con su comentario, no la estilices en la pantalla.
4. **Texto.** Copia el texto de la ficha. Los datos de ejemplo (correos, hashes, fechas) salen de la API.
5. **Estados.** Cada pantalla tiene vacío, cargando (`Skeleton`), error (`Banner` o `Field error`) y éxito. La ficha dice cuáles dibuja el diseño.
6. **Datos.** Consume la API del módulo según su contrato (`docs/contratos/`). Polling cada 3 s solo donde el diseño lo indica (lista de proyectos, despliegue en curso).
7. **Tema y accesibilidad.** Revisa claro y oscuro, tabulación completa y lector de pantalla en formularios.
8. **Pruebas.** Al menos la lógica (validaciones, mapeos de estado). Si agregas un componente, súmalo a `/sistema`.

## Rutas objetivo

| Pantalla | Ruta | Grupo | Dueño |
|---|---|---|---|
| 01 Registro | `/registro` | `(auth)` | Eddy |
| 02 Verifica tu correo | `/verificar` | `(auth)` | Eddy |
| 03 Iniciar sesión | `/ingresar` | `(auth)` | Eddy |
| 04 Recuperar contraseña | `/recuperar`, `/restablecer` | `(auth)` | Eddy |
| 05 Mi cuenta | `/cuenta`, `/cuenta/seguridad` | `(auth)` | Eddy |
| 06 Planes | `/planes` | `(billing)` | Javier |
| 07 Contratar | `/planes/contratar` | `(billing)` | Javier |
| 08 Mi suscripción | `/suscripcion` | `(billing)` | Javier |
| 09 Historial de pagos | `/pagos` | `(billing)` | Javier |
| 10 Proyectos | `/projects` | `(projects)` | Eduardo |
| 11 Nuevo proyecto | `/projects/nuevo` | `(projects)` | Eduardo |
| 12 Despliegue | `/projects/[proyecto]/despliegues/[n]` | `(projects)` | Eduardo |
| 13 Resumen | `/projects/[proyecto]` | `(projects)` | Eduardo |
| 14 Despliegues | `/projects/[proyecto]/despliegues` | `(projects)` | Eduardo |
| 17 Variables | `/projects/[proyecto]/variables` | `(projects)` | Eduardo |
| 19 Configuración | `/projects/[proyecto]/configuracion` | `(projects)` | Eduardo |
| 25 Admin · Usuarios | `/admin/usuarios` | `(admin)` | Javier |
| 28 Estados del sistema | `not-found.tsx`, `error.tsx`, `loading.tsx` y componentes | raíz | Eduardo |

Al crear tu ruta real, borra el stub de tu grupo (`/auth`, `/billing`, `/admin`) y actualiza su `href` en `components/shell/nav-panel.tsx`.

## Patrones de layout

### A · Acceso partido (01, 03, 04)

Formulario de 400px centrado en una columna de 640px; a la derecha, ilustración sobre `bg-sunken puntos` con borde izquierdo.

```tsx
<div className="grid min-h-full grid-cols-[640px_1fr]">
  <section className="grid place-items-center p-12">
    <form className="flex w-[400px] flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">Crear cuenta</p>
        <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em]">Empieza a desplegar</h1>
        <p className="text-muted-foreground">Arrancas en Sandbox: sin costo y sin tarjeta.</p>
      </div>
      <Field id="correo" label="Correo" error={errores.correo}>
        <Input id="correo" type="email" autoComplete="email" aria-invalid={!!errores.correo} aria-describedby="correo-msg" />
      </Field>
      {/* … */}
      <Button size="lg" className="w-full">Crear cuenta<ArrowRight /></Button>
    </form>
  </section>
  <aside aria-hidden className="puntos border-l border-border bg-sunken" />
</div>
```

### B · Tarjetas de estado (01b, 02, 03b)

Una `Card` de 400px con `p-7`, icono de 44px en caja con borde, título `h2`, texto `muted-foreground` y acción a lo ancho.

### C · Página del panel (06, 08, 09, 25)

```tsx
<main className="flex flex-col gap-6 px-8 pt-7 pb-8">
  <header className="flex items-end justify-between gap-4">
    <div className="flex flex-col gap-1">
      <p className="text-[13px] font-medium text-muted-foreground">Cobro</p>
      <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em]">Planes</h1>
    </div>
    <Segmented aria-label="Vigencia" value={v} onValueChange={setV} options={[…]} />
  </header>
  {/* contenido */}
</main>
```

### D · Lista + detalle (10, 25)

Tabla o lista a la izquierda, panel del elemento seleccionado a la derecha (`grid-cols-[1fr_420px]`). La fila seleccionada con `data-activa="true"` o fondo `muted` y barra de 2px en `foreground`. Nunca una rejilla de cards.

### E · Asistente de pasos (11)

`grid-cols-[280px_1fr]`: `Pasos` y el recuadro «Recursos del plan» a la izquierda; el paso actual en una `Card` a la derecha; barra inferior con «Paso n de 3», «Cancelar/Atrás» y «Continuar/Desplegar».

### F · Detalle de proyecto (12, 13, 14, 17, 19)

Cabecera con nombre, `EstadoDespliegue`, URL en mono y acciones; debajo `TabsNav` (Resumen · Despliegues · Variables · Configuración) como enlaces. En 12, `RielEtapas size="lg"` y `Bitacora` a todo el ancho.

## Datos compartidos

| Qué | Dónde |
|---|---|
| Estados de despliegue, suscripción y cuenta | `components/deploya/estados.ts` (la API usa los mismos valores en minúsculas) |
| Reglas de contraseña | `REGLAS_CONTRASENA` en `components/deploya/requisitos-contrasena.tsx` (la API aplica las mismas) |
| Contrato del motor | [../contratos/despliegues.md](../contratos/despliegues.md) |
| Planes y límites | [../alcance.md § Planes y recursos v4.1](../alcance.md#planes-y-recursos-v41) |

## Checklist de PR con UI

- [ ] La pantalla coincide con su ficha y el canvas en claro y oscuro
- [ ] Solo componentes del sistema y tokens semánticos (sin hex, sin colores de Tailwind)
- [ ] Texto en español, igual al de la ficha
- [ ] Estados vacío, carga, error y éxito
- [ ] Teclado y lector de pantalla revisados
- [ ] Si agregaste o cambiaste un componente, está en `/sistema` y en `docs/diseno/README.md`

## Prompt para un agente

Copia, reemplaza lo que va entre `<>` y pégalo en el chat del repo:

```text
Construye la pantalla <número y nombre> de Deploya para la historia <id> (<módulo>).

Lee primero, en este orden:
1. docs/diseno/README.md (principios, tokens, componentes y reglas)
2. docs/diseno/guia-construccion.md (patrón de layout y rutas)
3. docs/diseno/pantallas/<archivo>.md (ruta, componentes y texto exacto)
4. openspec/specs/<módulo>/spec.md y docs/alcance.md
5. docs/contratos/ si consume la API del motor

Reglas:
- Usa solo componentes de apps/web/src/components (ui, deploya, shell) y tokens de globals.css.
- Si falta una variante, agrégala al componente y a /sistema; no estilices en la pantalla.
- Texto en español idéntico a la ficha. Estados vacío, carga, error y éxito.
- Nada de lo listado como fuera de alcance.
- Trabaja en la rama feat/m<n>-<slug>, con su change de OpenSpec, y deja pruebas de la lógica.
```
