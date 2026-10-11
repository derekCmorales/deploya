# Spec Delta

## MODIFIED Requirements

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
