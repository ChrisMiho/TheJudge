# Live measurements — built backend boot, health and card lookup

What happened: the built backend was compiled, started on a free port, and
answered the health check and a real card lookup. A second run with no data
folder showed the health check stays green while card lookups fail. Nothing
paid was called and `.secrets/` was not read.

Machine: macOS arm64 (darwin/arm64), Node v26.0.0 (Homebrew), 2026-10-18.
Working directory: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/session-ci-smoke`
(branch `thejudge-auto/ci-built-server-smoke`, HEAD `64adabea`).

## 1. Install and build

| Step | Command | Result |
| --- | --- | --- |
| Install | `ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci --no-audit --no-fund` | 653 packages, 4.2 s wall (warm npm cache) |
| Build | `npm --workspace apps/backend run build` (= `tsc -p tsconfig.build.json`) | exit 0, 1.18 s wall |
| Output | `apps/backend/dist/` | 388 KB; contains `index.js` (HTTP server entry) and `lambda.js` (deployed Lambda entry), plus `app/`, `routes/`, `runtime/`, `config/`, `providers/`, `prompt/`, `validation/`, `commanderSpellbook/`, `types/` |

`tsconfig.build.json` extends `tsconfig.json` and excludes `src/**/*.test.ts`,
`src/test-utils/**` and `src/eval/**`, so the build output holds no tests.

## 2. Start the built server (normal run)

Free-port check first: `lsof -nP -iTCP:3917 -sTCP:LISTEN` returned nothing (exit 1).

Started with the Bash tool's background option (no `&`, no `nohup`):

```text
node -e 'console.log("launch_epoch_ms="+Date.now())' && \
  env -u ASK_AI_PROVIDER -u EMBEDDING_PROVIDER -u OPENAI_API_KEY -u NODE_ENV \
  PORT=3917 node apps/backend/dist/index.js
```

Unsetting the provider variables leaves both providers at their checkout
default `mock`; unsetting `NODE_ENV` means `index.ts` skips its development-only
`.env` / `.secrets/openai-dev.env` loading entirely.

Startup log line (verbatim):

```json
{"level":30,"time":"2026-10-18T23:20:48.409Z","service":"thejudge-backend","event":"backend.startup","port":3917,"frontendOrigin":"(unset)","askAiProvider":"mock","cardRulingsCardCount":19996,"cardDetailCardCount":37854,"cardPrintingPricesCardCount":37854,"gameRulesTopicCount":24,"gameRulesRuleCount":2894,"debugLoggingEnabled":false,"payloadLoggingEnabled":false}
```

Boot time: launch stamp `1792365647903` (23:20:47.903Z) to the listening log
line at 23:20:48.409Z = **~0.51 s** from launch to listening. (The traced run
below independently shows the last data file read at +520 ms after process
start.)

## 3. Calls

| Call | Command | Status | Body |
| --- | --- | --- | --- |
| Health | `curl -s -i http://127.0.0.1:3917/api/health` | `200 OK` | `{"ok":true}` (11 bytes, `application/json; charset=utf-8`) |
| Card lookup — Sol Ring | `curl -s -i http://127.0.0.1:3917/api/cards/6ad8011d-3471-4369-9d68-b264cc027487` | `200 OK` | `{"oracleText":"{T}: Add {C}{C}.","typeLine":"Artifact","manaCost":"{1}","manaValue":1,"colors":[],"supertypes":[],"subtypes":[],"keywords":[]}` (142 bytes) |
| Unknown card | `curl -s -i http://127.0.0.1:3917/api/cards/not-a-real-id` | `404 Not Found` | `{"error":"card_not_found"}` |
| Sol Ring prices (context only) | `curl ... /api/cards/6ad8011d-.../prices` | `200` | 18,864 bytes, 1.3 ms |

Card lookup latency: 0.9 ms (`curl -w %{time_total}`).

The card block has no `power` / `toughness` / `loyalty` keys — the route strips
them (REQ-245). The oracle id is Sol Ring's: `apps/frontend/public/data/cardMetadata.json`
maps `"cardId":"6ad8011d-3471-4369-9d68-b264cc027487","name":"Sol Ring"`.

Server process: pid 7925, RSS 58 MB. Stopped with `kill 7925` (background task
exit 143 = SIGTERM, expected).

## 4. Data files read at boot (traced run)

Same command plus a measurement-only preload (kept in the session scratchpad,
not the repository) that logs `existsSync` / `readFileSync` / `openSync` /
`statSync` calls under `apps/backend/data/`, `.secrets` or `*.env`:

```text
node --import <scratchpad>/trace-fs.mjs apps/backend/dist/index.js
```

| ms after start | File | Size (committed) |
| --- | --- | --- |
| +132 | `apps/backend/data/embeddingModel.manifest.json` (read at module load by `localEmbeddingProvider.ts`; the model itself is not loaded) | 733 B |
| +135 | `apps/backend/data/cardRulingsByOracleId.json.br` | 1.7 MB |
| +208 | `apps/backend/data/cardDetailByOracleId.json.br` — **the file the card lookup serves** | 1.7 MB |
| +298 | `apps/backend/data/cardPrintingPricesByOracleId.json.br` | 3.6 MB |
| +424 | `apps/backend/data/gameRulesByTopic.json` | 39 KB |
| +431 | `apps/backend/data/gameRulesRuleIndex.json` | 1.9 MB |
| +436 | `apps/backend/data/commanderSpellbookComboIndex.json.br` (read) and `commanderSpellbookComboBlocks.br` (exists + stat only; blocks are read lazily per request) | 1.5 MB / 14.3 MB |

Not touched at boot: `.secrets/`, any `.env`, `apps/backend/data/models/`
(the gitignored model folder), `gameRulesRuleEmbeddings.json`,
`gameRulesGlossary.json`, `gameRulesTokenStats.json` (all read lazily on an
ask-ai request). Every file read at boot is committed — `git ls-files
apps/backend/data` lists all of them. None of the gitignored local dumps
(`apps/frontend/data/scryfall/default-cards.json`, `apps/backend/data/scryfall/rulings.json`,
`apps/backend/data/cr/source.txt`, `apps/backend/data/commander-spellbook/`) is read.

Traced server pid 8493, stopped with `kill 8493`.

## 5. Failure mode — data folder missing

To see what the check catches, the built output alone was copied to a scratch
tree with no `apps/backend/data/` folder (`dist/` + `package.json` copied,
`node_modules` symlinked), then started the same way on port 3917.

| Call | Status | Body |
| --- | --- | --- |
| `GET /api/health` | `200` | `{"ok":true}` |
| `GET /api/cards/6ad8011d-3471-4369-9d68-b264cc027487` | `404` | `{"error":"card_not_found"}` |

The server booted anyway. Each loader logged one warning (for example
`Card detail file missing; GET /api/cards/:oracleId and ask-ai's server-side
card-text resolution are disabled: …`) and the startup line reported
`cardDetailCardCount: 0`. **Health alone would have passed; the card lookup
is what fails.** Stopped with `kill 12715`.

## 6. Deployed entry point, invoked in-process (context for the brief)

The Lambda handler in `apps/backend/dist/lambda.js` was invoked in-process
with synthetic Function URL (API Gateway v2) events — no AWS, no network,
provider `mock`, so `loadOpenAiKeyFromSsm` returns before any SSM call.
Probe script kept in the session scratchpad.

| Node | `/api/health` | Sol Ring lookup | Import + init + both calls |
| --- | --- | --- | --- |
| v26.0.0 (local) | 200 `{"ok":true}` | 200, same block | 423 ms |
| v22.23.3 (`npx -y node@22`) | 200 | 200, same block | 450 ms |
| v24.22.0 (`npx -y node@24`) | 200 | 200, same block | 385 ms |

So the built code boots and serves both routes on Node 22, 24 and 26.

## 7. Port release

After the last kill: `lsof -nP -iTCP:3917 -sTCP:LISTEN -t` printed nothing
(exit 1). Port 3917 is free. No server process is left running.

Build output (`apps/backend/dist/`) and `node_modules/` remain in the worktree;
both are gitignored and nothing was committed from them.

## 8. What may differ on CI (ubuntu-24.04, x86-64 Linux)

- **Architecture.** Booting `index.js` with the mock providers loads no native
  module: `@huggingface/transformers` (which pulls `onnxruntime-node` and
  `sharp`) is a dynamic `import()` inside `createLocalExtractor`, reached only
  when `EMBEDDING_PROVIDER=local` serves a request. Brotli decompression is
  Node's built-in `zlib`. No arm64-vs-x64 difference is expected in this path.
  The arm64 native-binding risk (REQ-184) is real for the deployed Lambda but
  is outside what an x86 CI runner can prove anyway.
- **Node major.** Measured here on 22, 24 and 26. The gate jobs use Node 22;
  the deploy job builds with Node 24 and the Lambda runs `nodejs24.x`.
- **Install.** CI runs `npm ci` with `ONNXRUNTIME_NODE_INSTALL_CUDA=skip`
  (workflow-level env) — the same skip used here. The existing jobs measured
  ~17 s for checkout + setup-node + `npm ci` (NFR-012 notes).
- **Timing.** Boot here was ~0.5 s on an Apple-silicon laptop. A GitHub
  standard runner is slower per core; a ready deadline of tens of seconds
  leaves wide headroom. Measure on the first CI run.
- **Port.** The runner is a fresh VM; port collisions are unlikely, but the
  check should pick a free port rather than hard-code one, so a local run of
  the same command never collides with a developer's dev server on 3000.
- **Line endings / paths.** None involved; the server resolves the repo root
  from `dist/index.js` (`../../..`), identical on both.
