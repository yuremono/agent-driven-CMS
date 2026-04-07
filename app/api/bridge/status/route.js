import { getCodexBridge } from "../../../../lib/codex-bridge.js";

export const runtime = "nodejs";

export async function GET() {
  const bridge = getCodexBridge();
  return Response.json(bridge.getStatus());
}
