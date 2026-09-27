import { RelojFijo } from "../../compartido/reloj";
import { VerificacionHttp, type Dormir } from "./verificacion-http";

const objetivo = { host: "deploya-p-1", puerto: 8080, ruta: "/", tiempoMaximoMs: 60_000 };

function dormirQueAvanza(reloj: RelojFijo): Dormir {
  return async (ms) => reloj.avanzar(ms);
}

describe("VerificacionHttp", () => {
  it("responde ok cuando el contenedor contesta con un estado menor que 500", async () => {
    const reloj = new RelojFijo();
    const pedir = jest.fn().mockResolvedValue({ status: 200 });

    const resultado = await new VerificacionHttp(reloj, dormirQueAvanza(reloj), pedir).saludable(objetivo);

    expect(resultado).toEqual(expect.objectContaining({ ok: true, estadoHttp: 200, detalle: "GET / 200" }));
    expect(pedir).toHaveBeenCalledWith("http://deploya-p-1:8080/", expect.anything());
  });

  it("reintenta cada segundo hasta que el contenedor arranca", async () => {
    const reloj = new RelojFijo();
    const pedir = jest.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")).mockResolvedValue({ status: 404 });

    const resultado = await new VerificacionHttp(reloj, dormirQueAvanza(reloj), pedir).saludable(objetivo);

    expect(resultado.ok).toBe(true);
    expect(pedir).toHaveBeenCalledTimes(2);
  });

  it("Contenedor que no responde: tras 60 s devuelve ok false con el último error", async () => {
    const reloj = new RelojFijo();
    const pedir = jest.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    const resultado = await new VerificacionHttp(reloj, dormirQueAvanza(reloj), pedir).saludable(objetivo);

    expect(resultado).toEqual({ ok: false, estadoHttp: null, milisegundos: 60_000, detalle: "ECONNREFUSED" });
    expect(pedir).toHaveBeenCalledTimes(60);
  });

  it("un 500 no cuenta como salud", async () => {
    const reloj = new RelojFijo();
    const pedir = jest.fn().mockResolvedValue({ status: 503 });

    const resultado = await new VerificacionHttp(reloj, dormirQueAvanza(reloj), pedir).saludable({ ...objetivo, tiempoMaximoMs: 2000 });

    expect(resultado.ok).toBe(false);
    expect(resultado.detalle).toBe("GET / 503");
  });
});
