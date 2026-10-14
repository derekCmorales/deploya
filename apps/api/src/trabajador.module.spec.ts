import { Test } from "@nestjs/testing";
import { PrismaService } from "./compartido/prisma/prisma.service";
import { PipelineDespliegue } from "./modules/construccion/pipeline/pipeline-despliegue";
import { VigiaCancelacion } from "./modules/construccion/pipeline/vigia-cancelacion";
import { AccionesContenedorService } from "./modules/orquestacion/acciones/acciones-contenedor.service";
import { RetencionArtefactos } from "./modules/orquestacion/retencion/retencion-artefactos";
import { TrabajadorModule } from "./trabajador.module";

describe("TrabajadorModule (inyección de dependencias)", () => {
  it("arma el pipeline con sus planes, la vigía de cancelación y la retención de artefactos", async () => {
    const modulo = await Test.createTestingModule({ imports: [TrabajadorModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(modulo.get(PipelineDespliegue)).toBeInstanceOf(PipelineDespliegue);
    expect(modulo.get(VigiaCancelacion)).toBeInstanceOf(VigiaCancelacion);
    expect(modulo.get(RetencionArtefactos)).toBeInstanceOf(RetencionArtefactos);
    expect(modulo.get(AccionesContenedorService)).toBeInstanceOf(AccionesContenedorService);
  });
});
