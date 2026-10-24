import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { EstadoInstalacion } from "@/lib/admin-instalacion";

import { FilaAjuste } from "./fila-ajuste";

const NOTAS_VERSION = "https://github.com/derekCmorales/deploya/releases/tag/";

/** Versión: la instalada, la disponible y lo que hace `actualizar.sh` (SP-19). */
export function BloqueVersion({ version, rutaRespaldos }: { version: EstadoInstalacion["version"]; rutaRespaldos: string }) {
  return (
    <FilaAjuste titulo="Versión" descripcion="Actualizar hace un respaldo antes y no corta las apps publicadas.">
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-medium">{version.instalada ?? "Versión desconocida"}</span>
          <span className="flex-1" />
          {version.disponible ? (
            <>
              <Badge variant="outline">{version.disponible} disponible</Badge>
              <a className="text-[13px] underline decoration-border-stronger underline-offset-[3px] hover:decoration-foreground" href={`${NOTAS_VERSION}${version.disponible}`}>
                Notas de la versión
              </a>
            </>
          ) : (
            <span className="text-[13px] text-muted-foreground">Estás en la última versión</span>
          )}
        </div>
        <pre className="m-0 rounded-xl border border-border-strong bg-sunken px-6 py-5 font-mono text-[12.5px] leading-[21px] whitespace-pre-wrap">
          <span className="text-muted-foreground">$</span> ./scripts/actualizar.sh{"\n"}
          <span className="text-ok">✓</span> Respaldo previo · {rutaRespaldos}
          {"\n"}
          <span className="text-ok">✓</span> {version.disponible ?? "La nueva versión"} descargada · migraciones aplicadas{"\n"}
          <span className="text-ok">✓</span> api, web y trabajador reiniciados · las apps publicadas no se cortan
        </pre>
        <p className="text-[13px] text-muted-foreground">
          Si algo sale mal, <code className="font-mono text-foreground">./scripts/actualizar.sh --volver</code> restaura el respaldo previo.
        </p>
      </Card>
    </FilaAjuste>
  );
}
