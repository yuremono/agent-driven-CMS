import { getBridge } from "../../../../lib/bridge";
import { jsonError, readJsonBody } from "../../../../lib/bridge-http";

export const runtime = "nodejs";

type TurnStartResult = {
  thread?: { id?: string | null };
  turn?: { id?: string | null };
};

export async function POST(request: Request) {
  const bridge = getBridge();
  const body = await readJsonBody<Record<string, unknown>>(request);
  const input = typeof body.input === "string" ? body.input.trim() : "";
  const model = typeof body.model === "string" ? body.model.trim() : "";

  if (!input) {
    return Response.json({ error: "input is required" }, { status: 400 });
  }

  try {
    const result = await bridge.submitPrompt(input, { model }) as TurnStartResult;
    return Response.json({
      threadId: result?.thread?.id ?? bridge.threadId,
      turnId: result?.turn?.id ?? null,
    });
  } catch (error) {
    return jsonError(error, "failed to submit prompt");
  }
}
