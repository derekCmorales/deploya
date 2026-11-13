# Proposal

Change: `feat/m3-alta-guiada`. Módulo dueño: **proyectos (M3)**; toca **construcción (M4)** y **datos (M5)** — Derek. Specs: `proyectos`, `motor-construccion`, `datos`. Pantallas: **11a–11d** (asistente «Nuevo proyecto»), **19** (campo nuevo).

## Why

El asistente de alta deja fuera casi todo lo que una app real necesita, y el cliente tiene que desplegar mal primero
y corregir después:

- Las variables (11c) se escriben en una tabla mínima: sin «Pegar .env», sin contador, sin mostrar el valor. La
  pestaña Variables (17) ya resolvió eso y es mucho más cómoda.
- El comando de inicio solo se puede poner en Configuración (19): el alta lo guarda siempre `null`.
- No hay comando de construcción: las recetas Node, Python y Go corren uno fijo.
- PostgreSQL, Redis y S3 solo se crean desde la pestaña Datos (18), **después** del despliegue #1. El primer
  despliegue arranca sin `DATABASE_URL` y casi siempre falla.

Queremos un alta guiada, al estilo de las consolas de nube: cada paso deja lista una parte y el despliegue #1 ya
sale con todo.

## What Changes

- **Asistente en cinco pasos**: Repositorio → Construcción → Datos → Variables → Revisar.
  - *Construcción*: comando de construcción (solo con receta) y comando de inicio, opcionales.
  - *Datos*: elegir PostgreSQL, Redis o S3 con el límite del plan a la vista y las variables que inyecta cada uno.
  - *Variables*: la misma experiencia que 17 (tabla, «Pegar .env», mostrar/ocultar, contador hasta 150) y la
    lista de variables que los recursos elegidos inyectarán solos.
  - *Revisar*: una fila por paso con «Editar».
- **`POST /proyectos`** acepta `comandoInicio`, `comandoConstruccion` y `datos: TipoRecurso[]`. Valida el plan de
  datos **antes** de guardar nada, crea los recursos y solo entonces encola el despliegue #1.
- **Comando de construcción** (`Proyecto.comandoConstruccion`, nueva columna): en Node reemplaza `npm run build`;
  en Python y Go corre después de instalar dependencias. Con `Dockerfile` propio o sitio estático no aplica y la
  bitácora lo dice. Se edita también en Configuración (19).
- **Ejecución espera a los recursos en `creando`** del proyecto (tope de 2 min) antes de arrancar la app, para que
  el despliegue #1 encuentre la base lista.

## Non-goals

- Compartir un recurso de otro proyecto desde el alta (sigue en la pestaña Datos).
- Comando de instalación propio, directorio raíz o contexto de build distinto de la raíz del clon.
- Repositorios privados, variables por entorno o plantillas de proyecto.
- Cambiar 18 o el contrato de los endpoints de datos. En 17 solo se agrega «Quitar» por fila (la tabla es la misma del alta).

## Capabilities

### Modified Capabilities

- `proyectos`: «Alta desde repositorio», «Revisar y desplegar», «Configuración y eliminación».
- `motor-construccion`: «Detección de stack» (comando de construcción en las recetas).

### New Capabilities

- `datos`: «Recursos listos antes de arrancar la app».

## Impact

- Prisma: migración con `Proyecto.comandoConstruccion String? @db.VarChar(512)` (aviso a Javier, dueño de `prisma`).
- API: `proyectos` (alta, cambios, servicio, puerto `RecursosDatosAlta` + adaptador sobre `DatosService`),
  `datos` (`verificarAltaInicial`, `limiteDe`, espera en `MotorDatosService.paraDespliegue`), `construccion` (recetas,
  `PasoRecepcion`), `adapters/prisma`.
- Web: asistente (`use-alta-proyecto`, pasos nuevos `paso-construccion`, `paso-datos`, `paso-variables` reescrito),
  `tabla-variables` (compartida con 17), `panel-configuracion`, `lib/alta`, `lib/datos`, `lib/variables`,
  `lib/configuracion`, `lib/proyectos`. Fichas nuevas 11b y 11f; notas en 11a, 11c, 11d, 17 y 19.
- Contratos: `despliegues.md` (cuerpo de `POST /proyectos`) y `recursos-datos.md` (alta con datos).
- Compatible: un cliente que no envía los campos nuevos obtiene lo mismo que hoy.
