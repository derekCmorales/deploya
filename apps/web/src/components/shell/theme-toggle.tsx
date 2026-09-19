"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  const oscuro = resolvedTheme === "dark";

  if (!montado) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Cambiar tema"
        disabled
      />
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-pressed={oscuro}
      onClick={() => setTheme(oscuro ? "light" : "dark")}
    >
      {oscuro ? <Sun /> : <Moon />}
    </Button>
  );
}
