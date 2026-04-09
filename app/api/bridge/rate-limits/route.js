import { getBridge } from "../../../../lib/bridge.js";

export const runtime = "nodejs";

export async function GET() {
  const bridge = getBridge();

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
