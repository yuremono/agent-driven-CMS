import { getBridge } from "../../../../lib/bridge.js";
import { jsonError, readJsonBody } from "../../../../lib/bridge-http.js";

export const runtime = "nodejs";

export async function POST(request) {
  const bridge = getBridge();
  const body = await readJsonBody(request);
  const input = typeof body.input === "string" ? body.input.trim() : "";
  const model = typeof body.model === "string" ? body.model.trim() : "";

  if (!input) {
    return Response.json({ error: "input is required" }, { status: 400 });
  }

  try {
    const result = await bridge.submitPrompt(input, { model });
    return Response.json({
      threadId: result?.thread?.id ?? bridge.threadId,
      turnId: result?.turn?.id ?? null,
    });
  } catch (error) {
    return jsonError(error, "failed to submit prompt");
  }
}
