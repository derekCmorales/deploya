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
});
