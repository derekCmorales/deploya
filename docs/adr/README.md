# ADR — registros de decisión de arquitectura

Una decisión grande por archivo, con su contexto y sus consecuencias (formato de Michael Nygard). Dueño: Derek; cualquiera puede proponer uno en su PR.

## Cuándo escribir uno

Cuando la decisión es difícil de revertir o afecta a más de un módulo: elegir una tecnología (BullMQ, Traefik), una restricción de producto (`Dockerfile` obligatorio), un contrato entre módulos o un estilo (polling en vez de WebSocket).

## Cómo

1. Copia [0000-plantilla.md](0000-plantilla.md) como `NNNN-titulo-corto.md` con el siguiente número libre.
2. Estado `Propuesto` en tu PR; pasa a `Aceptado` al mergear. No se borra: si cambia, un ADR nuevo lo marca `Reemplazado por NNNN`.
3. Enlázalo desde el `design.md` del change de OpenSpec que lo motivó.

## Índice

| # | Decisión | Estado |
|---|---|---|
| [0001](0001-correo-por-smtp-configurable.md) | Correo por un adaptador SMTP configurable; Mailpit solo en desarrollo | Propuesto |
| [0002](0002-cola-bullmq-y-trabajador-aparte.md) | Cola BullMQ y un trabajador aparte con la misma imagen | Propuesto |
| [0003](0003-construccion-dockerfile-o-receta.md) | Construcción con el `Dockerfile` del repo o con una receta por stack detectado | Propuesto |
| [0004](0004-versionado-y-reversion-sin-reconstruir.md) | Versionado inmutable y reversión sin reconstruir (retención de 5) | Propuesto |
| [0005](0005-traefik-proveedor-de-archivo.md) | Traefik v3 con proveedor de archivo y una red por proyecto | Propuesto |
| [0006](0006-polling-en-vez-de-websocket.md) | Polling cada 3 s en vez de WebSocket o SSE | Propuesto |
| — | Pendiente (A3): certificado comodín por DNS-01 en el VPS | Por escribir |
