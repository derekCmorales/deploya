/**
 * Hasta cuándo vale el certificado TLS que cubre un host (12b muestra el vencimiento). Puerto estrecho:
 * la vista de despliegue no sabe si hay TLS ni de dónde sale el certificado. Sin certificado → `null`.
 */
export abstract class CertificadoPuerto {
  abstract venceEl(host: string): Promise<Date | null>;
}
