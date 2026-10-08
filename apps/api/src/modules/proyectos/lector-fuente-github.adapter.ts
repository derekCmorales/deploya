import { LectorFuente } from '../construccion/puertos/lector-fuente.puerto'; // Ajusta la ruta relativa según tu ubicación exacta

export class LectorFuenteGitHub implements LectorFuente {
  private cache = new Map<string, { data: string | null; timestamp: number }>();
  private CACHE_TTL = 60 * 1000; // 60 segundos de caché

  constructor(
    private readonly urlRepo: string,
    private readonly rama: string,
    private readonly githubToken?: string,
  ) {}

  async existe(rutaArchivo: string): Promise<boolean> {
    const contenido = await this.leer(rutaArchivo);
    return contenido !== null;
  }

  async leer(rutaArchivo: string): Promise<string | null> {
    const cacheKey = `${this.urlRepo}@${this.rama}:${rutaArchivo}`;
    const ahora = Date.now();

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (ahora - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }

    try {
      const match = this.urlRepo.match(/github\.com\/([^/]+)\/([^/.]+)/);
      if (!match) return null;

      const [, owner, repo] = match;
      const apiUri = `https://api.github.com/repos/${owner}/${repo}/contents/${rutaArchivo}?ref=${this.rama}`;

      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Deploya-App',
      };

      if (this.githubToken) {
        headers['Authorization'] = `Bearer ${this.githubToken}`;
      }

      const response = await fetch(apiUri, { headers });
      if (!response.ok) {
        this.cache.set(cacheKey, { data: null, timestamp: ahora });
        return null;
      }

      const json = await response.json();
      if (!json.content) {
        this.cache.set(cacheKey, { data: null, timestamp: ahora });
        return null;
      }

      const buffer = Buffer.from(json.content, 'base64');
      const contenidoStr = buffer.toString('utf-8');

      this.cache.set(cacheKey, { data: contenidoStr, timestamp: ahora });
      return contenidoStr;
    } catch (error) {
      return null;
    }
  }
}