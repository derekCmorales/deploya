# Propuesta: Alta de Proyectos y Gestión de Interfaz (M3-01 y M3-02)

## Resumen
Implementación del módulo M3 de Proyectos en el backend (NestJS) y la interfaz web en el frontend (Next.js con design system v4.1). Permite registrar repositorios públicos de GitHub, validar su contenido y la existencia de Dockerfiles y puertos expuestos, verificar cuotas de usuario, persistir proyectos en memoria y encolar el despliegue inicial conectando con el motor de construcción (M4 - ConstruccionService).

## Historias de Usuario
- **M3-01 (3 pts):** Lista de proyectos y primer proyecto (pantallas 10 y 10b), búsqueda, contador de cuota contra `cuotaDe`, y estado actualizado por sondeo (*polling*) cada 3 segundos.
- **M3-02 (5 pts):** Alta de proyectos (pantallas 11a, 11d y 11e): ingreso de URL, rama, nombre y puerto obtenido del EXPOSE; manejo de errores de repositorio no accesible o sin Dockerfile; revisión y envío de la solicitud de alta que encola el despliegue en el motor.