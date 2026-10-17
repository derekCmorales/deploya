import { ConsultaInvalida } from "./errores";
import { contenedoresDetenidos, validarFiltroUsuarios } from "./usuarios";

describe("M9-01 · filtro de usuarios", () => {
  it("sin parámetros: todas las cuentas, página 1", () => {
    expect(validarFiltroUsuarios({})).toEqual({ correo: null, suscripcion: null, pagina: 1 });
  });

  it("normaliza el correo y acepta un estado de suscripción", () => {
    expect(validarFiltroUsuarios({ correo: "  TiendaDemo ", suscripcion: "vencida", pagina: "3" })).toEqual({
      correo: "tiendademo",
      suscripcion: "vencida",
      pagina: 3,
    });
  });

  it.each([{ suscripcion: "pausada" }, { pagina: "0" }, { pagina: "dos" }, { pagina: "1.5" }])("rechaza %o", (consulta) => {
    expect(() => validarFiltroUsuarios(consulta)).toThrow(ConsultaInvalida);
  });

  it("cuenta los contenedores detenidos", () => {
    const proyecto = (despliegue: string | null) => ({ id: "p", nombre: "p", subdominio: "p", despliegue });

    expect(contenedoresDetenidos([proyecto("detenido"), proyecto("saludable"), proyecto(null), proyecto("detenido")])).toBe(2);
  });
});
