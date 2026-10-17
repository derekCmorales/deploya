import { TTL_CANCELACION_S } from "../../modules/construccion/dominio/motor.constantes";
import { CancelacionesRedis, claveCancelacion } from "./cancelaciones-redis";

const redis = { set: jest.fn(), exists: jest.fn(), disconnect: jest.fn() };

jest.mock("ioredis", () => ({ Redis: jest.fn(() => redis) }));

describe("CancelacionesRedis", () => {
  beforeEach(() => jest.clearAllMocks());

  it("la señal vive en cancelacion:<id> con TTL de 10 minutos", async () => {
    await new CancelacionesRedis("redis://redis:6379").pedir("d1");

    expect(claveCancelacion("d1")).toBe("cancelacion:d1");
    expect(TTL_CANCELACION_S).toBe(600);
    expect(redis.set).toHaveBeenCalledWith("cancelacion:d1", "1", "EX", 600);
  });

  it("pedida es verdadera solo mientras la clave existe", async () => {
    const cancelaciones = new CancelacionesRedis("redis://redis:6379");
    redis.exists.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    expect(await cancelaciones.pedida("d1")).toBe(true);
    expect(await cancelaciones.pedida("d1")).toBe(false);
    expect(redis.exists).toHaveBeenCalledWith("cancelacion:d1");
  });

  it("cerrar corta la conexión", async () => {
    await new CancelacionesRedis("redis://redis:6379").cerrar();

    expect(redis.disconnect).toHaveBeenCalled();
  });
});
