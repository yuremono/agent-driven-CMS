import { getBridge } from "../../../../lib/bridge.js";
import { jsonError } from "../../../../lib/bridge-http.js";

export const runtime = "nodejs";

export async function GET(request) {
  const bridge = getBridge();
  const url = new URL(request.url);
  const refreshToken = url.searchParams.get("refreshToken") === "true";

  try {
    const result = await bridge.readAccount({ refreshToken });
    return Response.json({ result, status: bridge.getStatus() });
  } catch (error) {
    return jsonError(error, "failed to read account");
  }
}
