import { MuestraIlegible } from "./errores";
import { muestraDesdeStats } from "./muestra-desde-stats";

const LINEA = '{"CPUPerc":"12.00%","MemUsage":"430MiB / 512MiB","Name":"api"}';

describe("muestraDesdeStats", () => {
  it("docker stats --format json se lee como vCPU y MB", () => {
    expect(muestraDesdeStats(LINEA)).toEqual({ cpu: 0.12, memoriaMb: 430 });
  });

  it("acepta GiB y una línea entre ruido", () => {
    expect(muestraDesdeStats(`\n${'{"CPUPerc":"50%","MemUsage":"1.5GiB / 2GiB"}'}\n`)).toEqual({ cpu: 0.5, memoriaMb: 1536 });
  });

  it("rechaza una salida que no es json de stats", () => {
    expect(() => muestraDesdeStats("error: no such container")).toThrow(MuestraIlegible);
    expect(() => muestraDesdeStats('{"Name":"api"}')).toThrow(MuestraIlegible);
    expect(() => muestraDesdeStats("{")).toThrow(MuestraIlegible);
  });
});
