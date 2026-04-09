import assert from "node:assert/strict";
import test from "node:test";

import { CodexBridge } from "../lib/codex-bridge.js";

function createBridge() {
  const bridge = new CodexBridge();
  const sent = [];
  bridge.send = (message) => {
    sent.push(message);
  };
  return { bridge, sent };
}

test("bridge waits for account/read before starting the first thread", () => {
  const { bridge, sent } = createBridge();

  bridge.handleMessage({ id: 0, result: { ok: true } });

  assert.deepEqual(sent.slice(0, 2), [
    { method: "initialized", params: {} },
    { id: -1, method: "account/read", params: { refreshToken: false } },
  ]);

  bridge.handleMessage({
    id: -1,
    result: {
      account: { type: "apiKey" },
      requiresOpenaiAuth: true,
    },
  });

  assert.deepEqual(sent.slice(2), [
    { id: -2, method: "account/rateLimits/read", params: {} },
    { id: -3, method: "thread/start", params: { model: "gpt-5.4-mini" } },
  ]);

  bridge.handleMessage({
    id: -2,
    result: {
      rateLimits: {
        limitId: "codex",
        primary: { usedPercent: 12 },
      },
    },
  });
  bridge.handleMessage({
    id: -3,
    result: { thread: { id: "thr_123" } },
  });

  assert.equal(bridge.getStatus().threadId, "thr_123");
  assert.equal(bridge.getStatus().state, "ready");
  assert.equal(bridge.getStatus().provider, "codex");
  assert.equal(bridge.getStatus().authMode, "apikey");
  assert.equal(bridge.getStatus().requiresOpenaiAuth, true);
  assert.equal(bridge.getStatus().rateLimits.limitId, "codex");
  assert.equal(bridge.getStatus().defaultModel, "gpt-5.4-mini");
});

test("bridge enters an auth error when account/read reports no account and auth is required", () => {
  const { bridge, sent } = createBridge();

  bridge.handleMessage({ id: 0, result: { ok: true } });
  bridge.handleMessage({
    id: -1,
    result: {
      account: null,
      requiresOpenaiAuth: true,
    },
  });

  assert.equal(sent.some((message) => message.method === "thread/start"), false);
  assert.equal(bridge.getStatus().state, "error");
  assert.match(
    bridge.getStatus().error ?? "",
    /authentication|認証/i,
  );
  assert.equal(bridge.getStatus().requiresOpenaiAuth, true);
  assert.equal(bridge.getStatus().authMode, null);
});

test("bridge resumes when account/updated reports apikey auth", () => {
  const { bridge, sent } = createBridge();

  bridge.handleMessage({ id: 0, result: { ok: true } });
  bridge.handleMessage({
    id: -1,
    result: {
      account: null,
      requiresOpenaiAuth: true,
    },
  });
  bridge.handleMessage({
    method: "account/updated",
    params: { authMode: "apikey" },
  });

  assert.equal(sent.some((message) => message.id === -2), true);
  assert.equal(bridge.getStatus().authMode, "apikey");
});

test("bridge refreshes rate limits after account/read succeeds", () => {
  const { bridge, sent } = createBridge();

  bridge.handleMessage({ id: 0, result: { ok: true } });
  bridge.handleMessage({
    id: -1,
    result: {
      account: { type: "apiKey" },
      requiresOpenaiAuth: true,
    },
  });

  assert.deepEqual(sent.slice(2), [
    { id: -2, method: "account/rateLimits/read", params: {} },
    { id: -3, method: "thread/start", params: { model: "gpt-5.4-mini" } },
  ]);

  bridge.handleMessage({
    id: -2,
    result: {
      rateLimits: {
        limitId: "codex",
        primary: { usedPercent: 42 },
      },
    },
  });

  assert.equal(bridge.getStatus().rateLimits.limitId, "codex");
  assert.equal(bridge.getStatus().rateLimits.primary.usedPercent, 42);
});

test("bridge clears thread when account/updated reports unauthenticated", () => {
  const { bridge } = createBridge();

  bridge.handleMessage({ id: 0, result: { ok: true } });
  bridge.handleMessage({
    id: -1,
    result: {
      account: { type: "apiKey" },
      requiresOpenaiAuth: true,
    },
  });
  bridge.handleMessage({
    id: -2,
    result: {
      rateLimits: {
        limitId: "codex",
        primary: { usedPercent: 42 },
      },
    },
  });
  bridge.handleMessage({
    id: -3,
    result: { thread: { id: "thr_123" } },
  });

  assert.equal(bridge.getStatus().threadId, "thr_123");

  bridge.handleMessage({
    method: "account/updated",
    params: { authMode: null },
  });

  assert.equal(bridge.getStatus().authMode, null);
  assert.equal(bridge.getStatus().threadId, null);
  assert.equal(bridge.getStatus().state, "error");
});

test("bridge forwards per-turn model overrides", async () => {
  const { bridge, sent } = createBridge();

  bridge.waitForReady = async () => bridge;
  bridge.threadId = "thr_123";
  bridge.ready = true;
  bridge.nextId = 7;

  const prompt = bridge.submitPrompt("hello", { model: "gpt-5.4" });
  await Promise.resolve();

  assert.deepEqual(sent[0], {
    id: 7,
    method: "turn/start",
    params: {
      threadId: "thr_123",
      input: [{ type: "text", text: "hello" }],
      model: "gpt-5.4",
    },
  });

  bridge.handleMessage({
    id: 7,
    result: { thread: { id: "thr_123" }, turn: { id: "turn_1" } },
  });

  const result = await prompt;
  assert.equal(result.turn.id, "turn_1");
});
