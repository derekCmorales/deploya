import { EstadoSuscripcion } from "@/components/deploya/estado-suscripcion";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fechaAdmin, textoRol, type FilaUsuario } from "@/lib/admin-usuarios";

const FILAS_CARGANDO = 6;

/** Tabla de 25. `usuarios = null` mientras carga. La fila seleccionada lleva `data-activa`. */
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Correo</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Suscripción</TableHead>
          <TableHead>Alta</TableHead>
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
              className="cursor-pointer hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              onClick={() => alSeleccionar(u.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  alSeleccionar(u.id);
                }
              }}
            >
              <TableCell className="font-mono text-[13px]">{u.correo}</TableCell>
              <TableCell className="text-muted-foreground">{textoRol(u.rol)}</TableCell>
              <TableCell>{u.plan ?? "—"}</TableCell>
              <TableCell>{u.suscripcion ? <EstadoSuscripcion estado={u.suscripcion} /> : <span className="text-faint">—</span>}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">{fechaAdmin(u.creado)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
