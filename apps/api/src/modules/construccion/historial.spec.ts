import { BadRequestException } from "@nestjs/common";
import { motorDePrueba } from "../../pruebas/motor";
import { cursorHistorial, DesplieguesController, filtroHistorial } from "./despliegues.controller";
import { ClonFallido, ConstruccionFallida, ProyectoNoEncontrado } from "./dominio/errores";
import { PAGINA_HISTORIAL } from "./dominio/historial";

type Motor = ReturnType<typeof motorDePrueba>;

async function desplegarVarios(motor: Motor, cantidad: number): Promise<void> {
  for (let i = 0; i < cantidad; i++) await motor.desplegar();
}

describe("Historial de despliegues (M7-02)", () => {
  it("Filtrar fallidos", async () => {
    const motor = motorDePrueba();
    await desplegarVarios(motor, 2);
    motor.constructorImagen.error = new ConstruccionFallida(127, "tsc: not found");
    await motor.desplegar();
    motor.constructorImagen.error = null;
    await motor.desplegar();

    const fallidos = await motor.servicio.historial("proyecto-1", "usuario-1", "fallidos", null);
    const saludables = await motor.servicio.historial("proyecto-1", "usuario-1", "saludables", null);
    const todos = await motor.servicio.historial("proyecto-1", "usuario-1", "todos", null);

    expect(fallidos.despliegues.map((d) => [d.numero, d.estado])).toEqual([[3, "fallido"]]);
    expect(saludables.despliegues.map((d) => d.numero)).toEqual([4, 2, 1]);
    expect(todos.despliegues.map((d) => d.numero)).toEqual([4, 3, 2, 1]);
  });

  it("Cargar más", async () => {
    const motor = motorDePrueba();
    await desplegarVarios(motor, 25);

    const primera = await motor.servicio.historial("proyecto-1", "usuario-1", "todos", null);
    const segunda = await motor.servicio.historial("proyecto-1", "usuario-1", "todos", primera.siguiente);

    expect(PAGINA_HISTORIAL).toBe(20);
    expect(primera.despliegues.map((d) => d.numero)).toEqual(Array.from({ length: 20 }, (_, i) => 25 - i));
    expect(primera.siguiente).toBe(6);
    expect(segunda.despliegues.map((d) => d.numero)).toEqual([5, 4, 3, 2, 1]);
    expect(segunda.siguiente).toBeNull();
  });

  it("Cargar más no repite filas aunque entren despliegues nuevos", async () => {
    const motor = motorDePrueba();
    await desplegarVarios(motor, 22);
    const primera = await motor.servicio.historial("proyecto-1", "usuario-1", "todos", null);
    await desplegarVarios(motor, 3);

    const segunda = await motor.servicio.historial("proyecto-1", "usuario-1", "todos", primera.siguiente);

    expect(segunda.despliegues.map((d) => d.numero)).toEqual([2, 1]);
  });

  it("una página justa de 20 no ofrece «Cargar más»", async () => {
    const motor = motorDePrueba();
    await desplegarVarios(motor, 20);

    const pagina = await motor.servicio.historial("proyecto-1", "usuario-1", "todos", null);

    expect(pagina.despliegues).toHaveLength(20);
    expect(pagina.siguiente).toBeNull();
  });

  it("Fila activa marcada", async () => {
    const motor = motorDePrueba();
    const activo = await motor.desplegar();
    motor.constructorImagen.error = new ConstruccionFallida(127, "tsc: not found");
    await motor.desplegar();

    const { despliegues } = await motor.servicio.historial("proyecto-1", "usuario-1", "todos", null);

    expect(despliegues.map((d) => [d.numero, d.estado, d.activo])).toEqual([
      [2, "fallido", false],
      [1, "saludable", true],
    ]);
    expect(despliegues[1].id).toBe(activo.id);
  });

  it("cada fila trae commit, duración e imagen con su disponibilidad", async () => {
    const motor = motorDePrueba();
    await desplegarVarios(motor, 7);

    const { despliegues } = await motor.servicio.historial("proyecto-1", "usuario-1", "todos", null);

    expect(despliegues[0]).toEqual(
      expect.objectContaining({
        numero: 7,
        disparador: "manual",
        commit: { sha: motor.clonador.commit.sha, mensaje: "feat: demo", rama: "main" },
        imagen: { digest: motor.constructorImagen.imagen.digest, disponible: true },
        duracionMs: 0,
      }),
    );
    expect(despliegues.at(-1)?.imagen?.disponible).toBe(false);
  });

  it("un despliegue sin imagen ni commit (clon fallido) se lista con esos campos en null", async () => {
    const motor = motorDePrueba();
    motor.clonador.error = new ClonFallido("sin red");
    await motor.desplegar();

    const { despliegues } = await motor.servicio.historial("proyecto-1", "usuario-1", "todos", null);

    expect(despliegues[0]).toEqual(expect.objectContaining({ commit: null, imagen: null, artefactoId: null }));
  });

  it("un despliegue en curso aún no tiene duración", async () => {
    const motor = motorDePrueba();
    await motor.servicio.crearDespliegue("proyecto-1");

    const { despliegues } = await motor.servicio.historial("proyecto-1", "usuario-1", "todos", null);

    expect(despliegues[0]).toEqual(expect.objectContaining({ estado: "encolado", duracionMs: null }));
  });

  it("un proyecto ajeno o inexistente es 404", async () => {
    const motor = motorDePrueba();

    await expect(motor.servicio.historial("proyecto-1", "otro-usuario", "todos", null)).rejects.toThrow(ProyectoNoEncontrado);
    await expect(motor.servicio.historial("no-existe", "usuario-1", "todos", null)).rejects.toThrow(ProyectoNoEncontrado);
  });

  describe("consulta HTTP", () => {
    it("filtro y cursor se validan", () => {
      expect(filtroHistorial(undefined)).toBe("todos");
      expect(filtroHistorial("fallidos")).toBe("fallidos");
      expect(() => filtroHistorial("todas")).toThrow(BadRequestException);
      expect(cursorHistorial(undefined)).toBeNull();
      expect(cursorHistorial("6")).toBe(6);
      expect(() => cursorHistorial("0")).toThrow(BadRequestException);
      expect(() => cursorHistorial("abc")).toThrow(BadRequestException);
    });

    it("GET /proyectos/:id/despliegues entrega la página", async () => {
      const motor = motorDePrueba();
      await desplegarVarios(motor, 3);
      const controlador = new DesplieguesController(motor.servicio);

      const pagina = await controlador.historial("proyecto-1", "saludables", "3", "usuario-1");

      expect(pagina.despliegues.map((d) => d.numero)).toEqual([2, 1]);
    });
  });
});
