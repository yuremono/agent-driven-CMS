import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import test from "node:test";

import {
  ClaudeBridge,
  getClaudeArgs,
  normalizeClaudeAuthMode,
} from "../lib/claude-bridge";
import { getBridgeProvider } from "../lib/bridge";

class FakeProcess extends EventEmitter {
  stdout: PassThrough;
  stderr: PassThrough;
  pid: number;

  constructor() {
    super();
    this.stdout = new PassThrough();
    this.stderr = new PassThrough();
    this.pid = 4321;
  }

  finish({
    stderr = "",
    exitCode = 0,
    lines = [],
  }: {
    stderr?: string;
    exitCode?: number;
    lines?: unknown[];
  } = {}) {
    for (const line of lines) {
      this.stdout.write(`${JSON.stringify(line)}\n`);
    }
    this.stdout.end();
    if (stderr) {
      this.stderr.write(stderr);
    }
    this.stderr.end();
    this.emit("exit", exitCode);
  }
}

function waitForTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

test("normalizeClaudeAuthMode reports null for logged out users", () => {
  assert.equal(normalizeClaudeAuthMode({ loggedIn: false }), null);
  assert.equal(
    normalizeClaudeAuthMode({ loggedIn: true, authMethod: "oauth_token" }),
    "oauth_token",
  );
});

test("getBridgeProvider defaults to codex and honors AGENT_BRIDGE_PROVIDER", () => {
  const previous = process.env.AGENT_BRIDGE_PROVIDER;
  delete process.env.AGENT_BRIDGE_PROVIDER;
  assert.equal(getBridgeProvider(), "codex");

  process.env.AGENT_BRIDGE_PROVIDER = "claude";
  assert.equal(getBridgeProvider(), "claude");

  if (previous == null) {
    delete process.env.AGENT_BRIDGE_PROVIDER;
  } else {
    process.env.AGENT_BRIDGE_PROVIDER = previous;
  }
});

test("ClaudeBridge becomes ready after auth status succeeds", async () => {
  const bridge = new ClaudeBridge({
    execFileJson: async () => ({
      loggedIn: true,
      authMethod: "oauth_token",
      apiProvider: "firstParty",
    }),
    generateId: (() => {
      const ids = ["session-1"];
      return () => ids.shift();
    })(),
  });

  await bridge.start();

  assert.equal(bridge.getStatus().provider, "claude");
  assert.equal(bridge.getStatus().ready, true);
  assert.equal(bridge.getStatus().threadId, "session-1");
  assert.equal(bridge.getStatus().authMode, "oauth_token");
});

test("ClaudeBridge handles a complete turn and resumes on the second request", async () => {
  const proc1 = new FakeProcess();
  const proc2 = new FakeProcess();
  const spawnCalls: Array<{
    command: string;
    args: string[];
    options: unknown;
  }> = [];
  const ids = ["session-1", "turn-1", "turn-2"];
  const bridge = new ClaudeBridge({
    execFileJson: async () => ({
      loggedIn: true,
      authMethod: "oauth_token",
      apiProvider: "firstParty",
    }),
    spawnProcess: (command, args, options) => {
      spawnCalls.push({ command, args, options });
      return spawnCalls.length === 1 ? proc1 : proc2;
    },
    generateId: () => ids.shift(),
  });
  const events: any[] = [];
  bridge.on("event", (event) => {
    events.push(event);
  });

  const first = await bridge.submitPrompt("first", { model: "sonnet" });
  proc1.finish({
    lines: [
      { type: "system", subtype: "init", session_id: "session-1" },
      {
        type: "stream_event",
        event: {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "Hello" },
        },
      },
      {
        type: "assistant",
        message: {
          content: [{ type: "text", text: "Hello" }],
        },
      },
      {
        type: "result",
        subtype: "success",
        is_error: false,
        result: "Hello",
        session_id: "session-1",
        permission_denials: [],
      },
    ],
  });
  await waitForTick();

  assert.equal(first.turn.id, "turn-1");
  assert.deepEqual(
    spawnCalls[0].args,
    getClaudeArgs({
      permissionMode: "acceptEdits",
      sessionId: "session-1",
      isResume: false,
      model: "sonnet",
      text: "first",
    }),
  );
  assert.equal(
    events.some(
      (event) =>
        event.method === "item/agentMessage/delta" && event.params?.delta === "Hello",
    ),
    true,
  );
  assert.equal(
    events.some(
      (event) =>
        event.method === "item/completed" && event.params?.item?.text === "Hello",
    ),
    true,
  );
  assert.equal(
    events.some(
      (event) =>
        event.method === "turn/completed" && event.params?.turn?.status === "completed",
    ),
    true,
  );
  assert.equal(bridge.getStatus().state, "ready");

  events.length = 0;
  const second = await bridge.submitPrompt("second");
  proc2.finish({
    lines: [
      {
        type: "assistant",
        message: {
          content: [{ type: "text", text: "Again" }],
        },
      },
      {
        type: "result",
        subtype: "success",
        is_error: false,
        result: "Again",
        session_id: "session-1",
        permission_denials: [],
      },
    ],
  });
  await waitForTick();

  assert.equal(second.turn.id, "turn-2");
  assert.equal(
    spawnCalls[1].args.includes("--resume"),
    true,
  );
  assert.equal(spawnCalls[1].args.includes("session-1"), true);
});

test("ClaudeBridge surfaces permission denials as an assistant message", async () => {
  const proc = new FakeProcess();
  const bridge = new ClaudeBridge({
    execFileJson: async () => ({
      loggedIn: true,
      authMethod: "oauth_token",
      apiProvider: "firstParty",
    }),
    spawnProcess: () => proc,
    generateId: (() => {
      const ids = ["session-1", "turn-1"];
      return () => ids.shift();
    })(),
  });
  const events: any[] = [];
  bridge.on("event", (event) => events.push(event));

  await bridge.submitPrompt("needs permission");
  proc.finish({
    lines: [
      {
        type: "result",
        subtype: "success",
        is_error: false,
        result: "",
        session_id: "session-1",
        permission_denials: [{ tool_name: "Bash", tool_use_id: "tool_1" }],
      },
    ],
  });
  await waitForTick();

  const denialMessage = events.find(
    (event) =>
      event.method === "item/completed" &&
      typeof event.params?.item?.text === "string" &&
      event.params.item.text.includes("権限"),
  );
  assert.ok(denialMessage);
});
