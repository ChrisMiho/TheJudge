import cors from "cors";
import express from "express";
import { createErrorHandler } from "./errorHandler.js";
import { createAppLogger, type AppLogger } from "../logging.js";
import { mockAskAiProvider } from "../providers/mockAskAiProvider.js";
import type { AskAiProvider } from "../providers/askAiProvider.js";
import { registerAskAiRoute } from "../routes/askAi.js";
import { registerHealthRoute } from "../routes/health.js";

export type AppOptions = {
  frontendOrigin?: string;
  askAiProvider?: AskAiProvider;
  debugLoggingEnabled?: boolean;
  payloadLoggingEnabled?: boolean;
  logger?: AppLogger;
};

export function createApp(options: AppOptions = {}) {
  const app = express();
  const askAiProvider = options.askAiProvider ?? mockAskAiProvider;
  const isDebug = options.debugLoggingEnabled ?? false;
  const isPayloadLoggingEnabled = options.payloadLoggingEnabled ?? false;
  const logger = options.logger ?? createAppLogger(isDebug);

  app.use(cors(options.frontendOrigin ? { origin: options.frontendOrigin } : undefined));
  app.use(express.json());

  registerHealthRoute(app);
  registerAskAiRoute(app, {
    askAiProvider,
    logger,
    payloadLoggingEnabled: isPayloadLoggingEnabled
  });

  app.use(createErrorHandler(logger, isDebug));

  return app;
}
