"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Pestañas subrayadas v4.1 para vistas de un mismo recurso
 * (Resumen · Despliegues · Variables · Configuración). Para navegar entre rutas
 * usa `TabsNav` con enlaces y `aria-current="page"`.
 */
const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("flex gap-0.5 border-b border-border", className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const tabClass =
  "relative inline-flex h-10 items-center gap-2 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4 after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent";

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      tabClass,
      "disabled:pointer-events-none disabled:opacity-40 data-[state=active]:text-foreground data-[state=active]:after:bg-foreground",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("pt-6 focus-visible:outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

/** Pestañas como navegación entre rutas: pasa `<a>`/`<Link>` con `aria-current="page"`. */
function TabsNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      className={cn(
        "flex gap-0.5 border-b border-border [&>a]:relative [&>a]:inline-flex [&>a]:h-10 [&>a]:items-center [&>a]:gap-2 [&>a]:px-3 [&>a]:text-sm [&>a]:font-medium [&>a]:text-muted-foreground [&>a:hover]:text-foreground [&>a[aria-current=page]]:text-foreground [&>a[aria-current=page]]:after:absolute [&>a[aria-current=page]]:after:inset-x-2 [&>a[aria-current=page]]:after:-bottom-px [&>a[aria-current=page]]:after:h-0.5 [&>a[aria-current=page]]:after:rounded-full [&>a[aria-current=page]]:after:bg-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsNav };
