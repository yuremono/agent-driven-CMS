import { getCodexBridge } from "../../../../lib/codex-bridge.js";

export const runtime = "nodejs";

export async function POST(request) {
  const bridge = getCodexBridge();
  const body = await request.json().catch(() => ({}));
  const input = typeof body.input === "string" ? body.input.trim() : "";

  if (!input) {
    return Response.json({ error: "input is required" }, { status: 400 });
  }

  try {
    const result = await bridge.submitPrompt(input);
    return Response.json({
      threadId: result?.thread?.id ?? bridge.threadId,
      turnId: result?.turn?.id ?? null,
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "failed to submit prompt",
      },
      { status: 500 },
    );
  }
}
