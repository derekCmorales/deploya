# Spec Delta

## ADDED Requirements

### Requirement: Instalador por etapas

`instalar.sh` SHALL comprobar requisitos, dominio y certificado antes de escribir nada, SHALL detenerse con instrucciones cuando una comprobación falla, SHALL poder retomar con `--continuar` y SHALL terminar imprimiendo un código de configuración de un solo uso.

#### Scenario: Servidor limpio

- **WHEN** se corre en un servidor con Docker y el DNS bien
- **THEN** llega a HTTPS e imprime el código de configuración

#### Scenario: DNS que no apunta

- **WHEN** el comodín apunta a otra IP
- **THEN** se detiene en la etapa 2 sin escribir `.env` y explica qué registro crear

#### Scenario: Retomar

- **WHEN** se corre `--continuar` después de corregir el DNS
- **THEN** no repite la etapa 1 y sigue en la 2

### Requirement: Actualizar y respaldar

`actualizar.sh` SHALL respaldar antes de cambiar de versión, migrar la base y reiniciar api, web y trabajador sin detener los contenedores de los proyectos; `--volver` SHALL restaurar el respaldo previo. `respaldar.sh` SHALL guardar la base y la configuración sin la clave de cifrado y conservar 7.

#### Scenario: Actualizar sin cortar

- **WHEN** se actualiza con api-tienda Saludable
- **THEN** api-tienda responde durante toda la actualización

#### Scenario: Volver

- **WHEN** la migración falla
- **THEN** `--volver` deja la versión y la base anteriores

#### Scenario: Respaldo sin la clave

- **WHEN** se corre `respaldar.sh`
- **THEN** el archivo no contiene `CLAVE_CIFRADO_VARIABLES` y quedan como mucho 7 respaldos
