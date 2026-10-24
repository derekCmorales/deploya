import { RelojFijo } from "../../compartido/reloj";
import { ContenedoresClienteFalso } from "../suscripciones/ciclo/contenedores-cliente.falso";
import { AdministracionMemoria } from "./adaptadores/administracion.memoria";
import { cuentaDePrueba } from "./adaptadores/cuentas.fixture";
import { CuentaNoSuspendida, UsuarioNoEncontrado } from "./dominio/errores";
import { ReactivacionCuentaService } from "./reactivacion-cuenta.service";

const AHORA = new Date("2026-10-24T16:20:00.000Z");
const SOLICITUD = { detalle: "Aclarado con la clienta: el tráfico era de pruebas de carga." };
const SUSPENSION = { desde: new Date("2026-09-21T10:00:00.000Z"), motivo: "Uso que incumple los términos de servicio.", contenedoresDetenidos: 2 };

function armar() {
  const almacen = new AdministracionMemoria()
    .agregar(cuentaDePrueba({ id: "u-maria", estadoCuenta: "suspendida", suscripcion: "activa", suspension: SUSPENSION }))
    .agregar(cuentaDePrueba({ id: "u-pedro", estadoCuenta: "suspendida", suscripcion: "suspendida", suspension: SUSPENSION }))
    .agregar(cuentaDePrueba({ id: "u-ana", estadoCuenta: "activa" }));
  const contenedores = new ContenedoresClienteFalso();
  const servicio = new ReactivacionCuentaService(almacen.escritura, contenedores, new RelojFijo(AHORA));
  return { servicio, almacen, contenedores };
}

describe("SP-05 · ReactivacionCuentaService", () => {
  it("Reactivar con suscripción vigente", async () => {
    const { servicio, almacen, contenedores } = armar();

    const resultado = await servicio.reactivar("u-admin", "u-maria", SOLICITUD);

    expect(resultado).toEqual({ contenedores: "reanudados" });
    expect(almacen.cuentaDe("u-maria")).toMatchObject({ estadoCuenta: "activa", suspension: null });
    expect(contenedores.reanudados).toEqual(["u-maria"]);
    expect(almacen.acciones).toEqual([
      { adminId: "u-admin", usuarioAfectadoId: "u-maria", accion: "reactivar-cuenta", motivo: "reactivacion", detalle: SOLICITUD.detalle, creado: AHORA },
    ]);
  });

  it("Reactivar con suscripción suspendida", async () => {
    const { servicio, almacen, contenedores } = armar();

    const resultado = await servicio.reactivar("u-admin", "u-pedro", SOLICITUD);

    expect(resultado).toEqual({ contenedores: "esperan-renovacion" });
    expect(almacen.cuentaDe("u-pedro")?.estadoCuenta).toBe("activa");
    expect(contenedores.reanudados).toEqual([]);
  });

  it("Cuenta no suspendida", async () => {
    const { servicio, almacen, contenedores } = armar();

    await expect(servicio.reactivar("u-admin", "u-ana", SOLICITUD)).rejects.toBeInstanceOf(CuentaNoSuspendida);

    expect(almacen.acciones).toEqual([]);
    expect(contenedores.reanudados).toEqual([]);
  });

  it("una cuenta que no existe → UsuarioNoEncontrado", async () => {
    const { servicio } = armar();

    await expect(servicio.reactivar("u-admin", "u-nadie", SOLICITUD)).rejects.toBeInstanceOf(UsuarioNoEncontrado);
  });

  it("si M5 falla al reanudar, la cuenta queda reactivada", async () => {
    const { servicio, almacen, contenedores } = armar();
    contenedores.fallarCon(new Error("Redis no responde"));

    await expect(servicio.reactivar("u-admin", "u-maria", SOLICITUD)).resolves.toEqual({ contenedores: "reanudados" });

    expect(almacen.cuentaDe("u-maria")?.estadoCuenta).toBe("activa");
  });
});
