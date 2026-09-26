# Contrato · API de despliegues (M4 → web, M3 → M4)

Versión 1 · dueño: Derek · consumidores: Eduardo (web, M3). Cambiarlo exige avisar antes de mergear. Spec: [../../openspec/specs/motor-construccion/spec.md](../../openspec/specs/motor-construccion/spec.md).

## Servicio interno (M3 → M4)

```ts
ConstruccionService.crearDespliegue(proyectoId: string): Promise<{ id: string; numero: number; estado: "encolado" }>
```

`POST /proyectos` de M3 lo llama después de persistir el proyecto. Rechaza con 409 si la suscripción está Vencida o Suspendida o se agotaron las construcciones del mes (`cuotaDe`).

## HTTP (requiere sesión; solo el dueño del proyecto)

```text
POST /proyectos/:id/despliegues
  → 201 { id, numero, estado }

GET  /despliegues/:id
  → 200 {
      id, numero, proyectoId,
      estado: "encolado" | "construyendo" | "aprovisionando" | "publicando" | "saludable" | "fallido" | "cancelado" | "detenido",
      commit: { sha, mensaje, rama, autor },
      url: string | null,
      imagen: { digest, tamanoBytes } | null,
      codigoSalida: number | null,
      creado, terminado,
      etapas: [
        { nombre: "recepcion" | "construccion" | "ejecucion" | "enrutamiento" | "operacion",
          estado: "pendiente" | "en-curso" | "completada" | "fallida",
          duracionMs: number | null }
      ]
    }

GET  /despliegues/:id/bitacora?desde=<n>
  → 200 { lineas: [{ n, marca, etapa, texto, nivel: "info" | "aviso" | "error" }], siguiente: number, terminado: boolean }
```

- `desde` es el último `n` recibido (0 al empezar). El panel pregunta cada 3 s mientras `terminado` sea `false`.
- `marca` es ISO 8601 con milisegundos; la web la muestra como `HH:mm:ss.SSS`.
- `etapas` siempre trae las cinco, en orden, para `RielEtapas`.
- Los valores de `estado` coinciden con `components/deploya/estados.ts`.

## Lista de proyectos (M3)

`GET /proyectos` incluye por proyecto `ultimoDespliegue: { id, numero, estado, etapas, creado } | null` para el riel de 55px de la pantalla 10.
