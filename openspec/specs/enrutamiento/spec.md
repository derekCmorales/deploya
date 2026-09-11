# enrutamiento (M6)

Alcance §6.1: subdominios, certificados automáticos, conmutación de tráfico y dominios personalizados. Dueño: Derek.

## Purpose

Exponer el contenedor en un FQDN con TLS, vía `EnrutamientoPuerto`. La API no habla con el enrutador de borde.

## Requirements

### Requirement: Subdominio y TLS

Cada entorno Saludable SHALL tener subdominio y certificado TLS.

#### Scenario: Publicación

- **WHEN** el contenedor responde al healthcheck
- **THEN** se asigna FQDN, se emite certificado y se conmuta el tráfico

### Requirement: Dominios personalizados

Según el plan, el cliente MAY asociar un dominio propio (DNS del cliente). Sandbox no incluye dominio personalizado.

#### Scenario: Dominio del plan Starter

- **WHEN** el cliente declara un dominio y el DNS es correcto
- **THEN** el certificado cubre ese FQDN

### Requirement: Conmutación sin interrupción

Un nuevo despliegue saludable SHALL conmutar el tráfico al nuevo contenedor antes de retirar el anterior.
