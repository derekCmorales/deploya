import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { CONFIGURACION_MOTOR, type ConfiguracionMotor } from "./adapters/configuracion-motor";
import { consumirDespliegues } from "./adapters/reales/cola-bullmq";
import { PipelineDespliegue } from "./modules/construccion/pipeline/pipeline-despliegue";
import { TrabajadorModule } from "./trabajador.module";

async function iniciar(): Promise<void> {
  const registro = new Logger("Trabajador");
  const app = await NestFactory.createApplicationContext(TrabajadorModule);
  const configuracion = app.get<ConfiguracionMotor>(CONFIGURACION_MOTOR);
  if (configuracion.modo !== "docker") {
    registro.warn("MOTOR_ADAPTADORES no es «docker»: sin cola real no hay nada que consumir");
    await app.close();
    return;
  }
  const pipeline = app.get(PipelineDespliegue);
  const consumidor = consumirDespliegues(configuracion.redisUrl, configuracion.trabajadorConcurrencia, (trabajo) =>
    pipeline.ejecutar(trabajo),
  );
  registro.log(`Consumiendo la cola de despliegues (concurrencia ${configuracion.trabajadorConcurrencia})`);
  const detener = async () => {
    await consumidor.close();
    await app.close();
    process.exit(0);
  };
  process.once("SIGTERM", () => void detener());
  process.once("SIGINT", () => void detener());
}

void iniciar();
