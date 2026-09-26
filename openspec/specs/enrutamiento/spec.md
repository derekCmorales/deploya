# enrutamiento (M6)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): subdominio automático con HTTPS y conmutación de tráfico sin corte. Pantallas 12b y 13. Dueño: Derek.

## Purpose

Exponer el contenedor en `https://<proyecto>.deploya.app` vía `EnrutamientoPuerto` (Traefik). La API no habla con el enrutador de borde.

## Requirements

### Requirement: Subdominio automático

Cada proyecto SHALL publicarse en `<proyecto>.deploya.app` (en desarrollo, `<proyecto>.localhost`). Cambiar el nombre del proyecto no cambia el subdominio.

#### Scenario: Publicación

- **WHEN** el contenedor pasa la verificación de salud (M5)
- **THEN** el subdominio apunta al contenedor nuevo

### Requirement: HTTPS

En el VPS, el tráfico SHALL servirse con HTTPS usando un certificado comodín de `*.deploya.app`. El panel SHALL mostrar hasta cuándo es válido.

#### Scenario: Certificado comodín

- **WHEN** un proyecto se publica en el VPS
- **THEN** responde por HTTPS con el certificado de `*.deploya.app`

### Requirement: Conmutación sin interrupción

Un nuevo despliegue saludable SHALL recibir el tráfico antes de que se retire el contenedor anterior.

#### Scenario: Nuevo despliegue

- **WHEN** la versión #14 pasa la verificación de salud mientras #13 sirve tráfico
- **THEN** el subdominio apunta a #14 y solo después se detiene #13

## Fuera de alcance · solo si da el tiempo

- Dominios personalizados del cliente y su certificado.
