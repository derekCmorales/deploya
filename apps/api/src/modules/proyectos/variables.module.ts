import { Module } from "@nestjs/common";
import { cifradorDesdeEntorno } from "./adaptadores/cifrador-aes-gcm";
import { CifradorVariables } from "./puertos/cifrador-variables.puerto";
import { VariablesProyectoService } from "./servicios/variables-proyecto.service";

/**
 * M3-03 exportado para la API y para el trabajador (M5 descifra al crear el contenedor).
 * `CifradorVariables` también se exporta: la clave del SMTP de la instalación (SP-17) se cifra
 * con la misma `CLAVE_CIFRADO_VARIABLES` (contrato instalacion.md § Correo).
 */
@Module({
  providers: [
    VariablesProyectoService,
    { provide: CifradorVariables, useFactory: () => cifradorDesdeEntorno(process.env) },
  ],
  exports: [VariablesProyectoService, CifradorVariables],
})
export class VariablesModule {}
