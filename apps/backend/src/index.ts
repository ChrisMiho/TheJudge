import { createApp } from "./app.js";
import { readServerConfig } from "./config.js";
import { createAppLogger } from "./logging.js";
import { createAskAiProvider } from "./providers/createAskAiProvider.js";

const config = readServerConfig(process.env);
const startupLogger = createAppLogger(true);
const app = createApp({
  frontendOrigin: config.frontendOrigin,
  debugLoggingEnabled: config.debugLoggingEnabled,
  payloadLoggingEnabled: config.payloadLoggingEnabled,
  askAiProvider: createAskAiProvider(config)
});

app.listen(config.port, () => {
  startupLogger.info("backend.startup", {
    port: config.port,
    frontendOrigin: config.frontendOrigin ?? "(unset)",
    askAiProvider: config.askAiProvider,
    debugLoggingEnabled: config.debugLoggingEnabled,
    payloadLoggingEnabled: config.payloadLoggingEnabled
  });
});
