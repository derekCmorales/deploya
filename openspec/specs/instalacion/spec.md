# instalacion Specification

## Purpose
Deploya como código abierto y autoalojable (transversal, ADR 0008): repositorio público con licencia y guías, instalador por etapas y operación con un comando. Dueño de los scripts: Derek; modo y ajustes de instalación: Javier.

## Requirements

### Requirement: Repositorio de código abierto

El repositorio SHALL incluir licencia, README para usuarios externos, guía de contribución y política de seguridad, y su historial SHALL revisarse con `gitleaks`; cualquier secreto encontrado SHALL rotarse, porque el repositorio ya es público.

#### Scenario: Historial sin secretos

- **WHEN** CI corre `gitleaks` sobre todo el historial
- **THEN** no encuentra secretos, o cada secreto encontrado ya fue rotado y está en la lista de permitidos con su motivo

#### Scenario: Contribuir

- **WHEN** alguien de fuera lee CONTRIBUTING.md
- **THEN** sabe cómo proponer un change, nombrar la rama y correr `pnpm check`

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

#### Scenario: Código que la API puede validar

- **WHEN** la instalación termina
- **THEN** `.env` guarda el sha256 del código y `CODIGO_VENCE` a 30 min, el código en claro no queda en `.env` ni en la bitácora, y el seed de autoalojado copia ese hash a `ConfiguracionInstalacion`

#### Scenario: Código nuevo invalida el anterior

- **WHEN** se corre `--codigo-nuevo` antes de que exista un administrador
- **THEN** el hash anterior desaparece, el nuevo vence a los 30 min y se vuelve a sembrar
- **WHEN** ya hay un administrador
- **THEN** el comando no cambia el hash

#### Scenario: HTTPS espera al certificado

- **WHEN** el certificado tarda en responder
- **THEN** la etapa 4 reintenta `https://<dominio>/` hasta que HTTPS y el certificado están listos, sin pedir `/configurar`

#### Scenario: La raíz del dominio también se comprueba

- **WHEN** el comodín apunta a esta máquina y la raíz no
- **THEN** se detiene sin escribir `.env` y dice qué registro A crear para la raíz

#### Scenario: Un CNAME no se toma por una IP

- **WHEN** `dig` devuelve un CNAME y después la IPv4 de esta máquina
- **THEN** la etapa 2 sigue

#### Scenario: Token del proveedor inválido

- **WHEN** el token DNS no está activo
- **THEN** se detiene en la etapa 3 sin decir que el comodín ya fue emitido y sin escribir `.env`

#### Scenario: Salida de etapa correcta

- **WHEN** una comprobación pasa
- **THEN** la línea es `[n/5] Nombre ✓ detalle`

#### Scenario: Pasos de qué hacer en líneas distintas

- **WHEN** el DNS no apunta
- **THEN** el paso 2 y el paso 3 de «Qué hacer» van en líneas distintas

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

#### Scenario: Versión disponible

- **WHEN** `git fetch --tags` ve una etiqueta mayor que la instalada
- **THEN** `version.json.disponible` es esa etiqueta

#### Scenario: Dos respaldos del mismo día no se pisan

- **WHEN** hay un respaldo a las 03:00 y otro el mismo día
- **THEN** quedan los dos archivos y `ultimo.json.ultimo` trae la hora
