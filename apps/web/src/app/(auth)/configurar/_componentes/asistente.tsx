"use client";

import { notFound, useRouter } from "next/navigation";
import { useState } from "react";

import { Pasos } from "@/components/deploya/pasos";
import { Skeleton } from "@/components/ui/skeleton";
import { useModoInstalacion } from "@/hooks/use-modo-instalacion";
import { useSesion } from "@/hooks/use-sesion";
import { useSondeo } from "@/hooks/use-sondeo";
import { RUTA_ADMIN_INSTALACION, type EstadoInstalacion } from "@/lib/admin-instalacion";
import { pedirApi } from "@/lib/api";
import {
  encabezadoPaso,
  pasoDeEntrada,
  pasoSiguiente,
  pasosVisibles,
  RUTA_AL_TERMINAR,
  textoServidor,
  type Evento,
  type Paso,
} from "@/lib/asistente";

import { PasoAdministrador } from "./paso-administrador";
import { PasoCodigo } from "./paso-codigo";
import { PasoCorreo } from "./paso-correo";
import { PasoDominio } from "./paso-dominio";
import { PasoRegistro } from "./paso-registro";

const nunca = () => false;
const leerInstalacion = () => pedirApi<EstadoInstalacion>(RUTA_ADMIN_INSTALACION);

/** Pantalla 31 (SP-17): elige dónde abrir y lleva la máquina de pasos de `lib/asistente.ts`. */
export function Asistente() {
  const modo = useModoInstalacion();
  const { estado, usuario } = useSesion();
  const entrada = pasoDeEntrada(modo, { estado, rol: usuario?.rol ?? null });

  if (entrada === "no-disponible") notFound();
  if (entrada === "cargando") {
    return (
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-6 py-12" aria-busy="true" aria-label="Cargando la configuración">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  return <Recorrido inicial={entrada} />;
}

function Recorrido({ inicial }: { inicial: Paso }) {
  const router = useRouter();
  const { usuario, recargar } = useSesion();
  const [paso, setPaso] = useState<Paso>(inicial);
  const [codigo, setCodigo] = useState("");
  // Una sola lectura de `GET /admin/instalacion` para los pasos 3 a 5 (hay sesión de administrador desde el paso 2):
  // la columna conserva el dominio aunque se avance antes de que termine, y el paso 5 abre sin esperar.
  const instalacion = useSondeo(paso >= 2 ? leerInstalacion : null, nunca);
  const dominio = instalacion.datos?.dominio ?? null;

  function avanzar(evento: Evento) {
    const siguiente = pasoSiguiente(paso, evento);
    if (siguiente === "terminado") router.push(RUTA_AL_TERMINAR);
    else setPaso(siguiente);
  }

  const correoAdministrador = usuario?.rol === "administrador" ? usuario.correo : null;

  return (
    // Artboard 31: panel lateral (título, pasos y datos del servidor) y el paso a la derecha.
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6 border-b border-border bg-sunken px-6 py-8 lg:border-r lg:border-b-0">
        <header className="flex flex-col gap-0.5 px-3">
          <h1 className="text-[13px] font-medium">Configura tu instalación</h1>
          <p className="text-xs text-muted-foreground">{encabezadoPaso(paso)}</p>
        </header>
        <Pasos pasos={pasosVisibles(paso, { correoAdministrador, dominio })} actual={paso} />
        {instalacion.datos ? (
          <dl className="mx-3 flex flex-col gap-2 border-t border-border pt-5 text-xs">
            <DatoServidor etiqueta="Versión" valor={instalacion.datos.version.instalada ?? "—"} />
            <DatoServidor etiqueta="Certificado" valor={instalacion.datos.salud.find((c) => c.id === "certificado")?.detalle ?? "—"} />
            <DatoServidor etiqueta="Servidor" valor={textoServidor(instalacion.datos.limites.memoriaLibreMb)} />
          </dl>
        ) : null}
      </aside>
      <div className="min-w-0 px-6 py-10 lg:px-12">
        <div className="max-w-[540px]">
          {paso === 0 ? (
            <PasoCodigo
              alValidar={(valido) => {
                setCodigo(valido);
                avanzar("codigo-valido");
              }}
            />
          ) : null}
          {paso === 1 ? (
            <PasoAdministrador
              codigo={codigo}
              alCrear={async () => {
                await recargar();
                avanzar("administrador-creado");
              }}
            />
          ) : null}
          {paso === 2 ? <PasoDominio instalacion={instalacion} alContinuar={() => avanzar("continuar")} /> : null}
          {paso === 3 ? (
            <PasoCorreo
              correoAdministrador={correoAdministrador ?? ""}
              alVolver={() => avanzar("atras")}
              alGuardar={() => avanzar("correo-guardado")}
            />
          ) : null}
          {paso === 4 ? <PasoRegistro instalacion={instalacion} alVolver={() => avanzar("atras")} alTerminar={() => avanzar("continuar")} /> : null}
        </div>
      </div>
    </div>
  );
}

function DatoServidor({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className="min-w-0 text-right">{valor}</dd>
    </div>
  );
}
