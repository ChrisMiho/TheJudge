import { configure as serverlessExpress } from "@codegenie/serverless-express";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createConfiguredApp } from "./runtime/createConfiguredApp.js";

const backendDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(backendDir, "../../..");
const runtime = createConfiguredApp(repoRoot, process.env);

export const handler = serverlessExpress({ app: runtime.app });
