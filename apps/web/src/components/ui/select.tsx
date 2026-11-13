"use client";

import { Check, ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/** Lo único que los llamadores leen del evento de cambio: `e.target.value`. */
export interface CambioSelect {
  target: { id: string; name: string | undefined; value: string };
}

export interface SelectProps
  extends Omit<React.ComponentPropsWithoutRef<"button">, "onChange" | "value" | "defaultValue" | "children" | "type"> {
  value?: string;
  defaultValue?: string;
  name?: string;
  onChange?: (evento: CambioSelect) => void;
  /** `<option value disabled>texto</option>`, igual que un `<select>` nativo. */
  children?: React.ReactNode;
}

interface Opcion {
  valor: string;
  texto: React.ReactNode;
  deshabilitada: boolean;
}

const ALTO_LISTA_MAX = 240;
const SEPARACION = 6;

function opcionesDe(hijos: React.ReactNode): Opcion[] {
  return React.Children.toArray(hijos).flatMap((hijo) => {
    if (!React.isValidElement<React.OptionHTMLAttributes<HTMLOptionElement>>(hijo)) return [];
    if (hijo.type === React.Fragment) return opcionesDe(hijo.props.children);
    if (hijo.type !== "option") return [];
    const { value, disabled, children } = hijo.props;
    return [{ valor: String(value ?? ""), texto: children, deshabilitada: !!disabled }];
  });
}

function siguienteHabilitada(opciones: readonly Opcion[], desde: number, paso: 1 | -1): number {
  for (let i = desde + paso; i >= 0 && i < opciones.length; i += paso) {
    if (!opciones[i].deshabilitada) return i;
  }
  return desde;
}

interface Posicion {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
}

/**
 * Lista desplegable v4.1 (opciones cortas y cerradas, p. ej. el motivo de 25b o el proyecto con el
 * que se comparte un recurso de datos). Mismo alto, fondo y foco que `Input`; la lista usa los tokens
 * del tema y va en la capa superior del navegador (Popover API), así que no se recorta dentro de un
 * `Dialog`. Teclado: flechas, Inicio, Fin, Intro, Espacio, Escape. Para filtros en línea usa `Segmented`.
 */
const Select = React.forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { value, defaultValue = "", name, onChange, children, className, id, disabled, ...resto },
  ref,
) {
  const opciones = opcionesDe(children);
  const [interno, setInterno] = React.useState(defaultValue);
  const actual = value ?? interno;
  const indiceActual = Math.max(
    0,
    opciones.findIndex((o) => o.valor === actual),
  );
  const elegida = opciones.find((o) => o.valor === actual);

  const [abierta, setAbierta] = React.useState(false);
  const [activa, setActiva] = React.useState(indiceActual);
  const [posicion, setPosicion] = React.useState<Posicion | null>(null);
  const boton = React.useRef<HTMLButtonElement | null>(null);
  const lista = React.useRef<HTMLUListElement | null>(null);
  const listaId = React.useId();

  const asignarRef = (nodo: HTMLButtonElement | null) => {
    boton.current = nodo;
    if (typeof ref === "function") ref(nodo);
    else if (ref) ref.current = nodo;
  };

  const colocar = React.useCallback(() => {
    const caja = boton.current?.getBoundingClientRect();
    if (!caja) return;
    const abajo = window.innerHeight - caja.bottom - SEPARACION;
    const arriba = caja.top - SEPARACION;
    const haciaArriba = abajo < ALTO_LISTA_MAX && arriba > abajo;
    setPosicion(
      haciaArriba
        ? { left: caja.left, width: caja.width, bottom: window.innerHeight - caja.top + SEPARACION }
        : { left: caja.left, width: caja.width, top: caja.bottom + SEPARACION },
    );
  }, []);

  const abrir = () => {
    if (disabled) return;
    setActiva(indiceActual);
    colocar();
    setAbierta(true);
  };
  const cerrar = (devolverFoco: boolean) => {
    setAbierta(false);
    if (devolverFoco) boton.current?.focus();
  };

  const elegir = (indice: number) => {
    const opcion = opciones[indice];
    if (!opcion || opcion.deshabilitada) return;
    setInterno(opcion.valor);
    onChange?.({ target: { id: id ?? "", name, value: opcion.valor } });
    cerrar(true);
  };

  React.useEffect(() => {
    const nodo = lista.current;
    if (!abierta || !nodo) return;
    if (typeof nodo.showPopover === "function" && !nodo.matches(":popover-open")) nodo.showPopover();
    nodo.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [abierta]);

  React.useEffect(() => {
    if (!abierta) return;
    const alClicFuera = (evento: MouseEvent) => {
      const destino = evento.target as Node;
      if (!boton.current?.contains(destino) && !lista.current?.contains(destino)) setAbierta(false);
    };
    const alMover = () => colocar();
    document.addEventListener("mousedown", alClicFuera);
    window.addEventListener("resize", alMover);
    window.addEventListener("scroll", alMover, true);
    return () => {
      document.removeEventListener("mousedown", alClicFuera);
      window.removeEventListener("resize", alMover);
      window.removeEventListener("scroll", alMover, true);
    };
  }, [abierta, colocar]);

  React.useEffect(() => {
    if (!abierta) return;
    lista.current?.querySelector<HTMLElement>(`[data-indice="${activa}"]`)?.scrollIntoView({ block: "nearest" });
  }, [abierta, activa]);

  const alTeclado = (evento: React.KeyboardEvent<HTMLButtonElement>) => {
    const { key } = evento;
    if (!abierta) {
      if (key === "ArrowDown" || key === "ArrowUp") {
        evento.preventDefault();
        abrir();
      }
      return;
    }
    if (key === "Escape") {
      evento.preventDefault();
      evento.stopPropagation();
      cerrar(true);
    } else if (key === "Tab") {
      setAbierta(false);
    } else if (key === "ArrowDown" || key === "ArrowUp") {
      evento.preventDefault();
      setActiva((i) => siguienteHabilitada(opciones, i, key === "ArrowDown" ? 1 : -1));
    } else if (key === "Home" || key === "End") {
      evento.preventDefault();
      setActiva(key === "Home" ? siguienteHabilitada(opciones, -1, 1) : siguienteHabilitada(opciones, opciones.length, -1));
    } else if (key === "Enter" || key === " ") {
      evento.preventDefault();
      elegir(activa);
    }
  };

  const vacia = !elegida || elegida.valor === "";

  return (
    <>
      <button
        {...resto}
        ref={asignarRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierta}
        aria-controls={abierta ? listaId : undefined}
        aria-activedescendant={abierta ? `${listaId}-${activa}` : undefined}
        disabled={disabled}
        onClick={() => (abierta ? cerrar(false) : abrir())}
        onKeyDown={alTeclado}
        className={cn(
          "flex h-9 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-sunken px-2.5 text-left text-sm transition-[border-color,box-shadow] focus-visible:border-signal focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-signal-soft disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:border-bad aria-invalid:focus-visible:ring-bad/15",
          abierta && "border-signal ring-[3px] ring-signal-soft",
          vacia ? "text-muted-foreground" : "text-foreground",
          className,
        )}
      >
        <span className="min-w-0 flex-1 truncate">{elegida?.texto ?? ""}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", abierta && "rotate-180")}
          aria-hidden
        />
      </button>
      {name ? <input type="hidden" name={name} value={actual} /> : null}
      {abierta ? (
        <ul
          ref={lista}
          id={listaId}
          role="listbox"
          {...({ popover: "manual" } as Record<string, string>)}
          style={{ position: "fixed", margin: 0, ...posicion }}
          className="max-h-60 overflow-auto rounded-lg border border-border-strong bg-popover p-1.5 text-sm text-popover-foreground shadow-elev"
        >
          {opciones.map((opcion, indice) => {
            const seleccionada = opcion.valor === actual;
            return (
              <li
                key={`${opcion.valor}-${indice}`}
                id={`${listaId}-${indice}`}
                role="option"
                data-indice={indice}
                aria-selected={seleccionada}
                aria-disabled={opcion.deshabilitada || undefined}
                onMouseEnter={() => !opcion.deshabilitada && setActiva(indice)}
                onMouseDown={(evento) => evento.preventDefault()}
                onClick={() => elegir(indice)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2",
                  indice === activa && !opcion.deshabilitada && "bg-accent",
                  opcion.deshabilitada && "cursor-not-allowed text-muted-foreground opacity-60",
                  opcion.valor === "" && !seleccionada && "text-muted-foreground",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{opcion.texto}</span>
                {seleccionada && opcion.valor !== "" ? <Check className="size-4 shrink-0 text-signal" aria-hidden /> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
});
Select.displayName = "Select";

export { Select };
