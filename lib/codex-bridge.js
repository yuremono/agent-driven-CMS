import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";

function parseLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function normalizeAuthMode(accountType) {
  if (accountType === "apiKey" || accountType === "apikey") return "apikey";
  if (accountType === "chatgpt") return "chatgpt";
  if (accountType === "chatgptAuthTokens") return "chatgptAuthTokens";
  return null;
}

class CodexBridge extends EventEmitter {
  constructor() {
    super();
    this.proc = null;
    this.initialized = false;
    this.ready = false;
    this.threadId = null;
    this.pid = null;
    this.state = "idle";
    this.error = null;
    // Use negative ids for client-initiated requests to avoid colliding with
    // server-initiated request ids (approvals, token refresh, etc).
    this.nextId = -1;
    this.pending = new Map();
    this.pendingServerRequests = new Map();
    this.starting = null;
    this.latestDiff = "";
    this.latestPlan = null;
    this.authMode = null;
    this.account = null;
    this.requiresOpenaiAuth = null;
    this.threadStartRequested = false;
    this.latestRateLimits = null;
  }

  getStatus() {
    return {
      state: this.state,
      threadId: this.threadId,
      pid: this.pid,
      error: this.error,
      pendingServerRequests: this.pendingServerRequests.size,
      authMode: this.authMode,
      accountType: this.account?.type ?? null,
      accountEmail: this.account?.email ?? null,
      requiresOpenaiAuth: this.requiresOpenaiAuth,
      rateLimits: this.latestRateLimits,
      initialized: this.initialized,
      ready: this.ready,
    };
  }

  snapshot() {
    return {
      type: "status",
      status: this.getStatus(),
      diff: this.latestDiff,
      plan: this.latestPlan,
    };
  }

  failPending(message) {
    for (const pending of this.pending.values()) {
      pending.reject(new Error(message));
    }
    this.pending.clear();
    this.pendingServerRequests.clear();
  }

  async start() {
    if (this.proc) return this;
    if (this.starting) return this.starting;

    this.starting = (async () => {
      this.state = "starting";

      const command = process.env.CODEX_BIN ?? "codex";
      const args = ["app-server"];
      try {
        this.proc = spawn(command, args, {
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch (error) {
        this.state = "error";
        this.error = error instanceof Error ? error.message : "failed to start codex";
        this.emit("event", this.snapshot());
        throw error;
      }
      this.pid = this.proc.pid ?? null;

      this.proc.on("error", (error) => {
        this.state = "error";
        this.ready = false;
        this.initialized = false;
        this.pid = null;
        this.threadId = null;
        this.error = error.message;
        this.failPending(error.message);
        this.emit("event", this.snapshot());
      });

      this.proc.on("exit", (code, signal) => {
        this.state = code === 0 ? "idle" : "error";
        this.ready = false;
        this.initialized = false;
        this.pid = null;
        this.threadId = null;
        this.error =
          code === 0 ? null : `codex app-server exited (${code ?? signal ?? "unknown"})`;
        if (code !== 0) {
          this.failPending(this.error);
        }
        this.pendingServerRequests.clear();
        this.emit("event", {
          type: "process-exit",
          code,
          signal,
        });
        this.emit("event", this.snapshot());
        this.proc = null;
      });

      this.proc.stderr.on("data", (chunk) => {
        this.emit("event", {
          type: "stderr",
          message: chunk.toString("utf8"),
        });
      });

      this.proc.stdout.setEncoding("utf8");
      let buffer = "";
      this.proc.stdout.on("data", (chunk) => {
        buffer += chunk;
        let index = buffer.indexOf("\n");
        while (index !== -1) {
          const line = buffer.slice(0, index).trim();
          buffer = buffer.slice(index + 1);
          if (line) this.handleMessage(parseLine(line));
          index = buffer.indexOf("\n");
        }
      });

      this.send({
        id: 0,
        method: "initialize",
        params: {
          clientInfo: {
            name: "agent_driven_cms",
            title: "Agent Driven CMS",
            version: "0.1.0",
          },
        },
      });

      return this;
    })().finally(() => {
      this.starting = null;
    });

    return this.starting;
  }

  send(message) {
    if (!this.proc?.stdin.writable) {
      throw new Error("codex app-server is not running");
    }
    this.proc.stdin.write(`${JSON.stringify(message)}\n`);
  }

  request(method, params) {
    const id = this.nextId--;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.send({ id, method, params });
    });
  }

  handleMessage(message) {
    if (!message) return;
    this.emit("event", message);

    const isServerRequest = message.method && message.id != null;
    if (isServerRequest) {
      this.pendingServerRequests.set(message.id, message);
    }

    if (!message.method && message.id != null && this.pending.has(message.id)) {
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(message.error.message ?? "codex error"));
      } else {
        // Side-effects based on the originating request method.
        this.applyClientResult(pending.method, message.result);
        pending.resolve(message.result);
      }
    }

    if (message.id === 0 && message.result && !this.initialized) {
      this.initialized = true;
      this.send({ method: "initialized", params: {} });
      this.request("account/read", { refreshToken: false }).catch(() => {});
      this.emit("event", this.snapshot());
    }

    if (message.method === "account/updated") {
      if (Object.prototype.hasOwnProperty.call(message.params ?? {}, "authMode")) {
        this.authMode = normalizeAuthMode(message.params.authMode ?? null);
      }

      if (!this.authMode) {
        this.ready = false;
        this.threadId = null;
        this.threadStartRequested = false;
        if (this.requiresOpenaiAuth === true) {
          this.state = "error";
          this.error = "OpenAI authentication is required";
        } else {
          this.state = "idle";
          this.error = null;
        }
        this.emit("event", this.snapshot());
        return;
      }

      if (this.authMode && !this.threadStartRequested && !this.threadId) {
        this.state = "starting";
        this.error = null;
        this.request("account/rateLimits/read", {}).catch(() => {});
        this.threadStartRequested = true;
        this.request("thread/start", { model: "gpt-5.4-mini" }).catch(() => {});
      }

      this.emit("event", this.snapshot());
    }

    if (message.method === "turn/completed" && message.params?.threadId) {
      this.emit("event", {
        type: "turn/completed",
        threadId: message.params.threadId,
        turn: message.params.turn,
      });
    }

    if (message.method === "turn/diff/updated") {
      this.latestDiff = message.params?.diff ?? "";
      this.emit("event", {
        type: "turn/diff/updated",
        threadId: message.params?.threadId ?? this.threadId,
        turnId: message.params?.turnId ?? null,
        diff: this.latestDiff,
      });
    }

    if (message.method === "turn/plan/updated") {
      this.latestPlan = message.params ?? null;
      this.emit("event", {
        type: "turn/plan/updated",
        threadId: message.params?.threadId ?? this.threadId,
        turnId: message.params?.turnId ?? null,
        plan: this.latestPlan,
      });
    }

    if (message.method === "account/rateLimits/updated") {
      if (message.params?.rateLimits) {
        this.latestRateLimits = message.params.rateLimits;
        this.emit("event", this.snapshot());
      }
    }

    if (message.method === "serverRequest/resolved") {
      const requestId = message.params?.requestId;
      if (requestId != null) {
        this.pendingServerRequests.delete(requestId);
      }
    }
  }

  applyClientResult(method, result) {
    if (method === "account/read") {
      this.account = result?.account ? { ...result.account } : null;
      this.authMode = normalizeAuthMode(this.account?.type ?? null);
      if (typeof result?.requiresOpenaiAuth === "boolean") {
        this.requiresOpenaiAuth = result.requiresOpenaiAuth;
      }

      if (this.account || this.requiresOpenaiAuth === false) {
        this.state = "starting";
        this.error = null;
        this.request("account/rateLimits/read", {}).catch(() => {});
        if (!this.threadStartRequested) {
          this.threadStartRequested = true;
          this.request("thread/start", { model: "gpt-5.4-mini" }).catch(() => {});
        }
      } else if (this.requiresOpenaiAuth === true) {
        this.state = "error";
        this.error = "OpenAI authentication is required";
      }

      this.emit("event", this.snapshot());
      return;
    }

    if (method === "thread/start") {
      if (result?.thread?.id) {
        this.threadId = result.thread.id;
        this.ready = true;
        this.state = "ready";
        this.emit("event", this.snapshot());
      }
      return;
    }

    if (method === "account/rateLimits/read") {
      if (result?.rateLimits) {
        this.latestRateLimits = result.rateLimits;
        this.emit("event", this.snapshot());
      }
    }
  }

  async waitForReady() {
    if (this.ready && this.threadId) return this;
    await this.start();
    if (this.ready && this.threadId) return this;
    if (this.error && !this.threadId) {
      throw new Error(this.error);
    }

    await new Promise((resolve, reject) => {
      const onEvent = (event) => {
        if (event.type === "status" && event.status.threadId) {
          cleanup();
          resolve();
        }
        if (event.type === "status" && event.status.error && !event.status.threadId) {
          cleanup();
          reject(new Error(event.status.error));
        }
      };
      const onExit = (event) => {
        if (event.type === "process-exit") {
          cleanup();
          reject(new Error("codex app-server exited before becoming ready"));
        }
      };
      const cleanup = () => {
        this.off("event", onEvent);
        this.off("event", onExit);
      };
      this.on("event", onEvent);
      this.on("event", onExit);
    });

    return this;
  }

  async waitForInitialized() {
    if (this.initialized) return this;
    await this.start();
    if (this.initialized) return this;

    await new Promise((resolve, reject) => {
      const onEvent = (event) => {
        if (event.type === "status" && event.status.initialized) {
          cleanup();
          resolve();
        }
        if (event.type === "status" && event.status.error && !event.status.initialized) {
          cleanup();
          reject(new Error(event.status.error));
        }
      };
      const onExit = (event) => {
        if (event.type === "process-exit") {
          cleanup();
          reject(new Error("codex app-server exited before becoming initialized"));
        }
      };
      const cleanup = () => {
        this.off("event", onEvent);
        this.off("event", onExit);
      };
      this.on("event", onEvent);
      this.on("event", onExit);
    });

    return this;
  }

  async submitPrompt(text) {
    await this.waitForReady();
    const id = this.nextId++;

    return await new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.send({
        id,
        method: "turn/start",
        params: {
          threadId: this.threadId,
          input: [{ type: "text", text }],
        },
      });
    });
  }

  async respondToServerRequest(requestId, result) {
    await this.waitForReady();
    if (requestId == null) {
      throw new Error("requestId is required");
    }

    this.send({
      id: requestId,
      result,
    });

    return { requestId, result };
  }

  async readAccount({ refreshToken = false } = {}) {
    await this.waitForInitialized();
    return await this.request("account/read", { refreshToken: Boolean(refreshToken) });
  }

  async startChatgptLogin() {
    await this.waitForInitialized();
    return await this.request("account/login/start", { type: "chatgpt" });
  }

  async logout() {
    await this.waitForInitialized();
    return await this.request("account/logout", {});
  }

  async readRateLimits() {
    await this.waitForInitialized();
    return await this.request("account/rateLimits/read", {});
  }
}

const bridge = globalThis.__agentDrivenCmsBridge ?? new CodexBridge();
globalThis.__agentDrivenCmsBridge = bridge;

export { CodexBridge, normalizeAuthMode };
export function getCodexBridge() {
  return bridge;
}
