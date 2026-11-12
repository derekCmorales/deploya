import { datosDePrueba } from "../../pruebas/datos";
import {
  ConfirmacionRecursoNoCoincide,
  LimiteRecursosDatos,
  ProyectoDatosNoEncontrado,
  RecursoNoEncontrado,
  SuscripcionBloqueada,
  TipoYaConectado,
} from "./dominio/errores";

const USUARIO = "usuario-1";

describe("DatosService (feat/m5-recursos-datos)", () => {
  describe("crear", () => {
    it("Crear un Postgres: responde la vista en «creando», guarda la contraseña cifrada y encola crear", async () => {
      const datos = datosDePrueba();

      const vista = await datos.servicio.crear(USUARIO, "api", "postgres");

      expect(vista).toMatchObject({
        tipo: "postgres",
        nombre: "PostgreSQL 17 + pgvector",
        estado: "creando",
        host: "deploya-datos-api-postgres",
        puerto: 5432,
        urlPublica: null,
        esDueno: true,
        proyectoDueno: { id: "api", nombre: "api" },
        compartidoCon: [],
        usoDiscoMb: null,
        limiteDiscoMb: 2048,
        creado: "2026-11-12T10:00:00.000Z",
      });
      expect(vista.variablesInyectadas).toEqual(["DATABASE_URL", "PGHOST", "PGPORT", "PGUSER", "PGPASSWORD", "PGDATABASE", "DEPLOYA_POSTGRES_URL"]);
      const guardado = await datos.repositorio.porId(vista.id);
      expect(guardado?.contrasenaCifrada).not.toContain("a".repeat(32));
      expect(datos.cifrador.descifrar(guardado!.contrasenaCifrada)).toMatch(/^[A-Za-z0-9]{32}$/);
      expect(datos.cola.comandos).toEqual([{ accion: "crear", recursoId: vista.id }]);
    });

    it("Límite del plan: con los recursos de la cuenta agotados responde LIMITE_RECURSOS_DATOS y no encola", async () => {
      const datos = datosDePrueba();
      datos.cuota.fijar(USUARIO, { maxRecursosDatos: 1 });
      await datos.servicio.crear(USUARIO, "api", "postgres");

      await expect(datos.servicio.crear(USUARIO, "worker", "redis")).rejects.toThrow(LimiteRecursosDatos);
      expect(datos.cola.comandos).toHaveLength(1);
    });

    it("Un tipo por proyecto: un segundo postgres en el mismo proyecto responde TIPO_YA_CONECTADO", async () => {
      const datos = datosDePrueba();
      await datos.servicio.crear(USUARIO, "api", "postgres");

      await expect(datos.servicio.crear(USUARIO, "api", "postgres")).rejects.toThrow(TipoYaConectado);
    });

    it("Un tipo por proyecto: tampoco si el postgres le llega compartido de otro proyecto", async () => {
      const datos = datosDePrueba();
      const recurso = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.servicio.compartir(USUARIO, "api", recurso.id, "worker");

      await expect(datos.servicio.crear(USUARIO, "worker", "postgres")).rejects.toThrow(TipoYaConectado);
    });

    it.each(["vencida", "suspendida"] as const)("Suscripción bloqueada: %s responde SUSCRIPCION_BLOQUEADA", async (estado) => {
      const datos = datosDePrueba();
      datos.cuota.fijar(USUARIO, { estado });

      await expect(datos.servicio.crear(USUARIO, "api", "redis")).rejects.toThrow(SuscripcionBloqueada);
      expect(await datos.repositorio.conectadosA("api")).toHaveLength(0);
    });

    it("Proyecto ajeno: otro usuario recibe 404 como si no existiera", async () => {
      const datos = datosDePrueba();

      await expect(datos.servicio.crear(USUARIO, "ajeno", "postgres")).rejects.toThrow(ProyectoDatosNoEncontrado);
      await expect(datos.servicio.listar(USUARIO, "no-existe")).rejects.toThrow(ProyectoDatosNoEncontrado);
    });
  });

  describe("listar", () => {
    it("lista propios y compartidos, el límite de la cuenta y los tipos que aún se pueden agregar", async () => {
      const datos = datosDePrueba();
      const postgres = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.servicio.crear(USUARIO, "worker", "redis");
      await datos.servicio.compartir(USUARIO, "api", postgres.id, "worker");

      const lista = await datos.servicio.listar(USUARIO, "worker");

      expect(lista.recursos.map((r) => [r.tipo, r.esDueno])).toEqual([["redis", true], ["postgres", false]]);
      expect(lista.limite).toEqual({ usados: 2, maximo: 3 });
      expect(lista.tiposDisponibles).toEqual(["s3"]);
      expect(lista.recursos[1].proyectoDueno).toEqual({ id: "api", nombre: "api" });
    });

    it("Autoalojado sin tope: el máximo llega como Infinity (null en JSON) y se puede crear", async () => {
      const datos = datosDePrueba();
      datos.cuota.fijar(USUARIO, { maxRecursosDatos: Number.POSITIVE_INFINITY });
      await datos.servicio.crear(USUARIO, "api", "postgres");

      const lista = await datos.servicio.listar(USUARIO, "api");

      expect(lista.limite).toEqual({ usados: 1, maximo: Number.POSITIVE_INFINITY });
      expect(JSON.parse(JSON.stringify(lista.limite))).toEqual({ usados: 1, maximo: null });
    });
  });

  describe("conexion", () => {
    it("Conexión para copiar: devuelve los valores reales de las variables con la contraseña descifrada", async () => {
      const datos = datosDePrueba();
      const s3 = await datos.servicio.crear(USUARIO, "api", "s3");

      const { variables } = await datos.servicio.conexion(USUARIO, "api", s3.id);

      expect(variables).toMatchObject({
        S3_ENDPOINT: "http://deploya-datos-api-s3:9000",
        S3_PUBLIC_ENDPOINT: "https://api-s3.deploya.app",
        S3_ACCESS_KEY: "deploya",
        S3_BUCKET: "app",
        S3_REGION: "us-east-1",
        DEPLOYA_S3_BUCKET: "app",
      });
      expect(variables.S3_SECRET_KEY).toBe(variables.DEPLOYA_S3_SECRET_KEY);
      expect(variables.S3_SECRET_KEY).toHaveLength(32);
    });

    it("un recurso que no está conectado al proyecto responde 404", async () => {
      const datos = datosDePrueba();
      const postgres = await datos.servicio.crear(USUARIO, "api", "postgres");

      await expect(datos.servicio.conexion(USUARIO, "worker", postgres.id)).rejects.toThrow(RecursoNoEncontrado);
    });
  });

  describe("compartir", () => {
    it("Compartir con otro proyecto del mismo usuario: lo agrega a compartidoCon y encola conectar a su red", async () => {
      const datos = datosDePrueba();
      const postgres = await datos.servicio.crear(USUARIO, "api", "postgres");

      const vista = await datos.servicio.compartir(USUARIO, "api", postgres.id, "worker");

      expect(vista.compartidoCon).toEqual([{ id: "worker", nombre: "worker" }]);
      expect(datos.cola.comandos.at(-1)).toEqual({
        accion: "conectar",
        recursoId: postgres.id,
        tipo: "postgres",
        subdominioDueno: "api",
        subdominio: "worker",
      });
      expect((await datos.servicio.listar(USUARIO, "api")).limite.usados).toBe(1);
    });

    it("compartir dos veces con el mismo proyecto no encola de nuevo", async () => {
      const datos = datosDePrueba();
      const postgres = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.servicio.compartir(USUARIO, "api", postgres.id, "worker");

      await datos.servicio.compartir(USUARIO, "api", postgres.id, "worker");

      expect(datos.cola.comandos.filter((c) => c.accion === "conectar")).toHaveLength(1);
    });

    it("Compartir con un proyecto que ya tiene ese tipo responde TIPO_YA_CONECTADO", async () => {
      const datos = datosDePrueba();
      const postgres = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.servicio.crear(USUARIO, "worker", "postgres");

      await expect(datos.servicio.compartir(USUARIO, "api", postgres.id, "worker")).rejects.toThrow(TipoYaConectado);
      await expect(datos.servicio.compartir(USUARIO, "api", postgres.id, "api")).rejects.toThrow(TipoYaConectado);
    });

    it("Compartir con un proyecto de otro usuario responde 404", async () => {
      const datos = datosDePrueba();
      const postgres = await datos.servicio.crear(USUARIO, "api", "postgres");

      await expect(datos.servicio.compartir(USUARIO, "api", postgres.id, "ajeno")).rejects.toThrow(ProyectoDatosNoEncontrado);
    });

    it("solo el dueño comparte: desde un proyecto que lo usa compartido responde 404", async () => {
      const datos = datosDePrueba();
      const postgres = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.servicio.compartir(USUARIO, "api", postgres.id, "worker");

      await expect(datos.servicio.compartir(USUARIO, "worker", postgres.id, "web")).rejects.toThrow(RecursoNoEncontrado);
    });

    it("Dejar de compartir: desde el dueño quita la conexión y encola desconectar", async () => {
      const datos = datosDePrueba();
      const postgres = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.servicio.compartir(USUARIO, "api", postgres.id, "worker");

      await datos.servicio.dejarDeCompartir(USUARIO, "api", postgres.id, "worker");

      expect((await datos.repositorio.porId(postgres.id))?.compartidoCon).toEqual([]);
      expect(datos.cola.comandos.at(-1)).toMatchObject({ accion: "desconectar", subdominioDueno: "api", subdominio: "worker" });
    });

    it("dejar de compartir con un proyecto que no lo tiene responde 404", async () => {
      const datos = datosDePrueba();
      const postgres = await datos.servicio.crear(USUARIO, "api", "postgres");

      await expect(datos.servicio.dejarDeCompartir(USUARIO, "api", postgres.id, "worker")).rejects.toThrow(RecursoNoEncontrado);
    });
  });

  describe("eliminar", () => {
    it("Eliminar desde el dueño: borra la fila y encola eliminar (contenedor y volumen)", async () => {
      const datos = datosDePrueba();
      const postgres = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.servicio.compartir(USUARIO, "api", postgres.id, "worker");

      await datos.servicio.eliminar(USUARIO, "api", postgres.id, " postgres ");

      expect(await datos.repositorio.porId(postgres.id)).toBeNull();
      expect(datos.cola.comandos.at(-1)).toEqual({ accion: "eliminar", recursoId: postgres.id, tipo: "postgres", subdominioDueno: "api" });
    });

    it("Eliminar desde un compartido: solo lo desconecta de ese proyecto", async () => {
      const datos = datosDePrueba();
      const postgres = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.servicio.compartir(USUARIO, "api", postgres.id, "worker");

      await datos.servicio.eliminar(USUARIO, "worker", postgres.id, "postgres");

      expect((await datos.repositorio.porId(postgres.id))?.compartidoCon).toEqual([]);
      expect(datos.cola.comandos.at(-1)).toMatchObject({ accion: "desconectar", subdominio: "worker" });
    });

    it("Confirmación que no coincide: no borra nada", async () => {
      const datos = datosDePrueba();
      const postgres = await datos.servicio.crear(USUARIO, "api", "postgres");

      await expect(datos.servicio.eliminar(USUARIO, "api", postgres.id, "redis")).rejects.toThrow(ConfirmacionRecursoNoCoincide);
      expect(await datos.repositorio.porId(postgres.id)).not.toBeNull();
    });
  });

  describe("suspensión de la cuenta", () => {
    it("Suspensión detiene: un detener por recurso disponible de la cuenta; los creando se omiten", async () => {
      const datos = datosDePrueba();
      const postgres = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.servicio.crear(USUARIO, "worker", "redis");
      await datos.repositorio.cambiarEstado(postgres.id, "disponible");

      const resultado = await datos.servicio.detenerTodosDe(USUARIO);

      expect(resultado).toEqual({ encolados: 1 });
      expect(datos.cola.comandos.at(-1)).toEqual({ accion: "detener", recursoId: postgres.id, tipo: "postgres", subdominioDueno: "api" });
    });

    it("Reactivación inicia: un iniciar por recurso detenido", async () => {
      const datos = datosDePrueba();
      const postgres = await datos.servicio.crear(USUARIO, "api", "postgres");
      await datos.repositorio.cambiarEstado(postgres.id, "detenido");

      expect(await datos.servicio.reanudarTodosDe(USUARIO)).toEqual({ encolados: 1 });
      expect(datos.cola.comandos.at(-1)).toMatchObject({ accion: "iniciar", recursoId: postgres.id });
    });
  });
});
