# 0005 — Traefik v3 con proveedor de archivo y una red por proyecto

- **Estado:** Propuesto
- **Fecha:** 2026-09-27
- **Autor:** @derekCmorales · **Módulos:** M5, M6
- **Change de OpenSpec:** `feat/m4-motor-construccion` (lo mínimo para `<proyecto>.localhost`); `feat/m6-*` para HTTPS en el VPS

## Contexto

Hace falta publicar cada app en `<subdominio>.localhost` (desarrollo) y `https://<subdominio>.deploya.app` (VPS), conmutar sin corte y aislar a los clientes entre sí. Con el proveedor Docker de Traefik las rutas viven en **etiquetas** del contenedor: se fijan al crearlo y no se pueden mover al contenedor nuevo sin recrear.

## Decisión

Usamos **Traefik v3 con el proveedor de archivo** vigilando un volumen `traefik_dinamico`. `EnrutamientoTraefikArchivo` escribe `/traefik/dinamico/<subdominio>.yml` con un router `Host(<subdominio>.<DOMINIO_APPS>)` hacia `http://<contenedor>:<puerto>`. Conmutar es reescribir ese archivo **después** de que el nuevo pasa la salud; luego se detiene el anterior. Cada proyecto tiene su red `deploya-p-<subdominio>`; el adaptador de contenedores conecta a esa red a Traefik y al worker (para la salud), y a nada más. En el VPS se agrega un certificado comodín por DNS-01 (M6-02).

## Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| **Proveedor de archivo** (elegida) | La ruta es un dato que cambiamos cuando queremos: conmutación y reversión limpias | Un volumen compartido entre worker y Traefik |
| Proveedor Docker (etiquetas) | Cero archivos | La ruta nace con el contenedor; la conmutación depende de la prioridad de routers duplicados |
| API de Traefik | — | Traefik no expone escritura de rutas por API |
| Nginx con recarga | Conocido | Recarga a mano y TLS comodín a mano |

## Consecuencias

- **DIP/OCP:** M5 y M6 dependen de `EnrutamientoPuerto`; cambiar de borde es otro adaptador.
- Aislamiento: apps de distintos clientes no comparten red.
- En desarrollo no hace falta DNS: los navegadores resuelven `*.localhost` a 127.0.0.1.
