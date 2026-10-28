# Spec Delta

## ADDED Requirements

### Requirement: Métricas del proyecto

El cliente SHALL ver la CPU y la memoria de su contenedor de la última hora o de las últimas 24 h frente al límite del plan, con la zona de aviso desde el 80 %, los despliegues de la ventana marcados como eventos y un tooltip por punto. Cada gráfica SHALL tener una sola escala y una alternativa en tabla.

#### Scenario: Memoria cerca del límite

- **WHEN** la memoria está al 84 % del límite
- **THEN** ve el banner de aviso y el tramo de la línea dentro de la zona de aviso

#### Scenario: Despliegue en la ventana

- **WHEN** #14 se publicó hace 5 h
- **THEN** la gráfica muestra el chip #14 en esa hora y los promedios por versión

#### Scenario: Sin datos

- **WHEN** el proyecto está Detenido
- **THEN** ve «El contenedor no está corriendo» en vez de la gráfica

#### Scenario: Hover y teclado

- **WHEN** el cliente pasa el cursor o usa las flechas sobre la gráfica
- **THEN** ve la hora, el valor, el % del límite y la versión de ese punto

#### Scenario: Resumen de 24 h

- **WHEN** el cliente abre el Resumen
- **THEN** ve la tarjeta «Últimas 24 h» con CPU y memoria y su estado en palabra

#### Scenario: Resumen sin muestras

- **WHEN** el proyecto acaba de desplegar y aún no hay muestras
- **THEN** la tarjeta «Últimas 24 h» sigue visible con «Sin muestras todavía»
