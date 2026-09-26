# Estándar de ingeniería — SOLID, clean code, patrones y pruebas

Base del curso. **Obligatorio** en cada historia y en cada PR, lo escriba una persona o un agente. Si una regla choca con otra de este repo, manda [AGENTS.md](../AGENTS.md) y luego este documento. Auditoría del estado actual: [AUDITORIA_SOLID_CLEAN.md](AUDITORIA_SOLID_CLEAN.md).

Resumen en una línea: **cada historia entra con su diseño explicado en términos SOLID, sus patrones nombrados y sus pruebas unitarias en verde.**

---

## 1. Arquitectura: monolito modular con puertos y adaptadores

Estilo: **monolito modular** (NestJS + Next.js) organizado como **arquitectura hexagonal** (puertos y adaptadores, Cockburn) dentro de cada módulo. Vistas C4 en [arquitectura.md](arquitectura.md).

Dentro de `apps/api/src/modules/<modulo>/`:

| Capa | Qué vive ahí | Puede depender de | Nunca depende de |
|---|---|---|---|
| **Dominio** (`dominio/`) | Entidades, objetos valor, políticas y máquinas de estado puras (`PoliticaContrasena`, `TransicionesDespliegue`, `PoliticaCicloSuscripcion`) | Nada externo; solo TypeScript | Nest, Prisma, Docker, HTTP |
| **Aplicación** (`<modulo>.service.ts`, casos de uso) | Orquesta un caso de uso: valida, llama al dominio, persiste, publica | Dominio y **puertos** (clases abstractas) | Adaptadores concretos, `PrismaClient` directo si hay repositorio |
| **Puertos** (`*.puerto.ts`) | Contratos que la aplicación necesita (`ContenedorPuerto`, `CorreoPuerto`, `PasarelaPago`, `ProveedorFuente`, repositorios) | Tipos del dominio | Implementaciones |
| **Adaptadores** (`apps/api/src/adapters/`, `*.adaptador.ts`, `*.stub.ts`) | Docker, Traefik, SMTP, GitHub, Prisma, BullMQ | El puerto que implementan | Otros módulos |
| **Entrada** (`*.controller.ts`, trabajadores, guards) | HTTP / cola → DTO → servicio → respuesta | Servicio de su módulo | Prisma, adaptadores |

Reglas de frontera:

1. **La API no llama a Docker ni al enrutador de borde** (propuesta §7): siempre `ContenedorPuerto`, `EnrutamientoPuerto`, `VerificacionEntornoPuerto`.
2. **Un módulo solo usa lo que otro módulo exporta** en su `*.module.ts` (su servicio o su puerto). Nada de importar archivos internos de otro módulo.
3. **Puertos como `abstract class`**, no `interface`: en Nest la interfaz desaparece al compilar y no sirve como token de inyección. Sin prefijo `I`.
4. **El binding puerto → adaptador se decide en un solo lugar** (`AdaptersModule` o el `*.module.ts` del dueño). Cambiar de stub a Docker real no toca ningún servicio.
5. Estados de **despliegue** ≠ estados de **suscripción** (§4.4). Cada máquina de estados es una clase o función pura con sus pruebas.

Nombres: dominio en español de la propuesta (`Despliegue`, `Bitacora`, `Suscripcion`). Los sufijos del framework se quedan en inglés porque son de Nest (`ConstruccionService`, `ProyectosController`, `IdentidadModule`); en los diagramas el mismo componente se llama `ServicioConstruccion`. Es el mismo componente, no dos.

---

## 2. SOLID aplicado a Deploya

| Principio | Regla en este repo | Ejemplo concreto | Señal de violación en un PR |
|---|---|---|---|
| **S** — Responsabilidad única | Una clase = un motivo de cambio. Controlador adapta HTTP; servicio orquesta; política decide; adaptador habla con el exterior | `PoliticaCicloSuscripcion` saca el ciclo §4.4 de `SuscripcionesService`; métricas y bitácora en servicios separados | Un servicio que valida, hashea, envía correo y arma HTML; un controlador con `prisma.` dentro |
| **O** — Abierto/cerrado | Se extiende agregando una implementación de un puerto, no editando un `switch` | Nueva pasarela = nueva clase que extiende `PasarelaPago`; nueva fuente = nueva `ProveedorFuente` | `if (tipo === 'github') … else if (tipo === 'zip')` en un servicio |
| **L** — Sustitución de Liskov | Todo adaptador (real, stub o doble de prueba) cumple el mismo contrato: mismos tipos, mismos errores de dominio, sin precondiciones extra | `PasarelaSimulada` y cualquier pasarela futura devuelven `ResultadoPago`; `ContenedorStub` y el adaptador Docker devuelven `{ id }` | Un stub que lanza `Error('no implementado')` donde el real devuelve un resultado; un adaptador que exige un campo que el puerto no declara |
| **I** — Segregación de interfaces | Puertos estrechos, pensados desde quien los usa | `VerificacionEntornoPuerto` solo verifica salud; `CorreoPuerto` solo envía | Un `DockerPuerto` con 15 métodos que usa la mitad de los módulos |
| **D** — Inversión de dependencias | Servicios dependen de abstracciones inyectadas por constructor; nunca hacen `new` de un adaptador | `ServicioOrquestacion(contenedores: ContenedorPuerto, salud: VerificacionEntornoPuerto)` | `new Docker()`, `new PrismaClient()`, `nodemailer.createTransport()` o `Date.now()` dentro de un servicio de dominio |

Tiempo y azar también son dependencias: inyecta un `Reloj` (o pasa `ahora` como parámetro) y un generador de tokens para poder probar expiraciones de 24 h o 30 min sin esperar.

---

## 3. Clean code — reglas de revisión

1. **Nombres que revelan intención**, en español del dominio: `tokenVencido`, `cuotaDe(usuarioId)`, no `data`, `tmp`, `flag`, `handle2`.
2. **Funciones cortas y de un solo nivel de abstracción** (guía: ≤ 20 líneas, ≤ 3 parámetros; si hay más, un objeto con nombre).
3. **Sin números ni cadenas mágicas**: límites de planes desde la base/seed; tiempos (`24 h`, `30 min`, `10 min`, `60 s`) como constantes con nombre.
4. **Retornos tempranos** en lugar de `if` anidados; sin `else` tras `return`.
5. **Errores de dominio con nombre** (`CorreoYaRegistrado`, `CuotaExcedida`, `RepositorioSinDockerfile`) y un filtro o el controlador los traduce a HTTP. Nada de `throw new Error('x')` genérico ni `catch` vacío.
6. **Tipos estrictos**: sin `any`; `unknown` solo en el borde y se valida de inmediato (DTO + `class-validator` o esquema).
7. **Sin duplicación** (DRY) de reglas de negocio; sí se permite repetir en pruebas si las hace más legibles.
8. **Comentarios solo para el porqué**; el qué lo dice el nombre. Nada de código comentado.
9. **Consultas separadas de comandos** (CQS): un método que devuelve datos no cambia estado.
10. **Regla del boy scout**: el archivo que tocas queda un poco más limpio, sin salirte del alcance de la historia.
11. **Frontend**: componentes de presentación sin `fetch`; la llamada a la API vive en un cliente/hook (`useDespliegue`), la lógica de formato y validación en funciones puras. Solo componentes y tokens del design system ([diseno/](diseno/README.md)).

---

## 4. Patrones de diseño por módulo

Cada change de OpenSpec **nombra** en su `design.md` qué patrones usa y por qué. Los esperados:

| Módulo | Patrón | Dónde | Por qué |
|---|---|---|---|
| Todos | **Inyección de dependencias** (Nest) | Constructores de servicios | DIP y pruebas con dobles |
| Todos | **Repository** (Fowler, PoEAA) | Acceso a Prisma por agregado (`ProyectosRepositorio`) | El servicio no conoce SQL ni Prisma; se prueba con un repositorio en memoria |
| Todos | **Adapter** (GoF) | `apps/api/src/adapters/*`, correo SMTP, GitHub | Traducir una API externa al puerto |
| M1 Identidad | **Strategy** + objeto valor | `PoliticaContrasena`, `HashContrasena` (puerto) | Cambiar el algoritmo de hash sin tocar el registro |
| M1 Identidad | **Chain of Responsibility / Decorator** de Nest | `SesionGuard`, `@UsuarioActual()` | Autorización transversal fuera de los controladores |
| M10 Notificaciones | **Adapter** + **Template Method** | `CorreoPuerto` ← `CorreoSmtpAdaptador` (Mailpit en desarrollo, proveedor externo en producción) y `CorreoConsolaAdaptador`; binding por variables de entorno en `notificaciones.module.ts`; plantilla base de correo | Cambiar de proveedor con variables de entorno, sin tocar M1 ni el servicio de M10 ([ADR 0001](adr/0001-correo-por-smtp-configurable.md)) |
| M2 Suscripciones | **Strategy** | `PasarelaPago` ← `PasarelaSimulada` | Tarjetas de prueba hoy, pasarela real mañana |
| M2 Suscripciones | **State / política pura** | `PoliticaCicloSuscripcion.avanzar(suscripcion, ahora)` | Ciclo §4.4 probable sin base ni reloj |
| M2 Suscripciones | **Facade** | `SuscripcionesService.asignarSandbox`, `cuotaDe` | Una sola puerta para los demás módulos |
| M3 Proyectos | **Adapter** detrás de `ProveedorFuente` | Validación contra la API pública de GitHub | El controlador no sabe que existe GitHub |
| M4 Construcción | **Productor / consumidor** + **Command** | Cola BullMQ detrás de un puerto de cola; el trabajo es un comando serializable | Construir fuera del ciclo HTTP |
| M4–M6 Motor | **Máquina de estados** (State) | `TransicionesDespliegue`: Encolado → Construyendo → Aprovisionando → Publicando → Saludable / Fallido / Cancelado | Una sola fuente de verdad para transiciones válidas |
| M5 Orquestación | **Adapter** | `ContenedorPuerto` → dockerode | La API nunca llama a Docker |
| M6 Enrutamiento | **Adapter** | `EnrutamientoPuerto` → etiquetas de Traefik | Cambiar de enrutador sin tocar M5 |
| M7 Observabilidad | **Consulta de solo lectura** (CQRS ligero) | Polling de estado y bitácora con `desde=` | Separar lecturas del motor que escribe |
| M9 Administración | SRP en controladores | Usuarios, planes e infraestructura separados | Un controlador por recurso |
| M10 / motor | **Observer** (eventos de dominio) | `DespliegueTerminado` → notificación | El orquestador no depende del correo |
| `apps/web` | **Container / Presentational**, hooks | `(projects)`, `(auth)`… | UI testeable y reutilizable |

Anti-patrones que el revisor rechaza: *God object* (servicio de 600 líneas), *Service Locator* (`moduleRef.get` dentro de la lógica), *Anemic port* (puerto que expone Docker tal cual), *Shotgun surgery* (una regla de negocio copiada en tres módulos).

---

## 5. Pruebas unitarias — regla por historia

### 5.1 Qué es obligatorio

| Nivel | Herramienta | Obligatorio | Dónde |
|---|---|---|---|
| **Unitarias de dominio y servicios** | Jest + `@nestjs/testing` (`apps/api`) | **Sí, en cada historia** | `*.spec.ts` junto al archivo |
| Unitarias de lógica web (validación, formato, hooks puros) | `node --test` (`apps/web/test`) | Sí cuando la historia tiene lógica en web | `apps/web/test/*.test.mjs` |
| Controladores | Jest con el servicio como doble | Sí: al menos camino feliz y un error | `*.controller.spec.ts` |
| Adaptadores reales (Docker, SMTP, Prisma) | Prueba de integración en compose | Recomendado, no bloquea | `*.int-spec.ts` o smoke |
| Recorrido completo | `e2e/` (QA-01) | Entrega final | `e2e/` |

### 5.2 Reglas

1. **Un escenario del spec = al menos una prueba.** Cada `#### Scenario` del spec delta de tu change tiene su `it(...)` y el nombre lo cita: `it("rechaza el alta cuando el correo ya está registrado (01b)")`.
2. **Sin Docker, red, base ni reloj reales** en una unitaria. Se usan los stubs de los puertos (`ContenedorStub`, …) o dobles escritos en la prueba (*fake*, *stub*, *spy* según Meszaros).
3. **Arrange · Act · Assert**, un comportamiento por prueba, sin lógica (`if`, bucles) dentro de la prueba.
4. **Se prueba comportamiento observable**, no detalles privados: resultados, estado persistido en el repositorio en memoria y llamadas a puertos.
5. **Cada rama de error de dominio** tiene su prueba (token vencido, token usado, cuota excedida, repo sin `Dockerfile`, build con código de salida ≠ 0…).
6. **Cobertura:** `pnpm --filter @deploya/api test:cov`. Meta ≥ **80 % de líneas** en los archivos de dominio y servicio que toca la historia. La cifra no sustituye a la regla 1.
7. **Rápidas y deterministas**: la suite unitaria completa en menos de 30 s; sin `sleep`; tiempo con `Reloj` inyectado o `jest.useFakeTimers()`.
8. **Rojo antes que verde** cuando se pueda (TDD): primero la prueba del escenario, luego el código mínimo, luego refactor.
9. Los `health` del bootstrap y sus pruebas **se mantienen**.

### 5.3 Pruebas mínimas del Avance 1

| Historia | Dueño | Pruebas unitarias mínimas |
|---|---|---|
| M10-01 | Eddy | `CorreoPuerto` doble: el registro llama a `enviar` con el enlace; la plantilla incluye botón y enlace en texto plano; el binding elige `CorreoConsolaAdaptador` o `CorreoSmtpAdaptador` según `CORREO_ADAPTADOR`; un fallo de envío llega como `CorreoNoEnviado` |
| M1-01 | Eddy | `PoliticaContrasena` (longitud, mayúscula, minúscula, número, símbolo); correo repetido → `CorreoYaRegistrado`; la contraseña se guarda con hash, nunca en claro; se pide Sandbox a M2 |
| M1-02 | Eddy | Token válido activa; token vencido (24 h con `Reloj` falso) y token usado se rechazan; se guarda el hash del token |
| M1-03 | Eddy | Credenciales incorrectas → error genérico; cuenta pendiente no entra; `SesionGuard` rechaza sin cookie y deja pasar con sesión vigente |
| DB-01 | Javier | Seed idempotente (dos corridas, mismos registros); `asignarSandbox` crea una suscripción Activa |
| M2-01 | Javier | `cuotaDe` devuelve los límites de cada uno de los 4 planes; precio 30 / 365 días |
| M3-01 | Eduardo | Contador de proyectos frente a `cuotaDe`; en Sandbox con 1 proyecto se bloquea el alta |
| M3-02 | Eduardo | Parser de `EXPOSE` (puerto, varios, ausente); `ProveedorFuente` doble: repo privado y sin `Dockerfile` → errores de 11e; `POST /proyectos` llama a `crearDespliegue` |
| M4-01 | Derek | `TransicionesDespliegue`: transiciones válidas e inválidas; el trabajador con puertos stub pasa a Fallido con el código de salida; la bitácora respeta `desde=` |
| M5-01 | Derek | Los límites de `cuotaDe` llegan a `ContenedorPuerto.crear` (`cpu`, `memoriaMb`); salud falsa → Fallido; salud verdadera → Saludable |
| ENG-01 | Derek | Smoke de compose en CI (ya existe) sigue verde |

---

## 6. Cómo se aplica en el flujo

1. **`/opsx-propose`**: el `design.md` del change trae la sección *Diseño: SOLID y patrones* (qué clases, qué puerto, qué patrón y por qué) y `tasks.md` incluye una tarea de pruebas por cada tarea de código. Lo exige `openspec/config.yaml`.
2. **`/opsx-apply`**: se escribe la prueba del escenario junto al código; `pnpm test` en verde antes de marcar la tarea y `pnpm check` antes de pedir revisión.
3. **PR**: la plantilla pide marcar SOLID, clean code y pruebas; el revisor rechaza si falta alguna.
4. **Definición de terminado** ([METODOLOGIA.md](../METODOLOGIA.md)): *Probado* significa lo de la sección 5, no «lo probé a mano».
5. **Diagramas**: si la historia cambia un puerto, una clase o un estado, actualiza `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm validate:mermaid`).

---

## 7. Referencias

Las fuentes de las que salen estas reglas. Primero las del curso.

**SOLID y clean code**

- Robert C. Martin. *Clean Code: A Handbook of Agile Software Craftsmanship*. Prentice Hall, 2008.
- Robert C. Martin. *Agile Software Development: Principles, Patterns, and Practices*. Prentice Hall, 2002 — origen de SOLID como conjunto.
- Robert C. Martin. *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall, 2017.
- Bertrand Meyer. *Object-Oriented Software Construction*, 2.ª ed. Prentice Hall, 1997 — principio abierto/cerrado.
- Barbara Liskov y Jeannette Wing. «A Behavioral Notion of Subtyping». *ACM TOPLAS* 16(6), 1994.
- Martin Fowler. *Refactoring: Improving the Design of Existing Code*, 2.ª ed. Addison-Wesley, 2018 — catálogo de *code smells*.

**Patrones y arquitectura**

- Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides. *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley, 1994.
- Martin Fowler. *Patterns of Enterprise Application Architecture*. Addison-Wesley, 2002 — Repository, Service Layer, Data Mapper.
- Alistair Cockburn. «Hexagonal Architecture» (Ports and Adapters), 2005 — <https://alistair.cockburn.us/hexagonal-architecture/>.
- Eric Evans. *Domain-Driven Design*. Addison-Wesley, 2003 — agregados, objetos valor, lenguaje ubicuo.
- Simon Brown. *The C4 model for visualising software architecture* — <https://c4model.com>.
- Michael Nygard. «Documenting Architecture Decisions», 2011 — formato de los ADR de `docs/adr/`.
- Refactoring.Guru — catálogo ilustrado de patrones y *smells* — <https://refactoring.guru/es>.

**Pruebas**

- Kent Beck. *Test-Driven Development: By Example*. Addison-Wesley, 2002.
- Gerard Meszaros. *xUnit Test Patterns: Refactoring Test Code*. Addison-Wesley, 2007 — dobles de prueba (dummy, stub, spy, mock, fake).
- Steve Freeman y Nat Pryce. *Growing Object-Oriented Software, Guided by Tests*. Addison-Wesley, 2009.
- Vladimir Khorikov. *Unit Testing: Principles, Practices, and Patterns*. Manning, 2020.
- Martin Fowler. «Mocks Aren't Stubs», 2007, y «The Practical Test Pyramid» (Ham Vocke), 2018 — <https://martinfowler.com>.
- NestJS. *Testing* y *Custom providers* — <https://docs.nestjs.com/fundamentals/testing>.
- Jest — <https://jestjs.io/docs/getting-started>. Node.js test runner — <https://nodejs.org/api/test.html>.
