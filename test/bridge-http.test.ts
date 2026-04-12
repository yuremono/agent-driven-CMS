import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchJson,
  jsonError,
  readJsonBody,
  sameOriginForbidden,
} from "../lib/bridge-http";

test("jsonError returns the fallback message for non-Error values", async () => {
  const response = jsonError("nope", "fallback", 418);

  assert.equal(response.status, 418);
  assert.deepEqual(await response.json(), { error: "fallback" });
});

test("sameOriginForbidden blocks cross-origin requests", async () => {
  const request = new Request("http://example.test/api/bridge/login", {
    headers: {
      host: "example.test",
      origin: "http://evil.test",
    },
  });

  const response = sameOriginForbidden(request);

  assert.ok(response);
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "forbidden" });
});

test("readJsonBody parses request JSON and falls back on invalid bodies", async () => {
  const parsed = await readJsonBody(
    new Request("http://example.test/api", {
      method: "POST",
      body: JSON.stringify({ input: "hello" }),
      headers: {
        "Content-Type": "application/json",
      },
    }),
  );

  const fallback = await readJsonBody(
    new Request("http://example.test/api", {
      method: "POST",
    }),
    { input: "fallback" },
  );

  assert.deepEqual(parsed, { input: "hello" });
  assert.deepEqual(fallback, { input: "fallback" });
});

test("fetchJson returns parsed data and surfaces API errors", async () => {
  const originalFetch = global.fetch;

  global.fetch = (async (path: RequestInfo | URL) => {
    if (path === "/api/ok") {
      return new Response(JSON.stringify({ result: "ok" }), {
        headers: {
          "Content-Type": "application/json",
        },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "broken" }), {
      headers: {
        "Content-Type": "application/json",
      },
      status: 500,
    });
  }) as typeof fetch;

  try {
    await assert.deepEqual(await fetchJson("/api/ok"), { result: "ok" });
    await assert.rejects(fetchJson("/api/fail", {}, "fallback"), /broken/);
  } finally {
    global.fetch = originalFetch;
  }
});
