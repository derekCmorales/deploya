import { Test } from "@nestjs/testing";
import { PrismaService } from "./compartido/prisma/prisma.service";
import { AvisoDespliegueOyente } from "./modules/construccion/avisos/aviso-despliegue.oyente";
import { OYENTES_DESPLIEGUE } from "./modules/construccion/puertos/oyente-despliegue.puerto";
import { PipelineDespliegue } from "./modules/construccion/pipeline/pipeline-despliegue";
import { VigiaCancelacion } from "./modules/construccion/pipeline/vigia-cancelacion";
import { AccionesContenedorService } from "./modules/orquestacion/acciones/acciones-contenedor.service";
import { RetencionArtefactos } from "./modules/orquestacion/retencion/retencion-artefactos";
import { TareaCicloDiaria } from "./modules/suscripciones/ciclo/tarea-ciclo-diaria";
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

  it("registra el aviso por correo de M10 como un oyente más del despliegue (SP-08)", async () => {
    const modulo = await Test.createTestingModule({ imports: [TrabajadorModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(modulo.get(OYENTES_DESPLIEGUE)).toEqual([expect.any(RetencionArtefactos), expect.any(AvisoDespliegueOyente)]);
  });

  it("registra la tarea diaria del ciclo §4.4 (M2-05) con el puerto de contenedores de M5", async () => {
    const modulo = await Test.createTestingModule({ imports: [TrabajadorModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(modulo.get(TareaCicloDiaria)).toBeInstanceOf(TareaCicloDiaria);
  });
});
