import { CircleCheck, GitCommitHorizontal, Hammer, Play, Plus, RotateCw, Rocket } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import {
  Bitacora,
  ESTADOS_DESPLIEGUE,
  ESTADOS_SUSCRIPCION,
  EstadoDespliegue,
  EstadoSuscripcion,
  LineaTiempo,
  MapaActividad,
  Pasos,
  PuntoVivo,
  RielEtapas,
  Wordmark,
} from "@/components/deploya";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Sunken } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { Meter } from "@/components/ui/meter";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Interactivos } from "./interactivos";

export const metadata: Metadata = { title: "Sistema de diseño · Deploya" };

function Seccion({ titulo, nota, children }: { titulo: string; nota?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">{titulo}</h2>
        {nota ? <p className="max-w-3xl text-sm text-muted-foreground">{nota}</p> : null}
      </div>
      {children}
    </section>
  );
}

const TOKENS = [
  ["background", "Fondo"],
  ["sunken", "Zona hundida"],
  ["card", "Superficie"],
  ["muted", "Apagado"],
  ["border-strong", "Borde"],
  ["muted-foreground", "Texto de apoyo"],
  ["foreground", "Tinta"],
  ["signal", "Señal · en curso"],
  ["ok", "Saludable · Activa"],
  ["warn", "Por vencer"],
  ["bad", "Fallido · Suspendida"],
  ["destructive", "Solo eliminar"],
] as const;

const bitacora = [
  { n: 1, marca: "12:04:01.112", etapa: "recepción", texto: "Clonando github.com/tienda-demo/api-tienda (main)" },
  { n: 2, marca: "12:04:02.911", etapa: "construcción", texto: "docker build -t api-tienda:14 ." },
  { n: 3, marca: "12:04:18.401", etapa: "construcción", texto: "> tsc -p tsconfig.json" },
  { n: 4, marca: "12:04:18.433", etapa: "construcción", texto: "sh: 1: tsc: not found", nivel: "error" as const },
];

const dias = Array.from({ length: 84 }, (_, i) => ({
  fecha: `d${i}`,
  total: [0, 1, 0, 2, 0, 0, 4, 1, 0, 3][i % 10],
  fallidos: i === 40 || i === 71 ? 1 : 0,
}));

export default function SistemaPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-8 py-10">
      <header className="flex flex-col gap-3">
        <p className="text-[13px] font-medium text-signal">Design system v4.1</p>
        <h1 className="text-[40px] leading-[44px] font-semibold tracking-[-0.04em]">Sobrio en la forma, vivo en el estado.</h1>
        <p className="max-w-3xl text-muted-foreground">
          Catálogo vivo de los componentes de <span className="font-mono text-[13px]">apps/web/src/components</span>. Reglas
          y fichas por pantalla en <span className="font-mono text-[13px]">docs/diseno/</span>. Cambia el tema con el botón
          del header para revisar claro y oscuro.
        </p>
      </header>

      <Seccion titulo="Marca" nota="Solo la palabra, en minúsculas, con la última «a» en Señal. Sin símbolo.">
        <div className="flex items-end gap-10">
          <Wordmark size={64} />
          <Wordmark size={22} />
        </div>
      </Seccion>

      <Seccion titulo="Color" nota="Neutros cálidos y una sola tinta. Señal marca únicamente lo que está en curso. Destructive es el único rojo de acción.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {TOKENS.map(([t, n]) => (
            <div key={t} className="flex flex-col gap-2">
              <span className="h-14 rounded-lg border border-border" style={{ background: `var(--${t})` }} />
              <span className="text-xs font-medium">{n}</span>
              <span className="font-mono text-[11px] text-muted-foreground">--{t}</span>
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Tipografía" nota="Geist para hablar, Geist Mono para medir: todo lo que se copia (hashes, dominios, variables, tiempos) va en mono.">
        <div className="flex flex-col gap-3">
          <p className="text-[40px] leading-[44px] font-semibold tracking-[-0.04em]">Tu primer proyecto</p>
          <p className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em]">api-tienda · versión #14</p>
          <p className="text-lg leading-6 font-semibold tracking-[-0.02em]">Consumo del período</p>
          <p>Tu proyecto se está construyendo.</p>
          <p className="text-[13px] font-medium text-muted-foreground">Construcción</p>
          <p className="font-mono text-xs">a1b2c3d · api-tienda.deploya.app · DATABASE_URL</p>
        </div>
      </Seccion>

      <Seccion titulo="Botones" nota="Una acción principal por vista. Verbo en infinitivo. Solo-icono con aria-label.">
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Rocket />
            Desplegar
          </Button>
          <Button variant="secondary">Cambiar plan</Button>
          <Button variant="outline">
            <RotateCw />
            Reintentar
          </Button>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="destructive">Eliminar proyecto</Button>
          <Button variant="destructive-outline">Suspender cuenta</Button>
          <Button variant="link">Ya tengo cuenta</Button>
          <Button size="sm">Pequeño</Button>
          <Button size="xs" variant="outline">
            <Play />
            Mínimo
          </Button>
          <Button size="icon" variant="outline" aria-label="Nuevo proyecto">
            <Plus />
          </Button>
          <Button disabled>Deshabilitado</Button>
        </div>
      </Seccion>

      <Seccion titulo="Estados" nota="Despliegue y suscripción son vocabularios distintos. Nunca los mezcles ni armes el badge a mano.">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {ESTADOS_DESPLIEGUE.map((e) => (
              <EstadoDespliegue key={e} estado={e} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {ESTADOS_SUSCRIPCION.map((e) => (
              <EstadoSuscripcion key={e} estado={e} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>muted</Badge>
            <Badge variant="outline">outline</Badge>
            <Badge variant="signal">signal</Badge>
            <Badge variant="ok">ok</Badge>
            <Badge variant="warn">warn</Badge>
            <Badge variant="bad">bad</Badge>
            <Badge variant="signal" size="lg">
              <PuntoVivo /> En vivo
            </Badge>
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Riel de etapas" nota="Cinco segmentos, siempre en el mismo orden. En listas mide 55px; en cabeceras lleva etiquetas.">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-6">
            <RielEtapas etapas={["completada", "en-curso", "pendiente", "pendiente", "pendiente"]} />
            <RielEtapas etapas={["completada", "completada", "completada", "completada", "completada"]} saludable />
            <RielEtapas etapas={["completada", "fallida", "pendiente", "pendiente", "pendiente"]} />
          </div>
          <RielEtapas
            size="lg"
            etapas={["completada", "en-curso", "pendiente", "pendiente", "pendiente"]}
            detalle={[{ duracion: "1.4 s" }, { duracion: "01:10" }, {}, {}, {}]}
          />
        </div>
      </Seccion>

      <Seccion titulo="Formularios">
        <Interactivos />
      </Seccion>

      <Seccion titulo="Avisos">
        <div className="flex flex-col gap-3">
          <Banner variant="warn" title="Tu plan Starter venció el 24 sep · despliegues bloqueados" actions={<Button size="sm">Renovar</Button>}>
            Tus servicios siguen en línea hasta el 29 sep (5 días de gracia).
          </Banner>
          <Banner variant="bad" title="La construcción terminó con código 127">
            <span className="font-mono">sh: 1: tsc: not found</span> · línea 13. Tu versión #13 sigue sirviendo tráfico.
          </Banner>
          <Banner variant="signal" title="Construyendo la versión #14" />
          <Banner title="Todos los cobros son simulados; los comprobantes no tienen valor fiscal." />
        </div>
      </Seccion>

      <Seccion titulo="Superficies y datos">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Avatar nombre="Derek Calderón" />
              <div className="flex flex-col">
                <CardTitle>Consumo del período</CardTitle>
                <CardDescription>Se reinicia el 03 oct</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Meter label="Proyectos" value={3} max={3} />
              <Meter label="Construcciones" value={96} max={150} />
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline">
                Cambiar plan
              </Button>
              <span className="flex-1" />
              <Kbd>⌘K</Kbd>
            </CardFooter>
          </Card>
          <Sunken className="flex flex-col gap-3 p-4">
            <p className="text-[13px] font-medium text-muted-foreground">Último despliegue</p>
            <LineaTiempo
              items={[
                { icono: GitCommitHorizontal, titulo: "Commit recibido", detalle: "a1b2c3d · feat: carrito persistente", hora: "12:04:01" },
                { icono: Hammer, titulo: "Imagen construida", detalle: "148 MB", hora: "12:05:53" },
                { icono: CircleCheck, titulo: "Tráfico redirigido", detalle: "#13 detenido · #14 en línea", hora: "12:06:23", tono: "ok" },
              ]}
            />
          </Sunken>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Versión</TableHead>
              <TableHead>Commit</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow data-activa="true">
              <TableCell className="font-mono">#14</TableCell>
              <TableCell>feat: carrito persistente</TableCell>
              <TableCell className="tnum">2 min 41 s</TableCell>
              <TableCell>
                <EstadoDespliegue estado="saludable" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono">#11</TableCell>
              <TableCell>feat: cupones por categoría</TableCell>
              <TableCell className="tnum">0 min 38 s</TableCell>
              <TableCell>
                <EstadoDespliegue estado="fallido" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Seccion>

      <Seccion titulo="Bitácora, pasos y actividad">
        <Bitacora lineas={bitacora} enCurso className="max-h-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Pasos
            actual={1}
            pasos={[
              { titulo: "Repositorio", detalle: "URL, rama y Dockerfile" },
              { titulo: "Variables", detalle: "Claves cifradas" },
              { titulo: "Revisar", detalle: "Confirmar y desplegar" },
            ]}
          />
          <div className="flex flex-col gap-3">
            <MapaActividad dias={dias} />
            <div className="flex gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Pestañas">
        <Tabs defaultValue="resumen">
          <TabsList>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="despliegues">Despliegues</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
          </TabsList>
          <TabsContent value="resumen">Estado actual del proyecto.</TabsContent>
          <TabsContent value="despliegues">Historial de despliegues.</TabsContent>
          <TabsContent value="variables">Variables cifradas.</TabsContent>
        </Tabs>
      </Seccion>
    </main>
  );
}
