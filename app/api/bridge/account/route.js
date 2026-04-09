import { getBridge } from "../../../../lib/bridge.js";

export const runtime = "nodejs";

export async function GET(request) {
  const bridge = getBridge();
  const url = new URL(request.url);
  const refreshToken = url.searchParams.get("refreshToken") === "true";

  try {
    const result = await bridge.readAccount({ refreshToken });
    return Response.json({ result, status: bridge.getStatus() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "failed to read account" },
      { status: 500 },
    );
  }
}
