/// <reference types="jest" />
import { agruparPorDia, DIAS_ACTIVIDAD } from "./actividad";
import { periodoDe } from "./periodo";

describe("Observabilidad · Dominio puro (M7-03)", () => {
  describe("periodoDe", () => {
    it("Mes nuevo", () => {
      const primeroOctubre = new Date("2026-10-01T00:00:00.000Z");

      const periodo = periodoDe(primeroOctubre);

      expect(periodo).toEqual({
        desde: new Date("2026-10-01T00:00:00.000Z"),
        reinicia: new Date("2026-11-01T00:00:00.000Z"),
      });
    });

    it("31 dic → 1 ene cambia de año en UTC", () => {
      const finDeAno = new Date("2026-12-31T23:59:59.000Z");

      const periodo = periodoDe(finDeAno);

      expect(periodo).toEqual({
        desde: new Date("2026-12-01T00:00:00.000Z"),
        reinicia: new Date("2027-01-01T00:00:00.000Z"),
      });
    });
  });

  describe("agruparPorDia", () => {
    const hoy = new Date("2026-10-14T18:30:00.000Z");

    it("Actividad de 12 semanas", () => {
      const despliegues = [
        ...Array.from({ length: 36 }, (_, i) => ({
          creado: new Date(Date.UTC(2026, 9, 14 - (i % 10), 12, 0, 0)),
          estado: "saludable",
        })),
        { creado: new Date("2026-10-10T09:00:00.000Z"), estado: "fallido" },
        { creado: new Date("2026-10-14T15:00:00.000Z"), estado: "fallido" },
      ];

      const dias = agruparPorDia(despliegues, hoy);

      expect(dias).toHaveLength(DIAS_ACTIVIDAD);
      expect(dias[0]).toEqual({ fecha: "2026-07-23", total: 0, fallidos: 0 });
      expect(dias.at(-1)?.fecha).toBe("2026-10-14");
      expect(dias.reduce((acc, d) => acc + d.total, 0)).toBe(38);
      expect(dias.reduce((acc, d) => acc + d.fallidos, 0)).toBe(2);
      expect(dias.filter((d) => d.total === 0).length).toBeGreaterThan(0);
    });

    it("un despliegue fuera de la ventana no cuenta", () => {
      const fueraAntes = new Date("2026-07-22T23:59:59.000Z");
      const fueraDespues = new Date("2026-10-15T00:00:00.000Z");
      const dentro = new Date("2026-07-23T00:00:00.000Z");

      const dias = agruparPorDia(
        [
          { creado: fueraAntes, estado: "fallido" },
          { creado: dentro, estado: "saludable" },
          { creado: fueraDespues, estado: "saludable" },
        ],
        hoy,
      );

      expect(dias).toHaveLength(DIAS_ACTIVIDAD);
      expect(dias[0]).toEqual({ fecha: "2026-07-23", total: 1, fallidos: 0 });
      expect(dias.reduce((acc, d) => acc + d.total, 0)).toBe(1);
    });
  });
});
