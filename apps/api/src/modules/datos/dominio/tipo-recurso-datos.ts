import type { TipoRecurso } from "./recurso-datos";

/** Lo que un tipo necesita saber para armar sus variables (host en la red, secreto y ruta pública). */
export interface ConexionRecurso {
  host: string;
  contrasena: string;
  /** Solo `s3`: `https://<subdominio>-s3.<dominio>`. */
  urlPublica: string | null;
}

/** Variables que recibe cada app conectada: las de nombre corto ceden ante las del usuario; las `DEPLOYA_*` nunca. */
export interface VariablesRecurso {
  base: Record<string, string>;
  prefijadas: Record<string, string>;
}

/** Un comando que corre dentro del contenedor (`docker exec`, sin shell) hasta que sale con código 0. */
export type ComandoPreparacion = readonly string[];

/** Usuario y base fijos del contrato (recursos-datos.md). */
export const USUARIO_DATOS = "deploya";
export const BASE_POSTGRES = "app";
export const BUCKET_S3 = "app";
export const REGION_S3 = "us-east-1";

/**
 * Strategy: una clase por tipo de recurso con su imagen, puerto, memoria, dónde guarda los datos,
 * cómo arranca, qué variables inyecta y qué hay que hacer después de crearlo. Un tipo nuevo es una
 * clase nueva y una fila en `TIPOS_RECURSO_DATOS`; ni el servicio ni el adaptador Docker cambian (OCP).
 */
export abstract class TipoRecursoDatos {
  abstract readonly tipo: TipoRecurso;
  abstract readonly nombre: string;
  abstract readonly imagen: string;
  abstract readonly puerto: number;
  abstract readonly memoriaMb: number;
  /** Ruta del volumen dentro del contenedor. */
  abstract readonly rutaDatos: string;
  /** Con ruta pública en el enrutador de borde (`<subdominio>-s3`). */
  readonly publico: boolean = false;

  /** Variables de arranque del contenedor de datos (no las de la app). */
  abstract entorno(contrasena: string): Record<string, string>;

  /** Argumentos que reemplazan el `CMD` de la imagen; `null` = el de la imagen. */
  comando(_contrasena: string): string[] | null {
    return null;
  }

  /** Comandos que se repiten hasta salir con 0, en orden: listo para conexiones y acción post-creación. */
  abstract preparacion(contrasena: string): ComandoPreparacion[];

  abstract variables(conexion: ConexionRecurso): VariablesRecurso;
}

const POSTGRES_PUERTO = 5432;
const REDIS_PUERTO = 6379;
const S3_PUERTO = 9000;
const MEMORIA_POSTGRES_MB = 512;
const MEMORIA_REDIS_MB = 256;
const MEMORIA_S3_MB = 512;

/** PostgreSQL 17 con pgvector; la extensión `vector` queda creada en `app`. */
export class PostgresRecurso extends TipoRecursoDatos {
  readonly tipo = "postgres" as const;
  readonly nombre = "PostgreSQL 17 + pgvector";
  readonly imagen = "pgvector/pgvector:pg17";
  readonly puerto = POSTGRES_PUERTO;
  readonly memoriaMb = MEMORIA_POSTGRES_MB;
  readonly rutaDatos = "/var/lib/postgresql/data";

  entorno(contrasena: string): Record<string, string> {
    return { POSTGRES_USER: USUARIO_DATOS, POSTGRES_PASSWORD: contrasena, POSTGRES_DB: BASE_POSTGRES };
  }

  /**
   * `pg_isready` por TCP solo responde cuando terminó la inicialización (el servidor temporal del
   * entrypoint no escucha en red). Luego `CREATE EXTENSION` por el socket local (confianza local).
   */
  preparacion(): ComandoPreparacion[] {
    return [
      ["pg_isready", "-h", "127.0.0.1", "-U", USUARIO_DATOS, "-d", BASE_POSTGRES],
      ["psql", "-v", "ON_ERROR_STOP=1", "-U", USUARIO_DATOS, "-d", BASE_POSTGRES, "-c", "CREATE EXTENSION IF NOT EXISTS vector"],
    ];
  }

  variables({ host, contrasena }: ConexionRecurso): VariablesRecurso {
    const url = `postgresql://${USUARIO_DATOS}:${contrasena}@${host}:${this.puerto}/${BASE_POSTGRES}`;
    return {
      base: {
        DATABASE_URL: url,
        PGHOST: host,
        PGPORT: String(this.puerto),
        PGUSER: USUARIO_DATOS,
        PGPASSWORD: contrasena,
        PGDATABASE: BASE_POSTGRES,
      },
      prefijadas: { DEPLOYA_POSTGRES_URL: url },
    };
  }
}

/** Redis 7 con AOF (`--appendonly yes`) y contraseña. */
export class RedisRecurso extends TipoRecursoDatos {
  readonly tipo = "redis" as const;
  readonly nombre = "Redis 7";
  readonly imagen = "redis:7-alpine";
  readonly puerto = REDIS_PUERTO;
  readonly memoriaMb = MEMORIA_REDIS_MB;
  readonly rutaDatos = "/data";

  entorno(): Record<string, string> {
    return {};
  }

  comando(contrasena: string): string[] {
    return ["redis-server", "--appendonly", "yes", "--requirepass", contrasena];
  }

  preparacion(contrasena: string): ComandoPreparacion[] {
    return [["redis-cli", "--no-auth-warning", "-a", contrasena, "ping"]];
  }

  variables({ host, contrasena }: ConexionRecurso): VariablesRecurso {
    const url = `redis://default:${contrasena}@${host}:${this.puerto}`;
    return { base: { REDIS_URL: url }, prefijadas: { DEPLOYA_REDIS_URL: url } };
  }
}

/**
 * Silo (`pgsty/silo`, compatible con MinIO y S3). Al crearlo, `mc` (viene en la imagen) deja el
 * bucket `app` con versionado. Es el único tipo con ruta pública.
 */
export class S3Recurso extends TipoRecursoDatos {
  readonly tipo = "s3" as const;
  readonly nombre = "Almacenamiento S3";
  readonly imagen = "pgsty/silo";
  readonly puerto = S3_PUERTO;
  readonly memoriaMb = MEMORIA_S3_MB;
  readonly rutaDatos = "/data";
  override readonly publico = true;

  entorno(contrasena: string): Record<string, string> {
    return { MINIO_ROOT_USER: USUARIO_DATOS, MINIO_ROOT_PASSWORD: contrasena, MINIO_BROWSER: "off" };
  }

  comando(): string[] {
    return ["server", this.rutaDatos, "--address", `:${this.puerto}`];
  }

  preparacion(contrasena: string): ComandoPreparacion[] {
    const alias = "local";
    const bucket = `${alias}/${BUCKET_S3}`;
    return [
      ["mc", "alias", "set", alias, `http://127.0.0.1:${this.puerto}`, USUARIO_DATOS, contrasena],
      ["mc", "mb", "--ignore-existing", bucket],
      ["mc", "version", "enable", bucket],
    ];
  }

  variables({ host, contrasena, urlPublica }: ConexionRecurso): VariablesRecurso {
    const interno = `http://${host}:${this.puerto}`;
    const publico = urlPublica ?? interno;
    return {
      base: {
        S3_ENDPOINT: interno,
        S3_PUBLIC_ENDPOINT: publico,
        S3_ACCESS_KEY: USUARIO_DATOS,
        S3_SECRET_KEY: contrasena,
        S3_BUCKET: BUCKET_S3,
        S3_REGION: REGION_S3,
      },
      prefijadas: {
        DEPLOYA_S3_ENDPOINT: interno,
        DEPLOYA_S3_PUBLIC_ENDPOINT: publico,
        DEPLOYA_S3_ACCESS_KEY: USUARIO_DATOS,
        DEPLOYA_S3_SECRET_KEY: contrasena,
        DEPLOYA_S3_BUCKET: BUCKET_S3,
      },
    };
  }
}

/** Registro de estrategias: el único lugar que enumera los tipos. */
export const TIPOS_RECURSO_DATOS: Readonly<Record<TipoRecurso, TipoRecursoDatos>> = {
  postgres: new PostgresRecurso(),
  redis: new RedisRecurso(),
  s3: new S3Recurso(),
};

export function tipoRecursoDe(tipo: TipoRecurso): TipoRecursoDatos {
  return TIPOS_RECURSO_DATOS[tipo];
}

/** Nombres de todas las variables que el tipo inyecta (la vista solo muestra nombres). */
export function nombresVariables(tipo: TipoRecurso): string[] {
  const { base, prefijadas } = tipoRecursoDe(tipo).variables({ host: "h", contrasena: "c", urlPublica: null });
  return [...Object.keys(base), ...Object.keys(prefijadas)];
}
