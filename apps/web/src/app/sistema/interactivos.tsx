"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { RequisitosContrasena } from "@/components/deploya/requisitos-contrasena";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyField } from "@/components/ui/copy-field";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";

export function Interactivos() {
  const [vigencia, setVigencia] = useState<"30" | "365">("30");
  const [clave, setClave] = useState("tienda-Demo");
  const [auto, setAuto] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex flex-col gap-5">
        <Field id="correo" label="Correo" hint="Es tu usuario para iniciar sesión.">
          <Input id="correo" type="email" placeholder="tu@correo.com" aria-describedby="correo-msg" />
        </Field>
        <Field id="correo-err" label="Correo" error="Este correo ya tiene una cuenta.">
          <Input id="correo-err" defaultValue="derek@tiendademo.com" aria-invalid aria-describedby="correo-err-msg" />
        </Field>
        <Field id="clave" label="Contraseña">
          <Input id="clave" type="password" value={clave} onChange={(e) => setClave(e.target.value)} aria-describedby="clave-req" />
          <RequisitosContrasena id="clave-req" valor={clave} />
        </Field>
        <Field id="repo" label="URL del repositorio">
          <Input id="repo" className="font-mono" placeholder="https://github.com/usuario/proyecto" />
        </Field>
      </div>
      <div className="flex flex-col gap-5">
        <Segmented
          aria-label="Vigencia"
          value={vigencia}
          onValueChange={setVigencia}
          options={[
            { value: "30", label: "30 días" },
            { value: "365", label: "365 días" },
          ]}
        />
        <CopyField value="https://api-tienda.deploya.app" />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox defaultChecked /> Recordarme en este dispositivo
        </label>
        <label className="flex items-center gap-3 text-sm">
          <Switch checked={auto} onCheckedChange={setAuto} aria-label="Ejemplo de interruptor" /> Interruptor
        </label>
        <Button variant="destructive-outline" className="self-start" onClick={() => setAbierto(true)}>
          <Trash2 />
          Eliminar proyecto
        </Button>
        <Dialog
          open={abierto}
          onOpenChange={setAbierto}
          title="Eliminar api-tienda"
          description="Esto detiene el servicio y borra el contenedor, sus imágenes, variables e historial."
          footer={
            <>
              <Button variant="outline" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" disabled={confirmacion !== "api-tienda"}>
                Eliminar proyecto
              </Button>
            </>
          }
        >
          <Field id="confirmar" label={<>Escribe <span className="font-mono">api-tienda</span> para confirmar</>}>
            <Input id="confirmar" className="font-mono" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
          </Field>
        </Dialog>
      </div>
    </div>
  );
}
