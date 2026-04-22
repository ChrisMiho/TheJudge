import { createApp } from "./app.js";
import { readServerConfig } from "./config.js";

const config = readServerConfig(process.env);
const app = createApp({
  frontendOrigin: config.frontendOrigin,
  debugLoggingEnabled: config.debugLoggingEnabled
});

app.listen(config.port, () => {
  console.log(`TheJudge backend listening on :${config.port}`);
});
