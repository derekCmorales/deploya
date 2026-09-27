# Spec Delta

## MODIFIED Requirements

### Requirement: Subdominio automático

Cada proyecto SHALL publicarse en `<subdominio>.<DOMINIO_APPS>`: `<subdominio>.localhost` en desarrollo y `<subdominio>.deploya.app` en el VPS. La ruta SHALL escribirse vía `EnrutamientoPuerto` (Traefik con proveedor de archivo) solo después de que el contenedor pasa la verificación de salud. Cambiar el nombre del proyecto no cambia el subdominio.

#### Scenario: Publicación

- **WHEN** el contenedor de `hola-deploya` pasa la verificación de salud (M5)
- **THEN** existe la ruta `hola-deploya.localhost` hacia ese contenedor, el despliegue guarda la URL y la app responde en el navegador

#### Scenario: Renombrar no cambia la URL

- **WHEN** el cliente renombra el proyecto
- **THEN** el siguiente despliegue se publica en el mismo subdominio
