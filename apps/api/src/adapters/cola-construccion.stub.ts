import { Injectable } from "@nestjs/common";

/** Cola M4 — stub en memoria (Redis real llega en feat/m4-*). */
@Injectable()
export class ColaConstruccionStub {
  private readonly trabajos: unknown[] = [];

  async encolar(trabajo: unknown): Promise<void> {
    this.trabajos.push(trabajo);
  }

  listar(): unknown[] {
    return [...this.trabajos];
  }
}
