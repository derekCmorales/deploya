import { LimiteIntentos } from "./limite-intentos";
import { claveDeCorreo, claveDeSesion, LimitesIdentidad } from "./limites-identidad";

const AHORA = new Date("2026-10-31T12:00:00.000Z");
const MINUTO = 60 * 1000;
const enMinutos = (minutos: number) => new Date(AHORA.getTime() + minutos * MINUTO);

describe("EST-01a · Regla LimiteIntentos", () => {
  it("Inicio correcto limpia el conteo", () => {
    const limite = new LimiteIntentos(5, 15 * MINUTO);
    for (let i = 0; i < 4; i++) limite.registrar("ip|correo", AHORA);

    limite.limpiar("ip|correo");
    for (let i = 0; i < 4; i++) limite.registrar("ip|correo", AHORA);

    expect(limite.espera("ip|correo", AHORA)).toBe(0);
  });

  it("La ventana vence", () => {
    const limite = new LimiteIntentos(5, 15 * MINUTO);
    for (let i = 0; i < 5; i++) limite.registrar("ip", enMinutos(i));

    // Cuenta desde el primer intento: a los 4 min faltan 11 (660 s).
    expect(limite.espera("ip", enMinutos(4))).toBe(11 * 60);
    expect(limite.espera("ip", enMinutos(15))).toBe(0);
  });

  it("cada clave lleva su propia cuenta", () => {
    const limite = new LimiteIntentos(1, MINUTO);
    limite.registrar("a", AHORA);

    expect(limite.espera("a", AHORA)).toBe(60);
    expect(limite.espera("b", AHORA)).toBe(0);
  });

  it("los límites de M1 y sus claves (ip|correo normalizado; correo por tipo de envío)", () => {
    const limites = new LimitesIdentidad();

    expect([limites.sesion, limites.registro, limites.correos, limites.codigo].map((l) => [l.maximo, l.ventanaMs / MINUTO])).toEqual([
      [5, 15],
      [10, 60],
      [3, 60],
      [5, 15],
    ]);
    expect(claveDeSesion("203.0.113.7", "  Derek@TiendaDemo.com ")).toBe("203.0.113.7|derek@tiendademo.com");
    expect(claveDeCorreo("recuperacion", "a@b.co")).not.toBe(claveDeCorreo("verificacion", "a@b.co"));
  });
});
