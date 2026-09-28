export interface ReglaContrasena {
  id: "largo" | "caso" | "numero" | "simbolo";
  texto: string;
  cumple: (clave: string) => boolean;
}

export const LARGO_MINIMO_CONTRASENA = 12;

/**
 * Mismas reglas y mismo texto que `REGLAS_CONTRASENA` de la web
 * (apps/web/src/components/deploya/requisitos-contrasena.tsx): la web guía, la API decide.
 */
export const REGLAS_CONTRASENA: readonly ReglaContrasena[] = [
  { id: "largo", texto: "Mínimo 12 caracteres", cumple: (v) => v.length >= LARGO_MINIMO_CONTRASENA },
  { id: "caso", texto: "Mayúsculas y minúsculas", cumple: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { id: "numero", texto: "Al menos un número", cumple: (v) => /\d/.test(v) },
  { id: "simbolo", texto: "Al menos un símbolo", cumple: (v) => /[^A-Za-z0-9]/.test(v) },
];

export interface ResultadoPolitica {
  valida: boolean;
  incumplidas: string[];
}

/** Objeto de valor puro (Strategy de validación): la reutilizan registro, recuperación y Seguridad. */
export class PoliticaContrasena {
  constructor(private readonly reglas: readonly ReglaContrasena[] = REGLAS_CONTRASENA) {}

  validar(clave: string): ResultadoPolitica {
    const incumplidas = this.reglas.filter((r) => !r.cumple(clave)).map((r) => r.texto);
    return { valida: incumplidas.length === 0, incumplidas };
  }
}
