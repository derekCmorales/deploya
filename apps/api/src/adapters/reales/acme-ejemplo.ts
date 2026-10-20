import { X509Certificate } from "node:crypto";

/**
 * Certificado autofirmado de `deploya.app` y `*.deploya.app` solo para pruebas (sin su clave privada),
 * válido hasta `VENCE_EJEMPLO`. Es un dato público, no un secreto.
 */
export const CERTIFICADO_EJEMPLO = `-----BEGIN CERTIFICATE-----
MIIDODCCAiCgAwIBAgIUJbShDKcbaJ7Zq0NobJulF10/v84wDQYJKoZIhvcNAQEL
BQAwGDEWMBQGA1UEAwwNKi5kZXBsb3lhLmFwcDAeFw0yNjEwMTQwNTE0MjRaFw0z
NjEwMTEwNTE0MjRaMBgxFjAUBgNVBAMMDSouZGVwbG95YS5hcHAwggEiMA0GCSqG
SIb3DQEBAQUAA4IBDwAwggEKAoIBAQDKV/GwhhVJizsVYptMKQcVrpoN8kpJz5X0
q+Az91S9uLtX7BJXsDigG2xA6ZZiBt9DCmFQ6nhBcWuFYAceQvkV8sCyj+td3WJP
cPErOYmvSn6s+45+F4i1nEDBqr9xNLAziRITAQSiDxZ9QPIaV981zz0N/JKXjRo3
oqC6L/AARO+KlMw8P+aWurtF6UYiWeem+g6ivm2Ht7HfWQgdUVJWenJ2AbI2fPhy
RRQLAsyY5gTKVCTo65E+k6+uyhDx5eoZedKMAxsRcvZ6FbzKA3ICVc+VwwsHDA7D
ug2CtUz1jrG/n1A1p9R/8jSGbxiVwvXWHyujIk8HIhNFqmyoDbEfAgMBAAGjejB4
MB0GA1UdDgQWBBS6obcDgbBnNR3o/J6TLspjJcwS+jAfBgNVHSMEGDAWgBS6obcD
gbBnNR3o/J6TLspjJcwS+jAPBgNVHRMBAf8EBTADAQH/MCUGA1UdEQQeMByCC2Rl
cGxveWEuYXBwgg0qLmRlcGxveWEuYXBwMA0GCSqGSIb3DQEBCwUAA4IBAQBayZrc
dok4gmePfaNNJmkDyzB8tJG66A0+td02Ew+5YviLTU+xcM3SEVcyaSnaK3ckXqKg
V/5O8xiFUFKF56by5bdEF9P0B1JzQ8t7/HhqSaxlWUzeKMRySYUkfB5lJD3vD4xH
CD2zqfx5/hZUM8Z8JdSkct+hXGIEJc8XUB7ABjBEoTj8Y8/M1w16z1QyqvRgGLF8
+8ris3U7n45Y78kRpsXxkBfa9UH5IxZ8UF7ZHHhd/Jz6cM5CVf1TAaocdJHKEkrD
Z+egU5JEsP4+dOI5NzQyo+pb2j3nl05+WDdajlZ3+2bCfqUMyP8UuQboVgDacXj+
ncBeEG3sJI4mLF4i
-----END CERTIFICATE-----`;

export const VENCE_EJEMPLO = new Date(new X509Certificate(CERTIFICADO_EJEMPLO).validTo);

/** Un `acme.json` como el que escribe Traefik v3, con el certificado de ejemplo en base64. */
export function acmeJsonEjemplo(dominios: { main: string; sans?: string[] } = { main: "deploya.app", sans: ["*.deploya.app"] }): string {
  return JSON.stringify({
    letsencrypt: {
      Account: { Email: "admin@deploya.app", Registration: { uri: "https://acme-v02.api.letsencrypt.org/acme/acct/1" } },
      Certificates: [{ domain: dominios, certificate: Buffer.from(CERTIFICADO_EJEMPLO).toString("base64"), key: "", Store: "default" }],
    },
  });
}
