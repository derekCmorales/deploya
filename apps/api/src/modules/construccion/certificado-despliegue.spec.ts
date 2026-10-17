import { motorDePrueba } from "../../pruebas/motor";

const VENCE = new Date("2027-01-12T05:14:24.000Z");

describe("Certificado en la vista de despliegue (M6-02)", () => {
  it("Vencimiento visible: un despliegue Saludable servido por HTTPS incluye cuándo vence el certificado", async () => {
    const motor = motorDePrueba();
    motor.enrutamiento.esquema = "https";
    motor.enrutamiento.dominioBase = "deploya.app";
    motor.certificado.vencimientos.set("hola-deploya.deploya.app", VENCE);
    const despliegue = await motor.desplegar();

    const vista = await motor.servicio.consultar(despliegue.id, "usuario-1");

    expect(vista.url).toBe("https://hola-deploya.deploya.app");
    expect(vista.certificado).toEqual({ vence: "2027-01-12T05:14:24.000Z" });
    expect(motor.certificado.consultados).toEqual(["hola-deploya.deploya.app"]);
  });

  it("Desarrollo sin TLS: con una URL http no se consulta el certificado y la vista dice null", async () => {
    const motor = motorDePrueba();
    const despliegue = await motor.desplegar();

    const vista = await motor.servicio.consultar(despliegue.id, "usuario-1");

    expect(vista.url).toBe("http://hola-deploya.localhost");
    expect(vista.certificado).toBeNull();
    expect(motor.certificado.consultados).toEqual([]);
  });

  it("HTTPS sin certificado emitido todavía: null, no un error", async () => {
    const motor = motorDePrueba();
    motor.enrutamiento.esquema = "https";
    motor.enrutamiento.dominioBase = "deploya.app";
    const despliegue = await motor.desplegar();

    const vista = await motor.servicio.consultar(despliegue.id, "usuario-1");

    expect(vista.certificado).toBeNull();
  });

  it("un despliegue sin URL (Encolado) no tiene certificado", async () => {
    const motor = motorDePrueba();
    const creado = await motor.servicio.crearDespliegue("proyecto-1");

    expect((await motor.servicio.consultar(creado.id, "usuario-1")).certificado).toBeNull();
  });
});
