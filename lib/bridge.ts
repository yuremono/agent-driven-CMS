import { getClaudeBridge } from "./claude-bridge";
import { getCodexBridge } from "./codex-bridge";

export type BridgeProvider = "claude" | "codex";
export type BridgeState = "idle" | "starting" | "ready" | "running" | "error";
export type BridgeAuthMode = string | null;

export type BridgeModelOption = {
  label: string;
  value: string;
};

export type BridgeCapabilities = {
  approvals: boolean;
  browserLogin: boolean;
  browserLogout: boolean;
  diff: boolean;
  plan: boolean;
  rateLimits: boolean;
};

export type BridgeStatus = {
  provider: BridgeProvider;
  providerLabel: string;
  capabilities: BridgeCapabilities;
  availableModels: BridgeModelOption[];
  defaultModel: string;
  defaultPermissionMode: string | null;
  state: BridgeState;
  threadId: string | null;
  pid: number | null;
  error: string | null;
  pendingServerRequests: number;
  authMode: BridgeAuthMode;
  accountType: string | null;
  accountEmail: string | null;
  requiresOpenaiAuth: boolean | null;
  rateLimits: unknown;
  initialized: boolean;
  ready: boolean;
};

export type BridgeSnapshot = {
  type: "status";
  status: BridgeStatus;
  diff: string;
  plan: unknown;
};

export type BridgeAccountReadOptions = {
  refreshToken?: boolean;
};

export type BridgeSubmitOptions = {
  model?: string | null;
};

export interface AgentBridge {
  threadId: string | null;
  on(eventName: "event", listener: (event: unknown) => void): this;
  off(eventName: "event", listener: (event: unknown) => void): this;
  getStatus(): BridgeStatus;
  snapshot(): BridgeSnapshot;
  start(): Promise<this> | this;
  submitPrompt(text: string, options?: BridgeSubmitOptions): Promise<unknown>;
  respondToServerRequest(requestId: string | number, result: unknown): Promise<unknown>;
  readAccount(options?: BridgeAccountReadOptions): Promise<unknown>;
  startChatgptLogin(): Promise<unknown>;
  logout(): Promise<unknown>;
  readRateLimits(): Promise<unknown>;
}

const SUPPORTED_PROVIDERS = new Set<BridgeProvider>(["claude", "codex"]);

export function getBridgeProvider(): BridgeProvider {
  const provider = (process.env.AGENT_BRIDGE_PROVIDER ?? "codex").toLowerCase();
  return SUPPORTED_PROVIDERS.has(provider as BridgeProvider) ? (provider as BridgeProvider) : "codex";
}

export function getBridge(): AgentBridge {
  return getBridgeProvider() === "claude" ? getClaudeBridge() : getCodexBridge();
}
