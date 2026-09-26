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
| — | Pendientes del plan (Derek, A1–A3): `Dockerfile` obligatorio, BullMQ para la cola, polling en vez de WebSocket, Traefik con certificado comodín | Por escribir |
