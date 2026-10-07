import { RelojFijo } from "../../compartido/reloj";
import { RepositorioSesionesMemoria } from "./adaptadores/repositorio-sesiones.memoria";
import { RepositorioUsuariosMemoria } from "./adaptadores/repositorio-usuarios.memoria";
import type { EstadoCuenta } from "./dominio/cuenta";
import { CredencialesInvalidas, CuentaNoVerificada, CuentaSuspendida } from "./dominio/errores";
import { DIAS_INACTIVIDAD_SESION, MS_POR_DIA, MS_REFRESCO_ACTIVIDAD } from "./dominio/sesion";
import { GeneradorToken } from "./puertos/generador-token.puerto";
import { HashContrasena } from "./puertos/hash-contrasena.puerto";
import { SesionService } from "./sesion.service";

const CLAVE = "Deploya#2026seguro";

class HashTransparente extends HashContrasena {
  async calcular(clave: string): Promise<string> {
    return `h:${clave}`;
  }
  async coincide(clave: string, hash: string): Promise<boolean> {
    return hash === `h:${clave}`;
  }
}

class GeneradorSecuencial extends GeneradorToken {
  private n = 0;
  generar(): string {
    this.n += 1;
    return `token-${this.n}`;
  }
  huella(token: string): string {
    return `huella-${token}`;
  }
}

async function armar(estadoCuenta: EstadoCuenta = "activa") {
  const usuarios = new RepositorioUsuariosMemoria();
  const sesiones = new RepositorioSesionesMemoria();
  const reloj = new RelojFijo(new Date("2026-09-30T12:00:00.000Z"));
  const servicio = new SesionService(usuarios, sesiones, new HashTransparente(), new GeneradorSecuencial(), reloj);
  const usuario = await usuarios.crear({
    correo: "derek@tiendademo.com",
    nombre: "Derek",
    hashContrasena: `h:${CLAVE}`,
    rol: "cliente",
    estadoCuenta,
    creado: reloj.ahora(),
  });
  return { servicio, usuarios, sesiones, reloj, usuario };
}

describe("M1-03 · Iniciar sesión", () => {
  it("Credenciales válidas de una cuenta activa: crea la sesión y guarda solo la huella del token", async () => {
    const { servicio, sesiones, usuario } = await armar();

    const iniciada = await servicio.iniciar({ correo: "  Derek@TiendaDemo.com ", contrasena: CLAVE, agenteUsuario: "jest" });

    expect(iniciada.usuario).toEqual({ id: usuario.id, correo: "derek@tiendademo.com", nombre: "Derek", rol: "cliente" });
    const [guardada] = [...sesiones.sesiones.values()];
    expect(guardada.hashToken).toBe(`huella-${iniciada.token}`);
    expect(JSON.stringify(guardada)).not.toContain(`"${iniciada.token}"`);
  });

  it.each([
    ["contraseña incorrecta", "derek@tiendademo.com", "Otra#Clave2026"],
    ["correo sin cuenta", "nadie@tiendademo.com", CLAVE],
    ["correo mal formado", "derek@", CLAVE],
  ])("Credenciales incorrectas (%s): error genérico, sin decir cuál falló", async (_caso, correo, contrasena) => {
    const { servicio, sesiones } = await armar();

    await expect(servicio.iniciar({ correo, contrasena })).rejects.toBeInstanceOf(CredencialesInvalidas);
    expect(sesiones.sesiones.size).toBe(0);
  });

  it("Cuenta sin verificar no entra: CuentaNoVerificada con el correo enmascarado", async () => {
    const { servicio, sesiones } = await armar("pendiente");

    const error = await servicio.iniciar({ correo: "derek@tiendademo.com", contrasena: CLAVE }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CuentaNoVerificada);
    expect((error as CuentaNoVerificada).correoEnmascarado).toBe("d•••k@t•••••••o.com");
    expect(sesiones.sesiones.size).toBe(0);
  });

  it("Cuenta suspendida: no entra y el error trae el motivo y la fecha que registró M9", async () => {
    const { servicio, usuarios, usuario, sesiones } = await armar();
    const desde = new Date("2026-09-22T15:00:00.000Z");
    usuarios.suspender(usuario.id, "Uso que incumple los términos de servicio (§7.2).", desde);

    const error = await servicio.iniciar({ correo: "derek@tiendademo.com", contrasena: CLAVE }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CuentaSuspendida);
    expect(error).toMatchObject({ motivo: "Uso que incumple los términos de servicio (§7.2).", desde });
    expect(sesiones.sesiones.size).toBe(0);
  });

  it("una cuenta suspendida sin acción registrada no entra y no inventa motivo ni fecha", async () => {
    const { servicio } = await armar("suspendida");

    await expect(servicio.iniciar({ correo: "derek@tiendademo.com", contrasena: CLAVE })).rejects.toMatchObject({
      name: "CuentaSuspendida",
      motivo: null,
      desde: null,
    });
  });
});

describe("M1-03 · Guard de sesión", () => {
  it("Sesión vigente: el token de la cookie resuelve al usuario", async () => {
    const { servicio, usuario } = await armar();
    const { token } = await servicio.iniciar({ correo: "derek@tiendademo.com", contrasena: CLAVE });

    await expect(servicio.usuarioDe(token)).resolves.toMatchObject({ id: usuario.id });
  });

  it("Token desconocido: sin usuario", async () => {
    const { servicio } = await armar();

    await expect(servicio.usuarioDe("token-inventado")).resolves.toBeNull();
  });

  it("Sesión expirada tras 7 días sin actividad: sin usuario", async () => {
    const { servicio, reloj } = await armar();
    const { token } = await servicio.iniciar({ correo: "derek@tiendademo.com", contrasena: CLAVE });

    reloj.avanzar(DIAS_INACTIVIDAD_SESION * MS_POR_DIA);

    await expect(servicio.usuarioDe(token)).resolves.toBeNull();
  });

  it("La actividad renueva la vigencia, sin escribir en cada petición", async () => {
    const { servicio, sesiones, reloj } = await armar();
    const { token } = await servicio.iniciar({ correo: "derek@tiendademo.com", contrasena: CLAVE });
    const [sesion] = [...sesiones.sesiones.values()];
    const espia = jest.spyOn(sesiones, "registrarActividad");

    reloj.avanzar(MS_REFRESCO_ACTIVIDAD - 1);
    await servicio.usuarioDe(token);
    expect(espia).not.toHaveBeenCalled();

    reloj.avanzar(1);
    await servicio.usuarioDe(token);
    expect(espia).toHaveBeenCalledWith(sesion.id, reloj.ahora());

    reloj.avanzar(DIAS_INACTIVIDAD_SESION * MS_POR_DIA - 1);
    await expect(servicio.usuarioDe(token)).resolves.not.toBeNull();
  });

  it("Una cuenta suspendida después de iniciar sesión pierde el acceso", async () => {
    const { servicio, usuarios, usuario } = await armar();
    const { token } = await servicio.iniciar({ correo: "derek@tiendademo.com", contrasena: CLAVE });

    await usuarios.cambiarEstado(usuario.id, "suspendida");

    await expect(servicio.usuarioDe(token)).resolves.toBeNull();
  });
});

describe("M1-03 · Cerrar sesión", () => {
  it("Cerrar sesión revoca el token: deja de resolver al usuario", async () => {
    const { servicio } = await armar();
    const { token } = await servicio.iniciar({ correo: "derek@tiendademo.com", contrasena: CLAVE });

    await servicio.cerrar(token);

    await expect(servicio.usuarioDe(token)).resolves.toBeNull();
  });

  it("Cerrar dos veces o con un token desconocido no falla", async () => {
    const { servicio, sesiones } = await armar();
    const { token } = await servicio.iniciar({ correo: "derek@tiendademo.com", contrasena: CLAVE });
    const espia = jest.spyOn(sesiones, "revocar");

    await servicio.cerrar(token);
    await servicio.cerrar(token);
    await servicio.cerrar("token-inventado");

    expect(espia).toHaveBeenCalledTimes(1);
  });
});
