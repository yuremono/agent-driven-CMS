import { getBridge } from "../../../../lib/bridge";

export const runtime = "nodejs";

export async function GET() {
  const bridge = getBridge();
  return Response.json(bridge.getStatus());
}
