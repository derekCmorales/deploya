import { RepositorioProyectosMemoria } from "../../../adapters/memoria/repositorio-proyectos.memoria";
import { RepositorioVariablesMemoria } from "../../../adapters/memoria/repositorio-variables.memoria";
import { RelojFijo } from "../../../compartido/reloj";
import { CifradorAesGcm } from "../adaptadores/cifrador-aes-gcm";
import { CifradorFalso } from "../adaptadores/cifrador-falso";
import { ClaveInvalida, ProyectoNoEncontrado, VariableIlegible } from "../dominio/errores";
import { VariablesProyectoService } from "./variables-proyecto.service";

const CLAVE = "deploya-dev-clave-variables-032b";

async function proyectoDe(usuarioId: string) {
  const reloj = new RelojFijo();
  const proyectos = new RepositorioProyectosMemoria(reloj);
  const proyecto = await proyectos.guardar({
    usuarioId,
    nombre: "Hola",
    subdominio: "hola",
    urlRepositorio: "https://github.com/derekCmorales/hola-deploya",
    rama: "main",
    rutaDockerfile: "Dockerfile",
    puertoInterno: 8080,
  });
  return { reloj, proyectos, proyecto };
}

describe("VariablesProyectoService", () => {
  it("Guardar variable: en la base solo hay v1:… y el valor no queda en claro", async () => {
    const { reloj, proyectos, proyecto } = await proyectoDe("usuario-1");
    const almacen = new RepositorioVariablesMemoria(reloj);
    const servicio = new VariablesProyectoService(new CifradorAesGcm(CLAVE), almacen, proyectos);

    await servicio.reemplazar("usuario-1", proyecto.id, [{ clave: "SALUDO", valor: "hola secreto" }]);

    const [fila] = await almacen.deProyecto(proyecto.id);
    expect(fila.valorCifrado.startsWith("v1:")).toBe(true);
    expect(fila.valorCifrado).not.toContain("hola secreto");
    expect(await servicio.descifradasDe(proyecto.id)).toEqual({ SALUDO: "hola secreto" });
  });

  it("Mostrar valor", async () => {
    const { reloj, proyectos, proyecto } = await proyectoDe("usuario-1");
    const servicio = new VariablesProyectoService(new CifradorFalso(), new RepositorioVariablesMemoria(reloj), proyectos);
    await servicio.reemplazar("usuario-1", proyecto.id, [{ clave: "SALUDO", valor: "hola" }]);

    expect(await servicio.mostrar("usuario-1", proyecto.id, "SALUDO")).toEqual({ clave: "SALUDO", valor: "hola" });
    expect(await servicio.listar("usuario-1", proyecto.id)).toEqual([
      expect.objectContaining({ clave: "SALUDO" }),
    ]);
    const listadas = JSON.stringify(await servicio.listar("usuario-1", proyecto.id));
    expect(listadas).not.toContain("hola");
  });

  it("Variable de otro cliente", async () => {
    const { reloj, proyectos, proyecto } = await proyectoDe("usuario-1");
    const servicio = new VariablesProyectoService(new CifradorFalso(), new RepositorioVariablesMemoria(reloj), proyectos);
    await servicio.reemplazar("usuario-1", proyecto.id, [{ clave: "SALUDO", valor: "hola" }]);

    await expect(servicio.listar("usuario-2", proyecto.id)).rejects.toThrow(ProyectoNoEncontrado);
    await expect(servicio.mostrar("usuario-2", proyecto.id, "SALUDO")).rejects.toThrow(ProyectoNoEncontrado);
    await expect(servicio.reemplazar("usuario-2", proyecto.id, [])).rejects.toThrow(ProyectoNoEncontrado);
  });

  it("una entrada sin valor conserva el anterior", async () => {
    const { reloj, proyectos, proyecto } = await proyectoDe("usuario-1");
    const almacen = new RepositorioVariablesMemoria(reloj);
    const servicio = new VariablesProyectoService(new CifradorFalso(), almacen, proyectos);
    await servicio.reemplazar("usuario-1", proyecto.id, [{ clave: "SALUDO", valor: "hola" }]);
    const [antes] = await almacen.deProyecto(proyecto.id);

    await servicio.reemplazar("usuario-1", proyecto.id, [{ clave: "SALUDO" }, { clave: "MODO", valor: "prod" }]);

    const filas = await almacen.deProyecto(proyecto.id);
    const saludo = filas.find((fila) => fila.clave === "SALUDO");
    expect(saludo?.valorCifrado).toBe(antes.valorCifrado);
    expect(saludo?.actualizado).toEqual(antes.actualizado);
    expect(await servicio.descifradasDe(proyecto.id)).toEqual({ SALUDO: "hola", MODO: "prod" });
  });

  it("valor alterado → VariableIlegible", async () => {
    const { reloj, proyectos, proyecto } = await proyectoDe("usuario-1");
    const almacen = new RepositorioVariablesMemoria(reloj);
    const servicio = new VariablesProyectoService(new CifradorAesGcm(CLAVE), almacen, proyectos);
    await servicio.reemplazar("usuario-1", proyecto.id, [{ clave: "SALUDO", valor: "hola" }]);
    const [fila] = await almacen.deProyecto(proyecto.id);
    await almacen.reemplazar(proyecto.id, [{ clave: "SALUDO", valorCifrado: `${fila.valorCifrado.slice(0, -2)}aa` }]);

    await expect(servicio.descifradasDe(proyecto.id)).rejects.toThrow(VariableIlegible);
  });

  it("un fallo del cifrador que no es VariableIlegible se traduce", async () => {
    const { reloj, proyectos, proyecto } = await proyectoDe("usuario-1");
    const roto = new CifradorFalso();
    roto.descifrar = () => {
      throw new Error("roto");
    };
    const servicio = new VariablesProyectoService(roto, new RepositorioVariablesMemoria(reloj), proyectos);
    await servicio.reemplazar("usuario-1", proyecto.id, [{ clave: "SALUDO", valor: "hola" }]);
    await expect(servicio.descifradasDe(proyecto.id)).rejects.toThrow(VariableIlegible);
  });

  it("una variable nueva sin valor no se guarda", async () => {
    const { reloj, proyectos, proyecto } = await proyectoDe("usuario-1");
    const servicio = new VariablesProyectoService(new CifradorFalso(), new RepositorioVariablesMemoria(reloj), proyectos);
    await expect(servicio.reemplazar("usuario-1", proyecto.id, [{ clave: "NUEVA" }])).rejects.toThrow(ClaveInvalida);
  });
});
