# Design

## 1. Contexto

`Plan`, `Suscripcion` (con `planSiguienteId`) y `Pago` ya están en el schema del contrato [datos-nucleo.md](../../../docs/contratos/datos-nucleo.md) v1. Este change no toca el schema. Solo agrega la lógica, los adaptadores y las pantallas 07, 07b y 08 del canvas v4.1.

## 2. Capas

```text
apps/api/src/modules/suscripciones/
  dominio/      cambio-plan.ts (política), mi-suscripcion.ts (vistas), pago.ts, tarjeta.ts (validación), errores.ts
  puertos/      pasarela-pago, repositorio-pagos, espera, repositorio-suscripciones (+actualizar, +programarDescenso)
  adaptadores/  pasarela-simulada, espera-temporizador (+EsperaInstantanea), repositorio-pagos.{prisma,memoria}
  contratacion.service.ts · cobro.controller.ts · cobro.module.ts · errores-suscripciones.filter.ts
apps/web/src/
  lib/suscripcion.ts (puro) · hooks/use-suscripcion.ts
  app/(billing)/_componentes/cabecera-cobro.tsx · planes/contratar/* (07, 07b) · suscripcion/* (08)
```

## 3. Decisiones

- **`CobroModule` aparte.** M1 importa `SuscripcionesModule` (`asignarSandbox`) y las rutas del cliente necesitan el `SesionGuard` de M1. Meter el controlador en `SuscripcionesModule` crearía un import circular (`forwardRef`). `CobroModule` importa los dos módulos y solo declara el controlador. `SuscripcionesModule` exporta `ContratacionService` para él.
- **`ContratacionService` separado de la Facade.** `SuscripcionesService` sigue siendo la puerta estrecha para M1, M3, M4 y M5 (`asignarSandbox`, `cuotaDe`, `catalogo`). Los casos de uso del cliente viven en otra clase (S, I). El diagrama de clases proponía `contratar/renovar/cambiarPlan` en la Facade; se actualizó.
- **Una sola operación de pago.** Contratar, ascender y renovar son el mismo `POST /suscripciones/contratar`. La política decide el tipo según el plan actual y el destino (`orden`), así la web no duplica reglas. `GET /suscripciones/cotizacion` usa la misma política para el resumen de 07.
- **Renovación.** Suma los días al final de la vigencia vigente. Si la vigencia ya terminó, arranca hoy.
- **Descenso programado.** Solo guarda `planSiguienteId`. Aplicarlo al vencer es trabajo de la tarea diaria de M2-05. Un pago aprobado lo cancela.
- **Rechazo = 200.** Un pago rechazado es un resultado del negocio que 07b pinta, no un error HTTP. Se guarda con motivo y sin comprobante (I2).
- **Comprobante.** Cuenta los aprobados del año dentro de la transacción. La `@unique` de `numeroComprobante` convierte una carrera en error, en vez de un duplicado.
- **Sin atomicidad pago–suscripción.** El pago se registra y luego se actualiza la suscripción, en dos escrituras. Con la pasarela simulada no hay reembolso posible. Se documenta como riesgo.
- **Consumo en 08.** Proyectos sale de `GET /proyectos` (M3). Las construcciones del mes son de M7-03 (A3): la pantalla muestra el límite y lo dice.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `PasarelaPago` → `PasarelaSimulada` | Adapter | D, O, L | El servicio no sabe que el cobro es simulado; una pasarela real sería otra implementación |
| `Espera` → `EsperaTemporizador` / `EsperaInstantanea` | Inyección de dependencias | D | La tarjeta que tarda 5 s se prueba sin esperar |
| `operacionDeCobro`, `validarDescenso`, `cambioTrasCobro` | Strategy (política pura) | S, O | La regla de ascenso, descenso o renovación vive en un solo lugar y se prueba sin Nest ni base |
| `RepositorioPagos`, `RepositorioSuscripciones` → Prisma / memoria | Repository | D, L | Los dobles en memoria cumplen el mismo contrato |
| `ContratacionService` | Application service | S | Orquesta: suscripción + plan → política → pasarela → pago → suscripción |
| `CobroController` + `ErroresSuscripcionesFilter` | Adapter de entrada | S | El controlador valida el cuerpo y delega; el filtro mapea `codigo` a HTTP |
| `ContratarContenedor` / `FormularioPago` / `ResultadoPago`, `MiSuscripcionContenedor` / paneles | Container / Presentational | S | Datos y estado en el contenedor, dibujo en componentes |
| `useContratacion` | State (formulario → procesando → resultado) | S | 07 → 07b como una máquina de estados explícita |

Cambios a clases y puertos en `clases-unificado.mmd`:

- Nuevos: `ContratacionService`, `PoliticaCambioPlan`, `CobroController`, `RepositorioPagos` (+Prisma), `Espera` (+`EsperaTemporizador`).
- Cambian: `RepositorioSuscripciones` (+2 métodos) y `PasarelaPago.cobrar(cargo)`.
- `SuscripcionesService` queda solo con la Facade.

Estados sin cambios.

## Risks / Trade-offs

- **Dueño.** Son historias de Javier. Las revisa por CODEOWNERS antes del merge.
- **Descenso sin aplicar** hasta M2-05. La pantalla lo muestra como «Descenso programado» con su fecha.
- **Dos escrituras sin transacción** (pago y suscripción). Aceptable con la pasarela simulada. Con una pasarela real haría falta una transacción o un outbox.
