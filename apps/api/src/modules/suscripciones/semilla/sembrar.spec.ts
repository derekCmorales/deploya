import { RelojFijo } from "../../../compartido/reloj";
import { RepositorioPlanesMemoria } from "../adaptadores/repositorio-planes.memoria";
import { RepositorioSuscripcionesMemoria } from "../adaptadores/repositorio-suscripciones.memoria";
import { SuscripcionesService } from "../suscripciones.service";
import { DestinoSemillaMemoria } from "./destino-semilla.memoria";
import { sembrar, type Hashear } from "./sembrar";
import { ClaveAdminFaltante } from "./semilla";

const ENTORNO = { ADMIN_CLAVE: "Clave-Admin-1" };

function armar() {
  const destino = new DestinoSemillaMemoria();
  const suscripciones = new RepositorioSuscripcionesMemoria(destino.planes);
  const servicio = new SuscripcionesService(new RepositorioPlanesMemoria(destino.planes), suscripciones, new RelojFijo());
  let llamadas = 0;
  const hashear: Hashear = async (clave) => `hash-${clave}-${++llamadas}`;
  const foto = () => JSON.parse(JSON.stringify({ planes: destino.planes, usuarios: destino.usuarios, suscripciones: suscripciones.guardadas() }));
  return { destino, servicio, hashear, foto };
}

describe("sembrar", () => {
  it("Seed idempotente: dos corridas dejan los mismos registros", async () => {
    const { destino, servicio, hashear, foto } = armar();
    await sembrar(destino, servicio, hashear, ENTORNO);
    const primera = foto();
    await sembrar(destino, servicio, hashear, ENTORNO);
    expect(foto()).toEqual(primera);
    expect(primera.planes).toHaveLength(4);
    expect(primera.usuarios).toHaveLength(2);
    expect(primera.suscripciones).toHaveLength(2);
  });

  it("el administrador y el cliente quedan con Sandbox Activa y contraseña con hash", async () => {
    const { destino, servicio, hashear } = armar();
    await sembrar(destino, servicio, hashear, ENTORNO);
    for (const usuario of destino.usuarios) {
      expect(usuario.hashContrasena).not.toBe(ENTORNO.ADMIN_CLAVE);
      await expect(servicio.cuotaDe(usuario.id)).resolves.toMatchObject({ plan: { codigo: "sandbox" }, estado: "activa", vence: null });
    }
    expect(destino.usuarios.map((u) => u.rol)).toEqual(["administrador", "cliente"]);
  });

  it("sin ADMIN_CLAVE no escribe nada", async () => {
    const { destino, servicio, hashear } = armar();
    await expect(sembrar(destino, servicio, hashear, {})).rejects.toBeInstanceOf(ClaveAdminFaltante);
    expect(destino.planes).toHaveLength(0);
    expect(destino.usuarios).toHaveLength(0);
  });
});
