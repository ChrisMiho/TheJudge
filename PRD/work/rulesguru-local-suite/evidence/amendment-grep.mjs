// Reruns the DESIGN-BRIEF.md amendment-set grep and saves its raw stdout beside this file.
// Run from the repo root: node PRD/work/rulesguru-local-suite/evidence/amendment-grep.mjs
// The exact command is in amendment-grep.cmd.txt; the args below are that command, unquoted.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pattern =
  "REQ-185|REQ-186|REQ-188|REQ-226|NFR-018|rules test corpus|outside-source|outside text";
const stdout = execFileSync(
  "grep",
  ["-rnE", pattern, "PRD/sections", "apps", "scripts", "docs", "--exclude-dir=node_modules"],
  { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
);
const out = join(dirname(fileURLToPath(import.meta.url)), "amendment-grep.hits.txt");
writeFileSync(out, stdout);
console.log(`${stdout.split("\n").filter(Boolean).length} hits written to ${out}`);
