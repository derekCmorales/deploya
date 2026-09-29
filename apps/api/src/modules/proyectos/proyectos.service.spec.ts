/// <reference types="jest" />
import { ProyectosService } from "./proyectos.service";
import { ProveedorFuente } from "./puertos/proveedor-fuente.puerto";
import { RepositorioProyectos } from "./puertos/repositorio-proyectos.puerto";
import { CuotaProyectosPuerto } from "./puertos/cuota-proyectos.puerto";
import { ConstruccionService } from "../construccion/construccion.service";
import { LimiteProyectosAlcanzado, SubdominioEnUso } from "./dominio/errores";

describe("ProyectosService", () => {
  let servicio: ProyectosService;
  let proveedorMock: jest.Mocked<ProveedorFuente>;
  let repositorioMock: jest.Mocked<RepositorioProyectos>;
  let cuotaMock: jest.Mocked<CuotaProyectosPuerto>;
  let construccionMock: jest.Mocked<ConstruccionService>;

  beforeEach(() => {
    proveedorMock = {
      validar: jest.fn(),
    } as unknown as jest.Mocked<ProveedorFuente>;

    repositorioMock = {
      guardar: jest.fn(),
      porId: jest.fn(),
      deUsuario: jest.fn(),
      existeSubdominio: jest.fn(),
    } as unknown as jest.Mocked<RepositorioProyectos>;

    cuotaMock = {
      maxProyectosDe: jest.fn(),
    } as unknown as jest.Mocked<CuotaProyectosPuerto>;

    construccionMock = {
      crearDespliegue: jest.fn(),
      ultimosDespliegues: jest.fn(),
    } as unknown as jest.Mocked<ConstruccionService>;

    servicio = new ProyectosService(proveedorMock, repositorioMock, cuotaMock, construccionMock);
  });

  it("sandbox con 1 proyecto bloquea el alta", async () => {
    cuotaMock.maxProyectosDe.mockResolvedValue(1);
    repositorioMock.deUsuario.mockResolvedValue([
      { id: "proj-1", usuarioId: "u1", nombre: "P1", subdominio: "p1", urlRepositorio: "", rama: "main", rutaDockerfile: "Dockerfile", puertoInterno: 8080, creado: new Date() },
    ]);

    await expect(
      servicio.crear("u1", { url: "https://github.com/duenio/repo", nombre: "Nuevo", rama: "main", puerto: 8080 })
    ).rejects.toThrow(LimiteProyectosAlcanzado);
  });

  it("subdominio duplicado lanza SubdominioEnUso", async () => {
    cuotaMock.maxProyectosDe.mockResolvedValue(5);
    repositorioMock.deUsuario.mockResolvedValue([]);
    proveedorMock.validar.mockResolvedValue({
      accesible: true,
      urlNormalizada: "https://github.com/duenio/repo",
      ramas: ["main"],
      commit: { sha: "abc", mensaje: "m", autor: "a" },
      dockerfile: "EXPOSE 8080",
      puerto: 8080,
    });
    repositorioMock.existeSubdominio.mockResolvedValue(true);

    await expect(
      servicio.crear("u1", { url: "https://github.com/duenio/repo", nombre: "Mi App", rama: "main", puerto: 8080 })
    ).rejects.toThrow(SubdominioEnUso);
  });
});