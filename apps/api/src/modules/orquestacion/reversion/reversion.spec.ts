import { Logger } from "@nestjs/common";
import { motorDePrueba } from "../../../pruebas/motor";
import { PipelineDespliegue } from "../../construccion/pipeline/pipeline-despliegue";
import { ProyectoNoEncontrado } from "../../construccion/dominio/errores";
import { OyenteDespliegue } from "../../construccion/puertos/oyente-despliegue.puerto";
import { ArtefactoNoDisponible, ArtefactoYaActivo, CuotaConstruccionesAgotada, DespliegueEnCurso } from "../dominio/errores";
import { ReversionController } from "./reversion.controller";

const SALUD_FALLIDA = { ok: false, estadoHttp: null, milisegundos: 60_000, detalle: "connect ECONNREFUSED" };

async function desplegarVarias(motor: ReturnType<typeof motorDePrueba>, cantidad: number) {
  for (let i = 0; i < cantidad; i++) await motor.desplegar();
}

async function artefactoNumero(motor: ReturnType<typeof motorDePrueba>, numero: number) {
  const artefacto = motor.artefactos.artefactos.find((a) => a.numero === numero);
  if (!artefacto) throw new Error(`No hay artefacto #${numero}`);
  return artefacto;
}

describe("Reversión sin reconstruir (M5-04)", () => {
  it("Revertir a una versión disponible", async () => {
    const motor = motorDePrueba();
    await desplegarVarias(motor, 3);
    const primero = await artefactoNumero(motor, 1);
    const tercero = await motor.despliegues.porNumero("proyecto-1", 3);
    motor.clonador.error = new Error("una reversión no clona");

    const reversion = await motor.revertir(primero.id);

    expect(reversion).toEqual(
      expect.objectContaining({ numero: 4, estado: "saludable", disparador: "reversion", artefactoId: primero.id }),
    );
    expect(reversion.etapas.map((e) => e.estado)).toEqual(["omitida", "omitida", "completada", "completada", "completada"]);
    expect(motor.contenedores.creados.at(-1)).toEqual(expect.objectContaining({ imagen: "deploya/hola-deploya:1", nombre: "deploya-hola-deploya-4" }));
    expect(motor.constructorImagen.solicitudes).toHaveLength(3);
    expect((await motor.despliegues.activoDe("proyecto-1"))?.id).toBe(reversion.id);
    expect(motor.contenedores.detenidos.at(-1)).toBe(tercero?.contenedorId);
    expect(motor.enrutamiento.publicadas.at(-1)).toEqual({ subdominio: "hola-deploya", host: "deploya-hola-deploya-4", puerto: 8080 });
  });

  it("la reversión conserva el commit del artefacto y dice que no reconstruye", async () => {
    const motor = motorDePrueba();
    await desplegarVarias(motor, 2);
    const primero = await artefactoNumero(motor, 1);

    const reversion = await motor.revertir(primero.id);

    expect(reversion.commit).toEqual(motor.clonador.commit);
    const lineas = await motor.despliegues.lineasDesde(reversion.id, 0, 500);
    expect(lineas.map((l) => l.texto)).toContain("Imagen deploya/hola-deploya:1 reutilizada · sin reconstruir");
  });

  it("No consume construcciones", async () => {
    const motor = motorDePrueba();
    motor.cuota.permiso = { estado: "activa", construccionesMes: 2 };
    await desplegarVarias(motor, 2);
    await expect(motor.servicio.desplegarComoDueno("proyecto-1", "usuario-1")).rejects.toThrow(CuotaConstruccionesAgotada);
    const primero = await artefactoNumero(motor, 1);

    const reversion = await motor.revertir(primero.id);

    expect(reversion.estado).toBe("saludable");
    expect(await motor.despliegues.contarConstruccionesDesde("usuario-1", new Date(0))).toBe(2);
  });

  it("Artefacto no disponible", async () => {
    const motor = motorDePrueba();
    await desplegarVarias(motor, 2);
    const primero = await artefactoNumero(motor, 1);
    await motor.artefactos.marcarNoDisponible(primero.id);
    const antes = (await motor.despliegues.ultimosDe(["proyecto-1"]))[0].numero;

    await expect(motor.reversion.revertir("proyecto-1", primero.id, "usuario-1")).rejects.toThrow(ArtefactoNoDisponible);

    expect((await motor.despliegues.ultimosDe(["proyecto-1"]))[0].numero).toBe(antes);
  });

  it("Artefacto ya activo", async () => {
    const motor = motorDePrueba();
    await desplegarVarias(motor, 2);
    const segundo = await artefactoNumero(motor, 2);

    await expect(motor.reversion.revertir("proyecto-1", segundo.id, "usuario-1")).rejects.toThrow(ArtefactoYaActivo);
  });

  it("Despliegue en curso", async () => {
    const motor = motorDePrueba();
    await desplegarVarias(motor, 2);
    const primero = await artefactoNumero(motor, 1);
    await motor.servicio.crearDespliegue("proyecto-1");

    await expect(motor.reversion.revertir("proyecto-1", primero.id, "usuario-1")).rejects.toThrow(DespliegueEnCurso);
  });

  it("Reversión que no pasa la salud", async () => {
    const motor = motorDePrueba();
    await desplegarVarias(motor, 2);
    const primero = await artefactoNumero(motor, 1);
    const segundo = await motor.despliegues.porNumero("proyecto-1", 2);
    motor.salud.resultado = SALUD_FALLIDA;

    const reversion = await motor.revertir(primero.id);

    expect(reversion.estado).toBe("fallido");
    expect(reversion.motivoFallo).toBe("No respondió en 60 s: connect ECONNREFUSED");
    expect((await motor.despliegues.activoDe("proyecto-1"))?.id).toBe(segundo?.id);
    expect(motor.contenedores.eliminados).toContain("contenedor-deploya-hola-deploya-3");
    expect(motor.contenedores.detenidos).toHaveLength(1);
  });

  it("un artefacto de otro proyecto se trata como no disponible", async () => {
    const motor = motorDePrueba();
    await desplegarVarias(motor, 2);

    await expect(motor.reversion.revertir("proyecto-1", "no-existe", "usuario-1")).rejects.toThrow(ArtefactoNoDisponible);
  });

  it("un proyecto ajeno se trata como inexistente", async () => {
    const motor = motorDePrueba();
    await desplegarVarias(motor, 2);
    const primero = await artefactoNumero(motor, 1);

    await expect(motor.reversion.revertir("proyecto-1", primero.id, "otro-usuario")).rejects.toThrow(ProyectoNoEncontrado);
    await expect(motor.reversion.artefactosDe("proyecto-1", "otro-usuario")).rejects.toThrow(ProyectoNoEncontrado);
  });

  it("los rechazos llevan el código del contrato", () => {
    expect(new ArtefactoNoDisponible("a").codigo).toBe("artefacto-no-disponible");
    expect(new ArtefactoYaActivo("a").codigo).toBe("artefacto-ya-activo");
    expect(new DespliegueEnCurso("p").codigo).toBe("despliegue-en-curso");
  });

  describe("Retención de artefactos", () => {
    it("Retención de cinco", async () => {
      const motor = motorDePrueba();

      await desplegarVarias(motor, 7);

      expect(motor.contenedores.imagenesRetiradas).toEqual(["deploya/hola-deploya:1", "deploya/hola-deploya:2"]);
      const disponibles = (await motor.artefactos.disponiblesDe("proyecto-1")).map((a) => a.numero);
      expect(disponibles).toEqual([7, 6, 5, 4, 3]);
      expect(await motor.artefactos.deProyecto("proyecto-1")).toHaveLength(7);
    });

    it("El activo nunca se retira", async () => {
      const motor = motorDePrueba();
      await desplegarVarias(motor, 7);
      const tercero = await artefactoNumero(motor, 3);
      await motor.revertir(tercero.id);
      for (const numero of [9, 10, 11]) {
        await motor.artefactos.registrar({
          proyectoId: "proyecto-1",
          numero,
          imagen: `deploya/hola-deploya:${numero}`,
          digest: `sha256:${numero}`,
          tamanoBytes: 1,
          commitSha: "a".repeat(40),
          receta: "dockerfile",
          creado: motor.reloj.ahora(),
        });
      }
      motor.contenedores.imagenesRetiradas.length = 0;

      await motor.retencion.alTerminar({ proyectoId: "proyecto-1", despliegueId: "x", estado: "saludable" });

      expect(motor.contenedores.imagenesRetiradas).toEqual(["deploya/hola-deploya:4", "deploya/hola-deploya:5"]);
      expect((await motor.artefactos.porId(tercero.id))?.disponible).toBe(true);
    });

    it("la retención corre solo tras Saludable", async () => {
      const motor = motorDePrueba();
      await desplegarVarias(motor, 5);
      for (const numero of [6, 7]) {
        await motor.artefactos.registrar({
          proyectoId: "proyecto-1",
          numero,
          imagen: `deploya/hola-deploya:${numero}`,
          digest: `sha256:${numero}`,
          tamanoBytes: 1,
          commitSha: "a".repeat(40),
          receta: "dockerfile",
          creado: motor.reloj.ahora(),
        });
      }

      await motor.retencion.alTerminar({ proyectoId: "proyecto-1", despliegueId: "x", estado: "fallido" });
      expect(motor.contenedores.imagenesRetiradas).toEqual([]);

      await motor.retencion.alTerminar({ proyectoId: "proyecto-1", despliegueId: "x", estado: "saludable" });
      expect(motor.contenedores.imagenesRetiradas).toEqual(["deploya/hola-deploya:1", "deploya/hola-deploya:2"]);
    });

    it("un fallo al borrar una imagen no cambia el despliegue y se reintenta después", async () => {
      jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
      const motor = motorDePrueba();
      motor.contenedores.imagenesQueFallan.add("deploya/hola-deploya:1");

      await desplegarVarias(motor, 6);

      const sexto = await motor.despliegues.porNumero("proyecto-1", 6);
      expect(sexto?.estado).toBe("saludable");
      expect((await motor.artefactos.porId((await artefactoNumero(motor, 1)).id))?.disponible).toBe(true);
      motor.contenedores.imagenesQueFallan.clear();

      await motor.desplegar();

      expect(motor.contenedores.imagenesRetiradas).toEqual(["deploya/hola-deploya:1", "deploya/hola-deploya:2"]);
    });

    it("un oyente que falla no cambia el resultado del despliegue", async () => {
      jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
      class OyenteRoto extends OyenteDespliegue {
        async alTerminar(): Promise<void> {
          throw new Error("oyente roto");
        }
      }
      const motor = motorDePrueba();
      const pipeline = new PipelineDespliegue(motor.despliegues, motor.proyectos, motor.reloj, motor.planes, [new OyenteRoto()], motor.vigia);
      const creado = await motor.servicio.crearDespliegue("proyecto-1");

      await pipeline.ejecutar({ despliegueId: creado.id, plan: "construccion" }, 0);

      expect((await motor.despliegues.porId(creado.id))?.estado).toBe("saludable");
    });
  });

  describe("controlador", () => {
    it("POST /proyectos/:id/reversiones crea el despliegue en Revirtiendo", async () => {
      const motor = motorDePrueba();
      await desplegarVarias(motor, 2);
      const primero = await artefactoNumero(motor, 1);
      const controlador = new ReversionController(motor.reversion);

      const creado = await controlador.revertir("proyecto-1", { artefactoId: primero.id }, "usuario-1");

      expect(creado).toEqual({ id: expect.any(String), numero: 3, estado: "revirtiendo" });
      expect(motor.cola.trabajos.at(-1)).toEqual({ despliegueId: creado.id, plan: "reversion" });
    });

    it("sin artefactoId responde 400", () => {
      const motor = motorDePrueba();
      const controlador = new ReversionController(motor.reversion);

      expect(() => controlador.revertir("proyecto-1", {}, "usuario-1")).toThrow("artefactoId es obligatorio");
    });

    it("GET /proyectos/:id/artefactos lista los más recientes primero con el activo y los retirados", async () => {
      const motor = motorDePrueba();
      await desplegarVarias(motor, 7);
      const controlador = new ReversionController(motor.reversion);

      const lista = await controlador.artefactos("proyecto-1", "usuario-1");

      expect(lista.map((a) => [a.numero, a.disponible, a.activo])).toEqual([
        [7, true, true],
        [6, true, false],
        [5, true, false],
        [4, true, false],
        [3, true, false],
        [2, false, false],
        [1, false, false],
      ]);
      expect(lista[0]).toEqual(
        expect.objectContaining({ digest: motor.constructorImagen.imagen.digest, receta: "dockerfile", commit: { sha: motor.clonador.commit.sha, mensaje: "feat: demo" } }),
      );
    });
  });
});
