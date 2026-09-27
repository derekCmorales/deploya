import { RelojFijo } from "../../../compartido/reloj";
import { RepositorioDesplieguesMemoria } from "../../../adapters/memoria/repositorio-despliegues.memoria";
import { BitacoraEnLotes } from "./bitacora-en-lotes";

async function repositorioConDespliegue() {
  const repositorio = new RepositorioDesplieguesMemoria();
  const despliegue = await repositorio.crear({ proyectoId: "p", disparador: "manual", rama: "main", estado: "encolado", creado: new Date() });
  return { repositorio, id: despliegue.id };
}

describe("BitacoraEnLotes", () => {
  it("no escribe hasta llenar el lote o vaciar", async () => {
    const { repositorio, id } = await repositorioConDespliegue();
    const bitacora = new BitacoraEnLotes(repositorio, new RelojFijo(), id, 0, 3);

    bitacora.escribir("construccion", "uno");
    bitacora.escribir("construccion", "dos");

    expect(await repositorio.lineasDesde(id, 0, 10)).toHaveLength(0);
    await bitacora.vaciar();
    expect(await repositorio.lineasDesde(id, 0, 10)).toHaveLength(2);
  });

  it("al llenar el lote persiste solo, numerando de forma consecutiva", async () => {
    const { repositorio, id } = await repositorioConDespliegue();
    const bitacora = new BitacoraEnLotes(repositorio, new RelojFijo(), id, 0, 2);

    bitacora.escribir("construccion", "uno");
    bitacora.escribir("construccion", "dos");
    await bitacora.cerrar();

    expect((await repositorio.lineasDesde(id, 0, 10)).map((l) => l.n)).toEqual([1, 2]);
  });

  it("corta las líneas de más de 4 000 caracteres", async () => {
    const { repositorio, id } = await repositorioConDespliegue();
    const bitacora = new BitacoraEnLotes(repositorio, new RelojFijo(), id);

    bitacora.escribir("construccion", "x".repeat(5000));
    await bitacora.cerrar();

    expect((await repositorio.lineasDesde(id, 0, 10))[0].texto).toHaveLength(4000);
  });

  it("vaciarCada programa un vaciado periódico y cerrar lo detiene", async () => {
    jest.useFakeTimers();
    const { repositorio, id } = await repositorioConDespliegue();
    const bitacora = new BitacoraEnLotes(repositorio, new RelojFijo(), id);
    bitacora.vaciarCada(500);

    bitacora.escribir("construccion", "uno");
    jest.advanceTimersByTime(500);
    await bitacora.cerrar();
    jest.useRealTimers();

    expect(await repositorio.lineasDesde(id, 0, 10)).toHaveLength(1);
  });
});
