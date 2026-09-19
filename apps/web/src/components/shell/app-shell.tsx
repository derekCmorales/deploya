"use client";

import {
  CreditCard,
  Inbox,
  LayoutDashboard,
  Route,
  Shield,
  UserRound,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { proyectoPorDefecto } from "@/lib/mock/proyectos";
import { ThemeToggle } from "@/components/shell/theme-toggle";

const rail = [
  { href: "/", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/projects", label: "Proyectos", icon: Inbox, prefix: "/projects" },
  {
    href: "/flujo",
    label: "Flujo",
    icon: Workflow,
    suffix: "/flujo",
  },
  {
    href: "/operacion",
    label: "Operación",
    icon: Route,
    suffix: "/operacion",
  },
] as const;

const cuenta = [
  { href: "/auth", label: "Cuenta", icon: UserRound },
  { href: "/billing", label: "Planes", icon: CreditCard },
  { href: "/admin", label: "Administración", icon: Shield },
] as const;

function idDesdeRuta(pathname: string) {
  const match = pathname.match(/^\/projects\/([^/]+)/);
  return match?.[1] ?? proyectoPorDefecto.id;
}

function hrefDe(
  item: (typeof rail)[number],
  pathname: string,
): string {
  const id = idDesdeRuta(pathname);
  if ("suffix" in item && item.suffix) {
    return `/projects/${id}${item.suffix}`;
  }
  if ("prefix" in item) return `/projects/${id}`;
  return item.href;
}

function activo(item: (typeof rail)[number], pathname: string) {
  if ("exact" in item && item.exact) return pathname === "/";
  if ("suffix" in item && item.suffix) return pathname.endsWith(item.suffix);
  if ("prefix" in item) {
    return (
      pathname.startsWith("/projects") &&
      !pathname.endsWith("/flujo") &&
      !pathname.endsWith("/operacion")
    );
  }
  return false;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-16 shrink-0 flex-col items-center border-r border-border bg-card/80 py-3">
        <Link
          href="/"
          className="mb-4 flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
          aria-label="Deploya"
        >
          D
        </Link>
        <nav aria-label="Ciclo de despliegue" className="flex flex-col gap-1">
          {rail.map((item) => {
            const href = hrefDe(item, pathname);
            const Icon = item.icon;
            const isActive = activo(item, pathname);
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      isActive && "bg-accent text-primary",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <Separator className="my-3 w-8" />
        <nav aria-label="Cuenta y administración" className="flex flex-col gap-1">
          {cuenta.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      isActive && "bg-accent text-primary",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <div className="mt-auto">
          <ThemeToggle />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
          <p className="text-sm font-medium tracking-tight">Deploya</p>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Recepción → Construcción → Ejecución → Enrutamiento → Operación
          </p>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
