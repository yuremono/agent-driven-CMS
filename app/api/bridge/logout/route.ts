import { getBridge } from "../../../../lib/bridge";
import { jsonError, sameOriginForbidden } from "../../../../lib/bridge-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const forbidden = sameOriginForbidden(request);
  if (forbidden) return forbidden;

  const bridge = getBridge();

  try {
    const result = await bridge.logout();
    return Response.json({ result, status: bridge.getStatus() });
  } catch (error) {
    return jsonError(error, "failed to logout");
  }
}
