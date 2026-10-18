# enrutamiento (M6)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): subdominio automático con HTTPS y conmutación de tráfico sin corte. Pantallas 12b y 13. Dueño: Derek.

## Purpose

Exponer el contenedor en `https://<proyecto>.deploya.app` vía `EnrutamientoPuerto` (Traefik). La API no habla con el enrutador de borde.

## Requirements

### Requirement: Subdominio automático

Cada proyecto SHALL publicarse en `<subdominio>.<DOMINIO_APPS>`: `<subdominio>.localhost` en desarrollo y `<subdominio>.deploya.app` en el VPS. La ruta SHALL escribirse vía `EnrutamientoPuerto` (Traefik con proveedor de archivo) solo después de que el contenedor pasa la verificación de salud. Cambiar el nombre del proyecto no cambia el subdominio.

#### Scenario: Publicación

- **WHEN** el contenedor de `hola-deploya` pasa la verificación de salud (M5)
- **THEN** existe la ruta `hola-deploya.localhost` hacia ese contenedor, el despliegue guarda la URL y la app responde en el navegador

#### Scenario: Renombrar no cambia la URL

- **WHEN** el cliente renombra el proyecto
- **THEN** el siguiente despliegue se publica en el mismo subdominio

### Requirement: HTTPS

En el VPS, el tráfico SHALL servirse con HTTPS usando un certificado comodín de `*.deploya.app` emitido por DNS-01. Las peticiones HTTP SHALL redirigirse a HTTPS. El panel SHALL mostrar hasta cuándo es válido. En desarrollo SHALL seguir funcionando `http://<proyecto>.localhost` sin certificado. El dominio y el esquema SHALL salir de la configuración, no del código.

#### Scenario: Certificado comodín

- **WHEN** un proyecto se publica en el VPS
- **THEN** responde por HTTPS con el certificado de `*.deploya.app`

#### Scenario: Desarrollo sin TLS

- **WHEN** un proyecto se publica en compose local
- **THEN** la ruta no declara TLS y la URL es `http://<proyecto>.localhost`

#### Scenario: Vencimiento visible

- **WHEN** el cliente abre un despliegue Saludable en el VPS
- **THEN** la vista incluye la fecha de vencimiento del certificado

### Requirement: Conmutación sin interrupción

Un nuevo despliegue saludable SHALL recibir el tráfico antes de que se retire el contenedor anterior. Si el nuevo no pasa la verificación de salud, la ruta SHALL seguir apuntando al anterior.

#### Scenario: Nuevo despliegue

- **WHEN** la versión #14 pasa la verificación de salud mientras #13 sirve tráfico
- **THEN** el subdominio apunta a #14 y solo después se detiene #13

#### Scenario: Salud fallida no conmuta

- **WHEN** la versión #14 no pasa la verificación de salud mientras #13 sirve tráfico
- **THEN** la ruta sigue en #13, el contenedor de #14 se elimina y #13 sigue siendo el activo

## Fuera de alcance · solo si da el tiempo

- Dominios personalizados del cliente y su certificado.
