"use client";

import { BadgeCheck, Loader2, Mail, RotateCw, UserRound } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, Sunken } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSesion } from "@/hooks/use-sesion";
import { ErrorApi } from "@/lib/api";
import { guardarNombre, leerPerfil, type PerfilCuenta } from "@/lib/api-cuenta";
import { fechaCorta } from "@/lib/fechas";
import { errorNombre, LARGO_MAXIMO_NOMBRE, nombreDeRol } from "@/lib/mi-cuenta";

import { FilaCuenta } from "./fila-cuenta";

/** Pantalla 05 · Mi cuenta · Perfil (M1-06): nombre editable; correo y rol de solo lectura. */
export function Perfil() {
  const [perfil, setPerfil] = useState<PerfilCuenta | null>(null);
  const [fallo, setFallo] = useState(false);

  const cargar = useCallback(async () => {
    setFallo(false);
    try {
      setPerfil(await leerPerfil());
    } catch {
      setFallo(true);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (fallo) {
    return (
      <Banner
        variant="bad"
        title="No pudimos cargar tu cuenta."
        actions={
          <Button variant="outline" size="sm" onClick={() => void cargar()}>
            <RotateCw />
            Reintentar
          </Button>
        }
      >
        Revisa tu conexión e intenta de nuevo.
      </Banner>
    );
  }
  if (!perfil) {
    return (
      <div className="flex flex-col gap-4 py-6" aria-busy="true" aria-label="Cargando tu cuenta">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <FilaCuenta titulo="Perfil" descripcion="El nombre con el que aparece tu cuenta.">
        <FormularioNombre inicial={perfil.nombre} onGuardado={setPerfil} />
      </FilaCuenta>

      <FilaCuenta titulo="Correo" descripcion="Solo lectura.">
        <Card className="flex flex-col gap-1.5 p-4">
          <p className="text-[13px] leading-[18px] font-medium">Correo</p>
          <Sunken className="flex h-9 items-center gap-2 px-2.5 text-sm">
            <Mail className="size-4 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{perfil.correo}</span>
            {perfil.verificado ? (
              <Badge variant="ok">
                <BadgeCheck aria-hidden />
                Verificado
              </Badge>
            ) : null}
          </Sunken>
          <p className="text-xs text-muted-foreground">Es tu usuario para iniciar sesión. Por ahora no se puede cambiar.</p>
        </Card>
      </FilaCuenta>

      <FilaCuenta titulo="Rol" descripcion="Cliente o Administrador. Lo asigna administración.">
        <Sunken className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
          <span className="flex items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" aria-hidden />
            {nombreDeRol(perfil.rol)}
          </span>
          <span className="text-xs text-muted-foreground">Alta: {fechaCorta(perfil.creado) ?? "—"}</span>
        </Sunken>
      </FilaCuenta>
    </div>
  );
}

/** Al guardar, la sesión se vuelve a leer para que el encabezado muestre el nombre nuevo. */
function FormularioNombre({ inicial, onGuardado }: { inicial: string; onGuardado: (perfil: PerfilCuenta) => void }) {
  const { recargar } = useSesion();
  const [nombre, setNombre] = useState(inicial);
  const [error, setError] = useState<string | undefined>();
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const problema = errorNombre(nombre);
    setError(problema);
    setGuardado(false);
    if (problema) return;

    setGuardando(true);
    try {
      const perfil = await guardarNombre(nombre);
      setNombre(perfil.nombre);
      onGuardado(perfil);
      setGuardado(true);
      await recargar();
    } catch (fallo) {
      setError(fallo instanceof ErrorApi ? fallo.message : "No pudimos guardar el nombre. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <form onSubmit={guardar} noValidate aria-busy={guardando}>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-3">
            <Avatar nombre={nombre.trim() || inicial} size="lg" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{nombre.trim() || inicial}</span>
              <span className="text-xs text-muted-foreground">Iniciales generadas a partir del nombre</span>
            </div>
          </div>
          <Field id="nombre" label="Nombre" error={error}>
            <Input
              id="nombre"
              autoComplete="name"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setGuardado(false);
              }}
              disabled={guardando}
              aria-invalid={!!error}
              aria-describedby="nombre-msg"
            />
          </Field>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {guardado ? "Nombre guardado." : `Máximo ${LARGO_MAXIMO_NOMBRE} caracteres.`}
          </p>
          <Button type="submit" size="sm" disabled={guardando || nombre.trim() === inicial.trim()}>
            {guardando ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Guardar
          </Button>
        </div>
      </form>
    </Card>
  );
}
