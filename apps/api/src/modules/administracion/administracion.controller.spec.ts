import { GUARDS_METADATA } from "@nestjs/common/constants";
import { Test } from "@nestjs/testing";
import type { UsuarioSesion } from "../identidad/dominio/sesion";
import { RolGuard } from "../identidad/rol.guard";
import { ROLES_PERMITIDOS } from "../identidad/roles.decorator";
import { SesionGuard } from "../identidad/sesion.guard";
import { AdministracionController } from "./administracion.controller";

const ADMINISTRADOR: UsuarioSesion = { id: "u-admin", correo: "admin@deploya.app", nombre: "Administrador", rol: "administrador" };

async function armar() {
  const moduleRef = await Test.createTestingModule({ controllers: [AdministracionController] })
    .overrideGuard(SesionGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(RolGuard)
    .useValue({ canActivate: () => true })
    .compile();
  return moduleRef.get(AdministracionController);
}

describe("AdministracionController", () => {
  it("health del módulo", async () => {
    const controller = await armar();
    expect(controller.health()).toEqual({ status: "ok", module: "administracion" });
  });

  it("el health de administración sigue público: sin guards", () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AdministracionController.prototype.health)).toBeUndefined();
  });

  it("GET /administracion/acceso exige sesión y rol administrador", () => {
    const acceso = AdministracionController.prototype.acceso;

    expect(Reflect.getMetadata(GUARDS_METADATA, acceso)).toEqual([SesionGuard, RolGuard]);
    expect(Reflect.getMetadata(ROLES_PERMITIDOS, acceso)).toEqual(["administrador"]);
  });

  it("GET /administracion/acceso devuelve el usuario de la sesión", async () => {
    const controller = await armar();
    expect(controller.acceso(ADMINISTRADOR)).toEqual({ usuario: ADMINISTRADOR });
  });
});
