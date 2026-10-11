"use client";

import { CircleCheck, GitBranch, GitCommitHorizontal, Hash, Link2, RotateCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, Sunken } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { useAltaProyecto } from "@/hooks/use-alta-proyecto";
import { DOMINIO_APPS } from "@/lib/api";
import { haceCuanto, shaCorto, tituloDeteccion, type ErrorAlta, type ValidacionRepositorio } from "@/lib/proyectos";

type Alta = ReturnType<typeof useAltaProyecto>;

/** Ejemplo que 11e ofrece cuando falta el Dockerfile (texto exacto de la ficha). */
export const DOCKERFILE_EJEMPLO = `FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 8080
CMD ["npm", "start"]`;

/** Paso 1 del asistente: pantalla 11a y sus errores de 11e. */
export function PasoRepositorio({ alta }: { alta: Alta }) {
  const { validacion, error } = alta;
  const accesible = validacion !== null || error?.tipo === "sin-dockerfile" || error?.tipo === "stack-no-reconocido";
  const errorDe = (campo: string) => (error?.tipo === "campo" && error.campo === campo ? error.mensaje : undefined);
  const errorUrl = error?.tipo === "no-accesible" ? `No pudimos acceder al repositorio (HTTP ${error.estadoHttp}).` : errorDe("url");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] font-medium text-muted-foreground">Paso 1 · Repositorio</p>
        <h2 className="text-lg font-semibold tracking-[-0.02em]">¿Qué repositorio desplegamos?</h2>
        <p className="text-muted-foreground">
          Repositorio público con un <span className="font-mono text-[13px] text-foreground">Dockerfile</span> en la raíz. El
          lenguaje y las dependencias los defines tú ahí.
        </p>
      </div>

      <Field id="url" label="URL del repositorio" error={errorUrl} hint={validacion ? `Repositorio público · ${cantidadRamas(validacion.ramas.length)}` : undefined}>
        <div className="relative">
          <Link2 className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="url"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://github.com/usuario/proyecto"
            value={alta.url}
            onChange={(e) => alta.cambiarUrl(e.target.value)}
            aria-invalid={!!errorUrl}
            aria-describedby="url-msg"
            className={accesible ? "pr-28 pl-8 font-mono" : "pl-8 font-mono"}
          />
          {accesible ? (
            <span className="absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center gap-1.5 text-xs text-ok">
              <CircleCheck className="size-3.5" aria-hidden />
              Accesible
            </span>
          ) : null}
        </div>
      </Field>

      <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-3">
        <Field id="rama" label="Rama" error={errorDe("rama")}>
          <div className="relative">
            <GitBranch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="rama"
              list="ramas-repositorio"
              autoComplete="off"
              spellCheck={false}
              value={alta.rama}
              onChange={(e) => alta.cambiarRama(e.target.value)}
              aria-invalid={!!errorDe("rama")}
              aria-describedby="rama-msg"
              className="pl-8 font-mono"
            />
            <datalist id="ramas-repositorio">
              {validacion?.ramas.map((r) => <option key={r} value={r} />)}
            </datalist>
          </div>
        </Field>
        {validacion ? (
          <>
            <Field
              id="nombre"
              label="Nombre del proyecto"
              error={errorDe("nombre")}
              hint={
                <>
                  URL: <span className="font-mono text-foreground">{alta.subdominio || "…"}.{DOMINIO_APPS}</span>
                </>
              }
            >
              <Input
                id="nombre"
                autoComplete="off"
                value={alta.nombre}
                onChange={(e) => alta.cambiarNombre(e.target.value)}
                aria-invalid={!!errorDe("nombre")}
                aria-describedby="nombre-msg"
                className="font-mono"
              />
            </Field>
            <Field
              id="puerto"
              label="Puerto interno"
              error={errorDe("puerto")}
              hint={
                validacion.deteccion && validacion.deteccion.receta !== "dockerfile" ? (
                  <>Lo toma la receta. Puedes cambiarlo.</>
                ) : (
                  <>
                    Tomado de <span className="font-mono">EXPOSE</span>. Puedes cambiarlo.
                  </>
                )
              }
            >
              <div className="relative">
                <Hash className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="puerto"
                  inputMode="numeric"
                  value={alta.puerto}
                  onChange={(e) => alta.cambiarPuerto(e.target.value)}
                  aria-invalid={!!errorDe("puerto")}
                  aria-describedby="puerto-msg"
                  className="pl-8 font-mono"
                />
              </div>
            </Field>
          </>
        ) : null}
      </div>

      {error ? <ErrorRepositorio error={error} onReintentar={alta.validar} ocupado={alta.ocupado} /> : null}

      {validacion ? (
        <>
          <TarjetaDeteccion validacion={validacion} />
          <Sunken className="dy-entrada flex items-center gap-3 px-4 py-3.5">
            <GitCommitHorizontal className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="flex min-w-0 flex-col">
              <p className="truncate font-mono text-[13px]">
                {shaCorto(validacion.commit.sha)} · {validacion.commit.mensaje}
              </p>
              <p className="text-xs text-muted-foreground">
                Último commit en {validacion.rama} · {haceCuanto(validacion.commit.fecha, new Date())} · {validacion.commit.autor}
              </p>
            </div>
          </Sunken>
        </>
      ) : null}
    </div>
  );
}

/** Errores de 11e («no accesible», «falta Dockerfile») y avisos que no son de un campo. */
function ErrorRepositorio({ error, onReintentar, ocupado }: { error: ErrorAlta; onReintentar: () => void; ocupado: boolean }) {
  if (error.tipo === "no-accesible") {
    return (
      <div className="flex flex-col gap-4">
        <Sunken className="flex flex-col gap-2 px-3.5 py-3">
          <p className="text-xs">Revisa que:</p>
          <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
            <li>· la URL sea correcta y termine en el nombre del repositorio;</li>
            <li>· el repositorio sea público (los privados llegarán más adelante).</li>
          </ul>
        </Sunken>
        <Button type="button" size="sm" className="self-start" onClick={onReintentar} disabled={ocupado}>
          <RotateCw />
          Reintentar
        </Button>
      </div>
    );
  }
  if (error.tipo === "stack-no-reconocido") {
    return (
      <div className="flex flex-col gap-4">
        <Banner variant="bad" title={error.mensaje}>
          {error.pista}
        </Banner>
        <EjemploDockerfile onReintentar={onReintentar} ocupado={ocupado} />
      </div>
    );
  }
  if (error.tipo === "sin-dockerfile") {
    return (
      <div className="flex flex-col gap-4">
        <Banner
          variant="bad"
          title={
            <>
              No encontramos un Dockerfile en la raíz de <span className="font-mono">{error.rama}</span>
            </>
          }
        >
          deploya solo construye proyectos que traen su propio Dockerfile.
        </Banner>
        <EjemploDockerfile onReintentar={onReintentar} ocupado={ocupado} />
      </div>
    );
  }
  if (error.tipo === "aviso") return <Banner variant="warn" title={error.mensaje} />;
  return null;
}

function TarjetaDeteccion({ validacion }: { validacion: ValidacionRepositorio }) {
  const { titulo, detalle } = tituloDeteccion(validacion);
  return (
    <Card className="dy-entrada flex items-center gap-4 border-ok/40 px-4 py-3.5">
      <CircleCheck className="size-[18px] shrink-0 text-ok" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="font-medium">{titulo}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">{detalle}</p>
      </div>
      <Badge variant="ok">Listo para construir</Badge>
    </Card>
  );
}

function EjemploDockerfile({ onReintentar, ocupado }: { onReintentar: () => void; ocupado: boolean }) {
  return (
    <>
      <Sunken className="flex flex-col gap-2 px-3.5 py-3">
        <p className="text-xs">
          Agrega un archivo <span className="font-mono">Dockerfile</span> como este y vuelve a intentar:
        </p>
        <pre className="font-mono text-xs leading-5 whitespace-pre-wrap text-muted-foreground">{DOCKERFILE_EJEMPLO}</pre>
      </Sunken>
      <Button type="button" size="sm" className="self-start" onClick={onReintentar} disabled={ocupado}>
        <RotateCw />
        Volver a revisar
      </Button>
    </>
  );
}

function cantidadRamas(n: number): string {
  return `${n} ${n === 1 ? "rama" : "ramas"}`;
}
