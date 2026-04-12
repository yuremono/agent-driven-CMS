import { getBridge } from "../../../../lib/bridge";
import { jsonError, readJsonBody } from "../../../../lib/bridge-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const bridge = getBridge();
  const body = await readJsonBody<Record<string, unknown>>(request);
  const requestId = body.requestId;
  const result = body.result ?? body.decision ?? body.response ?? body.value ?? null;

  if (typeof requestId !== "string" && typeof requestId !== "number") {
    return Response.json({ error: "requestId is required" }, { status: 400 });
  }

  try {
    const response = await bridge.respondToServerRequest(requestId, result);
    return Response.json(response);
  } catch (error) {
    return jsonError(error, "failed to respond");
  }
}
