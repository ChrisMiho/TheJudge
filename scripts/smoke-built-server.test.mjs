import assert from "node:assert/strict";
import net from "node:net";
import test from "node:test";

import {
  POLL_INTERVAL_MS,
  READY_DEADLINE_MS,
  REQUEST_TIMEOUT_MS,
  SOL_RING_ORACLE_ID,
  buildChildEnv,
  evaluateCard,
  evaluateHealth,
  fetchJson,
  isPortFree,
  pickFreePort,
  runSmoke,
  waitUntilReady
} from "./smoke-built-server.mjs";

const GOOD_CARD = { oracleText: "{T}: Add {C}{C}.", typeLine: "Artifact" };

test("constants: 30 s ready deadline, a per-request timeout below it, Sol Ring id", () => {
  assert.equal(READY_DEADLINE_MS, 30_000);
  assert.ok(Number.isInteger(REQUEST_TIMEOUT_MS) && REQUEST_TIMEOUT_MS > 0);
  assert.ok(REQUEST_TIMEOUT_MS < READY_DEADLINE_MS);
  assert.ok(POLL_INTERVAL_MS > 0 && POLL_INTERVAL_MS < REQUEST_TIMEOUT_MS);
  assert.equal(SOL_RING_ORACLE_ID, "6ad8011d-3471-4369-9d68-b264cc027487");
});

test("buildChildEnv drops the four variables and sets PORT", () => {
  const env = buildChildEnv(
    {
      PATH: "/bin",
      ASK_AI_PROVIDER: "openai",
      EMBEDDING_PROVIDER: "local",
      OPENAI_API_KEY: "sk-secret",
      NODE_ENV: "development",
      PORT: "1"
    },
    4321
  );
  assert.equal(env.PATH, "/bin");
  assert.equal(env.PORT, "4321");
  for (const key of ["ASK_AI_PROVIDER", "EMBEDDING_PROVIDER", "OPENAI_API_KEY", "NODE_ENV"]) {
    assert.ok(!(key in env), `${key} must not reach the child`);
  }
});

test("evaluateHealth passes only on 200 {ok:true}", () => {
  assert.equal(evaluateHealth({ status: 200, body: { ok: true } }).ok, true);
  assert.equal(evaluateHealth({ status: 200, body: { ok: false } }).ok, false);
  assert.equal(evaluateHealth({ status: 200, body: null }).ok, false);
  assert.equal(evaluateHealth({ status: 500, body: { ok: true } }).ok, false);
});

test("evaluateCard passes on 200 with non-empty oracleText and typeLine", () => {
  assert.equal(evaluateCard({ status: 200, body: GOOD_CARD }).ok, true);
});

test("evaluateCard fails on 404, empty or missing oracleText, missing typeLine", () => {
  assert.equal(evaluateCard({ status: 404, body: { error: "card_not_found" } }).ok, false);
  assert.equal(evaluateCard({ status: 200, body: { ...GOOD_CARD, oracleText: "" } }).ok, false);
  assert.equal(evaluateCard({ status: 200, body: { typeLine: "Artifact" } }).ok, false);
  assert.equal(evaluateCard({ status: 200, body: { oracleText: "x", typeLine: "  " } }).ok, false);
  assert.equal(evaluateCard({ status: 200, body: { oracleText: 5, typeLine: "Artifact" } }).ok, false);
  assert.equal(evaluateCard({ status: 200, body: null }).ok, false);
});

function fakeClock() {
  let t = 0;
  return { now: () => t, sleep: async (ms) => void (t += ms) };
}

test("waitUntilReady returns ok once health passes", async () => {
  const clock = fakeClock();
  let calls = 0;
  const result = await waitUntilReady({
    getHealth: async () => {
      calls += 1;
      if (calls < 3) throw new Error("ECONNREFUSED");
      return { status: 200, body: { ok: true } };
    },
    childExited: () => false,
    ...clock
  });
  assert.equal(result.ok, true);
  assert.equal(calls, 3);
});

test("waitUntilReady fails when the child exits before ready", async () => {
  const clock = fakeClock();
  const result = await waitUntilReady({
    getHealth: async () => {
      throw new Error("ECONNREFUSED");
    },
    childExited: () => true,
    ...clock
  });
  assert.equal(result.ok, false);
  assert.match(result.reason, /exited before/);
});

test("waitUntilReady fails when the deadline passes", async () => {
  const clock = fakeClock();
  const result = await waitUntilReady({
    getHealth: async () => {
      throw new Error("ECONNREFUSED");
    },
    childExited: () => false,
    ...clock
  });
  assert.equal(result.ok, false);
  assert.match(result.reason, /deadline/);
  assert.ok(clock.now() >= READY_DEADLINE_MS);
});

test("fetchJson sends an AbortSignal timeout on every request", async () => {
  const seen = [];
  const fetchImpl = async (url, init) => {
    seen.push(init);
    return { status: 200, json: async () => ({ ok: true }) };
  };
  const res = await fetchJson("http://127.0.0.1:1/x", fetchImpl);
  assert.deepEqual(res, { status: 200, body: { ok: true } });
  assert.ok(seen[0].signal instanceof AbortSignal);
});

test("fetchJson returns a null body when the response is not JSON", async () => {
  const res = await fetchJson("http://x", async () => ({
    status: 502,
    json: async () => {
      throw new SyntaxError("bad");
    }
  }));
  assert.deepEqual(res, { status: 502, body: null });
});

test("pickFreePort returns a bindable port and isPortFree reflects a listener", async () => {
  const port = await pickFreePort();
  assert.ok(port > 0);
  assert.equal(await isPortFree(port), true);
  const server = net.createServer();
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  assert.equal(await isPortFree(port), false);
  await new Promise((resolve) => server.close(resolve));
});

function harness({ health, card, exited = false, portFree = true }) {
  const state = { stopped: 0, spawnEnv: null, urls: [] };
  const clock = fakeClock();
  const deps = {
    env: { PATH: "/bin", OPENAI_API_KEY: "sk", NODE_ENV: "production" },
    pickPort: async () => 4567,
    spawnChild: ({ env }) => {
      state.spawnEnv = env;
      return {
        hasExited: () => exited,
        output: () => "server output line",
        stop: async () => void (state.stopped += 1)
      };
    },
    fetchJson: async (url) => {
      state.urls.push(url);
      if (url.endsWith("/api/health")) return health();
      return card();
    },
    isPortFree: async () => portFree,
    log: () => {},
    ...clock
  };
  return { state, deps };
}

test("runSmoke passes and stops the child when health and Sol Ring answer", async () => {
  const { state, deps } = harness({
    health: () => ({ status: 200, body: { ok: true } }),
    card: () => ({ status: 200, body: GOOD_CARD })
  });
  const result = await runSmoke(deps);
  assert.equal(result.ok, true);
  assert.equal(result.healthStatus, 200);
  assert.equal(result.cardStatus, 200);
  assert.equal(state.stopped, 1);
  assert.ok(state.urls.some((u) => u.endsWith(`/api/cards/${SOL_RING_ORACLE_ID}`)));
  assert.ok(!("OPENAI_API_KEY" in state.spawnEnv));
  assert.ok(!("NODE_ENV" in state.spawnEnv));
  assert.equal(state.spawnEnv.PORT, "4567");
});

test("runSmoke fails when health is 200 but the card is 404, and stops the child", async () => {
  const { state, deps } = harness({
    health: () => ({ status: 200, body: { ok: true } }),
    card: () => ({ status: 404, body: { error: "card_not_found" } })
  });
  const result = await runSmoke(deps);
  assert.equal(result.ok, false);
  assert.equal(result.cardStatus, 404);
  assert.match(result.reasons.join(" "), /card/i);
  assert.equal(state.stopped, 1);
});

test("runSmoke fails on empty oracleText", async () => {
  const { deps } = harness({
    health: () => ({ status: 200, body: { ok: true } }),
    card: () => ({ status: 200, body: { oracleText: "", typeLine: "Artifact" } })
  });
  assert.equal((await runSmoke(deps)).ok, false);
});

test("runSmoke fails and stops the child when the server exits before ready", async () => {
  const { state, deps } = harness({
    health: () => {
      throw new Error("ECONNREFUSED");
    },
    card: () => ({ status: 200, body: GOOD_CARD }),
    exited: true
  });
  const result = await runSmoke(deps);
  assert.equal(result.ok, false);
  assert.equal(state.stopped, 1);
  assert.equal(result.output, "server output line");
});

test("runSmoke fails when the deadline passes", async () => {
  const { state, deps } = harness({
    health: () => {
      throw new Error("ECONNREFUSED");
    },
    card: () => ({ status: 200, body: GOOD_CARD })
  });
  const result = await runSmoke(deps);
  assert.equal(result.ok, false);
  assert.match(result.reasons.join(" "), /deadline/);
  assert.equal(state.stopped, 1);
});

test("runSmoke fails when the port is still held after the child is stopped", async () => {
  const { deps } = harness({
    health: () => ({ status: 200, body: { ok: true } }),
    card: () => ({ status: 200, body: GOOD_CARD }),
    portFree: false
  });
  const result = await runSmoke(deps);
  assert.equal(result.ok, false);
  assert.match(result.reasons.join(" "), /port/i);
});
