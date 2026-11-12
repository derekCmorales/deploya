import { Database, HardDrive, MemoryStick, type LucideIcon } from "lucide-react";

import type { TipoRecurso } from "@/lib/datos";

/** Icono de cada tipo de recurso de datos (Lucide, como el resto del sistema). */
export const ICONO_TIPO: Record<TipoRecurso, LucideIcon> = { postgres: Database, redis: MemoryStick, s3: HardDrive };
