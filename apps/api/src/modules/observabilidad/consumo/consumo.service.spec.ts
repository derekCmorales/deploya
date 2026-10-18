import { Test, TestingModule } from "@nestjs/testing";
import { ConsumoService } from "./consumo.service";
import { Reloj } from "../../../compartido/reloj";
import {
  CambiosDespliegue,
  MuestraDespliegue,
  NuevoDespliegue,
  RepositorioDespliegues,
} from "../../construccion/puertos/repositorio-despliegues.puerto";
import { ProyectosLecturaPuerto } from "../../construccion/puertos/proyectos-lectura.puerto";
import {
  CuotaPlanPuerto,
  PermisoPlan,
  PlanContratado,
  RecursosPlan,
} from "../../orquestacion/puertos/cuota-plan.puerto";
import {
  CuotaProyectos,
  CuotaProyectosPuerto,
} from "../../proyectos/puertos/cuota-proyectos.puerto";
import { Despliegue, LineaBitacora } from "../../construccion/dominio/despliegue";
import { Etapa, EstadoEtapa } from "../../construccion/dominio/estados";
import { FiltroHistorial } from "../../construccion/dominio/historial";

class RelojFijoStub extends Reloj {
  constructor(private readonly fechaFija: Date) {
    super();
  }
  ahora(): Date {
    return this.fechaFija;
  }
}

interface RegistroConstruccion {
  proyectoId: string;
  creado: Date;
  estado: string;
}

class RepositorioDesplieguesStub extends RepositorioDespliegues {
  private despliegues: RegistroConstruccion[] = [];

  agregar(d: RegistroConstruccion): void {
    this.despliegues.push(d);
  }

  async contarConstruccionesDesde(_usuarioId: string, desde: Date): Promise<number> {
    return this.despliegues.filter((d) => d.creado >= desde && d.estado !== "reversion").length;
  }

  async desplieguesDesde(_proyectoId: string, _desde: Date): Promise<MuestraDespliegue[]> {
    return [];
  }

  crear(_nuevo: NuevoDespliegue): Promise<Despliegue> {
    throw new Error("Method not implemented.");
  }
  porId(_id: string): Promise<Despliegue | null> {
    throw new Error("Method not implemented.");
  }
  porNumero(_proyectoId: string, _numero: number): Promise<Despliegue | null> {
    throw new Error("Method not implemented.");
  }
  porCommit(_proyectoId: string, _commitSha: string): Promise<Despliegue | null> {
    throw new Error("Method not implemented.");
  }
  cambiarEstado(_id: string, _estado: unknown, _cambios?: CambiosDespliegue): Promise<void> {
    throw new Error("Method not implemented.");
  }
  marcarEtapa(_id: string, _etapa: Etapa, _estado: EstadoEtapa, _marca: Date): Promise<void> {
    throw new Error("Method not implemented.");
  }
  agregarLineas(_id: string, _lineas: LineaBitacora[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  lineasDesde(_id: string, _desde: number, _limite: number): Promise<LineaBitacora[]> {
    throw new Error("Method not implemented.");
  }
  ultimosDe(_proyectoIds: string[]): Promise<Despliegue[]> {
    throw new Error("Method not implemented.");
  }
  activoDe(_proyectoId: string): Promise<Despliegue | null> {
    throw new Error("Method not implemented.");
  }
  historialDe(
    _proyectoId: string,
    _filtro: FiltroHistorial,
    _antesDe: number | null,
    _limite: number,
  ): Promise<Despliegue[]> {
    throw new Error("Method not implemented.");
  }
  enCursoDe(_proyectoId: string): Promise<Despliegue | null> {
    throw new Error("Method not implemented.");
  }
  marcarActivo(_proyectoId: string, _despliegueId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

class ProyectosLecturaStub implements ProyectosLecturaPuerto {
  async contarPorUsuario(): Promise<number> {
    return 1;
  }
  async porId(): Promise<null> {
    return null;
  }
  async deUsuario(): Promise<never[]> {
    return [];
  }
}

class CuotaPlanStub implements CuotaPlanPuerto {
  async recursosDe(_usuarioId: string): Promise<RecursosPlan> {
    return {
      construccionesMes: 150,
      limiteConstrucciones: 150,
      construccionesPorMes: 150,
      construcciones: 150,
      limite: 150,
    } as unknown as RecursosPlan;
  }
  async permisoDe(_usuarioId: string): Promise<PermisoPlan> {
    return {
      permitido: true,
      construccionesMes: 150,
      limiteConstrucciones: 150,
      construccionesPorMes: 150,
      construcciones: 150,
      limite: 150,
    } as unknown as PermisoPlan;
  }
  async planDe(_usuarioId: string): Promise<PlanContratado> {
    return {
      construccionesMes: 150,
      limiteConstrucciones: 150,
      construccionesPorMes: 150,
      construcciones: 150,
      limite: 150,
    } as unknown as PlanContratado;
  }
  async limiteConstrucciones(): Promise<number> {
    return 150;
  }
}

class CuotaProyectosStub implements CuotaProyectosPuerto {
  async cuotaDe(_usuarioId: string): Promise<CuotaProyectos> {
    return {
      usados: 1,
      actuales: 1,
      proyectosActivos: 1,
      limite: 3,
      maximo: 3,
      proyectosMaximos: 3,
      limiteProyectos: 3,
    } as unknown as CuotaProyectos;
  }
  async limiteProyectos(): Promise<number> {
    return 3;
  }
}

describe("ConsumoService", () => {
  let servicio: ConsumoService;
  let repoDespliegues: RepositorioDesplieguesStub;
  let reloj: RelojFijoStub;

  beforeEach(async () => {
    repoDespliegues = new RepositorioDesplieguesStub();
    reloj = new RelojFijoStub(new Date("2026-10-01T00:00:00.000Z")); // 1 de octubre

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        ConsumoService,
        { provide: Reloj, useValue: reloj },
        { provide: RepositorioDespliegues, useValue: repoDespliegues },
        { provide: ProyectosLecturaPuerto, useClass: ProyectosLecturaStub },
        { provide: CuotaPlanPuerto, useClass: CuotaPlanStub },
        { provide: CuotaProyectosPuerto, useClass: CuotaProyectosStub },
      ],
    }).compile();

    servicio = modulo.get<ConsumoService>(ConsumoService);
  });

  it("escenario 'Mes nuevo': con despliegues en septiembre, el 1 de octubre muestra 0 construcciones usadas", async () => {
    repoDespliegues.agregar({
      proyectoId: "p1",
      creado: new Date("2026-09-15T10:00:00.000Z"),
      estado: "saludable",
    });

    const resultado = await servicio.de("user-1");

    expect(resultado.construcciones.usadas).toBe(0);
    expect(resultado.construcciones.limite).toBe(150);
    expect(resultado.periodo).toBeDefined();
  });

  it("escenario 'la reversión no suma': los despliegues de tipo reversion no incrementan el contador de construcciones", async () => {
    repoDespliegues.agregar({
      proyectoId: "p1",
      creado: new Date("2026-10-02T10:00:00.000Z"),
      estado: "saludable",
    });
    repoDespliegues.agregar({
      proyectoId: "p1",
      creado: new Date("2026-10-03T10:00:00.000Z"),
      estado: "reversion",
    });

    const resultado = await servicio.de("user-1");

    expect(resultado.construcciones.usadas).toBe(1);
  });
});