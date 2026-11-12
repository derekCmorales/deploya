import { Inject, Injectable } from "@nestjs/common";
import { CifradorVariables } from "../proyectos/puertos/cifrador-variables.puerto";
import { DOMINIO_DATOS } from "./datos.constantes";
import type { RecursoDatos } from "./dominio/recurso-datos";
import { tipoRecursoDe, type VariablesRecurso } from "./dominio/tipo-recurso-datos";
import { urlPublicaDe, type DominioPublico } from "./dominio/vista-recurso";

/**
 * Las variables de conexión de un recurso con su contraseña descifrada. La usan la API (copiar la
 * conexión) y el trabajador (inyectarlas al desplegar): una sola regla en un solo lugar.
 */
@Injectable()
export class ConexionesDatos {
  constructor(
    private readonly cifrador: CifradorVariables,
    @Inject(DOMINIO_DATOS) private readonly dominio: DominioPublico,
  ) {}

  variablesDe(recurso: RecursoDatos, subdominioDueno: string): VariablesRecurso {
    return tipoRecursoDe(recurso.tipo).variables({
      host: recurso.contenedor,
      contrasena: this.contrasenaDe(recurso),
      urlPublica: urlPublicaDe(recurso.tipo, subdominioDueno, this.dominio),
    });
  }

  contrasenaDe(recurso: RecursoDatos): string {
    return this.cifrador.descifrar(recurso.contrasenaCifrada);
  }

  get dominioPublico(): DominioPublico {
    return this.dominio;
  }
}
