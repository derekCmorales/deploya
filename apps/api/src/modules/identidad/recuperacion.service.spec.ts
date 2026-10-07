import { RelojFijo } from "../../compartido/reloj";
import { CorreoNoEnviado, CorreoPuerto } from "../notificaciones";
import type { PlantillaCorreo } from "../notificaciones/dominio/plantilla-correo";
import { RepositorioSesionesMemoria } from "./adaptadores/repositorio-sesiones.memoria";
import { RepositorioTokensCuentaMemoria } from "./adaptadores/repositorio-tokens-cuenta.memoria";
import { RepositorioUsuariosMemoria } from "./adaptadores/repositorio-usuarios.memoria";
import { VIGENCIA_RECUPERACION_MS, type EstadoCuenta } from "./dominio/cuenta";
import { ContrasenaDebil, TokenNoValido } from "./dominio/errores";
import { GeneradorToken } from "./puertos/generador-token.puerto";
import { HashContrasena } from "./puertos/hash-contrasena.puerto";
import { RecuperacionService } from "./recuperacion.service";

const CLAVE_NUEVA = "Nueva#Clave2026";
const MS_POR_MINUTO = 60 * 1000;

class HashLegible extends HashContrasena {
  async calcular(clave: string): Promise<string> {
    return `hash:${clave}`;
  }
  async coincide(clave: string, hash: string): Promise<boolean> {
    return hash === `hash:${clave}`;
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

class CorreoEspia extends CorreoPuerto {
  readonly enviados: { destinatario: string; enlace: string }[] = [];
  falla = false;
  async enviar<D extends { enlace: string }>(destinatario: string, _plantilla: PlantillaCorreo<D>, datos: D): Promise<void> {
    if (this.falla) throw new CorreoNoEnviado(destinatario, "proveedor caído");
    this.enviados.push({ destinatario, enlace: datos.enlace });
  }
}

async function armar(estadoCuenta: EstadoCuenta = "activa") {
  const usuarios = new RepositorioUsuariosMemoria();
  const tokens = new RepositorioTokensCuentaMemoria();
  const sesiones = new RepositorioSesionesMemoria();
  const correo = new CorreoEspia();
  const reloj = new RelojFijo(new Date("2026-10-07T12:00:00.000Z"));
  const servicio = new RecuperacionService(
    usuarios,
    tokens,
    sesiones,
    new HashLegible(),
    new GeneradorSecuencial(),
    correo,
    reloj,
    { urlWeb: "http://localhost:3000" },
  );
  const usuario = await usuarios.crear({
    correo: "derek@tiendademo.com",
    nombre: "Derek",
    hashContrasena: "hash:Vieja#Clave2026",
    rol: "cliente",
    estadoCuenta,
    creado: reloj.ahora(),
  });
  return { servicio, usuarios, tokens, sesiones, correo, reloj, usuario };
}

const tokenDelEnlace = (enlace: string) => decodeURIComponent(new URL(enlace).searchParams.get("token") ?? "");

async function abrirSesion(sesiones: RepositorioSesionesMemoria, usuarioId: string, huella: string, ahora: Date) {
  return sesiones.crear({ usuarioId, hashToken: huella, creada: ahora, ultimaActividad: ahora, agenteUsuario: null });
}

describe("M1-05 · Recuperación de contraseña", () => {
  it("Solicitud con correo registrado", async () => {
    const { servicio, correo, tokens, reloj } = await armar();

    await expect(servicio.solicitar(" Derek@TiendaDemo.com ")).resolves.toBeUndefined();

    expect(correo.enviados).toEqual([{ destinatario: "derek@tiendademo.com", enlace: "http://localhost:3000/restablecer?token=token-1" }]);
    const guardado = await tokens.porHuella("huella-token-1");
    expect(guardado).toMatchObject({ tipo: "recuperacion", usadoEn: null });
    expect(guardado?.expira.getTime()).toBe(reloj.ahora().getTime() + VIGENCIA_RECUPERACION_MS);
  });

  it("Solicitud con correo no registrado", async () => {
    const { servicio, correo } = await armar();

    await expect(servicio.solicitar("nadie@tiendademo.com")).resolves.toBeUndefined();
    await expect(servicio.solicitar("no es un correo")).resolves.toBeUndefined();

    expect(correo.enviados).toEqual([]);
  });

  it("una cuenta pendiente o suspendida no recibe el enlace (misma respuesta)", async () => {
    for (const estado of ["pendiente", "suspendida"] as const) {
      const { servicio, correo } = await armar(estado);

      await expect(servicio.solicitar("derek@tiendademo.com")).resolves.toBeUndefined();

      expect(correo.enviados).toEqual([]);
    }
  });

  it("un fallo de CorreoPuerto no cambia la respuesta", async () => {
    const { servicio, correo } = await armar();
    correo.falla = true;

    await expect(servicio.solicitar("derek@tiendademo.com")).resolves.toBeUndefined();
  });

  it("Token de recuperación vigente", async () => {
    const { servicio, correo, usuarios, sesiones, usuario, reloj } = await armar();
    const otroNavegador = await abrirSesion(sesiones, usuario.id, "cookie-otro", reloj.ahora());
    const esteNavegador = await abrirSesion(sesiones, usuario.id, "cookie-este", reloj.ahora());
    await servicio.solicitar(usuario.correo);
    reloj.avanzar(29 * MS_POR_MINUTO);

    await servicio.restablecer({ token: tokenDelEnlace(correo.enviados[0].enlace), contrasena: CLAVE_NUEVA });

    expect((await usuarios.porId(usuario.id))?.hashContrasena).toBe(`hash:${CLAVE_NUEVA}`);
    expect(sesiones.sesiones.get(otroNavegador.id)?.revocadaEn).toEqual(reloj.ahora());
    expect(sesiones.sesiones.get(esteNavegador.id)?.revocadaEn).toEqual(reloj.ahora());
  });

  it("Token de recuperación vencido", async () => {
    const { servicio, correo, usuarios, usuario, reloj } = await armar();
    await servicio.solicitar(usuario.correo);
    reloj.avanzar(31 * MS_POR_MINUTO);

    await expect(servicio.restablecer({ token: tokenDelEnlace(correo.enviados[0].enlace), contrasena: CLAVE_NUEVA })).rejects.toEqual(
      new TokenNoValido("expirado"),
    );
    expect((await usuarios.porId(usuario.id))?.hashContrasena).toBe(usuario.hashContrasena);
  });

  it("Token de recuperación usado", async () => {
    const { servicio, correo, usuarios, usuario } = await armar();
    await servicio.solicitar(usuario.correo);
    const token = tokenDelEnlace(correo.enviados[0].enlace);
    await servicio.restablecer({ token, contrasena: CLAVE_NUEVA });

    const segundoIntento = servicio.restablecer({ token, contrasena: "Otra#Clave20266" });

    await expect(segundoIntento).rejects.toMatchObject({ name: "TokenNoValido", motivo: "usado" });
    expect((await usuarios.porId(usuario.id))?.hashContrasena).toBe(`hash:${CLAVE_NUEVA}`);
  });

  it("Nueva solicitud invalida la anterior", async () => {
    const { servicio, correo, usuario } = await armar();
    await servicio.solicitar(usuario.correo);
    await servicio.solicitar(usuario.correo);
    const [primero, segundo] = correo.enviados.map((envio) => tokenDelEnlace(envio.enlace));

    await expect(servicio.restablecer({ token: primero, contrasena: CLAVE_NUEVA })).rejects.toMatchObject({ motivo: "usado" });
    await expect(servicio.restablecer({ token: segundo, contrasena: CLAVE_NUEVA })).resolves.toBeUndefined();
  });

  it("Contraseña débil al restablecer", async () => {
    const { servicio, correo, usuario } = await armar();
    await servicio.solicitar(usuario.correo);
    const token = tokenDelEnlace(correo.enviados[0].enlace);

    const debil = servicio.restablecer({ token, contrasena: "corta" });

    await expect(debil).rejects.toBeInstanceOf(ContrasenaDebil);
    await expect(debil).rejects.toMatchObject({ reglasIncumplidas: expect.arrayContaining(["Mínimo 12 caracteres"]) });
    await expect(servicio.restablecer({ token, contrasena: CLAVE_NUEVA })).resolves.toBeUndefined();
  });

  it("si la cuenta se suspende después de pedir el enlace, el enlace ya no sirve y la contraseña no cambia", async () => {
    const { servicio, correo, usuarios, usuario } = await armar();
    await servicio.solicitar(usuario.correo);
    await usuarios.cambiarEstado(usuario.id, "suspendida");

    await expect(servicio.restablecer({ token: tokenDelEnlace(correo.enviados[0].enlace), contrasena: CLAVE_NUEVA })).rejects.toBeInstanceOf(
      TokenNoValido,
    );
    expect((await usuarios.porId(usuario.id))?.hashContrasena).toBe(usuario.hashContrasena);
  });

  it("un token desconocido o de verificación no sirve para restablecer", async () => {
    const { servicio, tokens, usuario, reloj } = await armar();
    await tokens.crear({
      usuarioId: usuario.id,
      tipo: "verificacion",
      hashToken: "huella-de-verificacion",
      expira: new Date(reloj.ahora().getTime() + VIGENCIA_RECUPERACION_MS),
      creado: reloj.ahora(),
    });

    await expect(servicio.restablecer({ token: "de-verificacion", contrasena: CLAVE_NUEVA })).rejects.toMatchObject({ motivo: "inexistente" });
    await expect(servicio.restablecer({ token: "inventado", contrasena: CLAVE_NUEVA })).rejects.toMatchObject({ motivo: "inexistente" });
  });
});
