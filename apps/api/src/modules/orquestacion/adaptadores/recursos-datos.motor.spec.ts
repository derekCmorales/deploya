import type { MotorDatosService } from "../../datos/motor-datos.service";
import { RecursosDatosMotor } from "./recursos-datos.motor";

describe("RecursosDatosMotor (adapter de M5 sobre los recursos de datos)", () => {
  it("delega paraDespliegue y liberarProyecto en MotorDatosService", async () => {
    const inyeccion = { recursos: ["Redis 7"], variables: { base: { REDIS_URL: "r" }, prefijadas: {} } };
    const motor = { paraDespliegue: jest.fn().mockResolvedValue(inyeccion), liberarProyecto: jest.fn().mockResolvedValue(undefined) };
    const adaptador = new RecursosDatosMotor(motor as unknown as MotorDatosService);

    expect(await adaptador.paraDespliegue({ id: "p", subdominio: "s" })).toBe(inyeccion);
    await adaptador.liberarProyecto("s");

    expect(motor.paraDespliegue).toHaveBeenCalledWith({ id: "p", subdominio: "s" });
    expect(motor.liberarProyecto).toHaveBeenCalledWith("s");
  });
});
