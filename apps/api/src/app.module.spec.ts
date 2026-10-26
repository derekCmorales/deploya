import { Test } from "@nestjs/testing";
import { AppModule } from "./app.module";
import { PrismaService } from "./compartido/prisma/prisma.service";
import { ContenedoresClientePuerto } from "./modules/orquestacion/puertos/contenedores-cliente.puerto";
import { ResumenProyectoService } from "./modules/observabilidad/resumen/resumen-proyecto.service";
import { ReversionService } from "./modules/orquestacion/reversion/reversion.service";
import { AccionesDespliegueService } from "./modules/construccion/acciones/acciones-despliegue.service";

describe("AppModule (inyección de dependencias del proceso API)", () => {
  it("resuelve los servicios de M4, M5 y M7 de la entrega del 85 %", async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(modulo.get(ResumenProyectoService, { strict: false })).toBeInstanceOf(ResumenProyectoService);
    expect(modulo.get(ReversionService, { strict: false })).toBeInstanceOf(ReversionService);
    expect(modulo.get(AccionesDespliegueService, { strict: false })).toBeInstanceOf(AccionesDespliegueService);
    expect(modulo.get(ContenedoresClientePuerto, { strict: false })).toBeDefined();
  });

  it("registra /despliegues/tiempos antes que /despliegues/:numero para que «tiempos» no se lea como número", async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    const app = modulo.createNestApplication({ logger: false });
    await app.init();

    const rutas = rutasRegistradas(app.getHttpAdapter().getInstance());
    await app.close();

    const tiempos = rutas.indexOf("/proyectos/:id/despliegues/tiempos");
    const porNumero = rutas.indexOf("/proyectos/:id/despliegues/:numero");
    expect(tiempos).toBeGreaterThanOrEqual(0);
    expect(porNumero).toBeGreaterThan(tiempos);
  });
});

interface CapaExpress {
  route?: { path: string };
}

function rutasRegistradas(express: { _router: { stack: CapaExpress[] } }): string[] {
  return express._router.stack.flatMap((capa) => (capa.route ? [capa.route.path] : []));
}
