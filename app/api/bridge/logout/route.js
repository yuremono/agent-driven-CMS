import { getBridge } from "../../../../lib/bridge.js";
import { jsonError, sameOriginForbidden } from "../../../../lib/bridge-http.js";

export const runtime = "nodejs";

export async function POST(request) {
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
