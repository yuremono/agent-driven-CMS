import { getBridge } from "../../../../lib/bridge.js";

export const runtime = "nodejs";

export async function GET() {
  const bridge = getBridge();
  return Response.json(bridge.getStatus());
}
