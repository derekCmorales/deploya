import { commitCorto, contenedoresDetenidos, diasHasta, duracionLegible, fechaAviso, hostDe } from "./formato-aviso";
import {
  PLANTILLA_DESPLIEGUE_FALLIDO,
  PLANTILLA_DESPLIEGUE_SALUDABLE,
  PLANTILLA_PLAN_POR_VENCER,
  PLANTILLA_SUSCRIPCION_SUSPENDIDA,
} from "./plantillas-avisos";
import { PLANTILLA_VERIFICACION } from "./plantilla-verificacion";

const AVISO_CUENTA = "Recibes este correo porque tienes una cuenta en deploya.";

describe("M10 · Plantillas de 24b", () => {
  it("las cuatro llevan el marco de 24: botón, enlace en texto plano, aviso de la cuenta y pie", () => {
    const mensajes = [
      PLANTILLA_DESPLIEGUE_SALUDABLE.componer({ enlace: "https://x.deploya.app", proyecto: "x", numero: 1, commit: "abc1234", duracion: "41 s", host: "x.deploya.app" }),
      PLANTILLA_DESPLIEGUE_FALLIDO.componer({ enlace: "https://deploya.app/projects/p/despliegues/2", proyecto: "x", numero: 2, etapa: "Construcción", versionActiva: 1, ultimasLineas: ["a"] }),
      PLANTILLA_PLAN_POR_VENCER.componer({ enlace: "https://deploya.app/suscripcion", plan: "Starter", dias: 7, venceEl: "03 nov 2026", vigencia: "30 días", precio: "USD 5.00" }),
      PLANTILLA_SUSCRIPCION_SUSPENDIDA.componer({ enlace: "https://deploya.app/suscripcion", contenedoresDetenidos: 1 }),
    ];

    for (const mensaje of mensajes) {
      expect(mensaje.html).toContain("¿El botón no funciona? Copia este enlace:");
      expect(mensaje.texto).toContain(AVISO_CUENTA);
      expect(mensaje.texto.endsWith("deploya · soporte@deploya.app")).toBe(true);
    }
    expect(mensajes[0].texto.startsWith("Despliegue\n")).toBe(true);
    expect(mensajes[2].texto.startsWith("Suscripción\n")).toBe(true);
  });

  it("suspendida con un contenedor usa singular; sin contenedores no los menciona; siempre dice qué se conserva", () => {
    const uno = PLANTILLA_SUSCRIPCION_SUSPENDIDA.componer({ enlace: "https://d/s", contenedoresDetenidos: 1 });
    const ninguno = PLANTILLA_SUSCRIPCION_SUSPENDIDA.componer({ enlace: "https://d/s", contenedoresDetenidos: 0 });

    expect(uno.texto).toContain("detuvimos el contenedor de tu cuenta.");
    expect(ninguno.texto).toContain("Terminó el período de gracia.\n");
    expect(ninguno.texto).toContain("Conservamos tu código, tus variables y tus versiones durante 30 días. Al renovar, vuelven a arrancar.");
  });

  it("por vencer sin vigencia ni precio muestra solo el plan y la fecha; con 1 día usa singular", () => {
    const mensaje = PLANTILLA_PLAN_POR_VENCER.componer({ enlace: "https://d/s", plan: "Pro", dias: 1, venceEl: "28 oct 2026", vigencia: null, precio: null });

    expect(mensaje.asunto).toBe("Tu plan Pro vence en 1 día");
    expect(mensaje.texto).toContain("Plan: Pro\n");
    expect(mensaje.texto).not.toContain("Renovación");
  });

  it("escapa los datos del proyecto y de la bitácora antes de meterlos en el HTML", () => {
    const mensaje = PLANTILLA_DESPLIEGUE_FALLIDO.componer({
      enlace: "https://d/p",
      proyecto: "<b>x</b>",
      numero: 3,
      etapa: "Construcción",
      versionActiva: null,
      ultimasLineas: ['<script>alert("x")</script>'],
    });

    expect(mensaje.html).not.toContain("<script>");
    expect(mensaje.html).toContain("&lt;script&gt;");
    expect(mensaje.html).not.toContain("<b>x</b>");
  });

  it("la verificación de 24 sale igual que antes: sin etiqueta, detalles ni bitácora", () => {
    const mensaje = PLANTILLA_VERIFICACION.componer({ nombre: "Derek", correo: "derek@tiendademo.com", enlace: "https://d/v" });

    expect(mensaje.texto.startsWith("Confirma tu correo\n\nHola Derek")).toBe(true);
    expect(mensaje.html).not.toContain("<table");
  });
});

describe("M10 · Formatos de los avisos", () => {
  it("duración legible", () => {
    expect(duracionLegible(41_000)).toBe("41 s");
    expect(duracionLegible(161_000)).toBe("2 min 41 s");
    expect(duracionLegible(3_900_000)).toBe("1 h 5 min");
    expect(duracionLegible(-5)).toBe("0 s");
  });

  it("fecha como en 24b, commit corto y host de la URL", () => {
    expect(fechaAviso("2026-11-03T00:00:00.000Z")).toBe("03 nov 2026");
    expect(fechaAviso("2026-01-15T23:59:00.000Z")).toBe("15 ene 2026");
    expect(commitCorto("a1b2c3d4e5f6")).toBe("a1b2c3d");
    expect(hostDe("https://api-tienda.deploya.app/")).toBe("api-tienda.deploya.app");
    expect(hostDe("no es url")).toBe("no es url");
  });

  it("días hasta el vencimiento, redondeados hacia arriba y nunca menos de 1", () => {
    const ahora = new Date("2026-10-27T12:00:00.000Z");
    expect(diasHasta("2026-11-03T00:00:00.000Z", ahora)).toBe(7);
    expect(diasHasta("2026-10-27T13:00:00.000Z", ahora)).toBe(1);
    expect(diasHasta("2026-10-20T00:00:00.000Z", ahora)).toBe(1);
    expect(contenedoresDetenidos(3)).toBe("los 3 contenedores");
  });
});
