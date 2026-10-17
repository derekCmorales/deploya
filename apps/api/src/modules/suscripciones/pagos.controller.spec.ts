import { UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { SesionGuard } from "../identidad/sesion.guard";
import type { SesionService } from "../identidad/sesion.service";
import { ComprobanteTextoFalso } from "./adaptadores/comprobante-texto.falso";
import { planesDePrueba } from "./adaptadores/planes.fixture";
import { RepositorioPagosMemoria } from "./adaptadores/repositorio-pagos.memoria";
import { HistorialPagosService } from "./historial-pagos.service";
import { PagosController } from "./pagos.controller";

async function armar() {
  const pagos = new RepositorioPagosMemoria(planesDePrueba(), { "u-derek": "Derek Calderón" });
  const aprobado = await pagos.registrar({
    usuarioId: "u-derek",
    suscripcionId: "s1",
    planId: "plan-starter",
    concepto: "contratacion",
    vigenciaDias: 30,
    monto: 5,
    estado: "aprobado",
    motivoRechazo: null,
    tarjetaUltimos4: "4242",
    creado: new Date("2026-09-03T16:10:00.000Z"),
  });
  return { controlador: new PagosController(new HistorialPagosService(pagos, new ComprobanteTextoFalso())), aprobado };
}

describe("M2-06 · PagosController", () => {
  it("GET /suscripciones/pagos devuelve las filas de la cuenta de la sesión", async () => {
    const { controlador } = await armar();

    await expect(controlador.pagos("u-derek")).resolves.toEqual([expect.objectContaining({ concepto: "Plan Starter · 30 días" })]);
  });

  it("el PDF responde application/pdf como adjunto DPY-AAAA-NNNNNN.pdf", async () => {
    const { controlador, aprobado } = await armar();

    const archivo = await controlador.comprobante("u-derek", aprobado.id);

    expect(archivo.getHeaders()).toMatchObject({ type: "application/pdf", disposition: 'attachment; filename="DPY-2026-000001.pdf"' });
  });

  it("sin sesión → 401", async () => {
    const guard = new SesionGuard({} as SesionService);
    const contexto = { switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }) } as unknown as ExecutionContext;

    expect(Reflect.getMetadata(GUARDS_METADATA, PagosController)).toEqual([SesionGuard]);
    await expect(guard.canActivate(contexto)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
