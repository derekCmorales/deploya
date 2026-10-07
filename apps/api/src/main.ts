import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // La web manda la cookie de sesión (`credentials: "include"`): CORS con origen explícito.
  app.enableCors({ origin: process.env.URL_WEB ?? "http://localhost:3000", credentials: true });
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
