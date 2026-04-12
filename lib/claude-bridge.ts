import { execFile, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import readline from "node:readline";
import type {
  BridgeAuthMode,
  BridgeCapabilities,
  BridgeModelOption,
  BridgeSnapshot,
  BridgeState,
  BridgeStatus,
  BridgeSubmitOptions,
} from "./bridge";

declare global {
  var __agentDrivenCmsClaudeBridge: ClaudeBridge | undefined;
}

type ClaudeAuthStatus = Record<string, unknown> | null;
type ClaudeActiveTurn = {
  turnId: string;
  assistantStarted: boolean;
  assistantText: string;
  completed: boolean;
};
type ClaudeBridgeOptions = {
  spawnProcess?: typeof spawn;
  execFileJson?: (command: string, args: string[]) => Promise<unknown>;
  generateId?: () => string;
};
type ClaudeRunTurnOptions = {
  turnId: string;
  text: string;
  model?: string | null;
};
type AssistantItem = {
  type: "agentMessage";
  text: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

const CLAUDE_MODELS = [
        { label: "Claude Sonnet", value: "sonnet" },
        { label: "Claude Haiku", value: "haiku" },
        { label: "Claude Opus", value: "opus" },
        { label: "Auto", value: "auto" },
];

const CLAUDE_CAPABILITIES = {
  approvals: false,
  browserLogin: false,
  browserLogout: false,
  diff: false,
  plan: false,
  rateLimits: false,
};

function buildAssistantItem(text: string): AssistantItem {
  return {
    type: "agentMessage",
    text,
  };
}

function getClaudeArgs({ permissionMode, sessionId, isResume, model, text }: {
  permissionMode: string;
  sessionId: string;
  isResume: boolean;
  model?: string | null;
  text: string;
}) {
  const args = [
    "-p",
    "--output-format",
    "stream-json",
    "--verbose",
    "--include-partial-messages",
    "--permission-mode",
    permissionMode,
  ];

  if (model && model !== "sonnet") {
    args.push("--model", model);
  }

  if (isResume) {
    args.push("--resume", sessionId);
  } else {
    args.push("--session-id", sessionId);
  }

  args.push(text);
  return args;
}

function parseJsonLine(line: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(line);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeClaudeAuthMode(authStatus: ClaudeAuthStatus) {
  if (!authStatus?.loggedIn) return null;

  if (typeof authStatus.authMethod === "string" && authStatus.authMethod) {
    return authStatus.authMethod;
  }

  if (typeof authStatus.apiProvider === "string" && authStatus.apiProvider) {
    return authStatus.apiProvider;
  }

  return "authenticated";
}

function extractAssistantText(message: unknown): string {
  const content = isRecord(message) && Array.isArray(message.content) ? message.content : [];
  return content
    .filter((block): block is { type: "text"; text: string } =>
      isRecord(block) && block.type === "text" && typeof block.text === "string"
    )
    .map((block) => block.text)
    .join("");
}

class ClaudeBridge extends EventEmitter {
  initialized: boolean;
  ready: boolean;
  threadId: string | null;
  pid: number | null;
  state: BridgeState;
  error: string | null;
  starting: Promise<this> | null;
  authMode: BridgeAuthMode;
  account: Record<string, unknown> | null;
  latestAuthStatus: unknown;
  activeTurn: ClaudeActiveTurn | null;
  hasStartedConversation: boolean;
  defaultPermissionMode: string;
  availableModels: BridgeModelOption[];
  capabilities: BridgeCapabilities;
  spawnProcess: typeof spawn;
  execFileJson: (command: string, args: string[]) => Promise<unknown>;
  generateId: () => string;

  constructor(options: ClaudeBridgeOptions = {}) {
    super();
    this.initialized = false;
    this.ready = false;
    this.threadId = null;
    this.pid = null;
    this.state = "idle";
    this.error = null;
    this.starting = null;
    this.authMode = null;
    this.account = null;
    this.latestAuthStatus = null;
    this.activeTurn = null;
    this.hasStartedConversation = false;
    this.defaultPermissionMode = "acceptEdits";
    this.availableModels = CLAUDE_MODELS;
    this.capabilities = CLAUDE_CAPABILITIES;
    this.spawnProcess = options.spawnProcess ?? spawn;
    this.execFileJson = options.execFileJson ?? this.defaultExecFileJson.bind(this);
    this.generateId = options.generateId ?? randomUUID;
  }

  getStatus(): BridgeStatus {
    return {
      provider: "claude",
      providerLabel: "Claude Code",
      capabilities: this.capabilities,
      availableModels: this.availableModels,
      defaultModel: "sonnet",
      defaultPermissionMode: this.defaultPermissionMode,
      state: this.state,
      threadId: this.threadId,
      pid: this.pid,
      error: this.error,
      pendingServerRequests: 0,
      authMode: this.authMode,
      accountType: typeof this.account?.type === "string" ? this.account.type : null,
      accountEmail: typeof this.account?.email === "string" ? this.account.email : null,
      requiresOpenaiAuth: null,
      rateLimits: null,
      initialized: this.initialized,
      ready: this.ready,
    };
  }

  snapshot(): BridgeSnapshot {
    return {
      type: "status",
      status: this.getStatus(),
      diff: "",
      plan: null,
    };
  }

  async defaultExecFileJson(command: string, args: string[]) {
    return await new Promise((resolve, reject) => {
      execFile(command, args, { encoding: "utf8", maxBuffer: 1024 * 1024 }, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        try {
          resolve(JSON.parse(stdout));
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  ensureThreadId() {
    if (!this.threadId) {
      this.threadId = this.generateId();
    }
    return this.threadId;
  }

  applyAuthStatus(authStatus: ClaudeAuthStatus) {
    this.latestAuthStatus = authStatus ?? null;
    this.initialized = true;
    this.authMode = normalizeClaudeAuthMode(authStatus);
    this.account = authStatus?.loggedIn
      ? {
          type: typeof authStatus.authMethod === "string" ? authStatus.authMethod : "authenticated",
          provider: typeof authStatus.apiProvider === "string" ? authStatus.apiProvider : null,
        }
      : null;

    if (authStatus?.loggedIn) {
      this.ensureThreadId();
      this.ready = true;
      this.state = this.activeTurn ? "running" : "ready";
      this.error = null;
    } else {
      this.ready = false;
      this.state = "error";
      this.threadId = null;
      this.hasStartedConversation = false;
      this.error = "Claude authentication is required";
    }
  }

  async refreshAuthStatus() {
    const result = await this.execFileJson("claude", ["auth", "status", "--json"]);
    this.applyAuthStatus(isRecord(result) ? result : null);
    this.emit("event", this.snapshot());
    return result;
  }

  async start() {
    if (this.starting) return this.starting;
    if (this.initialized && this.ready) return this;

    this.state = "starting";
    this.error = null;
    this.emit("event", this.snapshot());

    this.starting = this.refreshAuthStatus()
      .then(() => this)
      .catch((error) => {
        this.ready = false;
        this.initialized = false;
        this.state = "error";
        this.error =
          error instanceof Error ? error.message : "failed to read Claude authentication status";
        this.emit("event", this.snapshot());
        throw error;
      })
      .finally(() => {
        this.starting = null;
      });

    return await this.starting;
  }

  async waitForInitialized() {
    if (this.initialized) return this;
    await this.start();
    return this;
  }

  async waitForReady() {
    if (this.ready && this.threadId) return this;
    await this.start();

    if (this.ready && this.threadId) return this;
    throw new Error(this.error ?? "Claude Code is not ready");
  }

  emitAssistantStarted(turnId: string) {
    if (this.activeTurn?.assistantStarted) return;
    if (this.activeTurn) {
      this.activeTurn.assistantStarted = true;
    }

    this.emit("event", {
      method: "item/started",
      params: {
        turnId,
        item: buildAssistantItem(""),
      },
    });
  }

  emitAssistantDelta(turnId: string, delta: string) {
    if (!delta) return;
    this.emitAssistantStarted(turnId);
    this.emit("event", {
      method: "item/agentMessage/delta",
      params: {
        turnId,
        delta,
      },
    });
  }

  emitAssistantCompleted(turnId: string, text: string) {
    this.emitAssistantStarted(turnId);
    this.emit("event", {
      method: "item/completed",
      params: {
        turnId,
        item: buildAssistantItem(text),
      },
    });
  }

  emitTurnCompleted(turnId: string, status: string, error: string | null = null) {
    this.emit("event", {
      method: "turn/completed",
      params: {
        threadId: this.threadId,
        turn: {
          id: turnId,
          status,
          error: error ? { message: error } : null,
        },
      },
    });
  }

  handleClaudeEvent(event: unknown, turnId: string) {
    if (!isRecord(event)) return;

    if (event.type === "system" && event.subtype === "init" && typeof event.session_id === "string") {
      this.threadId = event.session_id;
      return;
    }

    if (event.type === "stream_event") {
      const streamEvent = isRecord(event.event) ? event.event : null;
      const delta = isRecord(streamEvent?.delta) ? streamEvent.delta : null;
      if (delta?.type === "text_delta" && typeof delta.text === "string") {
        if (this.activeTurn) {
          this.activeTurn.assistantText += delta.text;
        }
        this.emitAssistantDelta(turnId, delta.text);
      }
      return;
    }

    if (event.type === "assistant") {
      const text = extractAssistantText(event.message);
      if (!text) return;

      if (this.activeTurn) {
        this.activeTurn.assistantText = text;
        this.activeTurn.completed = true;
      }
      this.emitAssistantCompleted(turnId, text);
      return;
    }

    if (event.type === "result" && Array.isArray(event.permission_denials) && event.permission_denials.length > 0) {
      const message =
        "Claude Code は追加の権限が必要なため、このブラウザ経由の実行では続行できません。安全な変更に絞るか、Codex provider を使ってください。";
      if (!this.activeTurn?.completed) {
        this.emitAssistantCompleted(turnId, message);
        if (this.activeTurn) {
          this.activeTurn.assistantText = message;
          this.activeTurn.completed = true;
        }
      }
    }
  }

  async runTurn({ turnId, text, model }: ClaudeRunTurnOptions) {
    const sessionId = this.ensureThreadId();
    const args = getClaudeArgs({
      permissionMode: this.defaultPermissionMode,
      sessionId,
      isResume: this.hasStartedConversation,
      model,
      text,
    });

    const proc = this.spawnProcess("claude", args, {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    this.pid = proc.pid ?? null;
    this.state = "running";
    this.emit("event", this.snapshot());

    const rl = readline.createInterface({
      input: proc.stdout,
      crlfDelay: Infinity,
    });

    let resultEvent: Record<string, unknown> | null = null;
    let stderr = "";
    let resolved = false;
    const exitPromise = new Promise<number>((resolve) => {
      proc.on("exit", (code) => resolve(code ?? 0));
    });

    proc.stderr.on("data", (chunk) => {
      const message = chunk.toString("utf8");
      stderr += message;
      this.emit("event", { type: "stderr", message });
    });

    proc.on("error", (error) => {
      if (resolved) return;
      resolved = true;
      const message = error.message ?? "failed to start Claude Code";
      if (!this.activeTurn?.completed) {
        this.emitAssistantCompleted(turnId, message);
      }
      this.activeTurn = null;
      this.pid = null;
      this.state = "ready";
      this.emitTurnCompleted(turnId, "failed", message);
      this.emit("event", this.snapshot());
    });

    for await (const line of rl) {
      const event = parseJsonLine(line);
      if (!event) continue;
      if (event.type === "result") {
        resultEvent = event;
      }
      this.handleClaudeEvent(event, turnId);
    }

    const exitCode = await exitPromise;

    if (resolved) return;
    resolved = true;

    const resultText =
      typeof resultEvent?.result === "string" && resultEvent.result
        ? resultEvent.result
        : this.activeTurn?.assistantText ?? "";
    const resultError =
      resultEvent?.is_error || resultEvent?.subtype === "error"
        ? (getString(resultEvent?.error) ?? (stderr.trim() || "Claude Code failed"))
        : exitCode === 0
          ? null
          : stderr.trim() || `Claude Code exited with code ${exitCode}`;

    if (!this.activeTurn?.completed) {
      this.emitAssistantCompleted(turnId, resultError ? resultError : resultText);
    }

    this.hasStartedConversation = true;
    this.activeTurn = null;
    this.pid = null;
    this.state = this.ready ? "ready" : "error";
    if (resultError) {
      this.error = null;
      this.emitTurnCompleted(turnId, "failed", String(resultError));
    } else {
      this.error = null;
      this.emitTurnCompleted(turnId, "completed");
    }
    this.emit("event", this.snapshot());
  }

  async submitPrompt(text: string, { model }: BridgeSubmitOptions = {}) {
    await this.waitForReady();

    if (this.activeTurn) {
      throw new Error("Claude Code already has an active turn");
    }

    const turnId = this.generateId();
    this.activeTurn = {
      turnId,
      assistantStarted: false,
      assistantText: "",
      completed: false,
    };

    this.emit("event", {
      method: "turn/started",
      params: {
        threadId: this.threadId,
        turn: { id: turnId },
      },
    });

    this.runTurn({ turnId, text, model }).catch((error) => {
      const message = error instanceof Error ? error.message : "Claude Code failed";
      if (!this.activeTurn?.completed) {
        this.emitAssistantCompleted(turnId, message);
      }
      this.activeTurn = null;
      this.pid = null;
      this.state = this.ready ? "ready" : "error";
      this.error = null;
      this.emitTurnCompleted(turnId, "failed", message);
      this.emit("event", this.snapshot());
    });

    return {
      thread: { id: this.threadId },
      turn: { id: turnId },
    };
  }

  async respondToServerRequest() {
    throw new Error("Claude Code approvals are not supported from the browser bridge");
  }

  async readAccount() {
    await this.refreshAuthStatus();
    return {
      account: this.account,
      authStatus: this.latestAuthStatus,
      provider: "claude",
    };
  }

  async startChatgptLogin() {
    throw new Error("Claude Code login must be completed from the terminal");
  }

  async logout() {
    throw new Error("Claude Code logout is not available from the browser bridge");
  }

  async readRateLimits() {
    throw new Error("Claude Code rate limits are not exposed by this bridge");
  }
}

const bridge = globalThis.__agentDrivenCmsClaudeBridge ?? new ClaudeBridge();
globalThis.__agentDrivenCmsClaudeBridge = bridge;

export { ClaudeBridge, extractAssistantText, getClaudeArgs, normalizeClaudeAuthMode };
export function getClaudeBridge() {
  return bridge;
}
