import { Injectable } from '@nestjs/common';
import { ProveedorFuente } from './proveedor-fuente.abstract';

export class RepositorioNoAccesible extends Error {
  constructor() { 
    super('El repositorio no es accesible, no existe o es privado.'); 
  }
}

export class RepositorioSinDockerfile extends Error {
  constructor() { 
    super('El repositorio no contiene un archivo Dockerfile en la raíz.'); 
  }
}

@Injectable()
export class FuenteGitHubPublica implements ProveedorFuente {
  async verificarRepositorio(url: string, rama: string = 'main') {
    const partesUrl = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    
    if (!partesUrl) {
      throw new RepositorioNoAccesible();
    }

    const dueno = partesUrl[1];
    const nombreRepo = partesUrl[2];

    const respuestaRepo = await fetch(`https://api.github.com/repos/${dueno}/${nombreRepo}`);
    if (!respuestaRepo.ok) {
      throw new RepositorioNoAccesible();
    }

    const respuestaCommit = await fetch(`https://api.github.com/repos/${dueno}/${nombreRepo}/commits/${rama}`);
    if (!respuestaCommit.ok) {
      throw new RepositorioNoAccesible();
    }
    const datosCommit = await respuestaCommit.json();

    const respuestaDockerfile = await fetch(`https://api.github.com/repos/${dueno}/${nombreRepo}/contents/Dockerfile?ref=${rama}`);
    if (!respuestaDockerfile.ok) {
      throw new RepositorioSinDockerfile();
    }
    
    const datosDockerfile = await respuestaDockerfile.json();
    const textoDockerfile = Buffer.from(datosDockerfile.content, 'base64').toString('utf-8');

    return {
      accesible: true,
      commit: {
        sha: datosCommit.sha,
        mensaje: datosCommit.commit.message,
        autor: datosCommit.commit.author.name,
      },
      dockerfile: textoDockerfile,
    };
  }
}