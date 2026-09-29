import { scryptSync, timingSafeEqual } from "node:crypto";
import { hashSemilla } from "./hash-semilla";

describe("hashSemilla", () => {
  it("usa el formato scrypt:<sal>:<hash> de M1 y solo coincide con su clave", async () => {
    const hash = await hashSemilla("Clave-Admin-1");
    const [prefijo, sal, derivada] = hash.split(":");
    expect(prefijo).toBe("scrypt");
    expect(sal).toMatch(/^[0-9a-f]{32}$/);
    expect(derivada).toMatch(/^[0-9a-f]{128}$/);
    expect(hash).not.toContain("Clave-Admin-1");
    const comparar = (clave: string) =>
      timingSafeEqual(scryptSync(clave, Buffer.from(sal, "hex"), 64), Buffer.from(derivada, "hex"));
    expect(comparar("Clave-Admin-1")).toBe(true);
    expect(comparar("otra")).toBe(false);
  });
});
