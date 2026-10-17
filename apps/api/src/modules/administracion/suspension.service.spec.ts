import { RelojFijo } from "../../compartido/reloj";
import { ContenedoresClienteFalso } from "../suscripciones/ciclo/contenedores-cliente.falso";
import { AdministracionMemoria } from "./adaptadores/administracion.memoria";
import { cuentaDePrueba } from "./adaptadores/cuentas.fixture";
import { CuentaYaSuspendida, NoSePuedeSuspenderAdministrador, UsuarioNoEncontrado } from "./dominio/errores";
import { MOTIVOS_SUSPENSION } from "./dominio/suspension";
import { SuspensionService } from "./suspension.service";

const AHORA = new Date("2026-10-17T16:20:00.000Z");
const SOLICITUD = { motivo: "terminos" as const, detalle: "Tráfico de minería detectado en 2 contenedores." };

function armar() {
  const almacen = new AdministracionMemoria()
    .agregar(cuentaDePrueba())
    .agregar(cuentaDePrueba({ id: "u-admin", correo: "admin@deploya.app", nombre: "Administración", rol: "administrador", plan: null, suscripcion: null }))
    .agregar(cuentaDePrueba({ id: "u-suspendida", correo: "suspendida@deploya.app", estadoCuenta: "suspendida" }));
  almacen.sesiones.push({ usuarioId: "u-maria", revocadaEn: null }, { usuarioId: "u-maria", revocadaEn: null }, { usuarioId: "u-admin", revocadaEn: null });
  const contenedores = new ContenedoresClienteFalso();
  const servicio = new SuspensionService(almacen.escritura, contenedores, new RelojFijo(AHORA));
  return { servicio, almacen, contenedores };
}

describe("M9-02 · SuspensionService", () => {
  it("Suspender cuenta", async () => {
    const { servicio, almacen, contenedores } = armar();

    await servicio.suspender("u-admin", "u-maria", SOLICITUD);

    expect(almacen.cuentaDe("u-maria")).toMatchObject({ estadoCuenta: "suspendida", suspension: { motivo: MOTIVOS_SUSPENSION.terminos, desde: AHORA } });
    expect(almacen.sesiones.filter((s) => s.usuarioId === "u-maria").map((s) => s.revocadaEn)).toEqual([AHORA, AHORA]);
    expect(almacen.sesiones.find((s) => s.usuarioId === "u-admin")?.revocadaEn).toBeNull();
    expect(almacen.acciones).toEqual([
      { adminId: "u-admin", usuarioAfectadoId: "u-maria", accion: "suspender-cuenta", motivo: "terminos", detalle: SOLICITUD.detalle, creado: AHORA },
    ]);
    expect(contenedores.detenidos).toEqual(["u-maria"]);
  });

  it("No se suspende a un administrador", async () => {
    const { servicio, almacen, contenedores } = armar();

    await expect(servicio.suspender("u-admin", "u-admin", SOLICITUD)).rejects.toBeInstanceOf(NoSePuedeSuspenderAdministrador);

    expect(almacen.cuentaDe("u-admin")?.estadoCuenta).toBe("activa");
    expect(almacen.acciones).toEqual([]);
    expect(contenedores.detenidos).toEqual([]);
  });

  it("Cuenta ya suspendida", async () => {
    const { servicio, almacen, contenedores } = armar();

    await expect(servicio.suspender("u-admin", "u-suspendida", SOLICITUD)).rejects.toBeInstanceOf(CuentaYaSuspendida);

    expect(almacen.acciones).toEqual([]);
    expect(contenedores.detenidos).toEqual([]);
  });

  it("una cuenta que no existe → UsuarioNoEncontrado", async () => {
    const { servicio } = armar();

    await expect(servicio.suspender("u-admin", "u-nadie", SOLICITUD)).rejects.toBeInstanceOf(UsuarioNoEncontrado);
  });

  it("si M5 falla al detener, la suspensión queda hecha", async () => {
    const { servicio, almacen, contenedores } = armar();
    contenedores.fallarCon(new Error("Redis no responde"));

    await servicio.suspender("u-admin", "u-maria", SOLICITUD);

    expect(almacen.cuentaDe("u-maria")?.estadoCuenta).toBe("suspendida");
    expect(almacen.acciones).toHaveLength(1);
  });
});
