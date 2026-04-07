import { getCodexBridge } from "../../../../lib/codex-bridge.js";

export const runtime = "nodejs";

export async function GET() {
  const bridge = getCodexBridge();

  try {
    const result = await bridge.readRateLimits();
    return Response.json({ result, status: bridge.getStatus() });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "failed to read rate limits",
      },
      { status: 500 },
    );
  }
}
