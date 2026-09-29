# M3 Proyectos y fuentes

Dueño: Eduardo. Spec: [`openspec/specs/proyectos/spec.md`](../../../../../openspec/specs/proyectos/spec.md). Alcance: [docs/alcance.md](../../../../../docs/alcance.md).

**Núcleo v4.1:** Lista y alta desde repositorio público de GitHub con `Dockerfile`, variables cifradas, configuración y eliminación. Pide a M4 el primer despliegue.

**Pantallas:** 10, 11, 17, 19.

**Fuera de alcance (solo si da el tiempo):** Zip, repos privados, recetas sin `Dockerfile`, espacios de trabajo.

## Avance 1 (M3-01, M3-02) · change `feat-m3-alta-proyecto`

```text
GET  /proyectos/health
GET  /proyectos                          → { proyectos[+ultimoDespliegue], usados, maximo, plan }
POST /proyectos/validar-repositorio      { url, rama? } → { accesible, urlNormalizada, repositorio, rama, ramas, commit, dockerfile, puerto }
POST /proyectos                          { url, rama, nombre, puerto? } → 201 { proyecto, despliegue }
Errores: { codigo, mensaje, ...detalle } — url-invalida · datos-invalidos (400), repositorio-no-accesible · rama-no-encontrada · sin-dockerfile (422),
         fuente-no-disponible (503), subdominio-en-uso · limite-proyectos (409)
```

- `dominio/`: tipos, errores y funciones puras. `puertos/`: `ProveedorFuente`, `RepositorioProyectos`, `CuotaProyectosPuerto`. `adaptadores/`: `FuenteGitHubPublica`, `CuotaProyectosStub`.
- `RepositorioProyectos` lo registra `AdaptersModule` (memoria hasta DB-01) y el motor lo lee como `ProyectosLecturaPuerto`.
- Variables: `GITHUB_TOKEN` (recomendado para la demo), `GITHUB_API_URL` (opcional).
