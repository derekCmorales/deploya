import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { saltosDeProxy } from "./compartido/proxy-de-confianza";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // La web manda la cookie de sesión (`credentials: "include"`): CORS con origen explícito.
  app.enableCors({ origin: process.env.URL_WEB ?? "http://localhost:3000", credentials: true });
  // Detrás de Traefik, `req.ip` es la IP del cliente (límite de intentos del código, SP-17).
  app.set("trust proxy", saltosDeProxy(process.env));
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
