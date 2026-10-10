/// <reference types="jest" />

import { VariablesProyectoService } from './variables-proyecto.service';
import { CifradorFalso } from '../adaptadores/cifrador-falso';
import { RepositorioVariablesMemoria } from '../adaptadores/repositorio-variables-memoria';
import { ClaveInvalida } from '../dominio/errores';

describe('VariablesProyectoService', () => {
  it('guarda y lista variables correctamente con cifrado transparente', async () => {
    const cifrador = new CifradorFalso();
    const repo = new RepositorioVariablesMemoria();
    const servicio = new VariablesProyectoService(cifrador, repo);

    const proyectoId = 'proj-1';
    const variables = [
      { clave: 'API_KEY', valor: 'secreto-123' },
      { clave: 'DB_HOST', valor: 'localhost' },
    ];

    await servicio.guardarVariables(proyectoId, variables);
    const listadas = await servicio.listarVariables(proyectoId);

    expect(listadas).toEqual(variables);
  });

  it('lanza error al intentar guardar variables con claves inválidas', async () => {
    const cifrador = new CifradorFalso();
    const repo = new RepositorioVariablesMemoria();
    const servicio = new VariablesProyectoService(cifrador, repo);

    const proyectoId = 'proj-1';
    const invalidas = [
      { clave: 'api_key', valor: 'secreto-123' }, // minúsculas no permitidas
    ];

    await expect(servicio.guardarVariables(proyectoId, invalidas)).rejects.toThrow(ClaveInvalida);
  });
});