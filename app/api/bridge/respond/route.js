import { getBridge } from "../../../../lib/bridge.js";
import { jsonError, readJsonBody } from "../../../../lib/bridge-http.js";

export const runtime = "nodejs";

export async function POST(request) {
  const bridge = getBridge();
  const body = await readJsonBody(request);
  const requestId = body.requestId;
  const result =
    body.result ?? body.decision ?? body.response ?? body.value ?? null;

  if (requestId == null) {
    return Response.json({ error: "requestId is required" }, { status: 400 });
  }

  try {
    const response = await bridge.respondToServerRequest(requestId, result);
    return Response.json(response);
  } catch (error) {
    return jsonError(error, "failed to respond");
  }
}
