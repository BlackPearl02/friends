/**
 * Vercel serverless entry point for @friends/api (NestJS).
 *
 * Vercel invokes this file as a Node.js serverless function.
 * The NestJS app is created once and cached between warm invocations.
 */
import "reflect-metadata";
import type { IncomingMessage, ServerResponse } from "node:http";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import helmet from "helmet";
import express from "express";
import { AppModule } from "../src/app.module";

const expressApp = express();
let isReady = false;

async function bootstrap(): Promise<void> {
  const activityOrigin = process.env.ACTIVITY_ORIGIN ?? "";

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    rawBody: true,
    logger: ["error", "warn", "log"],
  });

  app.use(helmet());

  app.enableCors({
    // Allow Discord iframe origin and the Activity Vercel URL.
    // Falls back to same-origin only when the env var is unset.
    origin: activityOrigin
      ? [activityOrigin, /\.discordsays\.com$/]
      : /\.discordsays\.com$/,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  isReady = true;
}

const ready = bootstrap();

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await ready;
  if (!isReady) {
    res.writeHead(503);
    res.end("Service starting");
    return;
  }
  expressApp(req, res);
}
