"use client";

import { ChevronLeft, ChevronRight, RotateCw, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDetalleUsuario, useUsuariosAdmin } from "@/hooks/use-admin-usuarios";
import { FILTRO_INICIAL, OPCIONES_SUSCRIPCION, textoTotal, totalPaginas, type FiltroSuscripcion, type FiltroUsuarios } from "@/lib/admin-usuarios";

import { PanelDetalleUsuario } from "./panel-detalle-usuario";
import { TablaUsuarios } from "./tabla-usuarios";

const ESPERA_BUSQUEDA_MS = 300;

/** Container de 25: búsqueda, filtro, tabla paginada y panel del usuario seleccionado (patrón D). */
export function UsuariosContenedor() {
  const [texto, setTexto] = useState("");
  const [filtro, setFiltro] = useState<FiltroUsuarios>(FILTRO_INICIAL);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const lista = useUsuariosAdmin(filtro);
  const detalle = useDetalleUsuario(seleccion);
  const [ahora] = useState(() => new Date());

  useEffect(() => {
    const espera = setTimeout(() => setFiltro((f) => (f.correo === texto ? f : { ...f, correo: texto, pagina: 1 })), ESPERA_BUSQUEDA_MS);
    return () => clearTimeout(espera);
  }, [texto]);

  const usuarios = lista.datos?.usuarios ?? [];
  useEffect(() => {
    if (usuarios.length > 0 && !usuarios.some((u) => u.id === seleccion)) setSeleccion(usuarios[0].id);
  }, [usuarios, seleccion]);

  const paginas = lista.datos ? totalPaginas(lista.datos) : 1;
  const alCambiarCuenta = () => {
    lista.recargar();
    detalle.recargar();
  };

  return (
    <main className="flex w-full flex-col gap-6 px-8 pt-7 pb-8">
      <header className="flex flex-col gap-1">
        <p className="text-[13px] text-muted-foreground">Administración</p>
        <h1 className="text-[28px] leading-9 font-semibold tracking-[-0.03em]">Usuarios</h1>
        <p className="text-muted-foreground">Clientes y administradores de deploya</p>
      </header>

      {lista.error ? (
        <Banner
          variant="bad"
          title="No pudimos cargar las cuentas."
          actions={
            <Button size="sm" variant="outline" onClick={lista.recargar}>
              <RotateCw />
              Reintentar
            </Button>
          }
        >
          {lista.error.message}
        </Banner>
      ) : null}

      <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-border bg-card lg:grid-cols-[1fr_minmax(420px,655px)]">
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2 p-4">
            <div className="relative w-full max-w-[260px]">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-faint" aria-hidden />
              <Input
                type="search"
                aria-label="Buscar por correo"
                placeholder="Buscar por correo"
                className="pl-8"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
            </div>
            <label className="flex h-9 items-center gap-1 rounded-md border border-border-strong bg-card pl-2.5 text-sm focus-within:border-signal focus-within:ring-[3px] focus-within:ring-signal-soft">
              Suscripción:
              <select
                className="h-full cursor-pointer bg-transparent pr-2 font-medium text-foreground focus:outline-none"
                value={filtro.suscripcion}
                onChange={(e) => setFiltro((f) => ({ ...f, suscripcion: e.target.value as FiltroSuscripcion, pagina: 1 }))}
              >
                {OPCIONES_SUSCRIPCION.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.texto}
                  </option>
                ))}
              </select>
            </label>
            {lista.datos ? <span className="ml-auto text-[13px] text-muted-foreground tabular-nums">{textoTotal(lista.datos.total)}</span> : null}
          </div>
          <TablaUsuarios usuarios={lista.datos ? usuarios : null} seleccion={seleccion} alSeleccionar={setSeleccion} />
          {lista.datos && paginas > 1 ? (
            <div className="flex items-center justify-end gap-2 p-3 text-[13px] text-muted-foreground">
              <span className="tabular-nums">
                Página {filtro.pagina} de {paginas}
              </span>
              <Button
                size="icon-sm"
                variant="outline"
                aria-label="Página anterior"
                disabled={filtro.pagina <= 1}
                onClick={() => setFiltro((f) => ({ ...f, pagina: f.pagina - 1 }))}
              >
                <ChevronLeft />
              </Button>
              <Button
                size="icon-sm"
                variant="outline"
                aria-label="Página siguiente"
                disabled={filtro.pagina >= paginas}
                onClick={() => setFiltro((f) => ({ ...f, pagina: f.pagina + 1 }))}
              >
                <ChevronRight />
              </Button>
            </div>
          ) : null}
        </div>
        <div className="min-w-0 border-t border-border lg:border-t-0 lg:border-l">
          <PanelDetalleUsuario detalle={detalle} ahora={ahora} alCambiarCuenta={alCambiarCuenta} />
        </div>
      </div>
    </main>
  );
}
