import { PrismaService } from "./prisma.service";

describe("PrismaService", () => {
  it("conecta al iniciar el módulo y desconecta al cerrarlo", async () => {
    const cliente = { $connect: jest.fn().mockResolvedValue(undefined), $disconnect: jest.fn().mockResolvedValue(undefined) };
    await PrismaService.prototype.onModuleInit.call(cliente);
    await PrismaService.prototype.onModuleDestroy.call(cliente);
    expect(cliente.$connect).toHaveBeenCalledTimes(1);
    expect(cliente.$disconnect).toHaveBeenCalledTimes(1);
  });
});
