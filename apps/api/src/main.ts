import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { stripDiscordApiPrefix } from "./discord-api-prefix";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Discord `/api` mapping may forward `/api/discord/...` (prefix kept) — accept both.
  app.use((req: { url: string }, _res: unknown, next: () => void) => {
    req.url = stripDiscordApiPrefix(req.url);
    next();
  });
  app.use(helmet());
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : "unknown";
  Logger.error(`Bootstrap failed: ${message}`, err instanceof Error ? err.stack : undefined, "Bootstrap");
  process.exit(1);
});
