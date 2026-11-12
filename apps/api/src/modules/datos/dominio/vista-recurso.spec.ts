import type { RecursoDatos } from "./recurso-datos";
import { enOrden, urlPublicaDe, vistaRecurso, type ContextoVista } from "./vista-recurso";

function recurso(cambios: Partial<RecursoDatos> = {}): RecursoDatos {
  return {
    id: "r1",
    proyectoId: "api",
    tipo: "s3",
    estado: "disponible",
    detalle: null,
    contenedor: "deploya-datos-api-s3",
    volumen: "deploya-datos-api-s3",
    contrasenaCifrada: "v1:x",
    usoDiscoMb: 12,
    medidoEn: null,
    creado: new Date("2026-11-12T10:00:00.000Z"),
    compartidoCon: ["worker"],
    ...cambios,
  };
}

const CONTEXTO: ContextoVista = {
  proyectoId: "worker",
  proyectos: new Map([
    ["api", { id: "api", nombre: "Nimbo API", subdominio: "api" }],
    ["worker", { id: "worker", nombre: "Nimbo Worker", subdominio: "worker" }],
  ]),
  limiteDiscoMb: 10240,
  dominio: { esquema: "https", dominioBase: "deploya.app" },
};

describe("VistaRecursoDatos", () => {
  it("vista desde un proyecto compartido: esDueno false, dueño y compartidos con nombre, URL pública del S3", () => {
    expect(vistaRecurso(recurso(), CONTEXTO)).toEqual({
      id: "r1",
      tipo: "s3",
      nombre: "Almacenamiento S3",
      estado: "disponible",
      detalle: null,
      host: "deploya-datos-api-s3",
      puerto: 9000,
      urlPublica: "https://api-s3.deploya.app",
      esDueno: false,
      proyectoDueno: { id: "api", nombre: "Nimbo API" },
      compartidoCon: [{ id: "worker", nombre: "Nimbo Worker" }],
      usoDiscoMb: 12,
      limiteDiscoMb: 10240,
      variablesInyectadas: [
        "S3_ENDPOINT",
        "S3_PUBLIC_ENDPOINT",
        "S3_ACCESS_KEY",
        "S3_SECRET_KEY",
        "S3_BUCKET",
        "S3_REGION",
        "DEPLOYA_S3_ENDPOINT",
        "DEPLOYA_S3_PUBLIC_ENDPOINT",
        "DEPLOYA_S3_ACCESS_KEY",
        "DEPLOYA_S3_SECRET_KEY",
        "DEPLOYA_S3_BUCKET",
      ],
      creado: "2026-11-12T10:00:00.000Z",
    });
  });

  it("la vista nunca lleva la contraseña ni sus valores", () => {
    expect(JSON.stringify(vistaRecurso(recurso(), CONTEXTO))).not.toContain("v1:x");
  });

  it("solo s3 tiene URL pública", () => {
    const dominio = { esquema: "http", dominioBase: "localhost" };
    expect(urlPublicaDe("s3", "nimbo", dominio)).toBe("http://nimbo-s3.localhost");
    expect(urlPublicaDe("postgres", "nimbo", dominio)).toBeNull();
  });

  it("un proyecto que ya no está en el mapa aparece como eliminado y sin URL", () => {
    const vista = vistaRecurso(recurso({ proyectoId: "borrado" }), CONTEXTO);
    expect(vista.proyectoDueno).toEqual({ id: "borrado", nombre: "(proyecto eliminado)" });
    expect(vista.urlPublica).toBeNull();
  });

  it("enOrden: propios primero, luego por tipo, y solo los conectados al proyecto", () => {
    const lista = [
      recurso({ id: "a", proyectoId: "api", tipo: "redis", compartidoCon: ["worker"] }),
      recurso({ id: "b", proyectoId: "worker", tipo: "s3", compartidoCon: [] }),
      recurso({ id: "c", proyectoId: "worker", tipo: "postgres", compartidoCon: [] }),
      recurso({ id: "d", proyectoId: "api", tipo: "postgres", compartidoCon: [] }),
    ];
    expect(enOrden(lista, "worker").map((r) => r.id)).toEqual(["c", "b", "a"]);
  });
});
