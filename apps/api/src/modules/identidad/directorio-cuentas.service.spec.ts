import { MODULE_METADATA } from "@nestjs/common/constants";
import { AvisosModule } from "../notificaciones/avisos/avisos.module";
import { DestinatariosDeIdentidad } from "../notificaciones/avisos/destinatarios-de-identidad";
import { AvisosPuerto } from "../notificaciones/puertos/avisos.puerto";
import { RepositorioUsuariosMemoria } from "./adaptadores/repositorio-usuarios.memoria";
import { DirectorioCuentas } from "./directorio-cuentas.service";
import { IdentidadModule } from "./identidad.module";

describe("M1 · DirectorioCuentas (destinatario de los avisos de M10)", () => {
  it("da el correo y el nombre del titular; null si la cuenta no existe", async () => {
    const usuarios = new RepositorioUsuariosMemoria();
    const usuario = await usuarios.crear({
      correo: "derek@tiendademo.com",
      nombre: "Derek",
      hashContrasena: "h",
      rol: "cliente",
      estadoCuenta: "activa",
      creado: new Date("2026-09-03T12:00:00.000Z"),
    });
    const directorio = new DirectorioCuentas(usuarios);

    await expect(directorio.contactoDe(usuario.id)).resolves.toEqual({ correo: "derek@tiendademo.com", nombre: "Derek" });
    await expect(directorio.contactoDe("nadie")).resolves.toBeNull();
  });

  it("el adaptador de M10 lee al destinatario por DirectorioCuentas", async () => {
    const directorio = { contactoDe: jest.fn().mockResolvedValue({ correo: "derek@tiendademo.com", nombre: "Derek" }) };
    const destinatarios = new DestinatariosDeIdentidad(directorio as unknown as DirectorioCuentas);

    await expect(destinatarios.destinatarioDe("u-1")).resolves.toEqual({ correo: "derek@tiendademo.com", nombre: "Derek" });
    expect(directorio.contactoDe).toHaveBeenCalledWith("u-1");
  });

  it("IdentidadModule lo exporta y AvisosModule exporta AvisosPuerto sin que identidad dependa de los avisos", () => {
    expect(Reflect.getMetadata(MODULE_METADATA.EXPORTS, IdentidadModule)).toContain(DirectorioCuentas);
    expect(Reflect.getMetadata(MODULE_METADATA.EXPORTS, AvisosModule)).toEqual([AvisosPuerto]);
    expect(Reflect.getMetadata(MODULE_METADATA.IMPORTS, IdentidadModule)).not.toContain(AvisosModule);
  });
});
