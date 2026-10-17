import { EstadoSuscripcion } from "@/components/deploya/estado-suscripcion";
import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fechaAdmin, textoRol, type FilaUsuario } from "@/lib/admin-usuarios";

const FILAS_CARGANDO = 6;

/**
 * Tabla de 25 dentro del panel de la lista (sin borde propio). `usuarios = null` mientras carga.
 * La fila seleccionada lleva fondo `muted` y la barra de 2px en `foreground` (patrón D).
 */
export function TablaUsuarios({
  usuarios,
  seleccion,
  alSeleccionar,
}: {
  usuarios: FilaUsuario[] | null;
  seleccion: string | null;
  alSeleccionar: (id: string) => void;
}) {
  return (
    <table className="w-full border-collapse text-sm">
      <TableHeader>
        <TableRow>
          <TableHead className="border-t">Correo</TableHead>
          <TableHead className="border-t">Rol</TableHead>
          <TableHead className="border-t">Plan</TableHead>
          <TableHead className="border-t">Suscripción</TableHead>
          <TableHead className="border-t">Alta</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {usuarios === null ? (
          Array.from({ length: FILAS_CARGANDO }, (_, i) => (
            <TableRow key={i} aria-hidden>
              <TableCell colSpan={5}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            </TableRow>
          ))
        ) : usuarios.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
              Ninguna cuenta coincide con la búsqueda.
            </TableCell>
          </TableRow>
        ) : (
          usuarios.map((u) => (
            <TableRow
              key={u.id}
              data-activa={u.id === seleccion}
              aria-selected={u.id === seleccion}
              tabIndex={0}
              className="cursor-pointer last:border-b hover:bg-muted focus-visible:bg-muted focus-visible:outline-none data-[activa=true]:bg-muted data-[activa=true]:shadow-[inset_2px_0_0_var(--foreground)]"
              onClick={() => alSeleccionar(u.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  alSeleccionar(u.id);
                }
              }}
            >
              <TableCell>{u.correo}</TableCell>
              <TableCell className="text-[13px] text-muted-foreground">{textoRol(u.rol)}</TableCell>
              <TableCell className="text-[13px]">{u.plan ?? "—"}</TableCell>
              <TableCell>{u.suscripcion ? <EstadoSuscripcion estado={u.suscripcion} /> : <span className="text-faint">—</span>}</TableCell>
              <TableCell className="whitespace-nowrap text-[13px] text-muted-foreground tabular-nums">{fechaAdmin(u.creado)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </table>
  );
}
