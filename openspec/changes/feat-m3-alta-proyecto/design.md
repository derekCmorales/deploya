# Diseño Técnico: feat-m3-alta-proyecto

## Diseño: SOLID y patrones
* **Adapter Pattern (`Proveedor` ← `FuenteGitHubPublica`):** Aisla la comunicación con la API REST de GitHub del núcleo de dominio. Permite utilizar dobles (*mocks*) en las pruebas unitarias evitando llamadas a red y consumo de cuota de la API pública.
* **Repository Pattern (`RepositorioProyectos`):** Desacopla la persistencia de la lógica de negocio mediante una interfaz abstracta (implementada temporalmente en memoria con un `Map` y preparada para Prisma con `DB-01`).
* **Funciones Puras:** 
  * `puertoDesdeExpose`: Analiza de forma determinista el contenido de un archivo Dockerfile para extraer el primer puerto HTTP expuesto de manera válida.
  * `subdominioDesdeNombre`: Sanitiza y transforma el nombre del proyecto en una etiqueta DNS válida y única (minúsculas, sin acentos, caracteres especiales limitados a `[a-z0-9-]`, máximo 63 caracteres).
  * `validarAltaProyecto`: Valida la estructura y reglas estrictas del cuerpo de la solicitud de alta (reemplazando DTOs tradicionales de class-validator).
* **Fachada Consumida (`ConstruccionService`):** Inyección de la fachada del módulo M4 para invocar `crearDespliegue(proyecto.id, "alta")` y `ultimosDespliegues(ids)`.
* **Arquitectura Frontend (Container / Presentational):** Estructura modular en Next.js apoyada por los hooks personalizados `useProyectos` y `useDespliegue` para gestionar el estado y la sincronización periódica (*polling*).

## Estructura de Componentes y Módulos
- **Backend:** Organizado en `dominio/`, `puertos/`, y `adaptadores/` bajo `apps/api/src/modules/proyectos/`.
- **Frontend:** Páginas ubicadas en `apps/web/src/app/(projects)/projects/` y componentes presentacionales en `_componentes/`.