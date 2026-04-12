import { getBridge } from "../../../../lib/bridge";
import { jsonError } from "../../../../lib/bridge-http";

export const runtime = "nodejs";

export async function GET() {
  const bridge = getBridge();

  try {
    const result = await bridge.readRateLimits();
    return Response.json({ result, status: bridge.getStatus() });
  } catch (error) {
    return jsonError(error, "failed to read rate limits");
  }
}
