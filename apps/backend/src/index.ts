import { createApp } from "./app.js";
import { readServerConfig } from "./config.js";
import { createAskAiProvider } from "./providers/createAskAiProvider.js";

const config = readServerConfig(process.env);
const app = createApp({
  frontendOrigin: config.frontendOrigin,
  debugLoggingEnabled: config.debugLoggingEnabled,
  askAiProvider: createAskAiProvider(config)
});

app.listen(config.port, () => {
  console.log(`TheJudge backend listening on :${config.port}`);
});
