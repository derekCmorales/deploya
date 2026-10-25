"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fechaRestaurar, textoPrograma, textoUltimoRespaldo, type EstadoInstalacion } from "@/lib/admin-instalacion";

import { FilaAjuste } from "./fila-ajuste";

/** Preferencia de este navegador: el aviso de la clave ya se leyó. */
const CLAVE_GUARDADA = "deploya:instalacion:clave-guardada";

function leerGuardada(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_GUARDADA) === "si";
  } catch {
    return false;
  }
}

function marcarGuardada(): void {
  try {
    window.localStorage.setItem(CLAVE_GUARDADA, "si");
  } catch {
    // Sin almacenamiento (modo privado): el aviso vuelve a salir la próxima vez.
  }
}

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[13px] text-muted-foreground">{etiqueta}</span>
      {children}
    </div>
  );
}

/** Respaldos: lo que dejó `respaldar.sh` y el aviso de guardar la clave de cifrado. */
export function BloqueRespaldos({ respaldo, ahora }: { respaldo: EstadoInstalacion["respaldo"]; ahora: Date }) {
  const [claveGuardada, setClaveGuardada] = useState(false);
  useEffect(() => setClaveGuardada(leerGuardada()), []);

  return (
    <FilaAjuste titulo="Respaldos" descripcion="Base de datos, variables cifradas y configuración.">
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-end gap-6">
          <Dato etiqueta="Último respaldo">
            <span className="text-sm font-medium">{textoUltimoRespaldo(respaldo.ultimo, ahora)}</span>
          </Dato>
          <Dato etiqueta="Tamaño">
            <span className="font-mono text-sm font-medium">{respaldo.tamanoMb === null ? "—" : `${respaldo.tamanoMb} MB`}</span>
          </Dato>
          <div className="min-w-0 flex-1">
            <Dato etiqueta="Dónde">
              <code className="font-mono text-[13px]">{respaldo.ruta}</code>
            </Dato>
          </div>
          <span className="text-[13px] text-muted-foreground">{textoPrograma(respaldo)}</span>
        </div>
        {claveGuardada ? null : (
          <Banner
            variant="warn"
            title="Guarda la clave de cifrado fuera de este servidor"
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  marcarGuardada();
                  setClaveGuardada(true);
                }}
              >
                Ya la guardé
              </Button>
            }
          >
            Sin <code className="font-mono">CLAVE_CIFRADO_VARIABLES</code>, un respaldo restaura los proyectos pero no puede leer sus variables de
            entorno.
          </Banner>
        )}
        <p className="text-[13px] text-muted-foreground">
          Restaurar: <code className="font-mono text-foreground">./scripts/respaldar.sh --restaurar {fechaRestaurar(respaldo.ultimo)}</code>
        </p>
      </Card>
    </FilaAjuste>
  );
}
