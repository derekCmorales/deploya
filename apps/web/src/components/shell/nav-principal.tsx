"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export interface ItemNav {
  href: string;
  texto: string;
  icono: LucideIcon;
  /** Otras rutas que también marcan el item como activo (Suscripción en /planes). */
  activoEn?: string[];
}

/** Navegación principal en píldora (v4.1 `.nav2`). La activa lleva su icono en Señal. */
export function NavPrincipal({ items, className }: { items: ItemNav[]; className?: string }) {
  const ruta = usePathname();
  return (
    <nav
      aria-label="Principal"
      className={cn("ml-2 flex items-center md:ml-[18px] gap-0.5 rounded-[11px] border border-border bg-sunken p-[3px]", className)}
    >
      {items.map(({ href, texto, icono: Icono, activoEn = [] }) => {
        const activo = [href, ...activoEn].some((r) => ruta === r || ruta.startsWith(`${r}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={activo ? "page" : undefined}
            aria-label={texto}
            title={texto}
            className={cn(
              "inline-flex h-[30px] items-center gap-[7px] rounded-lg px-2 md:pr-3 md:pl-2.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activo && "bg-card text-foreground shadow-[0_0_0_1px_var(--border-strong),0_1px_2px_rgba(0,0,0,.06)]",
            )}
          >
            <Icono className={cn("size-4", activo ? "text-signal" : "text-faint")} aria-hidden />
            <span className="hidden md:inline">{texto}</span>
          </Link>
        );
      })}
    </nav>
  );
}
