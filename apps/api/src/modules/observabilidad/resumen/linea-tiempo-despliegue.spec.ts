import type { Artefacto, Despliegue, EtapaRegistrada } from "../../construccion/dominio/despliegue";
import type { EstadoEtapa, Etapa } from "../../construccion/dominio/estados";
import { LineaTiempoDespliegue } from "./linea-tiempo-despliegue";

const marca = (hora: string) => new Date(`2026-10-14T${hora}Z`);

function etapa(nombre: Etapa, estado: EstadoEtapa, iniciada?: string, terminada?: string): EtapaRegistrada {
  return { etapa: nombre, estado, iniciada: iniciada ? marca(iniciada) : null, terminada: terminada ? marca(terminada) : null };
}

const ARTEFACTO: Artefacto = {
  id: "a14",
  proyectoId: "p",
  numero: 14,
  imagen: "deploya/api-tienda:14",
  digest: "sha256:9f2c",
  tamanoBytes: 148 * 1024 * 1024,
  commitSha: "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678",
  receta: "dockerfile",
  disponible: true,
  creado: marca("12:05:53"),
};

function despliegue(cambios: Partial<Despliegue> = {}): Despliegue {
  return {
    id: "d-1",
    proyectoId: "p-1",
    numero: 14,
    estado: "saludable",
    disparador: "manual",
    rama: "main",
    commit: { sha: "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678", mensaje: "feat: carrito persistente", autor: "Dev" },
    artefactoId: "a14",
    contenedorId: "c-1",
    url: "https://app.com",
    cpus: 0.5,
    memoriaMb: 512,
    codigoSalida: 0,
    motivoFallo: null,
    fecha: marca("12:00:00"),
    creadoEn: marca("12:00:00"),
    creado: marca("12:00:00"),
    terminado: marca("12:06:23"),
    etapas: [
      etapa("recepcion", "completada", "12:04:00", "12:04:01"),
      etapa("construccion", "completada", "12:04:01", "12:05:53"),
      etapa("ejecucion", "completada", "12:05:53", "12:05:54"),
      etapa("enrutamiento", "completada", "12:05:54", "12:06:23"),
      etapa("operacion", "completada", "12:06:23", "12:06:23"),
    ],
    ...cambios,
  };
}

describe("LineaTiempoDespliegue (M7-02)", () => {
  it("Línea de tiempo del último despliegue: los cuatro hitos con su hora", () => {
    const hitos = LineaTiempoDespliegue.de(despliegue(), { artefacto: ARTEFACTO, anterior: 13 });

    expect(hitos).toEqual([
      { etapa: "recepcion", titulo: "Commit recibido", detalle: "a1b2c3d · feat: carrito persistente", marca: "2026-10-14T12:04:01.000Z" },
      { etapa: "construccion", titulo: "Imagen construida", detalle: "desde tu Dockerfile · 148 MB", marca: "2026-10-14T12:05:53.000Z" },
      { etapa: "ejecucion", titulo: "Contenedor iniciado", detalle: "0.5 vCPU · 512 MB", marca: "2026-10-14T12:05:54.000Z" },
      { etapa: "enrutamiento", titulo: "Tráfico redirigido", detalle: "#13 detenido · #14 en línea", marca: "2026-10-14T12:06:23.000Z" },
    ]);
  });

  it("sin versión anterior solo dice cuál está en línea", () => {
    const hitos = LineaTiempoDespliegue.de(despliegue({ numero: 1 }), { artefacto: ARTEFACTO, anterior: null });

    expect(hitos.at(-1)?.detalle).toBe("#1 en línea");
  });

  it("con receta la imagen dice de qué receta viene", () => {
    const hitos = LineaTiempoDespliegue.de(despliegue(), { artefacto: { ...ARTEFACTO, receta: "node" }, anterior: null });

    expect(hitos[1].detalle).toBe("desde la receta Node.js · 148 MB");
  });

  it("un hito aparece solo cuando su etapa terminó", () => {
    const enCurso = despliegue({
      estado: "aprovisionando",
      etapas: [
        etapa("recepcion", "completada", "12:04:01", "12:04:02"),
        etapa("construccion", "completada", "12:04:02", "12:05:53"),
        etapa("ejecucion", "en-curso", "12:05:54"),
        etapa("enrutamiento", "pendiente"),
        etapa("operacion", "pendiente"),
      ],
    });

    const hitos = LineaTiempoDespliegue.de(enCurso, { artefacto: ARTEFACTO, anterior: 13 });

    expect(hitos.map((h) => h.titulo)).toEqual(["Commit recibido", "Imagen construida"]);
  });

  it("una reversión no tiene hitos de commit ni de imagen: sus etapas se omitieron", () => {
    const reversion = despliegue({
      disparador: "reversion",
      etapas: [
        etapa("recepcion", "omitida"),
        etapa("construccion", "omitida"),
        etapa("ejecucion", "completada", "12:05:53", "12:05:54"),
        etapa("enrutamiento", "completada", "12:05:54", "12:06:23"),
        etapa("operacion", "completada", "12:06:23", "12:06:23"),
      ],
    });

    const hitos = LineaTiempoDespliegue.de(reversion, { artefacto: ARTEFACTO, anterior: 15 });

    expect(hitos.map((h) => h.titulo)).toEqual(["Contenedor iniciado", "Tráfico redirigido"]);
  });

  it("sin límites aplicados no hay hito de contenedor", () => {
    const hitos = LineaTiempoDespliegue.de(despliegue({ cpus: null, memoriaMb: null }), { artefacto: ARTEFACTO, anterior: null });

    expect(hitos.map((h) => h.titulo)).not.toContain("Contenedor iniciado");
  });
});