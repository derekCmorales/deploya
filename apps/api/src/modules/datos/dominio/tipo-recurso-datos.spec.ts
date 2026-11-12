import { nombreRecursoDatos, esTipoRecurso } from "./recurso-datos";
import { nombresVariables, tipoRecursoDe, TIPOS_RECURSO_DATOS } from "./tipo-recurso-datos";

const CONEXION = { host: "deploya-datos-nimbo-postgres", contrasena: "Secreta123", urlPublica: null };

describe("TipoRecursoDatos (Strategy por tipo)", () => {
  it("cada tipo declara la imagen, el puerto y la memoria del contrato", () => {
    const tabla = Object.values(TIPOS_RECURSO_DATOS).map((t) => [t.tipo, t.imagen, t.puerto, t.memoriaMb, t.publico]);

    expect(tabla).toEqual([
      ["postgres", "pgvector/pgvector:pg17", 5432, 512, false],
      ["redis", "redis:7-alpine", 6379, 256, false],
      ["s3", "pgsty/silo", 9000, 512, true],
    ]);
  });

  it("Postgres inyecta DATABASE_URL y PG* con usuario deploya y base app, más DEPLOYA_POSTGRES_URL", () => {
    const { base, prefijadas } = tipoRecursoDe("postgres").variables(CONEXION);

    expect(base).toEqual({
      DATABASE_URL: "postgresql://deploya:Secreta123@deploya-datos-nimbo-postgres:5432/app",
      PGHOST: "deploya-datos-nimbo-postgres",
      PGPORT: "5432",
      PGUSER: "deploya",
      PGPASSWORD: "Secreta123",
      PGDATABASE: "app",
    });
    expect(prefijadas).toEqual({ DEPLOYA_POSTGRES_URL: base.DATABASE_URL });
  });

  it("Redis arranca con AOF y contraseña e inyecta REDIS_URL y DEPLOYA_REDIS_URL", () => {
    const redis = tipoRecursoDe("redis");

    expect(redis.comando("Secreta123")).toEqual(["redis-server", "--appendonly", "yes", "--requirepass", "Secreta123"]);
    expect(redis.entorno("Secreta123")).toEqual({});
    expect(redis.variables({ ...CONEXION, host: "r" })).toEqual({
      base: { REDIS_URL: "redis://default:Secreta123@r:6379" },
      prefijadas: { DEPLOYA_REDIS_URL: "redis://default:Secreta123@r:6379" },
    });
  });

  it("S3 inyecta el endpoint interno y el público, credenciales, bucket app y región us-east-1", () => {
    const { base, prefijadas } = tipoRecursoDe("s3").variables({ host: "s", contrasena: "x", urlPublica: "https://nimbo-s3.deploya.app" });

    expect(base).toEqual({
      S3_ENDPOINT: "http://s:9000",
      S3_PUBLIC_ENDPOINT: "https://nimbo-s3.deploya.app",
      S3_ACCESS_KEY: "deploya",
      S3_SECRET_KEY: "x",
      S3_BUCKET: "app",
      S3_REGION: "us-east-1",
    });
    expect(Object.keys(prefijadas)).toEqual([
      "DEPLOYA_S3_ENDPOINT",
      "DEPLOYA_S3_PUBLIC_ENDPOINT",
      "DEPLOYA_S3_ACCESS_KEY",
      "DEPLOYA_S3_SECRET_KEY",
      "DEPLOYA_S3_BUCKET",
    ]);
  });

  it("S3 sin URL pública (sin dominio) usa el endpoint interno también como público", () => {
    expect(tipoRecursoDe("s3").variables({ host: "s", contrasena: "x", urlPublica: null }).base.S3_PUBLIC_ENDPOINT).toBe("http://s:9000");
  });

  it("S3 arranca el servidor en /data con el usuario deploya y sin consola web", () => {
    const s3 = tipoRecursoDe("s3");

    expect(s3.comando("x")).toEqual(["server", "/data", "--address", ":9000"]);
    expect(s3.entorno("x")).toEqual({ MINIO_ROOT_USER: "deploya", MINIO_ROOT_PASSWORD: "x", MINIO_BROWSER: "off" });
  });

  it("Postgres usa el CMD de la imagen", () => {
    expect(tipoRecursoDe("postgres").comando("x")).toBeNull();
  });

  it("nombresVariables lista solo nombres, sin valores", () => {
    expect(nombresVariables("redis")).toEqual(["REDIS_URL", "DEPLOYA_REDIS_URL"]);
  });

  it("nombre del contenedor y del volumen: deploya-datos-<subdominio-dueño>-<tipo>", () => {
    expect(nombreRecursoDatos("nimbo-api", "postgres")).toBe("deploya-datos-nimbo-api-postgres");
  });

  it("solo postgres, redis y s3 son tipos válidos", () => {
    expect(["postgres", "redis", "s3"].every(esTipoRecurso)).toBe(true);
    expect(esTipoRecurso("mysql")).toBe(false);
    expect(esTipoRecurso(3)).toBe(false);
  });
});
