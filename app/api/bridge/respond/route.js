import { getCodexBridge } from "../../../../lib/codex-bridge.js";

export const runtime = "nodejs";

export async function POST(request) {
  const bridge = getCodexBridge();
  const body = await request.json().catch(() => ({}));
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
    return Response.json(
      {
        error: error instanceof Error ? error.message : "failed to respond",
      },
      { status: 500 },
    );
  }
}
