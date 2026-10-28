# 0009 — Monolito modular con arquitectura hexagonal y stack TypeScript de punta a punta

- **Estado:** Aceptado (registra la decisión de la propuesta de agosto, vigente desde el bootstrap)
- **Fecha:** 2026-11-03
- **Autor:** @derekCmorales · **Módulos:** todos
- **Change de OpenSpec:** — (decisión de origen; la aplican todos los changes a través de `openspec/config.yaml` y [ingenieria.md](../ingenieria.md))

## Contexto

El enunciado deja la arquitectura a elección del equipo, pero exige que esté **analizada y defendida**. La propuesta (§7) eligió un monolito modular y descartó microservicios en dos líneas; los ADR 0001 a 0008 registran decisiones posteriores, pero ninguno deja por escrito la decisión de la que dependen todas las demás.

Fuerzas en juego:

- **Equipo y plazo:** cuatro personas a tiempo parcial y diez semanas. Cada uno es dueño de módulos distintos y necesita trabajar sin pisar a los demás.
- **Dominio:** diez módulos con límites claros (identidad, suscripciones, proyectos, motor…), pero con transacciones que los cruzan: un alta de proyecto consulta la cuota de M2 y crea el despliegue #1 de M4 en la misma petición.
- **Infraestructura:** un solo nodo (VPS de 2 vCPU y 4 GB) que además corre las aplicaciones de los clientes. Cada proceso de la plataforma le quita memoria a un cliente.
- **Riesgo técnico:** el motor necesita Docker, git y Traefik. Probar la lógica no puede depender de tenerlos.
- **Evaluación:** el curso califica SOLID, patrones y pruebas unitarias en cada historia.

## Decisión

Construimos Deploya como un **monolito modular** con dos procesos de la misma imagen (la **API** NestJS y el **trabajador**) más la **web** Next.js. Cada módulo de la API sigue la **arquitectura hexagonal** (puertos y adaptadores, Cockburn): entrada → aplicación → dominio puro, y la aplicación depende solo de **puertos** declarados como `abstract class`. Los adaptadores (Prisma, Docker, BullMQ, SMTP, GitHub, Traefik) se eligen en un solo lugar por configuración.

Usamos **TypeScript en todo el sistema** (NestJS 10, Next.js 15, Prisma 6), **PostgreSQL 16** como almacén único y **Redis 7** solo para la cola y el estado efímero.

Reglas que lo hacen cumplir:

1. Un módulo solo importa lo que otro exporta en su `*.module.ts`; los contratos entre módulos viven en `docs/contratos/`.
2. El dominio no importa Nest, Prisma, Docker ni HTTP; el tiempo entra por el puerto `Reloj`.
3. La API nunca habla con Docker ni con el enrutador: lo hace el trabajador, detrás de `ContenedorPuerto`, `EnrutamientoPuerto` y `VerificacionEntornoPuerto`.
4. Cada puerto tiene un adaptador real y uno en memoria o *stub* que cumplen el mismo contrato (`contratos-stubs.spec.ts` lo verifica).

## Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| **Monolito modular hexagonal** (elegida) | Un despliegue, una base, transacciones locales; límites de módulo explícitos; dominio probado sin infraestructura; cada dueño trabaja en su carpeta | Disciplina para no saltarse las fronteras (se revisa en cada PR); escala vertical, no horizontal |
| Microservicios (uno por módulo) | Despliegue y escalado independientes | Diez servicios para cuatro personas; red, contratos versionados y consistencia eventual entre M2, M3 y M4; cada proceso consume la memoria que necesitan los clientes en un solo nodo |
| Monolito en capas clásico (controlador → servicio → ORM) | Lo más rápido de empezar | El servicio queda atado a Prisma y a Docker; no se puede probar el motor sin Docker; la regla «la API no llama a Docker» no se puede expresar |
| Serverless (funciones) | Sin servidores que operar | Construir imágenes y mantener contenedores largos no encaja; dependencia del proveedor, contraria al producto (autoalojable) |
| Backend Java Spring Boot o .NET | Ecosistemas maduros, tipado fuerte | Dos lenguajes en el equipo (front y back); el SDK de Docker (`dockerode`), BullMQ y Prisma son de primera clase en Node |
| MongoDB | Esquema flexible | El dominio es relacional (usuario → suscripción → pagos; proyecto → despliegues → artefactos) y necesita restricciones únicas y transacciones |

## Consecuencias

- **Más fácil:** probar. El 96.8 % de las líneas de la API está cubierto con 1 069 pruebas que corren en segundos, sin Docker, red, base ni reloj reales, porque cada servicio recibe sus puertos por constructor.
- **Más fácil:** cambiar de proveedor. Correo (ADR 0001), cola (0002), enrutador (0005), pasarela de pagos y modo de instalación (0008) se cambian con otro adaptador, sin tocar servicios. El modo `MOTOR_ADAPTADORES=stub` levanta el sistema completo sin Docker para desarrollo y CI.
- **Más fácil:** el autoalojado. Un solo `docker compose` instala la plataforma entera en cualquier servidor.
- **Más difícil:** escalar horizontalmente. Se acepta: el producto es de un nodo y el trabajador ya está separado, que es la parte pesada; si hiciera falta, el trabajador escala primero (concurrencia y réplicas) sin tocar la API.
- **Deuda aceptada:** las fronteras entre módulos se cuidan por convención y revisión, no por el compilador. Mitigación: `CODEOWNERS` por carpeta y contratos firmados en `docs/contratos/`.
- **SOLID:** la arquitectura materializa DIP (servicios → puertos), OCP (nuevos adaptadores y recetas sin editar servicios) y LSP (stub y real con el mismo contrato). **Patrones:** Ports & Adapters, Repository, Adapter, Strategy, Facade entre módulos.
