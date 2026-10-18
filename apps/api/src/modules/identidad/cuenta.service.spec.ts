import { RelojFijo } from "../../compartido/reloj";
import { RepositorioSesionesMemoria } from "./adaptadores/repositorio-sesiones.memoria";
import { RepositorioUsuariosMemoria } from "./adaptadores/repositorio-usuarios.memoria";
import { CuentaService } from "./cuenta.service";
import { ContrasenaActualIncorrecta, ContrasenaDebil, ContrasenaRepetida, CuentaInexistente, NombreInvalido } from "./dominio/errores";
import { GeneradorToken } from "./puertos/generador-token.puerto";
import { HashContrasena } from "./puertos/hash-contrasena.puerto";

const CLAVE_ACTUAL = "Vieja#Clave2026";
const CLAVE_NUEVA = "Nueva#Clave2026";

class HashFalso extends HashContrasena {
  async calcular(clave: string): Promise<string> {
    return `hash(${clave})`;
  }
  async coincide(clave: string, hash: string): Promise<boolean> {
    return hash === `hash(${clave})`;
  }
}

class GeneradorHuella extends GeneradorToken {
  generar(): string {
    return "no-se-usa";
  }
  huella(token: string): string {
    return `huella-${token}`;
  }
}

async function armar() {
  const usuarios = new RepositorioUsuariosMemoria();
  const sesiones = new RepositorioSesionesMemoria();
  const reloj = new RelojFijo(new Date("2026-10-14T12:00:00.000Z"));
  const usuario = await usuarios.crear({
    correo: "derek@tiendademo.com",
    nombre: "Derek",
    hashContrasena: `hash(${CLAVE_ACTUAL})`,
    rol: "cliente",
    estadoCuenta: "activa",
    creado: new Date("2026-09-03T12:00:00.000Z"),
  });
  const abrir = (token: string) =>
    sesiones.crear({
      usuarioId: usuario.id,
      hashToken: `huella-${token}`,
      creada: reloj.ahora(),
      ultimaActividad: reloj.ahora(),
      agenteUsuario: null,
    });
  const servicio = new CuentaService(usuarios, sesiones, new HashFalso(), new GeneradorHuella(), reloj);
  return { servicio, usuarios, sesiones, reloj, usuario, abrir };
}

describe("M1-06 · Mi cuenta · Perfil", () => {
  it("Ver mi cuenta: nombre, correo verificado, rol de solo lectura y fecha de alta", async () => {
    const { servicio, usuario } = await armar();

    await expect(servicio.perfil(usuario.id)).resolves.toEqual({
      nombre: "Derek",
      correo: "derek@tiendademo.com",
      rol: "cliente",
      verificado: true,
      creado: new Date("2026-09-03T12:00:00.000Z"),
    });
  });

  it("Editar nombre: «  Derek Calderón  » se guarda recortado y vuelve en el perfil", async () => {
    const { servicio, usuarios, usuario } = await armar();

    const perfil = await servicio.renombrar(usuario.id, "  Derek Calderón  ");

    expect(perfil.nombre).toBe("Derek Calderón");
    expect((await usuarios.porId(usuario.id))?.nombre).toBe("Derek Calderón");
  });

  it.each([
    ["vacío", "   "],
    ["de 65 caracteres", "a".repeat(65)],
  ])("Nombre vacío o de más de 64 caracteres (%s): NombreInvalido y el nombre no cambia", async (_caso, nombre) => {
    const { servicio, usuarios, usuario } = await armar();

    await expect(servicio.renombrar(usuario.id, nombre)).rejects.toBeInstanceOf(NombreInvalido);
    expect((await usuarios.porId(usuario.id))?.nombre).toBe("Derek");
  });

  it("una cuenta que ya no existe responde como sesión terminada", async () => {
    const { servicio } = await armar();

    await expect(servicio.perfil("borrada")).rejects.toBeInstanceOf(CuentaInexistente);
  });
});

describe("M1-07 · Mi cuenta · Seguridad", () => {
  it("Cambiar contraseña: el hash cambia, la otra sesión queda revocada y la actual sigue activa", async () => {
    const { servicio, usuarios, sesiones, reloj, usuario, abrir } = await armar();
    const esta = await abrir("este-navegador");
    const otra = await abrir("otro-navegador");

    await servicio.cambiarContrasena(usuario.id, "este-navegador", { actual: CLAVE_ACTUAL, nueva: CLAVE_NUEVA });

    expect((await usuarios.porId(usuario.id))?.hashContrasena).toBe(`hash(${CLAVE_NUEVA})`);
    expect(sesiones.sesiones.get(otra.id)?.revocadaEn).toEqual(reloj.ahora());
    expect(sesiones.sesiones.get(esta.id)?.revocadaEn).toBeNull();
  });

  it("Contraseña actual incorrecta: ContrasenaActualIncorrecta y ninguna sesión se revoca", async () => {
    const { servicio, usuarios, sesiones, usuario, abrir } = await armar();
    await abrir("este-navegador");
    await abrir("otro-navegador");

    await expect(
      servicio.cambiarContrasena(usuario.id, "este-navegador", { actual: "Otra#Clave2026", nueva: CLAVE_NUEVA }),
    ).rejects.toBeInstanceOf(ContrasenaActualIncorrecta);

    expect([...sesiones.sesiones.values()].every((s) => s.revocadaEn === null)).toBe(true);
    expect((await usuarios.porId(usuario.id))?.hashContrasena).toBe(`hash(${CLAVE_ACTUAL})`);
  });

  it("Nueva contraseña débil: ContrasenaDebil con lo que falta y la contraseña no cambia", async () => {
    const { servicio, usuarios, usuario, abrir } = await armar();
    await abrir("este-navegador");

    const error = await servicio
      .cambiarContrasena(usuario.id, "este-navegador", { actual: CLAVE_ACTUAL, nueva: "corta" })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ContrasenaDebil);
    expect((error as ContrasenaDebil).reglasIncumplidas.length).toBeGreaterThan(0);
    expect((await usuarios.porId(usuario.id))?.hashContrasena).toBe(`hash(${CLAVE_ACTUAL})`);
  });

  it("la nueva igual a la actual se rechaza con ContrasenaRepetida y nada cambia", async () => {
    const { servicio, usuarios, sesiones, usuario, abrir } = await armar();
    await abrir("este-navegador");
    await abrir("otro-navegador");

    await expect(
      servicio.cambiarContrasena(usuario.id, "este-navegador", { actual: CLAVE_ACTUAL, nueva: CLAVE_ACTUAL }),
    ).rejects.toBeInstanceOf(ContrasenaRepetida);

    expect([...sesiones.sesiones.values()].every((s) => s.revocadaEn === null)).toBe(true);
    expect((await usuarios.porId(usuario.id))?.hashContrasena).toBe(`hash(${CLAVE_ACTUAL})`);
  });

  it("si revocar las otras sesiones falla, la contraseña no cambia (primero se revoca, después se guarda)", async () => {
    const { servicio, usuarios, sesiones, usuario, abrir } = await armar();
    await abrir("este-navegador");
    jest.spyOn(sesiones, "revocarTodasMenos").mockRejectedValue(new Error("base caída"));

    await expect(
      servicio.cambiarContrasena(usuario.id, "este-navegador", { actual: CLAVE_ACTUAL, nueva: CLAVE_NUEVA }),
    ).rejects.toThrow("base caída");

    expect((await usuarios.porId(usuario.id))?.hashContrasena).toBe(`hash(${CLAVE_ACTUAL})`);
  });

  it("si no se reconoce la sesión actual, por seguridad se cierran todas", async () => {
    const { servicio, sesiones, usuario, abrir } = await armar();
    await abrir("otro-navegador");

    await servicio.cambiarContrasena(usuario.id, "desconocida", { actual: CLAVE_ACTUAL, nueva: CLAVE_NUEVA });

    expect([...sesiones.sesiones.values()].every((s) => s.revocadaEn !== null)).toBe(true);
  });

  it("Cerrar sesión en todos los dispositivos: todas las sesiones, incluida la actual, quedan invalidadas", async () => {
    const { servicio, sesiones, reloj, usuario, abrir } = await armar();
    await abrir("este-navegador");
    await abrir("otro-navegador");

    await servicio.cerrarTodas(usuario.id);

    expect([...sesiones.sesiones.values()].map((s) => s.revocadaEn)).toEqual([reloj.ahora(), reloj.ahora()]);
  });
});
