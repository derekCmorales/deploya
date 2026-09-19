export const ETAPAS_CICLO = [
  "recepcion",
  "construccion",
  "ejecucion",
  "enrutamiento",
  "operacion",
] as const;

export type EtapaCiclo = (typeof ETAPAS_CICLO)[number];

export const ETAPA_ETIQUETA: Record<EtapaCiclo, string> = {
  recepcion: "Recepción",
  construccion: "Construcción",
  ejecucion: "Ejecución",
  enrutamiento: "Enrutamiento",
  operacion: "Operación",
};

export const ESTADOS_DESPLIEGUE = [
  "Encolado",
  "Construyendo",
  "Aprovisionando",
  "Publicando",
  "Saludable",
  "Fallido",
  "Revirtiendo",
  "Detenido",
] as const;

export type EstadoDespliegue = (typeof ESTADOS_DESPLIEGUE)[number];

export type ProveedorFuente = "repositorio" | "archivo-comprimido";

export type Proyecto = {
  id: string;
  nombre: string;
  fuente: ProveedorFuente;
  origen: string;
  subdominio: string;
  etapa: EtapaCiclo;
  estado: EstadoDespliegue;
  actualizado: string;
  resumen: string;
};

export const proyectos: Proyecto[] = [
  {
    id: "tienda-web",
    nombre: "tienda-web",
    fuente: "repositorio",
    origen: "github.com/acme/tienda-web",
    subdominio: "tienda.deploya.app",
    etapa: "operacion",
    estado: "Saludable",
    actualizado: "hace 4 min",
    resumen: "Artefacto v12 en línea. Certificado TLS renovado.",
  },
  {
    id: "api-catalogo",
    nombre: "api-catalogo",
    fuente: "repositorio",
    origen: "github.com/acme/api-catalogo",
    subdominio: "api-catalogo.deploya.app",
    etapa: "construccion",
    estado: "Construyendo",
    actualizado: "hace 1 min",
    resumen: "Detectando stack e imagen versionada. No encola M4 real.",
  },
  {
    id: "landing-evento",
    nombre: "landing-evento",
    fuente: "archivo-comprimido",
    origen: "landing-evento.zip",
    subdominio: "evento.deploya.app",
    etapa: "recepcion",
    estado: "Encolado",
    actualizado: "hace 12 min",
    resumen: "Fuente zip registrada. Construcción pendiente.",
  },
  {
    id: "panel-interno",
    nombre: "panel-interno",
    fuente: "repositorio",
    origen: "github.com/acme/panel-interno",
    subdominio: "interno.deploya.app",
    etapa: "construccion",
    estado: "Fallido",
    actualizado: "hace 28 min",
    resumen: "La receta de arranque no expone el puerto HTTP.",
  },
  {
    id: "docs-publicos",
    nombre: "docs-publicos",
    fuente: "repositorio",
    origen: "github.com/acme/docs",
    subdominio: "docs.deploya.app",
    etapa: "enrutamiento",
    estado: "Publicando",
    actualizado: "hace 2 min",
    resumen: "Conmutación de tráfico y certificado en curso.",
  },
  {
    id: "bot-avisos",
    nombre: "bot-avisos",
    fuente: "archivo-comprimido",
    origen: "bot-avisos.tar.gz",
    subdominio: "avisos.deploya.app",
    etapa: "ejecucion",
    estado: "Aprovisionando",
    actualizado: "hace 7 min",
    resumen: "Contenedor con límites de CPU y memoria del plan.",
  },
  {
    id: "sitio-archivo",
    nombre: "sitio-archivo",
    fuente: "repositorio",
    origen: "github.com/acme/archivo",
    subdominio: "archivo.deploya.app",
    etapa: "operacion",
    estado: "Detenido",
    actualizado: "hace 2 h",
    resumen: "Entorno detenido a petición. Artefacto v3 conservado.",
  },
];

export const proyectoPorDefecto = proyectos[0];

export function proyectoPorId(id: string): Proyecto | undefined {
  return proyectos.find((p) => p.id === id);
}
