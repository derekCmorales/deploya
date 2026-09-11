---
title: Propuesta de producto — Deploya
origen: propuesta del equipo (30 agosto 2026)
---

> Copia canónica de la guía general. Metodología de trabajo del equipo: ver [METODOLOGIA.md](../METODOLOGIA.md) (raíz). Arquitectura consolidada: [arquitectura.md](arquitectura.md).

# Propuesta de Proyecto — Deploya

> Guía general del producto (PaaS). Fuente: propuesta PDF del equipo, 30 agosto 2026.
>
> Universidad Rafael Landívar · Ingeniería de Software · Derek Calderón, Eduardo Rodríguez, José Rodríguez, Eddy Poroj

Usar este archivo como contexto general al consolidar diagramas en las carpetas de módulos.

## 1. Resumen ejecutivo

Deploya es una plataforma como servicio (PaaS) orientada al alojamiento de aplicaciones y sitios
web. Su propósito es que un desarrollador pueda pasar de un repositorio de código a una
aplicación en línea, con dominio y certificado HTTPS válido, sin escribir archivos de configuración
de infraestructura ni administrar servidores.
El producto se sitúa en la categoría "Servidores Web como Servicio" (Opción C) del enunciado
del proyecto. El usuario registra una cuenta, contrata un plan, conecta el código de su aplicación
y la plataforma se encarga de construir la imagen, ejecutarla en un contenedor aislado, asignarle
un subdominio con certificado TLS y exponer métricas y bitácoras en tiempo real.
La propuesta se concibe como una startup proveedora de servicios en la nube. En consecuencia,
el presente documento no se limita al detalle técnico: define el problema atendido, los usuarios
objetivo, el alcance comprometido, los diferenciadores frente a alternativas existentes, la
metodología de trabajo del equipo y el cronograma con el que se llegará a la entrega final.

## 2. Problema y oportunidad

Publicar una aplicación web en un servidor propio sigue siendo una tarea
desproporcionadamente compleja frente al valor que aporta. Un desarrollador que ya tiene su
aplicación funcionando en su máquina debe todavía aprovisionar un servidor, instalar
dependencias, escribir archivos de contenedor, configurar un servidor proxy inverso, gestionar
certificados TLS y su renovación, y establecer un procedimiento para actualizar la aplicación sin
dejarla fuera de servicio. Es trabajo repetitivo, propenso a error y ajeno al producto que se quiere
construir.
Las plataformas comerciales resuelven ese problema, pero introducen otros. El código y el
proceso de construcción residen en infraestructura de terceros, la facturación se basa en
consumo y resulta difícil de anticipar, y la migración hacia otro proveedor implica rehacer buena
parte de la configuración porque el formato de despliegue es propietario.
Existe entonces espacio para una plataforma que conserve la simplicidad de las soluciones
comerciales, pero que sea sencilla de instalar sobre infraestructura propia, que exponga de forma
transparente los recursos que cada plan otorga y que no imponga costos de salida. Ese es el
planteamiento de Deploya.

## 3. Solución propuesta

Deploya es una aplicación web que actúa como panel de control de una infraestructura de
contenedores. El usuario interactúa exclusivamente a través del navegador; la plataforma traduce
sus acciones en operaciones sobre el motor de contenedores, el enrutador de borde y la
autoridad certificadora.

### 3.1 Recorrido del usuario

1. El usuario se registra, confirma su correo electrónico e inicia sesión.

2. Consulta el catálogo de planes descrito en la sección 4 y contrata uno mediante el módulo
de pagos simulado; la cuota del plan queda activa de inmediato.
3. Crea un proyecto indicando la dirección de un repositorio público o cargando un archivo
comprimido con su aplicación.
4. La plataforma detecta el tipo de aplicación, encola la construcción y muestra la bitácora de
construcción en vivo.
5. Al finalizar, la aplicación queda en ejecución dentro de un contenedor aislado, accesible en
un subdominio propio con HTTPS.
6. Desde el panel el usuario consulta métricas de consumo, reinicia el servicio, modifica
variables de entorno, despliega una nueva versión o revierte a una anterior.

### 3.2 Ciclo de despliegue

Cada despliegue produce un artefacto versionado e inmutable. La versión anterior permanece
registrada, de modo que una reversión consiste en volver a levantar un artefacto ya construido y
no en reconstruir el proyecto. Este diseño es el que permite ofrecer reversión inmediata y
publicación sin interrupción del servicio.

Etapa             Responsable                Resultado

Recepción         API de control             Se registra el despliegue y se encola la construcción.

Trabajador de
Construcción                                 Se detecta el stack y se produce una imagen versionada.
construcción

Orquestador de             La imagen corre en un contenedor con límites de CPU y
Ejecución
contenedores               memoria.

Se asigna subdominio y certificado TLS; el tráfico se
Enrutamiento      Enrutador de borde
conmuta.

Operación         Módulo de observabilidad   Se transmiten bitácoras y métricas al panel del usuario.

## 4. Catálogo de servicios y modelo de monetización

El producto contratable de Deploya es un entorno web administrado: una unidad de cómputo
aislada, con dominio y certificado, sobre la que el cliente publica su aplicación. Los planes se
diferencian por la cantidad de entornos permitidos y por los recursos asignados a cada uno.

### 4.1 Servicios ofertados

Cada servicio del catálogo se define con nombre, descripción, precio y vigencia, conforme a lo
requerido. La vigencia estándar es de treinta días, con opción de contratación anual de
trescientos sesenta y cinco días a precio reducido.

Nombre            Descripción                                   Precio            Vigencia

Entorno de evaluación con un solo proyecto
Sandbox           y recursos mínimos. Pensado para pruebas      Sin costo         30 días, renovable
y aprendizaje.

Plan de entrada para sitios personales y
Starter           proyectos pequeños. Permite dominio           5.00 / mes        30 o 365 días
propio.

Plan orientado a desarrolladores con varios
Pro               proyectos en producción y necesidad de        15.00 / mes       30 o 365 días
trazabilidad.

Plan para equipos, con recursos ampliados,
Business          trabajo colaborativo y retención extendida    40.00 / mes       30 o 365 días
de bitácoras.

### 4.2 Recursos asignados por plan

Los límites siguientes no son informativos: se aplican de manera efectiva sobre el contenedor en
ejecución y sobre las operaciones permitidas al usuario. Constituyen el vínculo directo entre el
módulo de suscripciones y el módulo de orquestación.

Recurso                         Sandbox            Starter           Pro                Business

Proyectos simultáneos           1                  3                 10                 30

CPU por entorno                 0.25 núcleo        0.5 núcleo        1 núcleo           2 núcleos

Memoria por entorno             256 MB             512 MB            2 GB               4 GB

Almacenamiento                  1 GB               5 GB              25 GB              100 GB

Transferencia mensual           5 GB               50 GB             250 GB             1 TB

Construcciones al mes           20                 100               Sin límite         Sin límite

Versiones para reversión        1                  3                 10                 20

Dominios personalizados         No                 1                 5                  Sin límite

Recurso                          Sandbox              Starter           Pro                  Business

Retención de bitácoras           24 horas             7 días            30 días              90 días

Consultas al asistente           10 al mes            100 al mes        500 al mes           Sin límite

Acceso para clientes
No                   No                Sí                   Sí
externos

Miembros por espacio de
1                    1                 3                    10
trabajo

### 4.3 Complementos

Sobre cualquier plan de pago el cliente puede contratar ampliaciones puntuales, con vigencia
ligada a la del plan principal.

Complemento                                 Descripción                                   Precio

Almacenamiento adicional                    Bloque de 10 GB sobre la cuota del plan.      2.00 / mes

Incremento de 512 MB en un entorno
Memoria adicional                                                                         3.00 / mes
seleccionado.

Un dominio personalizado más allá del
Dominio adicional                                                                         1.00 / mes
límite del plan.

### 4.4 Ciclo de vida de la suscripción

La suscripción atraviesa estados explícitos, cada uno con consecuencias definidas sobre los
servicios del cliente. El diseño evita la pérdida abrupta de datos y hace previsible el
comportamiento del sistema al vencer un plan.

Estado                   Condición                                   Efecto sobre los servicios

Todos los entornos operan con la cuota
Activa                   Dentro del período de vigencia.
contratada.

Faltan siete días o menos para el           Operación normal; se notifica al cliente por
Por vencer
vencimiento.                                correo y en el panel.

Superada la fecha de vigencia, dentro del   Los entornos siguen en línea; se bloquean
Vencida
período de gracia de cinco días.            nuevos despliegues.

Concluido el período de gracia sin          Los contenedores se detienen; los datos y
Suspendida
renovación.                                 configuraciones se conservan.

Suspendida durante treinta días o           Se liberan los recursos; el cliente puede
Cancelada
cancelada por el cliente.                   exportar sus datos antes.

### 4.5 Funciones del módulo de pagos

El módulo cubre las funciones mínimas exigidas y opera sobre una pasarela simulada propia,
que reproduce los estados de una transacción real, incluido el rechazo, para poder ejercitar los
casos de error.
• Visualización de planes: página pública con la comparación de planes, recursos incluidos
y precios.
• Contratación: selección de plan y vigencia, confirmación del cargo simulado y activación
inmediata de la cuota.
• Historial de pagos: registro de todas las transacciones con fecha, concepto, monto, estado
y comprobante descargable.
• Renovación: renovación manual desde el panel o renovación automática al vencimiento,
según preferencia del cliente.
• Ascenso y descenso de plan: cambio de plan con recálculo proporcional del período
restante.
• Control de cuota: el panel muestra el consumo frente al límite y advierte antes de
alcanzarlo, en lugar de aplicar un corte sin aviso.

## 5. Usuarios e interesados

### 5.1 Roles del sistema

Rol                     Descripción y responsabilidad principal

Desarrollador que contrata un plan y despliega sus aplicaciones. Es el usuario
Cliente
principal del sistema.

Gestiona usuarios, planes y precios; supervisa la actividad de la plataforma y
Administrador
atiende incidencias de cuenta.

Operador de             Supervisa el estado de los nodos, la cola de construcción y el consumo
infraestructura         agregado de recursos.

Rol opcional con acceso de solo lectura a bitácoras y estado de proyectos para
Soporte técnico
asistir a los clientes.

### 5.2 Interesados del proyecto

• Equipo de desarrollo: conformado por cuatro estudiantes, responsable del diseño, la
construcción y la defensa de la solución.
• Docente del curso: evalúa el cumplimiento de los requisitos, la calidad de la arquitectura y
la capacidad del equipo para sustentar sus decisiones.
• Cliente objetivo: perfil de referencia sobre el que se validan las decisiones de producto y
de experiencia de usuario.

### 5.3 Sistemas externos

La plataforma depende de servicios de terceros que se documentan explícitamente por ser
puntos de integración y de riesgo: proveedor de repositorios de código, proveedor de DNS,
autoridad certificadora para la emisión de certificados TLS, servicio de correo transaccional y
proveedor de modelo de lenguaje para el asistente.

### 5.4 Usuario objetivo

El perfil de referencia es un desarrollador que trabaja de forma individual o en equipos pequeños,
que construye aplicaciones web y sitios de complejidad moderada, y que necesita publicarlos
rápidamente sin adquirir competencias profundas en administración de sistemas. Valora la
rapidez de publicación, la claridad sobre los recursos que consume y la posibilidad de conservar
el control de su infraestructura.

## 6. Alcance

### 6.1 Dentro del alcance

El compromiso de entrega se organiza en diez módulos funcionales:

Id        Módulo                        Contenido comprometido

Registro, validación de correo, recuperación de contraseña,
M1        Identidad y acceso
autenticación, manejo de sesiones, roles y bitácora de auditoría.

Catálogo de planes y complementos definido en la sección 4;
M2        Suscripciones y pagos         contratación con pago simulado, historial, renovación, cambio de
plan y aplicación efectiva de cuotas.

Alta de proyectos, conexión por repositorio o archivo
M3        Proyectos y fuentes           comprimido, configuración de construcción y variables de
entorno cifradas.

Cola de trabajos, detección del stack, construcción de imágenes
M4        Motor de construcción
y registro de artefactos versionados.

Ciclo de vida del contenedor, aislamiento de red, límites de CPU
M5        Orquestación y ejecución
y memoria, y reversión de versiones.

Asignación de subdominios, certificados automáticos,
M6        Enrutamiento y TLS
conmutación de tráfico y dominios personalizados.

Bitácoras en vivo, métricas de consumo de recursos y avisos por
M7        Observabilidad
proximidad al límite de cuota.

Capa de herramientas de la plataforma, asistente de diagnóstico
M8        Asistente e integración
y servidor de integración para clientes externos.

Panel administrativo de usuarios, planes y estado de la
M9        Administración
infraestructura.

Correo transaccional para eventos de cuenta, resultado de
M10       Notificaciones
despliegues y vencimiento de planes.

### 6.2 Fuera del alcance

Se excluyen expresamente, por restricción de tiempo y para proteger la calidad de lo
comprometido:
• Distribución de carga entre múltiples servidores y escalado automático horizontal.
• Servidor de correo propio; el envío se realiza mediante un proveedor externo.
• Red de distribución de contenido y enrutamiento multirregión.
• Aplicación de escritorio e interfaz de línea de comandos.
• Cobro con dinero real; el módulo de pagos opera en modo simulado, conforme al enunciado.
• Entornos de vista previa automáticos por cada solicitud de cambio en el repositorio.

### 6.3 Supuestos y restricciones

• El equipo dispone de un servidor virtual con acceso administrativo y de un dominio con
registro comodín.
• Las aplicaciones desplegadas por los usuarios son aplicaciones web sin estado que exponen
un único puerto HTTP.
• El almacenamiento persistente por proyecto se limita a un volumen de tamaño acotado
según el plan contratado.
• La plataforma opera sobre un único nodo durante todo el proyecto; la arquitectura contempla
la extensión a varios nodos sin implementarla.
• El equipo está integrado por cuatro estudiantes con dedicación parcial y compartida con
otros cursos.

## 7. Arquitectura preliminar

La arquitectura propuesta es un monolito modular con trabajadores asíncronos. La API expone
una interfaz única y concentra la lógica de negocio y el modelo de permisos; las tareas de larga
duración, señaladamente la construcción de imágenes, se ejecutan fuera del ciclo de petición
mediante una cola de trabajos.
Entre la lógica de negocio y la infraestructura se interpone una capa de adaptadores con tres
responsabilidades separadas: ejecución de contenedores, enrutamiento y certificados, y
verificación del entorno. La API nunca invoca directamente al motor de contenedores; solicita la
operación al adaptador correspondiente.

### 7.1 Justificación

Se descarta una arquitectura de microservicios porque el dominio no presenta límites de
escalado independientes que la justifiquen, y porque el costo de operación y despliegue de varios
servicios recaería sobre un equipo de cuatro personas con dedicación parcial. Se descarta
igualmente una arquitectura monolítica sin trabajadores, dado que una construcción puede tardar
varios minutos y bloquearía la interfaz.

La capa de adaptadores responde a dos objetivos concretos y verificables. Primero, permite
sustituir la tecnología de ejecución o de enrutamiento sin modificar la lógica de negocio. Segundo,
hace posible probar la lógica de negocio con implementaciones simuladas de los adaptadores,
sin necesidad de infraestructura real.
Cada decisión de arquitectura relevante se documentará mediante un registro de decisiones de
arquitectura fechado, que recoja el contexto, las alternativas evaluadas, la decisión adoptada y
sus consecuencias. Estos registros formarán parte del repositorio y constituyen el sustento de la
defensa técnica solicitada en el enunciado.

### 7.2 Aislamiento y seguridad

La plataforma ejecuta código de terceros, lo que constituye su principal superficie de riesgo. Se
adoptan las siguientes medidas de contención: ejecución de contenedores sin privilegios y sin
escalada de permisos, red aislada por proyecto sin acceso al anfitrión ni a otros proyectos, límites
estrictos de CPU, memoria y número de procesos, tiempo máximo de construcción, y cifrado en
reposo de las variables de entorno.

## 8. Stack tecnológico

Capa                     Tecnología                      Motivo de la elección

Framwprk completo para control del motor de
Backend                  NestJS                          contenedores, colas y transmisión de bitácoras;
un solo lenguaje en todo el equipo.

Ecosistema conocido por el equipo y adecuado
Frontend                 Next.js                         para interfaces con actualización en tiempo real.

Integridad referencial y transacciones para los
Base de datos            PostgreSQL
módulos de cuentas, planes y despliegues.

Soporte de la cola de construcción y del estado
Cola y caché             Redis
efímero de las sesiones de bitácora.

Estándar de facto para el empaquetado y
Ejecución                Docker
aislamiento de aplicaciones.

Enrutador de borde con          Descubrimiento dinámico de servicios y emisión
Enrutamiento y TLS
certificados automáticos        y renovación automática de certificados.

Verificación automática de estilo, pruebas y
Integración continua     GitHub Actions
construcción en cada solicitud de cambio.

## 9. Propuesta de valor y diferenciadores

Deploya compite con plataformas de despliegue consolidadas. La propuesta no consiste en
igualar su catálogo de funciones, sino en resolver mejor cuatro aspectos concretos.

### 9.1 Instalación de la plataforma en un solo paso

La propia plataforma se instala sobre cualquier servidor con Docker mediante un único comando,
sin editar archivos de configuración ni ejecutar procedimientos manuales. Es una decisión de
diseño, no un accesorio: la instalación desatendida obliga a que toda la configuración sea
explícita, reproducible y verificable, lo que a su vez simplifica la operación y la recuperación ante
fallos.

### 9.2 Experiencia de despliegue sin fricción

El usuario no escribe archivos de configuración de infraestructura. La plataforma detecta el tipo
de aplicación y propone los comandos de construcción y arranque, que el usuario puede
confirmar o ajustar. La bitácora de construcción se transmite en vivo, el resultado se publica sin
interrupción del servicio y la reversión a la versión anterior se ejecuta con una sola acción.

### 9.3 Asistente integrado y apertura a clientes externos

La plataforma define un conjunto de operaciones —consultar proyectos, desplegar, obtener
bitácoras y métricas, revertir versiones, gestionar variables— expuesto a través de una única
capa de herramientas. Esa capa alimenta dos consumidores: el asistente integrado en el panel,
que diagnostica construcciones fallidas y responde consultas sobre el estado de los proyectos, y
un servidor de integración que permite a herramientas externas operar la plataforma mediante
un protocolo abierto.
El asistente opera bajo tres restricciones de diseño. Hereda los permisos del usuario autenticado
y nunca los excede. Toda operación destructiva requiere confirmación humana explícita. Y el
contenido de las bitácoras y los repositorios se trata como entrada no confiable: el asistente lo
analiza, pero no ejecuta instrucciones contenidas en él.

### 9.4 Transparencia de recursos y ausencia de dependencia tecnológica

Los límites del plan contratado no son informativos: se aplican efectivamente sobre el contenedor
en ejecución. Los valores de la sección 4.2 se traducen en parámetros del contenedor y en
validaciones de la interfaz de programación, y el panel muestra en todo momento el consumo
frente al límite disponible, de manera que el usuario conoce su situación antes de alcanzarlo. Las
aplicaciones se ejecutan como contenedores estándar, por lo que un usuario que decida
abandonar la plataforma conserva un artefacto ejecutable en cualquier otro proveedor.

### 9.5 Comparación funcional

Plataformas
Aspecto                               Deploya                                  Servidor propio
gestionadas

Publicación sin configuración
Sí                Sí                     No
manual

Instalación sobre infraestructura
Sí                No                     Sí
propia

Límites de recursos visibles y
Sí                Parcial                Manual
aplicados

Reversión inmediata de versiones      Sí                Sí                     No

Asistente y apertura a clientes
Sí                Parcial                No
externos

Portabilidad del artefacto
Sí                No                     Sí
desplegado

## 10. Metodología de trabajo

El equipo adopta un marco de trabajo iterativo e incremental basado en Scrum, con adaptaciones
propias de un equipo pequeño y de dedicación parcial. Los ciclos de trabajo tienen una duración
de dos semanas y se alinean exactamente con las fechas de entrega establecidas por el curso,
de modo que cada ciclo concluye con un incremento funcional evaluable.

### 10.1 Ceremonias

Ceremonia                    Frecuencia         Propósito

Selección y estimación de las historias de usuario del
Planificación                Inicio de ciclo
ciclo.

Dos veces por      Revisión de avance y detección temprana de
Sincronización
semana             impedimentos.

Demostración del incremento funcional frente al
Revisión                     Cierre de ciclo
objetivo comprometido.

Acuerdos de mejora documentados en acta de una
Retrospectiva                Cierre de ciclo
página.

### 10.2 Prácticas de ingeniería

• Control de versiones con ramas de corta duración y solicitudes de cambio con al menos una
revisión aprobada antes de la integración.
• Convención de mensajes de confirmación uniforme, que permite generar el historial de
cambios de forma automática.

• Integración continua que ejecuta análisis estático, pruebas automatizadas y construcción en
cada solicitud de cambio.
• Definición de terminado explícita: código implementado, probado, documentado, revisado y
desplegado en el entorno de pruebas.
• Trazabilidad entre requisito funcional, historia de usuario, solicitud de cambio y confirmación
en el repositorio.
• Registro fechado de las decisiones de arquitectura, versionado junto al código fuente.

### 10.3 Equipo y responsabilidades

Integrante             Módulos (API e Interfaz)          Responsabilidad embbebida

Arquitecto e           M4, M5, M6 y la capa de           Revisión de todos los cambios, registros de
integrador             herramientas de M8                decisión, entorno de desarrollo y despliegue

Seguridad transversal, pruebas automatizadas e
Cuentas y seguridad    M1, M10
integración continua

Monetización y                                           Modelo de datos, datos semilla, edición y
M2, M9
administración                                           compilación de la documentación

Proyectos y                                              Sistema de diseño, accesibilidad, guion de la
M3, M7 y la interfaz de M8
experiencia                                              demostración

## 11. Cronograma

### 11.1 Fases e hitos

Fase      Descripción                      Período            Hito de entrega

Propuesta, alcance y
F0        Coordinación y propuesta         Hasta 28 ago
cronograma

F1        Requisitos y diseño preliminar   31 ago – 11 sep    Requisitos y diseño preliminar

F2        Núcleo de despliegue             12 sep – 25 sep    Avance funcional 1 (30 %)

Automatización y
F3                                         26 sep – 9 oct     Avance funcional 2 (50 %)
observabilidad

F4        Administración y asistente       10 oct – 23 oct    Avance funcional 3 (80 %)

F5        Estabilización y cierre          24 oct – 6 nov     Entrega final y exposición

### 11.2 Objetivo de cada avance

• Avance 1 (30 %): autenticación completa, catálogo de planes, contratación simulada y
despliegue de una aplicación de principio a fin desde el panel.
• Avance 2 (50 %): cola de construcción asíncrona, bitácoras en vivo, métricas de consumo
y aplicación efectiva de las cuotas del plan.
• Avance 3 (80 %): panel de administración, reversión de versiones, dominios personalizados,
asistente integrado y manuales en borrador.
• Entrega final: estabilización, pruebas de extremo a extremo, documentación definitiva y
ensayo de la exposición.

### 11.3 Diagrama de Gantt

Las columnas corresponden a semanas calendario. La casilla oscura señala la semana en que se produce
un hito de entrega evaluado.

Actividad                               31/8   7/9    14/9   21/9    28/9   5/10   12/10   19/10   26/10    2/11

Requisitos y casos de uso

Diseño, modelo de datos y ADR

Prueba de concepto de infraestructura

M1 Identidad y acceso

M2 Suscripciones y pagos

M3 Proyectos y fuentes

M4 Motor de construcción

M5 Orquestación y ejecución

M6 Enrutamiento y TLS

M7 Observabilidad

M9 Administración

M10 Notificaciones

M8 Asistente e integración

Interfaz de usuario

Pruebas y estabilización

Documentación y manuales

Ensayo y exposición final

Barra gris: período de ejecución de la actividad.     Casilla oscura: semana de hito evaluado.

## 12. Entregables

### 12.1 Entregables exigidos

Entregable                              Descripción

Repositorio con acceso para el docente, historial de cambios y flujo
Código fuente
de revisión documentado.

Introducción, alcance, requisitos funcionales y no funcionales, y
Documento de requisitos
casos de uso.

Entregable                          Descripción

Arquitectura general, diagramas UML, modelo entidad-relación y
Documento de diseño
diseño de base de datos.

Manual técnico                      Tecnologías utilizadas, instalación, configuración y despliegue.

Registro, inicio de sesión, contratación de servicios y administración
Manual de usuario
de recursos.

Plataforma desplegada y accesible públicamente durante la
Sistema en funcionamiento
exposición final.

### 12.2 Entregables complementarios

El equipo asume adicionalmente los siguientes entregables, orientados a sustentar la calidad del
trabajo y la defensa técnica:
• Registro de decisiones de arquitectura versionado en el repositorio.
• Especificación de la interfaz de programación y colección de pruebas de sus operaciones.
• Sitio público del producto, desplegado sobre la propia plataforma como demostración de su
funcionamiento.
• Guía de operación con procedimientos de recuperación ante fallos y restauración de
respaldos.
• Video de demostración de tres minutos, previsto como respaldo de la exposición.
• Actas de retrospectiva y métricas de avance del propio proyecto.

## 13. Gestión de riesgos

Riesgo                           Prob.       Impacto        Estrategia de mitigación

Complejidad no anticipada                                   Prueba de concepto en la primera semana;
del enrutamiento y los           Media       Alto           si no se resuelve, se replantea el alcance de
certificados                                                inmediato.

Fallos en la construcción de                                Se inicia con el caso más simple y se amplía
Alta        Medio
aplicaciones heterogéneas                                   la cobertura de forma incremental.

Ejecución de código de                                      Aislamiento de red, contenedores sin
Media       Alto
terceros en la infraestructura                              privilegios y límites estrictos de recursos.

Concentración del
Revisión cruzada obligatoria de cambios y
conocimiento en un solo          Media       Alto
documentación técnica continua.
integrante

Retraso de la documentación                                 Responsable dedicado y documentación
Alta        Medio
frente al desarrollo                                        incluida en la definición de terminado.

Riesgo                               Prob.           Impacto         Estrategia de mitigación

Dependencia de servicios
Video de demostración grabado y datos de
externos durante la                  Baja            Alto
prueba precargados.
exposición

## 14. Criterios de éxito

El proyecto se considerará exitoso si, en la entrega final, se verifican las siguientes condiciones:
1. Un usuario nuevo completa el recorrido de registro, contratación y publicación de una
aplicación accesible por HTTPS sin asistencia del equipo.
2. Los límites de recursos del plan contratado se aplican efectivamente sobre el contenedor
en ejecución y son visibles en el panel.
3. La reversión a una versión anterior se completa sin reconstruir el proyecto.
4. La plataforma completa se instala sobre un servidor limpio siguiendo el manual técnico.
5. Cada decisión de arquitectura relevante cuenta con un registro escrito que la sustenta.
6. La documentación exigida está completa y es consistente con el sistema entregado.

## 15. Trazabilidad con el enunciado del curso

La siguiente matriz relaciona cada característica obligatoria del enunciado con el módulo que la
implementa y con la sección del presente documento que la desarrolla.

Requisito del enunciado                     Cobertura en la propuesta         Módulo            Sección

Registro, validación de correo y
Módulo de identidad y acceso      M1                6.1
recuperación de contraseña

Autenticación segura y manejo de            Sesiones con expiración y
M1                6.1
sesiones                                    bitácora de auditoría

Cuatro roles, incluidos los dos
Roles de administrador y cliente                                              M1, M9            5.1
opcionales

Servicios con nombre, descripción,          Catálogo de cuatro planes y
M2                4.1, 4.3
precio y vigencia                           tres complementos

Página pública comparativa de
Visualización de planes                                                       M2                4.5
planes

Flujo de contratación con pago
Contratación de servicios                                                     M2                4.5
simulado

Registro de transacciones con
Historial de pagos                                                            M2                4.5
comprobante

Renovación manual o
Renovación de servicios                     automática y ciclo de vida        M2                4.4, 4.5
definido

Requisito del enunciado              Cobertura en la propuesta          Módulo       Sección

Pasarela simulada con estados
Simulación propia de pagos                                              M2           4.5
de éxito y rechazo

Alta de proyecto, construcción y
Crear entornos web                                                      M3, M4, M5   3.1, 3.2
ejecución en contenedor

Variables de entorno cifradas y
Gestionar configuraciones                                               M3           6.1
parámetros de construcción

Métricas de CPU, memoria y
Monitorear consumo de recursos                                          M7           4.2
transferencia frente a la cuota

Subdominio automático y
Gestión de dominios                  dominios personalizados con        M6           6.1
TLS

Justificación y registro de
Arquitectura analizada y defendida                                      —            7.1
decisiones de arquitectura

Cuatro documentos
Documentación obligatoria            comprometidos como                 —            12.1
entregables

Plataforma desplegada y
Sistema en funcionamiento                                               —            12.1
accesible en la exposición
