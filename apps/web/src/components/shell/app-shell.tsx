import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/shell/theme-toggle";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <p className="text-sm font-medium tracking-tight">Deploya</p>
        <ThemeToggle />
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
