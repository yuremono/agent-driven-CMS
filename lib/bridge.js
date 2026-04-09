import { getClaudeBridge } from "./claude-bridge.js";
import { getCodexBridge } from "./codex-bridge.js";

const SUPPORTED_PROVIDERS = new Set(["claude", "codex"]);

export function getBridgeProvider() {
  const provider = (process.env.AGENT_BRIDGE_PROVIDER ?? "codex").toLowerCase();
  return SUPPORTED_PROVIDERS.has(provider) ? provider : "codex";
}

export function getBridge() {
  return getBridgeProvider() === "claude" ? getClaudeBridge() : getCodexBridge();
}
