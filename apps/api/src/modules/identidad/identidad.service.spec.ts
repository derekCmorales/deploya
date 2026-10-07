import { RelojFijo } from "../../compartido/reloj";
import { CorreoNoEnviado, CorreoPuerto } from "../notificaciones";
import type { PlantillaCorreo } from "../notificaciones/dominio/plantilla-correo";
import { RepositorioTokensCuentaMemoria } from "./adaptadores/repositorio-tokens-cuenta.memoria";
import { RepositorioUsuariosMemoria } from "./adaptadores/repositorio-usuarios.memoria";
import { HORAS_VIGENCIA_VERIFICACION, MS_POR_HORA } from "./dominio/cuenta";
import { ContrasenaDebil, CorreoInvalido, CorreoYaRegistrado, EsperaReenvio, TokenNoValido } from "./dominio/errores";
import { IdentidadService } from "./identidad.service";
import { AsignacionSandboxPuerto } from "./puertos/asignacion-sandbox.puerto";
import { GeneradorToken } from "./puertos/generador-token.puerto";
import { HashContrasena } from "./puertos/hash-contrasena.puerto";

const CLAVE_VALIDA = "Deploya#2026seguro";

class HashFalso extends HashContrasena {
  async calcular(clave: string): Promise<string> {
    return `hash(${clave.length})`;
  }
  async coincide(): Promise<boolean> {
    return true;
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

interface EnvioRegistrado {
  destinatario: string;
  datos: unknown;
}

class CorreoEspia extends CorreoPuerto {
  readonly enviados: EnvioRegistrado[] = [];
  falla = false;
  async enviar<D extends { enlace: string }>(destinatario: string, _plantilla: PlantillaCorreo<D>, datos: D): Promise<void> {
    if (this.falla) throw new CorreoNoEnviado(destinatario, "proveedor caído");
    this.enviados.push({ destinatario, datos });
  }
}

class SandboxEspia extends AsignacionSandboxPuerto {
  readonly usuarios: string[] = [];
  async asignarSandbox(usuarioId: string): Promise<void> {
    this.usuarios.push(usuarioId);
  }
}

function armar() {
  const usuarios = new RepositorioUsuariosMemoria();
  const tokens = new RepositorioTokensCuentaMemoria();
  const correo = new CorreoEspia();
  const sandbox = new SandboxEspia();
  const reloj = new RelojFijo(new Date("2026-09-28T12:00:00.000Z"));
  const servicio = new IdentidadService(
    usuarios,
    tokens,
    new HashFalso(),
    new GeneradorSecuencial(),
    correo,
    sandbox,
    reloj,
    { urlWeb: "http://localhost:3000" },
  );
  return { servicio, usuarios, tokens, correo, sandbox, reloj };
}

const registrarValido = (servicio: IdentidadService, correo = "Derek@TiendaDemo.com") =>
  servicio.registrar({ correo, contrasena: CLAVE_VALIDA });

describe("M1-01 · Registro de cuenta", () => {
  it("Registro válido: crea la cuenta pendiente de verificación con el correo en minúsculas", async () => {
    const { servicio, usuarios } = armar();

    const cuenta = await registrarValido(servicio);

    const usuario = await usuarios.porCorreo("derek@tiendademo.com");
    expect(cuenta).toEqual(expect.objectContaining({ estadoCuenta: "pendiente", correoEnmascarado: "d•••k@t•••••••o.com", correoEnviado: true }));
    expect(usuario).toEqual(expect.objectContaining({ id: cuenta.usuarioId, estadoCuenta: "pendiente", rol: "cliente", nombre: "Derek" }));
  });

  it("Registro válido: M10 envía el correo de verificación con el enlace a /verificar", async () => {
    const { servicio, correo } = armar();

    await registrarValido(servicio);

    expect(correo.enviados).toEqual([
      {
        destinatario: "derek@tiendademo.com",
        datos: { nombre: "Derek", correo: "derek@tiendademo.com", enlace: "http://localhost:3000/verificar?token=token-1" },
      },
    ]);
  });

  it("Registro válido: pide a M2 la suscripción Sandbox de la cuenta nueva", async () => {
    const { servicio, sandbox } = armar();

    const cuenta = await registrarValido(servicio);

    expect(sandbox.usuarios).toEqual([cuenta.usuarioId]);
  });

  it("guarda la contraseña con hash, nunca en claro", async () => {
    const { servicio, usuarios } = armar();

    await registrarValido(servicio);

    const usuario = await usuarios.porCorreo("derek@tiendademo.com");
    expect(usuario?.hashContrasena).toBe(`hash(${CLAVE_VALIDA.length})`);
    expect(JSON.stringify(usuario)).not.toContain(CLAVE_VALIDA);
  });

  it("guarda solo la huella del token de verificación, que vence en 24 horas", async () => {
    const { servicio, tokens, reloj } = armar();

    await registrarValido(servicio);

    const token = await tokens.porHuella("huella-token-1");
    expect(await tokens.porHuella("token-1")).toBeNull();
    expect(token?.expira.getTime()).toBe(reloj.ahora().getTime() + HORAS_VIGENCIA_VERIFICACION * MS_POR_HORA);
  });

  it("Correo ya registrado: rechaza el alta con CorreoYaRegistrado (01b), sin importar mayúsculas", async () => {
    const { servicio } = armar();
    await registrarValido(servicio, "derek@tiendademo.com");

    await expect(registrarValido(servicio, "  DEREK@tiendademo.com ")).rejects.toBeInstanceOf(CorreoYaRegistrado);
  });

  it("Correo ya registrado: no crea una segunda cuenta ni reenvía el correo", async () => {
    const { servicio, correo } = armar();
    await registrarValido(servicio);

    await registrarValido(servicio).catch(() => undefined);

    expect(correo.enviados).toHaveLength(1);
  });

  it("Contraseña débil: rechaza con ContrasenaDebil y las reglas incumplidas", async () => {
    const { servicio } = armar();

    const error = await servicio.registrar({ correo: "ana@tiendademo.com", contrasena: "corta" }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ContrasenaDebil);
    expect((error as ContrasenaDebil).reglasIncumplidas).toEqual([
      "Mínimo 12 caracteres",
      "Mayúsculas y minúsculas",
      "Al menos un número",
      "Al menos un símbolo",
    ]);
  });

  it("rechaza un correo sin formato válido con CorreoInvalido", async () => {
    const { servicio } = armar();

    await expect(servicio.registrar({ correo: "no-es-correo", contrasena: CLAVE_VALIDA })).rejects.toBeInstanceOf(CorreoInvalido);
  });

  it("Falla del correo al registrarse: la cuenta queda creada y la respuesta avisa correoEnviado=false", async () => {
    const { servicio, correo, usuarios } = armar();
    correo.falla = true;

    const cuenta = await registrarValido(servicio);

    expect(cuenta.correoEnviado).toBe(false);
    expect(await usuarios.porId(cuenta.usuarioId)).not.toBeNull();
  });
});

describe("M1-02 · Verificación de correo", () => {
  it("Token válido: la cuenta pasa a Activa", async () => {
    const { servicio, usuarios } = armar();
    const cuenta = await registrarValido(servicio);

    const resultado = await servicio.verificar("token-1");

    expect(resultado).toEqual({ estadoCuenta: "activa" });
    expect((await usuarios.porId(cuenta.usuarioId))?.estadoCuenta).toBe("activa");
  });

  it("Token expirado o usado: a las 24 horas el enlace ya no es válido", async () => {
    const { servicio, reloj } = armar();
    await registrarValido(servicio);
    reloj.avanzar(HORAS_VIGENCIA_VERIFICACION * MS_POR_HORA);

    await expect(servicio.verificar("token-1")).rejects.toEqual(new TokenNoValido("expirado"));
  });

  it("Token válido: un minuto antes de las 24 horas todavía activa", async () => {
    const { servicio, reloj } = armar();
    await registrarValido(servicio);
    reloj.avanzar(HORAS_VIGENCIA_VERIFICACION * MS_POR_HORA - 60_000);

    await expect(servicio.verificar("token-1")).resolves.toEqual({ estadoCuenta: "activa" });
  });

  it("Token expirado o usado: el enlace sirve una sola vez", async () => {
    const { servicio } = armar();
    await registrarValido(servicio);
    await servicio.verificar("token-1");

    const error = await servicio.verificar("token-1").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TokenNoValido);
    expect((error as TokenNoValido).motivo).toBe("usado");
  });

  it("Token expirado o usado: un token que no existe se rechaza igual", async () => {
    const { servicio } = armar();

    await expect(servicio.verificar("inventado")).rejects.toEqual(new TokenNoValido("inexistente"));
  });

  it("un token de otro tipo (recuperación) no activa la cuenta", async () => {
    const { servicio, tokens, usuarios, reloj } = armar();
    const cuenta = await registrarValido(servicio);
    await tokens.crear({
      usuarioId: cuenta.usuarioId,
      tipo: "recuperacion",
      hashToken: "huella-recuperar",
      expira: new Date(reloj.ahora().getTime() + MS_POR_HORA),
      creado: reloj.ahora(),
    });

    await expect(servicio.verificar("recuperar")).rejects.toBeInstanceOf(TokenNoValido);
    expect((await usuarios.porId(cuenta.usuarioId))?.estadoCuenta).toBe("pendiente");
  });

  it("no reactiva una cuenta suspendida aunque el token sea vigente", async () => {
    const { servicio, usuarios } = armar();
    const cuenta = await registrarValido(servicio);
    await usuarios.cambiarEstado(cuenta.usuarioId, "suspendida");

    const resultado = await servicio.verificar("token-1");

    expect(resultado).toEqual({ estadoCuenta: "suspendida" });
  });
});

describe("M1-04 · Reenviar verificación", () => {
  const SEGUNDO = 1000;

  it("Reenviar verificación: pasada la cuenta atrás llega un enlace nuevo de 24 h y el anterior deja de servir", async () => {
    const { servicio, tokens, correo, reloj } = armar();
    await registrarValido(servicio);
    reloj.avanzar(61 * SEGUNDO);

    await servicio.reenviarVerificacion({ correo: "derek@tiendademo.com" });

    expect(correo.enviados).toHaveLength(2);
    expect(correo.enviados[1].datos).toMatchObject({ enlace: "http://localhost:3000/verificar?token=token-2" });
    expect((await tokens.porHuella("huella-token-1"))?.usadoEn).toEqual(reloj.ahora());
    const nuevo = await tokens.porHuella("huella-token-2");
    expect(nuevo?.expira.getTime()).toBe(reloj.ahora().getTime() + HORAS_VIGENCIA_VERIFICACION * MS_POR_HORA);
    await expect(servicio.verificar("token-1")).rejects.toBeInstanceOf(TokenNoValido);
    await expect(servicio.verificar("token-2")).resolves.toEqual({ estadoCuenta: "activa" });
  });

  it("Reenvío antes de la cuenta atrás: a los 20 s se rechaza con los 40 s que faltan y no se envía correo", async () => {
    const { servicio, correo, reloj } = armar();
    await registrarValido(servicio);
    reloj.avanzar(20 * SEGUNDO);

    const error = await servicio.reenviarVerificacion({ correo: "derek@tiendademo.com" }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(EsperaReenvio);
    expect((error as EsperaReenvio).segundos).toBe(40);
    expect(correo.enviados).toHaveLength(1);
  });

  it("Reenvío a una cuenta ya activa: misma respuesta neutra y no se envía correo (también con un correo que no existe)", async () => {
    const { servicio, correo, reloj } = armar();
    await registrarValido(servicio);
    await servicio.verificar("token-1");
    reloj.avanzar(61 * SEGUNDO);

    await expect(servicio.reenviarVerificacion({ correo: "derek@tiendademo.com" })).resolves.toBeUndefined();
    await expect(servicio.reenviarVerificacion({ correo: "nadie@tiendademo.com" })).resolves.toBeUndefined();
    await expect(servicio.reenviarVerificacion({ correo: "mal@" })).resolves.toBeUndefined();
    expect(correo.enviados).toHaveLength(1);
  });

  it("desde 02 (c) se reenvía con el token vencido del enlace", async () => {
    const { servicio, correo, reloj } = armar();
    await registrarValido(servicio);
    reloj.avanzar((HORAS_VIGENCIA_VERIFICACION + 1) * MS_POR_HORA);

    await servicio.reenviarVerificacion({ token: "token-1" });

    expect(correo.enviados).toHaveLength(2);
    await expect(servicio.reenviarVerificacion({ token: "inventado" })).resolves.toBeUndefined();
  });

  it("si el correo falla al reenviar, la respuesta no cambia", async () => {
    const { servicio, correo, reloj } = armar();
    await registrarValido(servicio);
    reloj.avanzar(61 * SEGUNDO);
    correo.falla = true;

    await expect(servicio.reenviarVerificacion({ correo: "derek@tiendademo.com" })).resolves.toBeUndefined();
  });
});
