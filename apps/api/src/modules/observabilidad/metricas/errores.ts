/** `GET /proyectos/:id/metricas` solo acepta `1h` o `24h`. El borde lo traduce a 400. */
export class RangoMetricasInvalido extends Error {
  constructor(readonly rango: string) {
    super("El rango de métricas es 1h o 24h");
    this.name = "RangoMetricasInvalido";
  }
}
