import { RelojFijo } from "../../../../compartido/reloj";
import { RegistroEnviosMemoria, ReporteServidorMemoria } from "../../../../adapters/stubs/estado-compartido.memoria";
import { RepositorioConfiguracionInstalacionMemoria } from "../../../suscripciones/modo/repositorio-configuracion-instalacion.memoria";
import type { CertificadoPuerto } from "../../../enrutamiento/puertos/certificado.puerto";
import type { ReporteServidor } from "../puertos/reporte-servidor.puerto";
import type { ResolutorDnsPuerto } from "../puertos/resolutor-dns.puerto";
import { ComprobacionInstalacion, SaludInstalacion } from "./comprobacion";
import { ComprobacionCertificado, ComprobacionCorreo, DETALLE_SIN_CORREO, ComprobacionDisco, ComprobacionDnsComodin, ComprobacionDocker } from "./comprobaciones";

const AHORA = new Date("2026-10-21T12:00:00.000Z");
const reloj = () => new RelojFijo(AHORA);

function reporte(cambios: Partial<ReporteServidor> = {}): ReporteServidor {
  return {
    tomado: new Date("2026-10-21T11:59:00.000Z"),
    docker: { version: "27.3", contenedores: 6 },
    errorDocker: null,
    disco: { usadoGb: 31, totalGb: 80 },
    memoria: { libreMb: 4096, totalMb: 8192 },
    ...cambios,
  };
}

async function conReporte(r: ReporteServidor | null): Promise<ReporteServidorMemoria> {
  const reportes = new ReporteServidorMemoria();
  if (r) await reportes.publicar(r);
  return reportes;
}

const dns = (ips: string[]): ResolutorDnsPuerto => ({ ipv4: async () => ips });
const venceEl = (fecha: Date): CertificadoPuerto => ({ venceEl: async () => fecha });

describe("SP-18 · SaludInstalacion y sus comprobaciones", () => {
  it("Docker con la versión y los contenedores de deploya", async () => {
    await expect(new ComprobacionDocker(await conReporte(reporte()), reloj()).comprobar()).resolves.toEqual({
      id: "docker",
      estado: "ok",
      detalle: "27.3 · 6 contenedores de deploya en marcha",
    });
    await expect(new ComprobacionDocker(await conReporte(reporte({ docker: null, errorDocker: "connect ENOENT" })), reloj()).comprobar()).resolves.toMatchObject({
      estado: "error",
      detalle: "Docker no responde: connect ENOENT",
    });
  });

  it("sin reporte o con uno viejo, el Composite lo muestra como error sin tumbar a las demás", async () => {
    const viejo = await conReporte(reporte({ tomado: new Date("2026-10-21T10:00:00.000Z") }));
    const salud = new SaludInstalacion([new ComprobacionDocker(await conReporte(null), reloj()), new ComprobacionDisco(viejo, reloj()), new ComprobacionCorreo(new RepositorioConfiguracionInstalacionMemoria(), new RegistroEnviosMemoria(), reloj())]);

    const resultados = await salud.comprobar();

    expect(resultados).toEqual([
      { id: "docker", estado: "error", detalle: "El trabajador todavía no reporta el estado del servidor." },
      { id: "disco", estado: "error", detalle: "El trabajador no reporta desde hace 2 h." },
      { id: "correo", estado: "ok", detalle: "Todavía no se ha enviado ningún correo" },
    ]);
  });

  it("una comprobación que lanza algo que no es Error también queda como error", async () => {
    class Rota extends ComprobacionInstalacion {
      readonly id = "rota";

      async comprobar(): Promise<never> {
        throw "sin red";
      }
    }

    await expect(new SaludInstalacion([new Rota()]).comprobar()).resolves.toEqual([{ id: "rota", estado: "error", detalle: "sin red" }]);
  });

  it("disco: aviso desde el 80 % y error desde el 90 %", async () => {
    const estadoCon = async (usadoGb: number) =>
      (await new ComprobacionDisco(await conReporte(reporte({ disco: { usadoGb, totalGb: 100 } })), reloj()).comprobar()).estado;

    expect([await estadoCon(31), await estadoCon(80), await estadoCon(95)]).toEqual(["ok", "aviso", "error"]);
    await expect(new ComprobacionDisco(await conReporte(reporte()), reloj()).comprobar()).resolves.toMatchObject({ detalle: "31 de 80 GB · imágenes y artefactos" });
  });

  it("DNS comodín", async () => {
    await expect(new ComprobacionDnsComodin(dns(["203.0.113.10"]), "apps.miempresa.com").comprobar()).resolves.toEqual({
      id: "dns",
      estado: "ok",
      detalle: "*.apps.miempresa.com → 203.0.113.10",
    });
    await expect(new ComprobacionDnsComodin(dns([]), "apps.miempresa.com").comprobar()).resolves.toMatchObject({ estado: "error" });
  });

  it("certificado: ok, aviso a menos de 14 días, error sin certificado", async () => {
    const comprobar = (certificado: CertificadoPuerto) => new ComprobacionCertificado(certificado, "apps.miempresa.com", reloj()).comprobar();

    await expect(comprobar(venceEl(new Date("2027-01-18T00:00:00.000Z")))).resolves.toEqual({
      id: "certificado",
      estado: "ok",
      detalle: "Comodín · vence 18 ene 2027 (en 88 días) · se renueva solo",
    });
    await expect(comprobar(venceEl(new Date("2026-10-30T00:00:00.000Z")))).resolves.toMatchObject({ estado: "aviso" });
    await expect(comprobar({ venceEl: async () => null })).resolves.toMatchObject({ estado: "error", detalle: "No hay certificado para el comodín" });
  });

  it("correo que llegó", async () => {
    const envios = new RegistroEnviosMemoria();
    await envios.registrar({ en: new Date("2026-10-21T11:48:00.000Z"), entregado: true, error: null });

    await expect(new ComprobacionCorreo(new RepositorioConfiguracionInstalacionMemoria(), envios, reloj()).comprobar()).resolves.toEqual({
      id: "correo",
      estado: "ok",
      detalle: "El último envío llegó hace 12 min",
    });
  });

  it("Estado sin correo", async () => {
    const configuracion = new RepositorioConfiguracionInstalacionMemoria();
    await configuracion.guardarCorreo({ tipo: "sin-correo" });
    const envios = new RegistroEnviosMemoria();
    await envios.registrar({ en: new Date("2026-10-21T11:48:00.000Z"), entregado: true, error: null });

    await expect(new ComprobacionCorreo(configuracion, envios, reloj()).comprobar()).resolves.toEqual({ id: "correo", estado: "aviso", detalle: DETALLE_SIN_CORREO });
  });
});
