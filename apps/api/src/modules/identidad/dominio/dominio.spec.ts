import { HashContrasenaScrypt } from "../adaptadores/hash-contrasena-scrypt";
import { GeneradorTokenCripto } from "../adaptadores/generador-token-cripto";
import { enmascararCorreo, nombreDesdeCorreo, normalizarCorreo } from "./cuenta";
import { CorreoInvalido } from "./errores";
import { PoliticaContrasena } from "./politica-contrasena";

describe("PoliticaContrasena", () => {
  const politica = new PoliticaContrasena();

  it("acepta una contraseña que cumple las cuatro reglas", () => {
    expect(politica.validar("Deploya#2026seguro")).toEqual({ valida: true, incumplidas: [] });
  });

  it.each([
    ["De#1corta", "Mínimo 12 caracteres"],
    ["deploya#2026seguro", "Mayúsculas y minúsculas"],
    ["DEPLOYA#2026SEGURO", "Mayúsculas y minúsculas"],
    ["Deploya#seguroSin", "Al menos un número"],
    ["Deploya2026seguro", "Al menos un símbolo"],
  ])("«%s» incumple «%s»", (clave, regla) => {
    expect(politica.validar(clave)).toEqual({ valida: false, incumplidas: [regla] });
  });
});

describe("Cuenta", () => {
  it("normaliza el correo a minúsculas y sin espacios", () => {
    expect(normalizarCorreo("  Ana.Gomez@TiendaDemo.com ")).toBe("ana.gomez@tiendademo.com");
  });

  it("rechaza un correo sin arroba o sin dominio", () => {
    expect(() => normalizarCorreo("ana@tiendademo")).toThrow(CorreoInvalido);
  });

  it("toma el nombre de la parte local del correo", () => {
    expect(nombreDesdeCorreo("derek@tiendademo.com")).toBe("Derek");
    expect(nombreDesdeCorreo("ana.gomez@tiendademo.com")).toBe("Ana");
  });

  it("enmascara el correo como en las pantallas 01b y 02", () => {
    expect(enmascararCorreo("ana.gomez@tiendademo.com")).toBe("a•••z@t•••••••o.com");
    expect(enmascararCorreo("derek@tiendademo.com")).toBe("d•••k@t•••••••o.com");
    expect(enmascararCorreo("x@ab.io")).toBe("x•••@a•b.io");
  });
});

describe("Adaptadores criptográficos", () => {
  it("HashContrasenaScrypt: el hash no contiene la clave y solo coincide con ella", async () => {
    const hash = new HashContrasenaScrypt();

    const calculado = await hash.calcular("Deploya#2026seguro");

    expect(calculado).not.toContain("Deploya#2026seguro");
    await expect(hash.coincide("Deploya#2026seguro", calculado)).resolves.toBe(true);
    await expect(hash.coincide("Deploya#2026Seguro", calculado)).resolves.toBe(false);
    await expect(hash.coincide("Deploya#2026seguro", "texto-plano")).resolves.toBe(false);
  });

  it("GeneradorTokenCripto: tokens distintos y huella sha256 estable", () => {
    const generador = new GeneradorTokenCripto();

    const [a, b] = [generador.generar(), generador.generar()];

    expect(a).not.toBe(b);
    expect(generador.huella(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(generador.huella(a)).toBe(generador.huella(a));
  });
});
