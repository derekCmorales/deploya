import { datosDePrueba } from "../../pruebas/datos";

const USUARIO = "usuario-1";

describe("MotorDatosService (trabajador, feat/m5-recursos-datos)", () => {
  describe("crear", () => {
    it("Crear un Postgres: el trabajador levanta contenedor y volumen en la red del dueño, crea pgvector y lo deja disponible", async () => {
      const datos = datosDePrueba();
      const vista = await datos.servicio.crear(USUARIO, "api", "postgres");

      await datos.procesar();

      expect(datos.docker.creados[0]).toEqual(
        expect.objectContaining({
          nombre: "deploya-datos-api-postgres",
          volumen: "deploya-datos-api-postgres",
          imagen: "pgvector/pgvector:pg17",
          rutaDatos: "/var/lib/postgresql/data",
          red: "deploya-p-api",
          redesCompartidas: [],
          memoriaMb: 512,
          subdominioDueno: "api",
        }),
      );
      expect(datos.docker.creados[0].entorno).toEqual(expect.objectContaining({ POSTGRES_USER: "deploya", POSTGRES_DB: "app" }));
      expect(datos.docker.preparados[0].comandos.flat()).toContain("CREATE EXTENSION IF NOT EXISTS vector");
      expect(await datos.repositorio.porId(vista.id)).toMatchObject({ estado: "disponible", detalle: null });
      expect(datos.rutas.publicadas).toEqual([]);
    });

    it("La red se crea aunque el proyecto no tenga despliegue: el recurso nace conectado a deploya-p-<subdominio>", async () => {
      const datos = datosDePrueba();
      await datos.servicio.crear(USUARIO, "web", "redis");

      await datos.procesar();

      expect(datos.docker.conectadoA("deploya-datos-web-redis", "deploya-p-web")).toBe(true);
      expect(datos.docker.creados[0].comando).toEqual(["redis-server", "--appendonly", "yes", "--requirepass", expect.stringMatching(/^[a-z]{32}$/)]);
    });

    it("Ruta pública del S3: publica <subdominio>-s3 hacia el contenedor en el puerto 9000", async () => {
      const datos = datosDePrueba();
      await datos.servicio.crear(USUARIO, "api", "s3");

      await datos.procesar();

      expect(datos.rutas.publicadas).toEqual([{ subdominio: "api-s3", host: "deploya-datos-api-s3", puerto: 9000 }]);
    });

    it("Bucket con versionado: la preparación del S3 crea el bucket app y activa el versionado con mc", async () => {
      const datos = datosDePrueba();
      await datos.servicio.crear(USUARIO, "api", "s3");

      await datos.procesar();

      const comandos = datos.docker.preparados[0].comandos.map((c) => c.slice(0, 3).join(" "));
      expect(comandos).toEqual(["mc alias set", "mc mb --ignore-existing", "mc version enable"]);
      expect(datos.docker.preparados[0].comandos[2]).toContain("local/app");
    });

    it("Imagen que no arranca: el recurso queda en error con el detalle", async () => {
      const datos = datosDePrueba();
      datos.docker.falloPreparacion = new Error("«pg_isready -h» no respondió en 180 s");
      const vista = await datos.servicio.crear(USUARIO, "api", "postgres");

      await datos.procesar();

      expect(await datos.repositorio.porId(vista.id)).toMatchObject({ estado: "error", detalle: "«pg_isready -h» no respondió en 180 s" });
    });

    it("crear un recurso que ya no está en creando (o que se borró) no hace nada", async () => {
      const datos = datosDePrueba();
      const vista = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.repositorio.eliminar(vista.id);

      await datos.motor.ejecutar({ accion: "crear", recursoId: vista.id });

      expect(datos.docker.creados).toEqual([]);
    });

    it("un recurso compartido antes de terminar de crearse nace también en la red del otro proyecto", async () => {
      const datos = datosDePrueba();
      const vista = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.repositorio.compartir(vista.id, "worker");

      await datos.motor.ejecutar({ accion: "crear", recursoId: vista.id });

      expect(datos.docker.creados[0].redesCompartidas).toEqual(["deploya-p-worker"]);
    });
  });

  describe("compartir y eliminar", () => {
    it("Compartir conecta el contenedor a la red del otro proyecto y dejar de compartir lo desconecta", async () => {
      const datos = datosDePrueba();
      const vista = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.procesar();

      await datos.servicio.compartir(USUARIO, "api", vista.id, "worker");
      await datos.procesar();
      const conectado = datos.docker.conectadoA("deploya-datos-api-postgres", "deploya-p-worker");
      await datos.servicio.dejarDeCompartir(USUARIO, "api", vista.id, "worker");
      await datos.procesar();

      expect(conectado).toBe(true);
      expect(datos.docker.conectadoA("deploya-datos-api-postgres", "deploya-p-worker")).toBe(false);
    });

    it("Eliminar desde el dueño borra contenedor y volumen, y retira la ruta del S3", async () => {
      const datos = datosDePrueba();
      const vista = await datos.servicio.crear(USUARIO, "api", "s3");
      await datos.procesar();

      await datos.servicio.eliminar(USUARIO, "api", vista.id, "s3");
      await datos.procesar();

      expect(datos.docker.eliminados).toEqual(["deploya-datos-api-s3"]);
      expect(datos.docker.volumenes.has("deploya-datos-api-s3")).toBe(false);
      expect(datos.rutas.retiradas).toEqual(["api-s3"]);
    });

    it("Eliminar proyecto dueño: sus recursos se borran con el volumen y su ruta S3 se retira", async () => {
      const datos = datosDePrueba();
      await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.procesar();

      await datos.motor.liberarProyecto("api");

      expect(datos.docker.volumenes.size).toBe(0);
      expect(datos.docker.proyectosLiberados).toEqual(["api"]);
      expect(datos.rutas.retiradas).toEqual(["api-s3"]);
    });

    it("Eliminar proyecto con el que se comparte: el recurso del dueño solo se desconecta de su red", async () => {
      const datos = datosDePrueba();
      const vista = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.procesar();
      await datos.servicio.compartir(USUARIO, "api", vista.id, "worker");
      await datos.procesar();

      await datos.motor.liberarProyecto("worker");

      expect(datos.docker.volumenes.has("deploya-datos-api-postgres")).toBe(true);
      expect(datos.docker.conectadoA("deploya-datos-api-postgres", "deploya-p-worker")).toBe(false);
      expect(datos.docker.conectadoA("deploya-datos-api-postgres", "deploya-p-api")).toBe(true);
    });
  });

  describe("suspensión", () => {
    it("Suspensión detiene: el contenedor se para, el volumen queda y el estado pasa a detenido; reanudar lo vuelve a disponible", async () => {
      const datos = datosDePrueba();
      const vista = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.procesar();

      await datos.servicio.detenerTodosDe(USUARIO);
      await datos.procesar();
      const detenido = await datos.repositorio.porId(vista.id);
      const corriendo = datos.docker.corriendo.has("deploya-datos-api-postgres");
      await datos.servicio.reanudarTodosDe(USUARIO);
      await datos.procesar();

      expect(detenido?.estado).toBe("detenido");
      expect(corriendo).toBe(false);
      expect(datos.docker.volumenes.has("deploya-datos-api-postgres")).toBe(true);
      expect(await datos.repositorio.porId(vista.id)).toMatchObject({ estado: "disponible" });
      expect(datos.docker.corriendo.has("deploya-datos-api-postgres")).toBe(true);
    });
  });

  describe("paraDespliegue", () => {
    it("Variables inyectadas: un proyecto con su postgres y un redis compartido recibe las de ambos y queda en su red", async () => {
      const datos = datosDePrueba();
      await datos.servicio.crear(USUARIO, "worker", "postgres");
      const redis = await datos.servicio.crear(USUARIO, "api", "redis");
      await datos.procesar();
      await datos.repositorio.compartir(redis.id, "worker");

      const inyeccion = await datos.motor.paraDespliegue({ id: "worker", subdominio: "worker" });

      expect(inyeccion.recursos.sort()).toEqual(["PostgreSQL 17 + pgvector", "Redis 7"]);
      expect(inyeccion.variables.base.DATABASE_URL).toMatch(/^postgresql:\/\/deploya:[a-z]{32}@deploya-datos-worker-postgres:5432\/app$/);
      expect(inyeccion.variables.base.REDIS_URL).toMatch(/^redis:\/\/default:[a-z]{32}@deploya-datos-api-redis:6379$/);
      expect(Object.keys(inyeccion.variables.prefijadas).sort()).toEqual(["DEPLOYA_POSTGRES_URL", "DEPLOYA_REDIS_URL"]);
      expect(datos.docker.conectadoA("deploya-datos-api-redis", "deploya-p-worker")).toBe(true);
    });

    it("un recurso en error no se inyecta y uno creando no se conecta todavía", async () => {
      const datos = datosDePrueba();
      const postgres = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.servicio.crear(USUARIO, "api", "redis");
      await datos.repositorio.cambiarEstado(postgres.id, "error", "falló");

      const inyeccion = await datos.motor.paraDespliegue({ id: "api", subdominio: "api" });

      expect(inyeccion.recursos).toEqual(["Redis 7"]);
      expect(datos.docker.redes.size).toBe(0);
    });

    it("sin recursos no inyecta nada", async () => {
      const datos = datosDePrueba();

      expect(await datos.motor.paraDespliegue({ id: "web", subdominio: "web" })).toEqual({ recursos: [], variables: { base: {}, prefijadas: {} } });
    });
  });

  describe("medición de disco", () => {
    it("Medición periódica: guarda el uso en MB y la hora de cada recurso disponible", async () => {
      const datos = datosDePrueba();
      const vista = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.procesar();
      datos.docker.usoMb.set("deploya-datos-api-postgres", 37);
      datos.reloj.avanzar(5 * 60 * 1000);

      const medidos = await datos.motor.medirDiscos();

      expect(medidos).toBe(1);
      expect(await datos.repositorio.porId(vista.id)).toMatchObject({ usoDiscoMb: 37, medidoEn: new Date("2026-11-12T10:05:00.000Z") });
    });

    it("Sobre el límite no corta: un uso mayor que el disco del plan se guarda y el recurso sigue disponible", async () => {
      const datos = datosDePrueba();
      const vista = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.procesar();
      datos.docker.usoMb.set("deploya-datos-api-postgres", 4096);

      await datos.motor.medirDiscos();

      const lista = await datos.servicio.listar(USUARIO, "api");
      expect(lista.recursos[0]).toMatchObject({ id: vista.id, estado: "disponible", usoDiscoMb: 4096, limiteDiscoMb: 2048 });
      expect(datos.docker.corriendo.has("deploya-datos-api-postgres")).toBe(true);
    });

    it("un contenedor que no se pudo medir no pisa la medición anterior", async () => {
      const datos = datosDePrueba();
      const vista = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.procesar();
      await datos.repositorio.registrarUso(vista.id, 12, datos.reloj.ahora());
      await datos.docker.detener("deploya-datos-api-postgres");

      expect(await datos.motor.medirDiscos()).toBe(0);
      expect((await datos.repositorio.porId(vista.id))?.usoDiscoMb).toBe(12);
    });
  });
});
