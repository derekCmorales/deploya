# M6 Enrutamiento y TLS

Dueño: Derek. Spec: [`openspec/specs/enrutamiento/spec.md`](../../../../../openspec/specs/enrutamiento/spec.md). Alcance: [docs/alcance.md](../../../../../docs/alcance.md).

**Núcleo v4.1:** `<proyecto>.deploya.app` vía `EnrutamientoPuerto` (Traefik), HTTPS comodín y conmutación sin corte.

**Pantallas:** 12b, 13 (vía M7).

**Fuera de alcance (solo si da el tiempo):** Dominios personalizados.

Hoy (Avance 2, M6-01): `PasoEnrutamiento` publica `<subdominio>.localhost` por `EnrutamientoPuerto` (Traefik con proveedor de archivo, ADR 0005) después de la salud; `EnrutamientoService.retirar` lo usan detener y eliminar. HTTPS comodín en el VPS: M6-02, Avance 3.
