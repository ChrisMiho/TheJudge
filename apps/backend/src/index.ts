import { createApp } from "./app.js";
import { readServerConfig } from "./config.js";

const config = readServerConfig(process.env);
const app = createApp({ frontendOrigin: config.frontendOrigin });

app.listen(config.port, () => {
  console.log(`TheJudge backend listening on :${config.port}`);
});
