"use client";

import Link from "next/link";
import * as React from "react";

import { cn } from "@/lib/utils";

/** Una opción del menú: siempre un enlace (las acciones con confirmación viven en su pantalla). */
export interface OpcionMenu {
  href: string;
  etiqueta: string;
  icono?: React.ReactNode;
  destructiva?: boolean;
}

export interface MenuProps {
  /** Botón que abre el menú; recibe `aria-expanded`, `aria-haspopup` y `onClick`. */
  disparador: React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  opciones: readonly OpcionMenu[];
  /** Índices antes de los que va un separador (p. ej. la opción destructiva al final). */
  separadorAntesDe?: readonly number[];
  className?: string;
}

/**
 * Menú desplegable («Más acciones» de 13 y 14): popover de 230px alineado a la derecha.
 * Escape y un clic fuera lo cierran; flechas arriba y abajo recorren las opciones.
 */
function Menu({ disparador, opciones, separadorAntesDe = [], className }: MenuProps) {
  const [abierto, setAbierto] = React.useState(false);
  const raiz = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();

  React.useEffect(() => {
    if (!abierto) return;
    const alClicFuera = (evento: MouseEvent) => {
      if (!raiz.current?.contains(evento.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", alClicFuera);
    raiz.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, [abierto]);

  const alTeclado = (evento: React.KeyboardEvent<HTMLDivElement>) => {
    if (evento.key === "Escape") {
      setAbierto(false);
      raiz.current?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
      return;
    }
    if (evento.key !== "ArrowDown" && evento.key !== "ArrowUp") return;
    evento.preventDefault();
    const items = [...(raiz.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const actual = items.indexOf(document.activeElement as HTMLElement);
    const paso = evento.key === "ArrowDown" ? 1 : -1;
    items[(actual + paso + items.length) % items.length]?.focus();
  };

  return (
    <div ref={raiz} className={cn("relative", className)} onKeyDown={alTeclado}>
      {React.cloneElement(disparador, {
        "aria-haspopup": "menu",
        "aria-expanded": abierto,
        "aria-controls": abierto ? menuId : undefined,
        onClick: () => setAbierto((valor) => !valor),
      })}
      {abierto ? (
        <div
          id={menuId}
          role="menu"
          className="absolute top-[calc(100%+6px)] right-0 z-20 flex w-[230px] flex-col rounded-lg border border-border-strong bg-popover p-1.5 text-sm shadow-elev"
        >
          {opciones.map((opcion, i) => (
            <React.Fragment key={opcion.etiqueta}>
              {separadorAntesDe.includes(i) ? <div role="separator" className="my-1.5 h-px bg-border" /> : null}
              <Link
                href={opcion.href}
                role="menuitem"
                onClick={() => setAbierto(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-2 outline-none hover:bg-accent focus-visible:bg-accent [&_svg]:size-4 [&_svg]:shrink-0",
                  opcion.destructiva && "text-destructive",
                )}
              >
                {opcion.icono}
                <span>{opcion.etiqueta}</span>
              </Link>
            </React.Fragment>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { Menu };
