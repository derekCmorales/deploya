import { RelojFijo } from "../../../compartido/reloj";
import { CodigoInvalido, CodigoVencido, PrimeraConfiguracionNoDisponible } from "../dominio/errores";
import { ESTADO_HTTP_POR_CODIGO } from "../errores-suscripciones.filter";
import { ComoCliente, ConCodigoDeConfiguracion, hashDeCodigo } from "./altas";
import { InstalacionController } from "./instalacion.controller";
import { RepositorioConfiguracionInstalacionMemoria } from "./repositorio-configuracion-instalacion.memoria";

const AHORA = new Date("2026-10-24T03:10:00.000Z");
const CODIGO = "DPY-7K2M-Q9XA";

function armar() {
  const configuracion = new RepositorioConfiguracionInstalacionMemoria();
  configuracion.codigoGuardado = { hashCodigo: hashDeCodigo(CODIGO), codigoVence: new Date("2026-10-24T03:30:00.000Z") };
  return { configuracion, alta: new ConCodigoDeConfiguracion(configuracion, new RelojFijo(AHORA)) };
}

describe("SP-06 · AltaPrimerUsuario", () => {
  it("Sin código no hay administrador", async () => {
    const { alta } = armar();

    await expect(alta.configurada()).resolves.toBe(false);
    await expect(new InstalacionController("autoalojado", alta).estado()).resolves.toEqual({ modo: "autoalojado", configurada: false });
  });

  it("el código del instalador vale una vez y se borra al crear el administrador", async () => {
    const { alta, configuracion } = armar();

    await expect(alta.validarCodigo(` ${CODIGO} `)).resolves.toBeUndefined();
    await alta.consumirCodigo();

    await expect(alta.validarCodigo(CODIGO)).rejects.toBeInstanceOf(CodigoInvalido);
    expect(configuracion.codigoGuardado).toBeNull();
  });

  it("código equivocado → 401, vencido → 410", async () => {
    const { alta, configuracion } = armar();
    await expect(alta.validarCodigo("DPY-0000-0000")).rejects.toBeInstanceOf(CodigoInvalido);

    configuracion.codigoGuardado = { hashCodigo: hashDeCodigo(CODIGO), codigoVence: AHORA };

    await expect(alta.validarCodigo(CODIGO)).rejects.toBeInstanceOf(CodigoVencido);
    expect([ESTADO_HTTP_POR_CODIGO.CodigoInvalido, ESTADO_HTTP_POR_CODIGO.CodigoVencido]).toEqual([401, 410]);
  });

  it("con administrador la primera configuración ya no existe (404)", async () => {
    const { alta, configuracion } = armar();
    configuracion.administradores = 1;

    await expect(alta.configurada()).resolves.toBe(true);
    await expect(alta.validarCodigo(CODIGO)).rejects.toBeInstanceOf(PrimeraConfiguracionNoDisponible);
    await expect(alta.consumirCodigo()).rejects.toBeInstanceOf(PrimeraConfiguracionNoDisponible);
    expect(ESTADO_HTTP_POR_CODIGO.PrimeraConfiguracionNoDisponible).toBe(404);
  });

  it("Nube por defecto: configurada y sin primera configuración", async () => {
    const alta = new ComoCliente();

    await expect(new InstalacionController("nube", alta).estado()).resolves.toEqual({ modo: "nube", configurada: true });
    await expect(alta.validarCodigo()).rejects.toBeInstanceOf(PrimeraConfiguracionNoDisponible);
    await expect(alta.consumirCodigo()).rejects.toBeInstanceOf(PrimeraConfiguracionNoDisponible);
  });

  it("el hash es el sha256 hex del texto exacto, como el instalador", () => {
    expect(hashDeCodigo("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
