import type { NextConfig } from "next";

/**
 * EST-01c · Cabeceras de todas las páginas. HSTS y el HTTPS del borde los pone Traefik en el
 * VPS (ADR 0007), así que aquí no se repiten.
 */
const CABECERAS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [{ source: "/:path*", headers: CABECERAS }];
  },
};

export default nextConfig;
